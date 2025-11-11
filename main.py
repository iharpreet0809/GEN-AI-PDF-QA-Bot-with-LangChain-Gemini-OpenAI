from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from utils.pdf_loader import load_and_split_pdf
from utils.embeddings import get_embeddings
from utils.vector_store import create_vector_store
from chains.pdf_qa_chain import create_pdf_qa_chain
from langchain_community.vectorstores import Chroma
import shutil, os

app = FastAPI(title="LangChain PDF Q&A Chatbot")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

UPLOAD_DIR = "uploads"
CHROMA_DIR = "chroma_db"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Cache for storing processed PDFs
pdf_cache = {}

@app.get("/")
async def read_root():
    """Serve the main HTML page"""
    return FileResponse("static/index.html")

@app.post("/upload/")
async def upload_pdf(file: UploadFile):
    """Upload and process PDF - this will take time but only once"""
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Process PDF immediately after upload
    chunks = load_and_split_pdf(file_path)
    embeddings = get_embeddings()
    
    # Create unique collection name for this PDF
    collection_name = file.filename.replace(".", "_").replace(" ", "_")
    vectorstore = Chroma.from_documents(
        chunks, 
        embeddings, 
        persist_directory=CHROMA_DIR,
        collection_name=collection_name
    )
    
    # Cache the collection name
    pdf_cache[file_path] = collection_name
    
    return {
        "message": "PDF uploaded and processed successfully", 
        "path": file_path,
        "collection": collection_name,
        "chunks": len(chunks)
    }

@app.post("/ask/")
async def ask_question(pdf_path: str = Form(...), question: str = Form(...)):
    """Ask question - this will be fast as PDF is already processed"""
    
    # Check if PDF was processed
    if pdf_path not in pdf_cache:
        raise HTTPException(status_code=404, detail="PDF not found. Please upload it first.")
    
    collection_name = pdf_cache[pdf_path]
    embeddings = get_embeddings()
    
    # Load existing vectorstore (fast!)
    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=collection_name,
        embedding_function=embeddings
    )
    
    qa_chain = create_pdf_qa_chain(vectorstore)
    
    async def generate_stream():
        """Stream response - simple and working"""
        try:
            # Send initial signal
            yield f"data: {json.dumps({'chunk': '', 'done': False, 'status': 'started'})}\n\n"
            await asyncio.sleep(0.1)
            
            # Generate answer
            result = qa_chain.invoke(question)
            
            # Stream in small chunks for fast but smooth display
            words = result.split()
            chunk_size = 2  # Send 2 words at a time
            
            for i in range(0, len(words), chunk_size):
                chunk_words = words[i:i+chunk_size]
                chunk = " ".join(chunk_words) + (" " if i+chunk_size < len(words) else "")
                yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
                await asyncio.sleep(0.02)  # Fast and smooth
            
            # Send completion signal
            yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
            
        except Exception as e:
            import traceback
            error_msg = f"Error: {str(e)}\n{traceback.format_exc()}"
            yield f"data: {json.dumps({'chunk': error_msg, 'done': True, 'error': True})}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
