# prompts.py

PROMPT_IDENTIFY_WRITING_PURPOSE = """# Instruction:
You are an advanced AI assistant with expertise in English writing. Your task is to analyze the writing purpose of the predicted sentence in a English essay. Please think step by step.

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

Additionally, the user specifies the paragraph containing the predicted sentence and marks its position using [PREDICTED SENTENCE] within the paragraph’s text.

# Your Task:
1. Understand Context: Analyze the given content and determine the role of the predicted sentence.
2. Identify Writing Purpose: Consider whether the predicted sentence should introduce an idea, provide evidence, offer a transition, or summarize a point.
3. Just output the purpose of predicted sentence you analyzed."""

PROMPT_VOTE_WRITING_PURPOSE = """# Instruction:
You are an advanced AI assistant with expertise in English writing. Your task is to analyze a predicted sentence in a English essay and determine which of {num_options} given purposes of writing best aligns with its intended function. Additionally, you must consider whether purposes of writing aligns with the English essay context. Please think step by step.

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

Additionally, the user specifies the paragraph containing the predicted sentence and marks its position using [PREDICTED SENTENCE] within the paragraph’s text.

{num_options_text} Purposes of Writing:
{writing_purposes_options_list}

# Your Task:
1. Analyze Context: Understand the logical flow of the essay and the role of the predicted sentence.
2. Evaluate Purposes of Writing: Compare the predicted sentence’s expected function with the given purposes of writing and assess whether it aligns with situation description context.
3. Select the Best Fit: Identify and justify which purpose of writing most accurately aligns with the predicted sentence's role and the English essay context.(Respond with a number: 1 to {num_options})
4. Explain Your Choice: Provide a brief explanation supporting your selection based on the essay’s structure and logical coherence."""

PROMPT_GENERATE_QUESTION = """# Instruction:
You are an advanced AI assistant with expertise in analyzing English writing. Your task is to improve the predicted sentence in an English essay by formulating effective database queries. The predicted sentence has a specific purpose of writing, which will be provided as input. Your ultimate goal is to generate three targeted, insightful questions that can retrieve relevant and useful information from the database to refine the predicted sentence.

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

Additionally, the user specifies the paragraph containing the predicted sentence and marks its position using [PREDICTED SENTENCE] within the paragraph’s text.

The purpose of writing predicted sentence: {best_match_writing_purpose}

# Your Task:
1. Understand the logical flow of the essay and the role of the predicted sentence.
2. Based on the purpose of writing predicted sentence, produce three clear and concise questions.
3. Each question should be crafted to extract specific information from the database that will help enhance the predicted sentence's effectiveness.
4. Think carefully about what aspects of the writing need further research, and ensure that your questions are directly aligned with the writing purpose."""

PROMPT_ANSWER_FROM_HISTORY = """# Please answer this question: {query}"""

PROMPT_ANSWER_FROM_CURRENT = """# Instruction:
You are an AI assistant tasked with extracting accurate information from a given essay. Your primary goal is to answer the user's question strictly based on the provided text. If the answer is not explicitly stated or cannot be inferred directly from the essay, respond with "No related information." Avoid making assumptions, adding external knowledge, or generating speculative answers. Please think step by step.

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

Question: {query}

# Your Task:
1. Carefully analyze the essay to determine if it contains a direct answer to the question.
2. If the answer is explicitly stated or can be directly inferred from the essay, provide a concise and accurate response.
3. If the essay does not contain the requested information, respond strictly with: "No related information."
4. Do not include external knowledge or assumptions beyond what is given in the essay."""

# Appendix refer: WSM-3 Identify the sentence pattern
PROMPT_IDENTIFY_SENTENCE_PATTERN = """# Instruction:
You are a writing analysis AI designed to help users understand their writing style. Your task is to analyze the provided English essays and identify sentence patterns. You should provide detailed explanations for each identified category and include examples from the text.

# Task Details:
- Focus on the deeper underlying patterns and characteristics of the writing, including personal tendencies in vocabulary, sentence structures, and rhetorical devices.
- Do not worry too much about grammar or spelling mistakes; your primary goal is to focus on the stylistic tendencies present in the text.
- Provide clear definitions for each category, with specific examples from the text.

# Output Structure:
Sentence Pattern
- Sentence Pattern Type: Describes the common sentence structure used by the writer.
- Explanation: Explain the structure of the sentences that the user typically employs in their writing.
- Example: Provide a representative example from the text to demonstrate the sentence structure.
- Pattern: Describe the pattern of how sentences are generally formed.
- Function: Explain the purpose or effect this sentence pattern serves in the text.

# Input
English essays:
{essay_content}

# Your Task:
1. Analyze the provided essays to identify writing patterns and features.
2. Returning your analysis results in the output structure, ensuring each section is thorough and well-explained."""

# Appendix refer: Extract five candidate sentence patterns
PROMPT_SELECT_SENTENCE_PATTERN = """# Instruction:
You are an advanced AI assistant with expertise in English writing. Your task is to select the appropriate sentence pattern for the predicted sentence from both the history and current sentence pattern lists based on the essay content and the purpose of writing the predicted sentence. Please think step by step!

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

The purpose of writing the predicted sentence: {best_match_writing_purpose}

Sentence Pattern List:
{formatted_current_patterns}
{formatted_history_patterns}

# You Task:
- Please compare the sentence patterns used in the current essay and the past essays, and based on the purpose of the predicted sentence, determine which sentence pattern should be used for crafting the predicted sentence."""

# Appendix refer: Voting
PROMPT_VOTE_SENTENCE_PATTERN = """# Instruction:
You are an advanced AI assistant with expertise in English writing. Your task is to choose the sentence pattern that the predicted sentence should use from the {num_options} sentence pattern options according to the English essay and the purpose of writing the predicted sentence.

# Input Structure:
The user provides the essay's content:
Essay Content:
{current_writing_content}

The purpose of writing the predicted sentence : {best_match_writing_purpose}

{num_options_text} Sentence Pattern Options:
{predict_sntence_pattern_options_list}

# Your Task:
- Review the content of the essay and the stated purpose of the predicted sentence.
- Carefully analyze the {num_options_text} provided sentence pattern options.
- Select the sentence pattern that aligns best with the essay’s context and the goal of the predicted sentence.(Respond with a number: 1 to {num_options})
- Ensure that the chosen sentence pattern enhances the overall clarity, flow, and coherence of the essay.
- Provide a brief explanation of why you chose the selected sentence pattern."""

# Original identify writing pattern
PROMPT_IDENTIFY_WRITING_PATTERN = """# Instruction:
You are a writing analysis AI designed to help users understand their writing style. Your task is to generate user's writing style based on the user's provided English essays.

# Task Details:
- Analyze and discover the underlying writing patterns and features that reflect the user's personal writing habits, such as preferred vocabulary, sentence structures, and rhetorical devices.
Don't worry too much about grammar or spelling mistakes. Should focus on identifying and characterizing the user's stylistic tendencies.

# Output Structure:
Writing Pattern
- writing pattern type: defines the category of the pattern (e.g. narrative, expository, argumentative, etc.)
- explanation: the main features of the pattern, such as how information is organized, common expression habits, tone, etc.
- pattern: common ways of organizing paragraphs or content
- example: provide a representative example of the pattern

Writing Feature
- writing feature type: defines the writing features (e.g. vocabulary, sentence structure, word order, rhetoric, etc.)
- explanation: describes the user's common expression style, including preferred syntax, vocabulary, conjunctions, etc.
- example: give an example illustrating how the feature manifests in the text
- preferred words: the words and phrases favored by the user
- preferred syntax: the sentence structures favored by the user, such as simple sentences, long sentences, repetitive sentence patterns, etc.

# Input
Several English essays:
{history_content}

# Your Task:
1. Analyze the provided essays to identify writing patterns and features.
2. Return your analysis results in the output structure, ensuring each section is thorough and well-explained."""

# Appendix refer: PCP (Personalized and Contextual Prompt)
PROMPT_PREDICT_SENTENCE = """# Instruction:
You are an AI writing assistant specialized in predicting a sentence within a user’s English essay. Your task is to generate ONE predicted sentence based on the provided full context. The sentence must align with the essay's topic, as defined by the Title and Context, and must not deviate from the main subject. Please think step by step!

# Input Detail:
- Essay Title: The title defines the essay's core topic and sets the overall direction.
- Contextual Information: Background descriptions and keywords that represent the essay's intent and audience perspective.
- Essay Content: The entire essay text, with one paragraph containing the marker [PREDICTED SENTENCE], which is where the sentence will be inserted.
- Writing Purpose: The intent or goal for adding the predicted sentence.
- Writing Pattern: The organizational structure of the essay.
- Writing Features: The stylistic and linguistic tone.
- Sentence Pattern: The designated grammatical structure of the sentence.
- Enhancement Details: Supplementary writing details, drawn from current and past writing drafts.

# Input Structure:
Essay Title:
{title}

Contextual Information:
{context_info}

Essay Content:
{current_writing_content}

Writing Purpose:
{best_match_writing_purpose}

Writing Pattern:
{writing_patterns_formatted_output}

Writing Features:
{writing_features_formatted_output}

Sentence Pattern:
{best_match_sentence_pattern}

Enhancement Details:
{answer_from_current}
{answer_from_history}

# Your Task:
1. Focus on the Core Topic:
- Ensure the predicted sentence directly supports the essay's core topic as defined by the Title and Contextual Information. (e.g., location, people involved, names of food, physical landmarks, etc.).
- Identify the role of the predicted sentence (e.g., introducing an idea, providing evidence, offering a transition, or summarizing a point).
- Avoid introducing unrelated or tangential ideas.

2. Enhance Logical Flow:
- The predicted sentence must connect seamlessly with the preceding and following sentences.
- Use transition words or phrases if necessary to enhance the flow.

3. Avoid Redundancy:
- Do NOT repeat or paraphrase ideas already present in the essay.
- Check for semantic similarity (not just surface text).

4. Preserve Logical Accuracy:
- The predicted sentence MUST NOT introduce false or contradictory information (e.g., misidentifying a restaurant as a cafe, mischaracterizing a door as a mural).

5. Respect Contextual Consistency:
- Align your sentence with the setting, tone, and real-world implications established by the essay. Use the contextual information (keywords + description) to guide your tone and content.

6. Natural Integration:
- Your sentence should enhance the flow of the paragraph, connect ideas logically, and sound natural.

7. Maintain Stylistic Consistency:
- The predicted sentence must match the tone and stylistic level of the surrounding content (e.g., avoid shifting from factual to poetic or from neutral to emotional).
- Do not use overly figurative or metaphorical language unless such style is already present in the preceding or following sentences.

8. Output a SINGLE Sentence Only."""
