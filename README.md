# 🤖 AI PDF Chatbot - Powered by Gemini 2.5 Pro

A modern, professional PDF Q&A chatbot built with FastAPI, LangChain, and Google's Gemini 2.5 Pro AI. Upload any PDF document and ask questions in natural language!

![Python](https://img.shields.io/badge/Python-3.12-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)
![LangChain](https://img.shields.io/badge/LangChain-1.0+-orange)
![Gemini](https://img.shields.io/badge/Gemini-2.5%20Pro-purple)

## ✨ Features

- 📄 **PDF Upload & Processing** - Drag & drop or click to upload
- 🧠 **AI-Powered Q&A** - Powered by Gemini 2.5 Pro (1M token context)
- ⚡ **Fast Performance** - Local embeddings with HuggingFace
- 💬 **Natural Language** - Ask questions in plain English
- 🎨 **Modern UI** - Beautiful, responsive interface
- 🔒 **Secure** - Local processing with API-based AI

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Google Gemini API Key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd langchain_fastapi_pdfbot
```

2. **Create virtual environment**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up environment variables**

Create a `.env` file:
```env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_google_api_key_here
```

5. **Run the application**
```bash
uvicorn main:app --reload
```

6. **Open your browser**
```
http://127.0.0.1:8000
```

## 📁 Project Structure

```
langchain_fastapi_pdfbot/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables
├── static/                # Frontend files
│   ├── index.html        # Main HTML page
│   ├── css/
│   │   └── style.css     # Styles
│   └── js/
│       └── app.js        # JavaScript logic
├── chains/               # LangChain chains
│   ├── pdf_qa_chain.py  # Q&A chain
│   └── prompt_templates.py
├── utils/               # Utility functions
│   ├── pdf_loader.py   # PDF processing
│   ├── embeddings.py   # Embedding models
│   └── vector_store.py # Vector database
├── uploads/            # Uploaded PDFs
└── chroma_db/         # Vector database storage
```

## 🎯 How It Works

1. **Upload PDF** - User uploads a PDF document
2. **Process** - PDF is split into chunks and embedded using HuggingFace
3. **Store** - Embeddings are stored in ChromaDB vector database
4. **Ask** - User asks questions in natural language
5. **Retrieve** - Relevant chunks are retrieved from vector store
6. **Answer** - Gemini 2.5 Pro generates comprehensive answers

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **LangChain** - LLM application framework
- **Google Gemini 2.5 Pro** - AI model for Q&A
- **HuggingFace** - Local embeddings (sentence-transformers)
- **ChromaDB** - Vector database

### Frontend
- **HTML5** - Structure
- **CSS3** - Modern styling with animations
- **Vanilla JavaScript** - No frameworks needed

## 📊 API Endpoints

### `POST /upload/`
Upload and process a PDF document
- **Input**: PDF file (multipart/form-data)
- **Output**: Processing status, chunk count

### `POST /ask/`
Ask a question about the uploaded PDF
- **Input**: `pdf_path`, `question` (form data)
- **Output**: AI-generated answer

### `GET /docs`
Interactive API documentation (Swagger UI)

## 🎨 UI Features

- **Drag & Drop Upload** - Easy file upload
- **Real-time Chat** - Instant Q&A interface
- **Markdown Support** - Formatted responses
- **Loading States** - Visual feedback
- **Responsive Design** - Works on all devices
- **Smooth Animations** - Professional feel

## 🔧 Configuration

### Environment Variables

```env
# LLM Provider (gemini or openai)
LLM_PROVIDER=gemini

# Google Gemini API Key
GOOGLE_API_KEY=your_api_key_here

# Optional: OpenAI API Key (if using OpenAI)
OPENAI_API_KEY=your_openai_key_here
```

### Available Models

- `gemini-2.5-pro` - Best quality (default)
- `gemini-2.5-flash` - Faster responses
- `gemini-2.0-flash` - Older version

## 📈 Performance

- **Upload Time**: 20-30 seconds (one-time processing)
- **Query Time**: 2-5 seconds (fast retrieval + AI)
- **Context Window**: 1M tokens (Gemini 2.5 Pro)
- **Output Limit**: 65K tokens

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Built with ❤️ by [Your Name]

## 🙏 Acknowledgments

- Google Gemini AI
- LangChain Team
- FastAPI Community
- HuggingFace

---

**Note**: Make sure to keep your API keys secure and never commit them to version control!
