import tiktoken
import pandas as pd
import re
import os

from graphrag.query.indexer_adapters import read_indexer_entities, read_indexer_reports
from graphrag.query.llm.oai.chat_openai import ChatOpenAI
from graphrag.query.llm.oai.embedding import OpenAIEmbedding

from graphrag.query.llm.oai.typing import OpenaiApiType

from graphrag.query.structured_search.global_search.community_context import (
    GlobalCommunityContext,
)
from graphrag.query.structured_search.global_search.search import GlobalSearch

from graphrag.query.structured_search.local_search.mixed_context import (
    LocalSearchMixedContext,
)
from graphrag.query.structured_search.local_search.search import LocalSearch
from graphrag.vector_stores.lancedb import LanceDBVectorStore
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.indexer_adapters import (
    read_indexer_covariates,
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
)
from graphrag.query.input.loaders.dfs import (
    store_entity_semantic_embeddings,
)

from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GPT_API_KEY")

llm_model = os.getenv("LLM_MODEL", "gpt-4o-mini")
embedding_model = "text-embedding-3-small"

llm_kwargs = {
    "api_key": api_key,
    "model": llm_model,
    "api_type": OpenaiApiType.OpenAI,
    "max_retries": 20,
}
if llm_model.startswith("o3"):
    llm_kwargs["reasoning_effort"] = "low"

llm = ChatOpenAI(**llm_kwargs)

text_embedder = OpenAIEmbedding(
    api_key=api_key,
    api_base=None,
    api_type=OpenaiApiType.OpenAI,
    model=embedding_model,
    deployment_name=embedding_model,
    max_retries=20,
)
token_encoder = tiktoken.get_encoding("cl100k_base")


# Function to find the latest artifacts directory based on modification time
def get_latest_input_dir(root_output_path):
    if not os.path.exists(root_output_path):
        return None
    
    # List all directories in output folder
    dirs = [os.path.join(root_output_path, d) for d in os.listdir(root_output_path) 
            if os.path.isdir(os.path.join(root_output_path, d))]
    
    if not dirs:
        return None
        
    # Sort by modification time and pick the latest one
    latest_full_path = max(dirs, key=os.path.getmtime)
    return os.path.join(latest_full_path, "artifacts")

# Determine base path relative to this script
GRAPHRAG_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_ROOT = os.path.join(GRAPHRAG_ROOT, "graphRAG", "output")

INPUT_DIR = get_latest_input_dir(OUTPUT_ROOT)

if not INPUT_DIR or not os.path.exists(INPUT_DIR):
    # Final fallback attempt
    INPUT_DIR = "./graphRAG/output/20250311-012701/artifacts"
    if not os.path.exists(INPUT_DIR):
        print(f"Warning: No valid GraphRAG artifacts found in {OUTPUT_ROOT}")
        print("Please run indexer first or ensure output files exist.")

print(f"INPUT_DIR: {INPUT_DIR}")

LANCEDB_URI = f"{INPUT_DIR}/lancedb"

# parquet files generated from indexing pipeline
COMMUNITY_REPORT_TABLE = "create_final_community_reports"
ENTITY_TABLE = "create_final_nodes"
ENTITY_EMBEDDING_TABLE = "create_final_entities"
RELATIONSHIP_TABLE = "create_final_relationships"
COVARIATE_TABLE = "create_final_covariates"
TEXT_UNIT_TABLE = "create_final_text_units"
COMMUNITY_TABLE = "create_final_communities"

# community level in the Leiden community hierarchy from which we will load the community reports
# higher value means we use reports from more fine-grained communities (at the cost of higher computation cost)
COMMUNITY_LEVEL = 2


# read nodes table to get community and degree data
entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
report_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_REPORT_TABLE}.parquet")
relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
entity_embedding_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_EMBEDDING_TABLE}.parquet")
community_df= pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_TABLE}.parquet")

reports = read_indexer_reports(report_df, entity_df, COMMUNITY_LEVEL)
entities = read_indexer_entities(entity_df, entity_embedding_df, COMMUNITY_LEVEL)
relationships = read_indexer_relationships(relationship_df)
text_units = read_indexer_text_units(text_unit_df)

# load description embeddings to an in-memory lancedb vectorstore
# to connect to a remote db, specify url and port values.
description_embedding_store = LanceDBVectorStore(
    collection_name="entity_description_embeddings",
)
description_embedding_store.connect(db_uri=LANCEDB_URI)
entity_description_embeddings = store_entity_semantic_embeddings(
    entities=entities, vectorstore=description_embedding_store
)


# Global serach is used to answer questions which need the complete dataset understanding for questions like "What are top 10 themes in articles"
context_builder = GlobalCommunityContext(
    community_reports=reports,
    entities=entities,  # default to None if you don't want to use community weights for ranking
    token_encoder=token_encoder,
)

context_builder_params = {
    "use_community_summary": False,  # False means using full community reports. True means using community short summaries.
    "shuffle_data": True,
    "include_community_rank": True,
    "min_community_rank": 0,
    "community_rank_name": "rank",
    "include_community_weight": True,
    "community_weight_name": "occurrence weight",
    "normalize_community_weight": True,
    "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
    "context_name": "Reports",
}

map_llm_params = {
    "max_tokens": 1000,
    "temperature": 0.0,
    "response_format": {"type": "json_object"},
}

reduce_llm_params = {
    "max_tokens": 2000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000-1500)
    "temperature": 0.0,
}

global_search_engine = GlobalSearch(
    llm=llm,
    context_builder=context_builder,
    token_encoder=token_encoder,
    max_data_tokens=12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
    map_llm_params=map_llm_params,
    reduce_llm_params=reduce_llm_params,
    allow_general_knowledge=False,  # set this to True will add instruction to encourage the LLM to incorporate general knowledge in the response, which may increase hallucinations, but could be useful in some use cases.
    json_mode=True,  # set this to False if your LLM model does not support JSON mode.
    context_builder_params=context_builder_params,
    concurrent_coroutines=32,
    response_type="single paragraph",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
)



# Function to Global Search
async def global_search(question: str) -> any:
    result = await global_search_engine.asearch(question)
    answer = re.sub(r' \[.*?\]', '', result.response).strip()
    return answer

# NOTE: This function is strictly for testing purposes. Do not use in production.
# Function to Main
# NOTE: This function is strictly for testing purposes. Do not use in production.
async def main():
    question = """Introducing Indonesia's Independence Day"""
    result = await global_search_engine.asearch(question)
    answer = re.sub(r' \[.*?\]', '', result.response).strip()
    print(answer)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
