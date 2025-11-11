from langchain_community.vectorstores import Chroma

def create_vector_store(chunks, embeddings):
    vectorstore = Chroma.from_documents(chunks, embeddings, persist_directory="chroma_db")
    return vectorstore
