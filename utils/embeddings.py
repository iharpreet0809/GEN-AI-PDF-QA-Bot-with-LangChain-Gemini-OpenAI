import os
from langchain_openai import OpenAIEmbeddings
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from dotenv import load_dotenv

load_dotenv()

def get_embeddings():
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "gemini":
        # Use HuggingFace embeddings as fallback for Gemini (free, runs locally)
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError:
            from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    else:
        return OpenAIEmbeddings(openai_api_key=os.getenv("OPENAI_API_KEY"))
