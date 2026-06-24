// ============ LOADING SCREEN ============
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
    loadingScreen.classList.add('hidden');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 600);
    console.log('✅ Loading screen hidden');
  }
}

// ============ AUTH STATE ============
let currentUser = null;
let isAuthenticated = false;
let isFirstMessage = true;
let currentFile = null;
let isUploading = false;

// ============ DOM READY ============
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 EVOQ Initializing...");
  
  // Check if user is already logged in
  checkAuth();
  
  // Auth form handlers
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("showRegister").addEventListener("click", showRegisterScreen);
  document.getElementById("showLogin").addEventListener("click", showLoginScreen);
  
  // Chat handlers
  document.getElementById("send").addEventListener("click", sendMessage);
  document.getElementById("text").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // New Chat button
  const newChatBtn = document.getElementById("newChatBtn");
  if (newChatBtn) {
    newChatBtn.addEventListener("click", startNewChat);
  }
  
  // Logout - FIXED
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
  
  // Attachment
  document.getElementById("attachment").addEventListener("click", () => {
    document.getElementById("fileInput").click();
  });
  document.getElementById("fileInput").addEventListener("change", handleFileSelect);
  
  // History
  document.getElementById("historyButton").addEventListener("click", openHistoryModal);
  document.querySelector(".close-history").addEventListener("click", closeHistoryModal);
  
  // Click outside modal to close
  window.addEventListener("click", (e) => {
    const modal = document.getElementById("historyModal");
    if (e.target === modal) {
      closeHistoryModal();
    }
  });
  
  console.log("✅ EVOQ initialized");
});

// ============ AUTH FUNCTIONS ============

function checkAuth() {
  console.log("🔍 Checking authentication...");
  
  fetch("/api/me")
    .then(res => {
      console.log("Auth response status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log("Auth data:", data);
      if (data.authenticated) {
        currentUser = data.username;
        isAuthenticated = true;
        showMainApp();
        document.getElementById("usernameDisplay").textContent = currentUser;
        console.log(`✅ Logged in as: ${currentUser}`);
      } else {
        showAuthScreen();
      }
    })
    .catch((error) => {
      console.error("Auth check error:", error);
      showAuthScreen();
    })
    .finally(() => {
      // Hide loading screen ONCE
      hideLoadingScreen();
    });
}

function showAuthScreen() {
  console.log("📱 Showing auth screen");
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appContainer").classList.remove("active");
  document.getElementById("appContainer").style.display = "none";
}

function showMainApp() {
  console.log("💬 Showing main app");
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appContainer").style.display = "flex";
  document.getElementById("appContainer").classList.add("active");
  
  const welcome = document.getElementById("welcomeContainer");
  if (welcome) {
    welcome.classList.remove("hidden");
  }
  isFirstMessage = true;
}

function showLoginScreen(e) {
  if (e) e.preventDefault();
  console.log("📱 Showing login screen");
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("registerScreen").style.display = "none";
  clearAuthErrors();
}

function showRegisterScreen(e) {
  if (e) e.preventDefault();
  console.log("📝 Showing register screen");
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("registerScreen").style.display = "flex";
  clearAuthErrors();
}

function clearAuthErrors() {
  document.querySelectorAll(".auth-error").forEach(el => {
    el.textContent = "";
    el.classList.remove("visible");
  });
}

function showAuthError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.classList.add("visible");
  }
}

// ============ LOGIN ============
async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();
  
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  
  if (!username || !password) {
    showAuthError("loginError", "Please enter username and password");
    return;
  }
  
  try {
    console.log("🔑 Attempting login for:", username);
    
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    console.log("Login response:", data);
    
    if (data.success) {
      currentUser = username;
      isAuthenticated = true;
      document.getElementById("usernameDisplay").textContent = username;
      showMainApp();
      startNewChat();
      console.log(`✅ Login successful: ${username}`);
    } else {
      showAuthError("loginError", data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    showAuthError("loginError", "Connection error. Please try again.");
  }
}

// ============ REGISTER ============
async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors();
  
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  
  if (!username || !password) {
    showAuthError("registerError", "Please enter username and password");
    return;
  }
  
  if (password.length < 4) {
    showAuthError("registerError", "Password must be at least 4 characters");
    return;
  }
  
  try {
    console.log("📝 Attempting registration for:", username);
    
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    console.log("Register response:", data);
    
    if (data.success) {
      showLoginScreen(e);
      document.getElementById("loginUsername").value = username;
      showAuthError("loginError", "✅ Account created! Please sign in.");
    } else {
      showAuthError("registerError", data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Register error:", error);
    showAuthError("registerError", "Connection error. Please try again.");
  }
}

// ============ LOGOUT - FIXED ============
async function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;
  
  try {
    console.log("👋 Logging out...");
    const response = await fetch("/api/logout", { method: "POST" });
    const data = await response.json();
    console.log("Logout response:", data);
    
    // Reset state
    currentUser = null;
    isAuthenticated = false;
    isFirstMessage = true;
    
    // Clear chat container
    const chatContainer = document.getElementById("chatContainer");
    if (chatContainer) {
      chatContainer.innerHTML = "";
    }
    
    // Show auth screen
    showAuthScreen();
    console.log("👋 Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed. Please try again.");
  }
}

// ============ NEW CHAT ============
function startNewChat() {
  console.log("✨ Starting new chat");
  const chatContainer = document.getElementById("chatContainer");
  if (chatContainer) {
    chatContainer.innerHTML = "";
  }
  
  const welcome = document.getElementById("welcomeContainer");
  if (welcome) {
    welcome.classList.remove("hidden");
  }
  isFirstMessage = true;
  document.getElementById("text").value = "";
}

// ============ SEND MESSAGE ============
function sendMessage() {
  if (!isAuthenticated) {
    showAuthScreen();
    return;
  }
  
  const inputField = document.getElementById("text");
  const rawText = inputField.value.trim();
  
  if (!rawText) return;
  
  inputField.value = "";
  
  if (isFirstMessage) {
    document.getElementById("welcomeContainer").classList.add("hidden");
    isFirstMessage = false;
  }
  
  appendMessage("user", rawText);
  showTypingIndicator();
  
  fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: rawText })
  })
  .then(res => res.json())
  .then(data => {
    removeTypingIndicator();
    if (data.response) {
      appendMessage("EVOQ", data.response);
      saveConversation();
    } else {
      appendMessage("EVOQ", "Sorry, I couldn't generate a response.");
    }
  })
  .catch(error => {
    console.error("Error:", error);
    removeTypingIndicator();
    appendMessage("EVOQ", "Failed to connect to server.");
  });
}

// ============ APPEND MESSAGE ============
function appendMessage(sender, message, id = null) {
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;
  
  const avatar = sender === "user" ? "👤" : "🤖";
  
  const messageHtml = `<div class="message ${sender}">
    <div class="avatar">${avatar}</div>
    <div class="msg-body" ${id ? `id="${id}"` : ""}>${formatMessage(message)}</div>
  </div>`;
  
  chatContainer.insertAdjacentHTML("beforeend", messageHtml);
  scrollToBottom();
}

function formatMessage(text) {
  text = escapeHtml(text);
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\n/g, '<br>');
  return text;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  const chatContainer = document.getElementById("chatContainer");
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}

// ============ TYPING INDICATOR ============
function showTypingIndicator() {
  removeTypingIndicator();
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;
  
  const typingHtml = `<div class="message EVOQ" id="typingIndicator">
    <div class="avatar">🤖</div>
    <div class="msg-body">Thinking<span class="dots">...</span></div>
  </div>`;
  
  chatContainer.insertAdjacentHTML("beforeend", typingHtml);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// ============ FILE UPLOAD ============
function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  if (file.size > 10 * 1024 * 1024) {
    appendMessage("EVOQ", "❌ File is too large. Maximum size is 10MB");
    return;
  }
  
  currentFile = file;
  showFilePreviewInChat(file);
}

function showFilePreviewInChat(file) {
  const fileName = file.name;
  const fileSize = (file.size / 1024).toFixed(2) + " KB";
  const fileIcon = file.type.startsWith('image/') ? '🖼️' : '📄';
  
  let previewHtml = `
    <div class="message user" id="tempFileMessage">
      <div class="avatar">👤</div>
      <div class="msg-body">
        <div class="file-preview">
          <div class="file-icon">${fileIcon}</div>
          <div class="file-info">
            <div class="file-name">${escapeHtml(fileName)}</div>
            <div class="file-size">${fileSize}</div>
          </div>
        </div>
        <div class="file-question-container">
          <input type="text" id="fileQuestion" placeholder="Ask something about this file..." class="file-question-input" autocomplete="off">
          <button onclick="sendFileWithQuestion()" class="file-send-btn">Send 📤</button>
          <button onclick="cancelFileUpload()" class="file-cancel-btn">Cancel ❌</button>
        </div>
      </div>
    </div>
  `;
  
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.insertAdjacentHTML("beforeend", previewHtml);
  scrollToBottom();
  
  const questionInput = document.getElementById("fileQuestion");
  if (questionInput) {
    questionInput.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        sendFileWithQuestion();
      }
    });
    questionInput.focus();
  }
}

async function sendFileWithQuestion() {
  if (isUploading || !currentFile) return;
  
  const questionInput = document.getElementById("fileQuestion");
  const question = questionInput ? questionInput.value.trim() : "";
  
  const tempMessage = document.getElementById("tempFileMessage");
  if (tempMessage) tempMessage.remove();
  
  const userMessage = question ? 
    `📎 **${currentFile.name}**\n\n❓ ${question}` : 
    `📎 **${currentFile.name}**`;
  
  appendMessage("user", userMessage);
  showTypingIndicator();
  isUploading = true;
  
  const formData = new FormData();
  formData.append("file", currentFile);
  formData.append("question", question);
  
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    
    const data = await response.json();
    removeTypingIndicator();
    
    if (data.response) {
      appendMessage("EVOQ", data.response);
      saveConversation();
    } else if (data.error) {
      appendMessage("EVOQ", `❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error("Upload error:", error);
    removeTypingIndicator();
    appendMessage("EVOQ", "❌ Failed to upload file. Make sure the server is running.");
  } finally {
    isUploading = false;
    currentFile = null;
  }
}

function cancelFileUpload() {
  const tempMessage = document.getElementById("tempFileMessage");
  if (tempMessage) tempMessage.remove();
  currentFile = null;
}

// ============ HISTORY ============
function saveConversation() {
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;
  
  const messageElements = chatContainer.querySelectorAll(".message");
  if (messageElements.length === 0) return;
  
  const messages = [];
  messageElements.forEach(msg => {
    const sender = msg.classList.contains("user") ? "user" : "EVOQ";
    const textElement = msg.querySelector(".msg-body");
    if (textElement) {
      messages.push({
        sender: sender,
        text: textElement.innerText
      });
    }
  });
  
  if (messages.length > 0) {
    const conversation = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      messages: messages,
      preview: messages[0]?.text.substring(0, 50) || "Empty"
    };
    
    let histories = localStorage.getItem("chatHistories");
    histories = histories ? JSON.parse(histories) : [];
    histories.unshift(conversation);
    if (histories.length > 30) histories.pop();
    localStorage.setItem("chatHistories", JSON.stringify(histories));
  }
}

function openHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    loadHistoryList();
    modal.classList.add("show");
    modal.style.display = "flex";
  }
}

function closeHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.classList.remove("show");
    modal.style.display = "none";
  }
}

function loadHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;
  
  let histories = localStorage.getItem("chatHistories");
  histories = histories ? JSON.parse(histories) : [];
  
  if (histories.length === 0) {
    historyList.innerHTML = '<div class="history-empty">No conversation history yet. Start chatting!</div>';
    return;
  }
  
  historyList.innerHTML = "";
  histories.forEach(conv => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.innerHTML = `
      <strong>${conv.date}</strong>
      <div class="history-preview">${escapeHtml(conv.preview)}...</div>
    `;
    historyItem.onclick = () => loadConversation(conv.id);
    historyList.appendChild(historyItem);
  });
}

function loadConversation(conversationId) {
  let histories = localStorage.getItem("chatHistories");
  histories = histories ? JSON.parse(histories) : [];
  
  const conversation = histories.find(h => h.id === conversationId);
  if (!conversation) return;
  
  const chatContainer = document.getElementById("chatContainer");
  chatContainer.innerHTML = "";
  
  conversation.messages.forEach(msg => {
    const avatar = msg.sender === "user" ? "👤" : "🤖";
    const messageHtml = `<div class="message ${msg.sender}">
      <div class="avatar">${avatar}</div>
      <div class="msg-body">${escapeHtml(msg.text)}</div>
    </div>`;
    chatContainer.insertAdjacentHTML("beforeend", messageHtml);
  });
  
  if (conversation.messages.length > 0) {
    document.getElementById("welcomeContainer").classList.add("hidden");
    isFirstMessage = false;
  }
  
  scrollToBottom();
  closeHistoryModal();
}

// ============ VOICE FUNCTIONS ============
function speakText() {
  const lastMsg = document.querySelector('.message.EVOQ:last-child .msg-body');
  if (lastMsg) {
    const utterance = new SpeechSynthesisUtterance(lastMsg.innerText);
    window.speechSynthesis.speak(utterance);
  }
}

function togglePauseResume() {
  if (window.speechSynthesis.speaking) {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    } else {
      window.speechSynthesis.pause();
    }
  }
}

function cancelSpeech() {
  window.speechSynthesis.cancel();
}

// ============ EXPOSE FUNCTIONS TO GLOBAL SCOPE ============
window.sendFileWithQuestion = sendFileWithQuestion;
window.cancelFileUpload = cancelFileUpload;
window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.speakText = speakText;
window.togglePauseResume = togglePauseResume;
window.cancelSpeech = cancelSpeech;