import pandas as pd
import os
import sys
import time
import re
from dotenv import load_dotenv
from FlagEmbedding import BGEM3FlagModel
from scipy.special import expit
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

# Load local environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

# Import prompts from prompts.py
from prompts import (
    CORRECTNESS_CRITERIA,
    TOPIC_RELEVANCE_CRITERIA,
    FLUENCY_CRITERIA,
    REDUNDANCY_CHECK_CRITERIA,
    LOGICAL_ACCURACY_CRITERIA,
    CONTEXTUAL_CONSISTENCY_CRITERIA,
    INTEGRATION_CRITERIA,
    WRITING_STYLE_CONSISTENCY_CRITERIA,
    OUTPUT_COMPLIANCE_CRITERIA
)

# Initialization DeepEval
model_name = os.getenv("DEEPEVAL_MODEL", "gpt-4o")

def create_geval_metric(name, criteria, params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.ACTUAL_OUTPUT]):
    return GEval(name=name, criteria=criteria, evaluation_params=params, model=model_name)

# Initialize all metrics
metrics_pool = {
    "correctness": GEval(
        name="Correctness",
        criteria=CORRECTNESS_CRITERIA,
        evaluation_params=[LLMTestCaseParams.INPUT, LLMTestCaseParams.EXPECTED_OUTPUT, LLMTestCaseParams.ACTUAL_OUTPUT],
        model=model_name
    ),
    "topic_relevance": create_geval_metric("Topic Relevance", TOPIC_RELEVANCE_CRITERIA),
    "fluency": create_geval_metric("Fluency", FLUENCY_CRITERIA),
    "redundancy": create_geval_metric("Redundancy Check", REDUNDANCY_CHECK_CRITERIA),
    "logical_accuracy": create_geval_metric("Logical Accuracy", LOGICAL_ACCURACY_CRITERIA),
    "contextual_consistency": create_geval_metric("Contextual Consistency", CONTEXTUAL_CONSISTENCY_CRITERIA),
    "integration": create_geval_metric("Integration", INTEGRATION_CRITERIA),
    "writing_style": create_geval_metric("Writing Style Consistency", WRITING_STYLE_CONSISTENCY_CRITERIA),
    "output_compliance": create_geval_metric("Output Compliance", OUTPUT_COMPLIANCE_CRITERIA)
}

# Global placeholder for M3 Model
m3_model = None

# Evaluation
def get_similarity_score(expected, actual):
    global m3_model
    if m3_model is None:
        print("Initializing M3 Embedding Model (BAAI/bge-m3)...")
        m3_model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
    
    n_adjust = 2.8 
    output_1 = m3_model.encode([expected], return_colbert_vecs=True)
    output_2 = m3_model.encode([actual], return_colbert_vecs=True)
    
    raw_similarity = float(m3_model.colbert_score(output_1['colbert_vecs'][0], output_2['colbert_vecs'][0]))
    return expit(raw_similarity * n_adjust)

def get_deepeval_scores(test_type, prompt, expected, actual):
    test_case = LLMTestCase(
        input=prompt,
        expected_output=expected if expected else "N/A",
        actual_output=actual
    )
    
    results = {}
    n_adjust = 3.5 

    # Stage filtering
    if test_type == "alpha":
        active_keys = ["correctness"]
    else:
        active_keys = [k for k in metrics_pool.keys() if k != "correctness"]

    for key in active_keys:
        metric = metrics_pool[key]
        print(f"  - Measuring {metric.name}...")
        metric.measure(test_case)
        
        if key == "correctness":
            results[key] = expit(metric.score * n_adjust)
            results[f"{key}_reason"] = metric.reason
        else:
            results[f"geval_{key}_score"] = metric.score
            results[f"geval_{key}_reason"] = metric.reason
            
    return results

# Processing Logic
def process_evaluation(test_type, mode, target_id=None):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(base_dir, 'input', 'test-data.csv')
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    df = pd.read_csv(input_path, encoding='utf-8-sig')
    
    # Mode
    input_basename = os.path.splitext(os.path.basename(input_path))[0]
    if mode == "single":
        df_target = df[df['uid'] == target_id]
        if df_target.empty:
            print(f"Error: ID {target_id} not found.")
            return
        df = df_target
        output_filename = f"{input_basename}-{test_type}-{target_id}-results.csv"
    else:
        output_filename = f"{input_basename}-{test_type}-all-results.csv"

    output_path = os.path.join(base_dir, 'output', output_filename)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    final_rows = []
    print(f"Starting {test_type.upper()} TEST for {len(df)} records...")

    for idx, row in df.iterrows():
        print(f"\n[{idx+1}/{len(df)}] Processing UID: {row['uid']}...")
        
        if test_type == "alpha":
            # Alpha Stage: Similarity + Correctness
            sim_score = get_similarity_score(row['true-sentences'], row['predect-sentences'])
            row['similarity_score'] = sim_score
            
            eval_results = get_deepeval_scores("alpha", row['predect-prompts'], row['true-sentences'], row['predect-sentences'])
        else:
            # Beta Stage: 8 G-Eval Metrics
            eval_results = get_deepeval_scores("beta", row['predect-prompts'], None, row['predect-sentences'])
        
        # Update row with results
        for key, value in eval_results.items():
            row[key] = value
        
        final_rows.append(row)
        time.sleep(1) 

    result_df = pd.DataFrame(final_rows)
    result_df.to_csv(output_path, index=False, encoding='utf-8-sig')
    print(f"\n{test_type.upper()} TEST completed. Saved to: {output_path}")

def main():
    print("=== Evaluation ===")
    print("Select Test Stage:")
    print("1. Alpha Test (Similarity & Correctness)")
    print("2. Beta Test (8 G-Eval Metrics)")
    
    stage_choice = input("\nSelect stage (1/2): ").strip()
    test_type = "alpha" if stage_choice == "1" else "beta" if stage_choice == "2" else None
    
    if not test_type:
        print("Invalid stage choice.")
        return

    print(f"\n--- {test_type.upper()} TEST ---")
    print("1. Evaluate All IDs")
    print("2. Evaluate Specific ID")
    
    mode_choice = input("\nSelect mode (1/2): ").strip()
    
    if mode_choice == "1":
        process_evaluation(test_type, "all")
    elif mode_choice == "2":
        target_id = input("Enter UID to evaluate: ").strip()
        try:
            if target_id.isdigit():
                target_id = int(target_id)
        except:
            pass
        process_evaluation(test_type, "single", target_id)
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    main()
