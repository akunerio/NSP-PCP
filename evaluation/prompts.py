CORRECTNESS_CRITERIA = (
    "Evaluate the correctness of the predicted sentence (ACTUAL_OUTPUT) based on the following criteria:\n"
    "1. Semantic Alignment: The predicted sentence must be factually accurate and semantically aligned with the expected sentence (EXPECTED_OUTPUT). "
    "Minor variations in wording are acceptable as long as the core meaning remains unchanged.\n"
    "2. Prompt Adherence: The predicted sentence must follow the writing style, tone, and instructions provided in the input prompt (INPUT). "
    "This includes maintaining consistency in vocabulary choice, sentence structure, and any explicit stylistic guidelines.\n"
    "3. Logical Coherence: The predicted sentence should be logically consistent and should not introduce contradictions, misinformation, or hallucinations."
)

TOPIC_RELEVANCE_CRITERIA = (
    "Evaluate whether the predicted sentence (ACTUAL_OUTPUT) directly supports the essay's core topic:\n"
    "1. Topic Adherence: Does the sentence support the essay's core topic as defined by the Title and Contextual Information (INPUT)?\n"
    "2. Role Clarity: Does the sentence serve a clear purpose (introducing idea, providing evidence, offering transition, or summarizing)?\n"
    "3. Relevance: Does it avoid introducing unrelated or tangential ideas?\n"
    "Score from 0-10 where 10 represents perfect core topic focus and relevance."
)

FLUENCY_CRITERIA = (
    "Evaluate the logical flow and coherence of the predicted sentence (ACTUAL_OUTPUT):\n"
    "1. Seamless Connection: Does the sentence connect seamlessly with preceding and following sentences (INPUT)?\n"
    "2. Transition Quality: Are transition words or phrases used effectively to enhance flow?\n"
    "3. Coherence: Does it maintain logical progression?\n"
    "Score from 0-10 where 10 represents perfect logical flow and coherence."
)

REDUNDANCY_CHECK_CRITERIA = (
    "Evaluate whether the predicted sentence (ACTUAL_OUTPUT) avoids redundancy:\n"
    "1. Uniqueness: Does it avoid repeating or paraphrasing ideas already present in the essay (INPUT)?\n"
    "2. Semantic Originality: Does it check for semantic similarity, not just surface text?\n"
    "3. Value Addition: Does it contribute new meaningful content?\n"
    "Score from 0-10 where 10 represents completely unique and valuable content."
)

LOGICAL_ACCURACY_CRITERIA = (
    "Evaluate the logical accuracy and factual consistency of the predicted sentence (ACTUAL_OUTPUT):\n"
    "1. Factual Accuracy: Does it preserve logical accuracy and avoid false information?\n"
    "2. Consistency: Does it avoid contradictory information (e.g., misidentifying objects or locations)?\n"
    "3. Detail Precision: Are specific details (names, places, objects) accurate?\n"
    "Score from 0-10 where 10 represents perfect logical accuracy and consistency."
)

CONTEXTUAL_CONSISTENCY_CRITERIA = (
    "Evaluate the contextual consistency of the predicted sentence (ACTUAL_OUTPUT):\n"
    "1. Setting Alignment: Does it align with the setting, tone, and real-world implications established by the essay (INPUT)?\n"
    "2. Contextual Information Usage: Does it properly use contextual information to guide tone and content?\n"
    "3. Environmental Consistency: Does it respect the established context?\n"
    "Score from 0-10 where 10 represents perfect contextual consistency."
)

INTEGRATION_CRITERIA = (
    "Evaluate how naturally the predicted sentence (ACTUAL_OUTPUT) integrates with the essay:\n"
    "1. Flow Enhancement: Does the sentence enhance the flow of the paragraph?\n"
    "2. Logical Connection: Does it connect ideas logically and sound natural?\n"
    "3. Smooth Integration: Does it integrate naturally into the existing text (INPUT)?\n"
    "Score from 0-10 where 10 represents perfect natural integration."
)

WRITING_STYLE_CONSISTENCY_CRITERIA = (
    "Evaluate the stylistic consistency of the predicted sentence (ACTUAL_OUTPUT):\n"
    "1. Tone Matching: Does it match the tone and stylistic level of surrounding content (INPUT)?\n"
    "2. Style Continuity: Does it avoid shifting from factual to poetic or neutral to emotional inappropriately?\n"
    "3. Language Appropriateness: Does it avoid overly figurative language unless already present?\n"
    "Score from 0-10 where 10 represents perfect stylistic consistency."
)

OUTPUT_COMPLIANCE_CRITERIA = (
    "Evaluate the compliance of the predicted sentence (ACTUAL_OUTPUT) with output requirements:\n"
    "1. Single Sentence: Is the output exactly one sentence?\n"
    "2. Format Compliance: Does it meet the basic output requirements?\n"
    "3. Structure Appropriateness: Is the sentence structure appropriate?\n"
    "Score from 0-10 where 10 represents perfect output compliance."
)
