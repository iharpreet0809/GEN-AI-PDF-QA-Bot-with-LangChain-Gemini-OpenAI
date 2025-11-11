// Global state
let uploadedPdfPath = null;
let isProcessing = false;

// DOM Elements
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileInfo = document.getElementById("fileInfo");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const chatMessages = document.getElementById("chatMessages");
const questionInput = document.getElementById("questionInput");
const askBtn = document.getElementById("askBtn");
const uploadLoading = document.getElementById("uploadLoading");
const chatLoading = document.getElementById("chatLoading");

// Upload Area - Click to select file
uploadArea.addEventListener("click", () => {
  fileInput.click();
});

// Drag and Drop
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type === "application/pdf") {
    fileInput.files = files;
    handleFileSelect();
  } else {
    showNotification("Please upload a PDF file", "error");
  }
});

// File Input Change
fileInput.addEventListener("change", handleFileSelect);

// Handle File Selection
function handleFileSelect() {
  const file = fileInput.files[0];
  if (file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.add("show");
    uploadBtn.disabled = false;
  }
}

// Upload Button Click
uploadBtn.addEventListener("click", uploadPDF);

// Upload PDF
async function uploadPDF() {
  const file = fileInput.files[0];
  if (!file) {
    showNotification("Please select a PDF file", "error");
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  uploadBtn.disabled = true;
  uploadLoading.classList.add("show");

  const uploadSuccess = document.getElementById("uploadSuccess");
  const uploadSuccessText = document.getElementById("uploadSuccessText");
  uploadSuccess.style.display = "none";

  try {
    const response = await fetch("/upload/", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      uploadedPdfPath = data.path;
      const pdfName = data.path
        .split("/")
        .pop()
        .replace(/\\/g, "/")
        .split("/")
        .pop();

      // Show success message below button
      uploadSuccessText.textContent = `PDF is processed! Ready for questions!`;
      uploadSuccess.style.display = "block";

      // Also add to chat
      addBotMessage(
        `✅ PDF "${pdfName}" has been uploaded and processed. You can now ask questions about it!`
      );

      questionInput.disabled = false;
      askBtn.disabled = false;
    } else {
      showNotification("Upload failed: " + data.detail, "error");
    }
  } catch (error) {
    showNotification("Upload failed: " + error.message, "error");
  } finally {
    uploadBtn.disabled = false;
    uploadLoading.classList.remove("show");
  }
}

// Ask Question
askBtn.addEventListener("click", askQuestion);
questionInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    askQuestion();
  }
});

async function askQuestion() {
  const question = questionInput.value.trim();

  if (!question) {
    showNotification("Please enter a question", "error");
    return;
  }

  if (!uploadedPdfPath) {
    showNotification("Please upload a PDF first", "error");
    return;
  }

  if (isProcessing) return;

  // Add user message
  addUserMessage(question);
  questionInput.value = "";
  questionInput.disabled = true;
  askBtn.disabled = true;
  isProcessing = true;

  // Show typing indicator
  const typingIndicator = addTypingIndicator();

  const formData = new FormData();
  formData.append("pdf_path", uploadedPdfPath);
  formData.append("question", question);

  try {
    // Small delay to ensure indicator is visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response = await fetch("/ask/", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // Read the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let messageDiv = null;
      let streamingMessage = null;
      let fullText = "";
      let firstChunkReceived = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            // Remove typing indicator ONLY when actual text arrives
            if (!firstChunkReceived && data.chunk && data.chunk.length > 0) {
              firstChunkReceived = true;

              // Remove typing indicator properly
              if (typingIndicator && typingIndicator.parentNode) {
                typingIndicator.remove();
              }

              // Create message div for streaming - plain text while streaming
              messageDiv = document.createElement("div");
              messageDiv.className = "message message-bot";
              messageDiv.innerHTML = `<div class="message-content" id="streaming-message" style="white-space: pre-wrap; line-height: 1.8;"></div>`;
              chatMessages.appendChild(messageDiv);
              streamingMessage = document.getElementById("streaming-message");
            }

            if (data.done) {
              // Apply formatting ONLY after streaming is complete
              if (streamingMessage) {
                streamingMessage.innerHTML = formatMarkdown(fullText);
                streamingMessage.style.whiteSpace = "normal";
                streamingMessage.removeAttribute("id");
              }
            } else if (data.chunk !== undefined) {
              // Accept ALL chunks including spaces
              fullText += data.chunk;
              if (streamingMessage) {
                // Show plain text while streaming (no formatting)
                streamingMessage.textContent = fullText;
                scrollToBottom();
              }
            }
          }
        }
      }
    } else {
      const data = await response.json();
      addBotMessage("❌ Error: " + data.detail);
      showNotification("Failed to get answer", "error");
    }
  } catch (error) {
    // Remove typing indicator on error
    if (typingIndicator && typingIndicator.parentNode) {
      typingIndicator.remove();
    }
    addBotMessage("❌ Error: " + error.message);
    showNotification("Failed to get answer", "error");
  } finally {
    questionInput.disabled = false;
    askBtn.disabled = false;
    isProcessing = false;
    questionInput.focus();
  }
}

// Add User Message
function addUserMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message message-user";
  messageDiv.innerHTML = `
        <div class="message-content">
            ${escapeHtml(text)}
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Add Bot Message
function addBotMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message message-bot";

  // Convert markdown-like formatting to HTML
  const formattedText = formatMarkdown(text);

  messageDiv.innerHTML = `
        <div class="message-content">
            ${formattedText}
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
}

// Add Typing Indicator
function addTypingIndicator() {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message message-bot";
  messageDiv.id = "typing-indicator-message";
  messageDiv.innerHTML = `
        <div class="typing-indicator">
            <span class="typing-text">✨ Generating answer</span>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
  chatMessages.appendChild(messageDiv);
  scrollToBottom();
  return messageDiv;
}

// Simple Clean Formatter - Applied AFTER streaming completes
function formatMarkdown(text) {
  let html = [];
  let lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // Headers
    if (line.startsWith("### ")) {
      html.push(
        '<h3 style="color: #1e293b; font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">' +
          line.substring(4) +
          "</h3>"
      );
    } else if (line.startsWith("## ")) {
      html.push(
        '<h3 style="color: #1e293b; font-size: 1.2rem; font-weight: 700; margin: 1.5rem 0 0.75rem 0; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0;">' +
          line.substring(3) +
          "</h3>"
      );
    }
    // Numbered list
    else if (/^\d+\.\s+/.test(line)) {
      let content = line.replace(/^\d+\.\s+/, "");
      content = content.replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color: #6366f1; font-weight: 600;">$1</strong>'
      );
      html.push(
        '<div style="margin-left: 1.5rem; margin-bottom: 0.75rem; line-height: 1.7;"><span style="color: #6366f1; font-weight: 600; margin-right: 0.5rem;">' +
          line.match(/^\d+/)[0] +
          ".</span>" +
          content +
          "</div>"
      );
    }
    // Bullet list
    else if (/^[\*\-]\s+/.test(line)) {
      let content = line.replace(/^[\*\-]\s+/, "");
      content = content.replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color: #6366f1; font-weight: 600;">$1</strong>'
      );
      html.push(
        '<div style="margin-left: 1.5rem; margin-bottom: 0.75rem; line-height: 1.7;"><span style="color: #6366f1; margin-right: 0.5rem;">•</span>' +
          content +
          "</div>"
      );
    }
    // Regular text
    else if (line) {
      line = line.replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color: #6366f1; font-weight: 600;">$1</strong>'
      );
      html.push(
        '<p style="margin: 0.5rem 0; line-height: 1.8;">' + line + "</p>"
      );
    }
    // Empty line
    else {
      html.push('<div style="height: 0.5rem;"></div>');
    }
  }

  return html.join("");
}

// Scroll to Bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Format File Size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Show Notification
function showNotification(message, type = "info") {
  // You can implement a toast notification here
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Add welcome message
  addBotMessage(
    "👋 Welcome! Upload a PDF document to get started. I'll analyze it and answer your questions using Gemini/OpenAI."
  );
});
