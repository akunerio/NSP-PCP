import os
from dotenv import load_dotenv

load_dotenv()

GPT_API_KEY = os.getenv("GPT_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

LLM_KWARGS = {"model": LLM_MODEL}
if "o3" in LLM_MODEL:
    LLM_KWARGS["reasoning_effort"] = "low"
else:
    LLM_KWARGS["temperature"] = 0.7