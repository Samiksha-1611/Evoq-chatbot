# 🤖 EVOQ - Intelligent AI Chatbot

EVOQ is a modern AI-powered chatbot with document processing, image recognition, and real-time chat capabilities.

## ✨ Features

- 💬 Real-time AI chat using Groq's Llama 3.3 70B
- 🖼️ Image recognition with Groq Llama 4 Scout
- 📄 Document reading (PDF, Word, TXT)
- 🔐 User authentication (Login/Register)
- 📜 Conversation history (localStorage)
- 🎤 Voice input/output support
- 📎 File upload with inline preview
- 🎨 Modern dark UI with glass-morphism
- 📱 Fully responsive design

## 🚀 Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express
- **AI Models:** Groq (Llama 3.3, Llama 4 Scout)
- **Authentication:** JWT, bcryptjs

## 📦 Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/evoq-chatbot.git
cd evoq-chatbot

2. Install dependencies
npm install

3.Create a .env file
.env
GROQ_API_KEY=your_groq_api_key_here

4.Start the server
node server.js
Open http://localhost:3000

#🎯 How It Works
Feature	Process
Text Chat	Send messages → Groq Llama 3.3 70B processes → AI responds
Image Upload	Upload image → Groq Llama 4 Scout analyzes → AI describes
Document Upload	Upload PDF/Word → Text extraction → AI answers questions
History	Conversations saved locally in your browser

#📁 Project Structure
text
Evog-chatbot/
├── public/                    # Frontend files
│   ├── index.html             # Main HTML
│   ├── script.js              # Client-side JavaScript
│   └── style.css              # Styling
├── uploads/                   # Temporary file storage (auto-created)
├── .env                       # Environment variables (NOT in repo)
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
├── package-lock.json          # Locked dependencies
└── server.js                  # Backend server

#🔑 Environment Variables
GROQ_API_KEY- Your Groq API key for AI services

#📝 License
MIT


