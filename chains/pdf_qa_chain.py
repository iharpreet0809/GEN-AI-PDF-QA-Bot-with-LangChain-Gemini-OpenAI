import os
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from chains.prompt_templates import pdf_qa_prompt

def create_pdf_qa_chain(vectorstore):
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "gemini":
        # Using Gemini 2.5 Flash - optimized for speed
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            temperature=0.2,
            max_output_tokens=512  # Limit response length for faster generation
        )
    else:
        llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.2)

    # Retrieve fewer, smaller documents for fastest response
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})
    
    def format_docs(docs):
        # Limit context size for faster processing
        context = "\n\n".join(doc.page_content for doc in docs)
        # Truncate if too long (max 2000 chars for speed)
        return context[:2000] if len(context) > 2000 else context
    
    qa_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | pdf_qa_prompt
        | llm
        | StrOutputParser()
    )
    
    return qa_chain
