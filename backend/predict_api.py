from openai import OpenAI
from pydantic import BaseModel
from typing import List
import asyncio
import time
from collections import Counter
from typing import List
from datetime import datetime
from graphRAG.global_search import global_search

from api_config import GPT_API_KEY, LLM_MODEL, LLM_KWARGS
from db_config import DB_CONFIG
from prompts import (
    PROMPT_IDENTIFY_WRITING_PURPOSE,
    PROMPT_VOTE_WRITING_PURPOSE,
    PROMPT_GENERATE_QUESTION,
    PROMPT_ANSWER_FROM_HISTORY,
    PROMPT_ANSWER_FROM_CURRENT,
    PROMPT_IDENTIFY_SENTENCE_PATTERN,
    PROMPT_SELECT_SENTENCE_PATTERN,
    PROMPT_VOTE_SENTENCE_PATTERN,
    PROMPT_IDENTIFY_WRITING_PATTERN,
    PROMPT_PREDICT_SENTENCE
)

client = OpenAI(api_key=GPT_API_KEY)


# Function to Identify Writing Purpose
# Uses ToT (Tree of Thoughts) framework conceptually to brainstorm the potential writing purposes of the user's predicted sentence.
def identify_writing_purpose(current_writing_content):
    user_prompt = PROMPT_IDENTIFY_WRITING_PURPOSE.format(current_writing_content=current_writing_content)

    
    class WritingPurposes(BaseModel):
        writing_purposes: str

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    response = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=WritingPurposes,
        n=5 
    )

    
    writing_purposes_list = []

    for choice in response.choices:
        writing_purposes_list.append(choice.message.parsed.writing_purposes)

    
    return writing_purposes_list


# Function to Vote Writing Purpose
# Select the best matching writing purpose from the candidates.
def vote_writing_purpose(current_writing_content, writing_purposes_list):
    
    writing_purposes_options_list = "\n".join([f"{i+1}. {response}" for i, response in enumerate(writing_purposes_list)])
    
    user_prompt = PROMPT_VOTE_WRITING_PURPOSE.format(num_options=5, num_options_text="Five", current_writing_content=current_writing_content, writing_purposes_options_list=writing_purposes_options_list)

    
    class BestMatchWritingPurposes(BaseModel):
        best_match_writing_purpose: str
        best_match_writing_purpose_reason: str

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    response = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=BestMatchWritingPurposes,
        n=5
    )

    
    best_match_writing_purpose_vote_results = []
    for choice in response.choices:
        best_match_writing_purpose_vote_results.append(choice.message.parsed.best_match_writing_purpose)

    
    best_match_writing_purpose_vote_counts = Counter(best_match_writing_purpose_vote_results)
    best_match_writing_purpose_highest_vote_result = max(best_match_writing_purpose_vote_counts.values())
    best_match_writing_purpose_winning_options = [option for option, count in best_match_writing_purpose_vote_counts.items() if count == best_match_writing_purpose_highest_vote_result]

    
    if len(best_match_writing_purpose_winning_options) > 1:
        
        
        re_writing_purposes_options_list = ""  
        for i, option in enumerate(best_match_writing_purpose_winning_options, start=1):
            writing_purpose = writing_purposes_list[int(option) - 1]
            re_writing_purposes_options_list += f"{i}. {writing_purpose}\n"
        
        
        user_prompt = PROMPT_VOTE_WRITING_PURPOSE.format(num_options=2, num_options_text="Two", current_writing_content=current_writing_content, writing_purposes_options_list=writing_purposes_options_list)
        
        class BestMatchWritingPurposes(BaseModel):
            best_match_writing_purpose: str
            best_match_writing_purpose_reason: str
        
        messages=[
            {"role": "user", "content": user_prompt}
        ]
        
        response = client.beta.chat.completions.parse(
            **LLM_KWARGS,
        messages=messages,
            response_format=BestMatchWritingPurposes,
            n=3
        )
        
        re_best_match_writing_purpose_vote_results = []
        for choice in response.choices:
            re_best_match_writing_purpose_vote_results.append(choice.message.parsed.best_match_writing_purpose)
            # print("Number:" + choice.message.parsed.best_match_writing_purpose)
            # print("Reason:" + choice.message.parsed.best_match_writing_purpose_reason + "\n")
        
        best_match_writing_purpose_vote_counts = Counter(re_best_match_writing_purpose_vote_results)
        best_match_writing_purpose_highest_vote_result = max(best_match_writing_purpose_vote_counts.values())
        best_match_writing_purpose_winning_options = [option for option, count in best_match_writing_purpose_vote_counts.items() if count == best_match_writing_purpose_highest_vote_result]
        best_match_writing_purpose_winning_option = best_match_writing_purpose_winning_options[0]
        best_match_writing_purpose = writing_purposes_list[int(best_match_writing_purpose_winning_option) - 1]        
    else:
        best_match_writing_purpose_winning_option = best_match_writing_purpose_winning_options[0]
        best_match_writing_purpose = writing_purposes_list[int(best_match_writing_purpose_winning_option) - 1]

    return best_match_writing_purpose, ""


# Function to Generate Question
# Generates specific questions to retrieve context from the GraphRAG database based on the chosen writing purpose.
def generate_question(current_writing_content, best_match_writing_purpose):
    user_prompt = PROMPT_GENERATE_QUESTION.format(current_writing_content=current_writing_content, best_match_writing_purpose=best_match_writing_purpose)

    
    class WritingQuerys(BaseModel):
        query: List[str]

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    query = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=WritingQuerys
    )

    
    query_list = query.choices[0].message.parsed.query

    return query_list


# Function to Answer From History
# Executes global search on the GraphRAG database built from historical essays.
async def answer_from_history(query):
    
    user_prompt = PROMPT_ANSWER_FROM_HISTORY.format(query=query)
    
    graphRAG_result = await global_search(user_prompt)

    return str(graphRAG_result)


# Function to Answer From Current
# Extracts relevant context directly from the current essay being written.
def answer_from_current(current_writing_content, query):
    user_prompt = PROMPT_ANSWER_FROM_CURRENT.format(current_writing_content=current_writing_content, query=query)

    
    class Answer(BaseModel):
        answer: str

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    answer = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=Answer
    )

    
    query_answer_from_current = answer.choices[0].message.parsed.answer

    return str(query_answer_from_current)


# Function to Identify Sentence Pattern
# Identifies syntactic preferences using the WSM-SPC (Sentence Pattern Component) approach. Compares historical and current essays.
def identify_sentence_pattern(current_writing_content, history_content, best_match_writing_purpose):
    
    user_prompt = PROMPT_IDENTIFY_SENTENCE_PATTERN.format(essay_content=history_content)

    
    class HistorySentencePattern(BaseModel):
        sentent_pattern_type: str
        explanation: str
        example: str
        pattern: str
        function: str


    class HistoryWritingPatternAnalysis(BaseModel):
        history_sentence_patterns: list[HistorySentencePattern]

    
    messages=[
        {"role": "user", "content": user_prompt},
    ]

    
    history_writing_pattern_analysis = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=HistoryWritingPatternAnalysis
    )

    
    history_sentence_patterns = history_writing_pattern_analysis.choices[0].message.parsed.history_sentence_patterns


    
    user_prompt = PROMPT_IDENTIFY_SENTENCE_PATTERN.format(essay_content=current_writing_content)

    
    class CurrentSentencePattern(BaseModel):
        sentent_pattern_type: str
        explanation: str
        example: str
        pattern: str
        function: str

    class CurrentWritingPatternAnalysis(BaseModel):
        current_sentence_patterns: list[CurrentSentencePattern]

    
    messages=[
        {"role": "user", "content": user_prompt},
    ]

    
    current_writing_pattern_analysis = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=CurrentWritingPatternAnalysis
    )

    
    current_sentence_patterns = current_writing_pattern_analysis.choices[0].message.parsed.current_sentence_patterns

    
    def format_common_sentence_patterns(patterns: List) -> str:
        class SentencePattern(BaseModel):
            sentent_pattern_type: str
            explanation: str
            example: str
            pattern: str
            function: str

        validated_patterns = [SentencePattern(**pattern) if isinstance(pattern, dict) else pattern for pattern in patterns]

        output = []
        for idx, pattern in enumerate(validated_patterns, start=1):
            output.append(
                f"Type: {pattern.sentent_pattern_type}\n"
                f"Explanation: {pattern.explanation}\n"
                f"Example: {pattern.example}\n"
                f"Pattern: {pattern.pattern}\n"
                f"Function: {pattern.function}\n"
            )
        return "\n".join(output)
    
    
    formatted_history_patterns = format_common_sentence_patterns(history_sentence_patterns)
    formatted_current_patterns = format_common_sentence_patterns(current_sentence_patterns)

    
    
    user_prompt = PROMPT_SELECT_SENTENCE_PATTERN.format(current_writing_content=current_writing_content, best_match_writing_purpose=best_match_writing_purpose, formatted_current_patterns=formatted_current_patterns, formatted_history_patterns=formatted_history_patterns)

    
    class PredictSentencePattern(BaseModel):
        sentent_pattern_type: str
        explanation: str
        example: str
        pattern: str
        function: str

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    predict_sntence_pattern = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=PredictSentencePattern,
        n=5 
    )

    
    predict_sntence_pattern_list = []
    for i, choice in enumerate(predict_sntence_pattern.choices):
        parsed = choice.message.parsed        
        
        type_info = f"Type: {parsed.sentent_pattern_type}"
        explanation = f"Explanation: {parsed.explanation}"
        example = f"Example: {parsed.example}"
        pattern = f"Pattern: {parsed.pattern}"
        function = f"Function: {parsed.function}"
        
        formatted_string = f"{type_info}\n{explanation}\n{example}\n{pattern}\n{function}"
        
        predict_sntence_pattern_list.append(formatted_string)


    
    
    predict_sntence_pattern_options_list = "\n".join([f"{i+1}. {response}" for i, response in enumerate(predict_sntence_pattern_list)])

    
    user_prompt = PROMPT_VOTE_SENTENCE_PATTERN.format(num_options=5, num_options_text="Five", current_writing_content=current_writing_content, best_match_writing_purpose=best_match_writing_purpose, predict_sntence_pattern_options_list=predict_sntence_pattern_options_list)

    
    class BestMatchSentencePattern(BaseModel):
        best_match_sentence_pattern: str
        best_match_sentence_pattern_reason: str

    
    messages=[
        {"role": "user", "content": user_prompt}
    ]

    
    response = client.beta.chat.completions.parse(
        **LLM_KWARGS,
        messages=messages,
        response_format=BestMatchSentencePattern,
        n=5 
    )

    
    best_match_sentence_pattern_vote_results = []
    best_match_sentence_pattern_vote_results_reason = []
    for choice in response.choices:
        best_match_sentence_pattern_vote_results.append(choice.message.parsed.best_match_sentence_pattern)
        best_match_sentence_pattern_vote_results_reason.append(choice.message.parsed.best_match_sentence_pattern_reason)
        
        

    
    best_match_sentence_pattern_vote_counts = Counter(best_match_sentence_pattern_vote_results)
    best_match_sentence_pattern_highest_vote_result = max(best_match_sentence_pattern_vote_counts.values())
    best_match_sentence_pattern_winning_options = [option for option, count in best_match_sentence_pattern_vote_counts.items() if count == best_match_sentence_pattern_highest_vote_result]

    
    if len(best_match_sentence_pattern_winning_options) > 1:
        
        tie_options = [predict_sntence_pattern_list[int(option) - 1] for option in best_match_sentence_pattern_winning_options]
        tie_options_list = "\n".join([f"{i+1}. {response}" for i, response in enumerate(tie_options)])

        
        tie_prompt = PROMPT_VOTE_SENTENCE_PATTERN.format(num_options=2, num_options_text="Two", current_writing_content=current_writing_content, best_match_writing_purpose=best_match_writing_purpose, predict_sntence_pattern_options_list=tie_options_list)

        
        tie_messages = [
            {"role": "user", "content": tie_prompt}
        ]

        
        tie_response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            # reasoning_effort="low",
            messages=tie_messages,
            response_format=BestMatchSentencePattern,
            n=3
        )

        
        tie_vote_results = []
        tie_vote_reason = []
        for choice in tie_response.choices:
            tie_vote_results.append(choice.message.parsed.best_match_sentence_pattern)
            tie_vote_reason.append(choice.message.parsed.best_match_sentence_pattern_reason)


        
        tie_vote_counts = Counter(tie_vote_results)
        tie_highest_vote_result = max(tie_vote_counts.values())
        tie_winning_options = [option for option, count in tie_vote_counts.items() if count == tie_highest_vote_result][0]
        best_match_sentence_pattern = tie_options[int(tie_winning_options) - 1]

    else:
        best_match_sentence_pattern_winning_option = best_match_sentence_pattern_winning_options[0]
        best_match_sentence_pattern = predict_sntence_pattern_list[int(best_match_sentence_pattern_winning_option) - 1]
        
        
    
    return best_match_sentence_pattern


# Function to Identify Writing Pattern
# Extracts stylistic tendencies (narrative, vocabulary, rhetoric) to maintain personalization.
def identify_writing_pattern(history_content):
    
    user_prompt = PROMPT_IDENTIFY_WRITING_PATTERN.format(history_content=history_content)
    
    
    class WritingPattern(BaseModel):
        writing_pattern_type: str
        explanation: str
        pattern: str
        example: str
    class WritingFeature(BaseModel):
        writing_feature_type: str
        explanation: str
        example: str
        preferred_words: str
        preferred_syntax: str
    class WritingPatternAnalysis(BaseModel):
        writing_patterns: list[WritingPattern]
        writing_features: list[WritingFeature]
    
    messages=[
        {"role": "user", "content": user_prompt},
    ]
    
    writing_pattern_analysis = client.beta.chat.completions.parse(
            **LLM_KWARGS,
        messages=messages,
            response_format=WritingPatternAnalysis,
        )
    writing_patterns = writing_pattern_analysis.choices[0].message.parsed.writing_patterns
    writing_features = writing_pattern_analysis.choices[0].message.parsed.writing_features

    
    writing_patterns_formatted = []
    for idx, pattern in enumerate(writing_patterns, start=1):
        writing_patterns_formatted.append(
            f"Pattern {idx}:\n"
            f"Type: {pattern.writing_pattern_type}\n"
            f"Explanation: {pattern.explanation}\n"
            f"Pattern: {pattern.pattern}\n"
            f"Example: {pattern.example}\n"
        )
    writing_patterns_formatted_output = "\n".join(writing_patterns_formatted)

    
    writing_features_formatted = []
    for idx, feature in enumerate(writing_features, start=1):
        writing_features_formatted.append(
            f"Feature {idx}:\n"
            f"Type: {feature.writing_feature_type}\n"
            f"Explanation: {feature.explanation}\n"
            f"Example: {feature.example}\n"
            f"Preferred Words: {feature.preferred_words}\n"
            f"Preferred Syntax: {feature.preferred_syntax}\n"
        )
    writing_features_formatted_output = "\n".join(writing_features_formatted)

    
    return writing_patterns_formatted_output, writing_features_formatted_output


# Function to Predict Sentence
# Employs the Personalized and Contextual Prompt (PCP) strategy. Integrates all contextual modules (CM), intention extraction modules (IEM), and writing style modules (WSM) to generate a personalized prediction.
def predict_sentence(title, context_info, current_writing_content, best_match_writing_purpose, answer_from_current, answer_from_history, best_match_sentence_pattern, writing_patterns_formatted_output, writing_features_formatted_output):
    
    user_prompt = PROMPT_PREDICT_SENTENCE.format(title=title, context_info=context_info, current_writing_content=current_writing_content, best_match_writing_purpose=best_match_writing_purpose, writing_patterns_formatted_output=writing_patterns_formatted_output, writing_features_formatted_output=writing_features_formatted_output, best_match_sentence_pattern=best_match_sentence_pattern, answer_from_current=answer_from_current, answer_from_history=answer_from_history)

    
    class PredictSentence(BaseModel):
        predict_sentence: str
    
    messages=[
        {"role": "user", "content": user_prompt}
    ]
    
    predict_sentence = client.beta.chat.completions.parse(
        model="gpt-4o-mini", #o3-mini #gpt-4o-mini
        # reasoning_effort="low",
        messages=messages,
        response_format=PredictSentence
    )
    
    final_predict_sentence = predict_sentence.choices[0].message.parsed.predict_sentence
    
    return final_predict_sentence, user_prompt


# Function to Get Predict Sentence
# Main orchestration function integrating all sub-modules for generating the predicted sentence.
async def get_predict_sentence(current_essay_content: str, history_essay_content: str, images_info: List[dict], title: str) -> str:
    start_time = time.time()  
    try:
        
        timeout = 160  

        
        context_info = ""
        for idx, img in enumerate(images_info, 1):
            context_info += f"Context Infomation {idx}:\n"
            context_info += f"Keywords: {', '.join(img['keywords'])}\n"
            context_info += f"Description: {img['description']}\n\n"

        async def predict_with_timeout():
            
            purpose_start = time.time()
            writing_purposes_list = identify_writing_purpose(current_essay_content)
            if not writing_purposes_list:
                raise ValueError("unable to identify writing purpose")
            print(f"identify writing purposetime spent: {time.time() - purpose_start:.2f} seconds")

            
            vote_start = time.time()
            best_match_writing_purpose, error_msg = vote_writing_purpose(current_essay_content, writing_purposes_list)
            if error_msg:
                raise ValueError(f"error occurred during voting process: {error_msg}")
            print(f"Vote for the best writing purpose time spent: {time.time() - vote_start:.2f} seconds")

            
            query_start = time.time()
            query_list = generate_question(current_essay_content, best_match_writing_purpose)
            if not query_list:
                raise ValueError("unable to generate question")
            print(f"Generate question time spent: {time.time() - query_start:.2f} seconds")

            
            history_start = time.time()
            answer_from_history_list = ""
            for query in query_list:
                query_answer_from_history = await answer_from_history(query)
                if query_answer_from_history != "I am sorry but I am unable to answer this question given the provided data.":
                    answer_from_history_list += f"Question: {query}\nAnswer: {query_answer_from_history}\n\n"
            print(f"retrieve answer from history essaytime spent: {time.time() - history_start:.2f} seconds")

            
            current_start = time.time()
            answer_from_current_list = ""
            for query in query_list:
                query_answer_from_current = answer_from_current(current_essay_content, query)
                if query_answer_from_current != "No related information.":
                    answer_from_current_list += f"Question: {query}\nAnswer: {query_answer_from_current}\n\n"
            print(f"retrieve answer from current essaytime spent: {time.time() - current_start:.2f} seconds")

            
            pattern_start = time.time()
            best_match_sentence_pattern = identify_sentence_pattern(
                current_essay_content, 
                history_essay_content, 
                best_match_writing_purpose
            )
            if not best_match_sentence_pattern:
                raise ValueError("Unable to identify sentence pattern")
            print(f"identify sentence patterntime spent: {time.time() - pattern_start:.2f} seconds")

            
            style_start = time.time()
            writing_patterns_formatted_output, writing_features_formatted_output = identify_writing_pattern(history_essay_content)
            if not writing_patterns_formatted_output or not writing_features_formatted_output:
                raise ValueError("Unable to identify writing style")
            print(f"identify writing styletime spent: {time.time() - style_start:.2f} seconds")

            
            predict_start = time.time()
            final_predict_sentence, user_prompt = predict_sentence(
                title,
                context_info,
                current_essay_content,
                best_match_writing_purpose,
                answer_from_current_list,
                answer_from_history_list,
                best_match_sentence_pattern,
                writing_patterns_formatted_output,
                writing_features_formatted_output
            )
            if not final_predict_sentence:
                raise ValueError("Unable to generate predicted sentence")
            print(f"generate predicted sentencetime spent: {time.time() - predict_start:.2f} seconds")

            
            # final_predict_sentence = "test"
            # user_prompt = "test"

            return final_predict_sentence, user_prompt

        
        final_predict_sentence, user_prompt = await asyncio.wait_for(predict_with_timeout(), timeout=timeout)

        total_time = time.time() - start_time
        print(f"\nTotal time spent on prediction process: {total_time:.2f} seconds")

        return final_predict_sentence, user_prompt

    except asyncio.TimeoutError:
        total_time = time.time() - start_time
        print(f"Prediction timed out, total execution time: {total_time:.2f} seconds")
        raise TimeoutError("Prediction timed out, please try again later.")

    except Exception as e:
        total_time = time.time() - start_time
        print(f"Prediction failed, total execution time: {total_time:.2f} seconds")
        print(f"Error occurred while predicting sentence: {str(e)}")
        raise e


            





