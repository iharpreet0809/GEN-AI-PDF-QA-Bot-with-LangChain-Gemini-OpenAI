from langchain_core.prompts import PromptTemplate

pdf_qa_prompt = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are an intelligent assistant. Use the following PDF context to answer the user's question clearly.

Context:
{context}

Question:
{question}

Answer:
"""
)
