// ==================== LOADING =====================
const loadingMessages = [
  "Initializing AI Assistant...",
  "Loading Neural Engine...",
  "Connecting Knowledge Base...",
  "Preparing Workspace...",
  "Welcome to EVOQ"
];

function startLoading() {
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const loaderMessage = document.getElementById("loaderMessage");
  let progress = 0;
  let messageIndex = 0;

  const interval = setInterval(() => {
    progress++;
    progressFill.style.width = progress + "%";
    progressText.innerHTML = progress + "%";

    if (progress % 20 === 0 && messageIndex < loadingMessages.length - 1) {
      messageIndex++;
      loaderMessage.innerHTML = loadingMessages[messageIndex];
    }

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById("loadingScreen").classList.add("hidden");
      }, 600);
    }
  }, 30);
}

window.onload = startLoading;

// ==================== AUTH STATE ====================
let currentUser = null;
let isAuthenticated = false;
let isFirstMessage = true;
let currentFile = null;
let isUploading = false;

// ==================== PARTICLES ====================
function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 1.5 + 0.3;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.fadeDir = Math.random() > 0.5 ? 1 : -1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.opacity += this.fadeDir * 0.003;
      if (this.opacity <= 0.05 || this.opacity >= 0.6) this.fadeDir *= -1;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
      ctx.fill();
    }
  }

  const count = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(animate);
  }
  animate();
}

// ==================== DOM READY ====================
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 EVOQ Initializing...");

  // Particles
  initParticles();

  // Check auth
  checkAuth();

  // Landing
  const landingBtn1 = document.getElementById("landingGetStartedBtn");
  if (landingBtn1) landingBtn1.addEventListener("click", showAuthScreen);
  const landingBtn2 = document.getElementById("landingGetStartedBtn2");
  if (landingBtn2) landingBtn2.addEventListener("click", showAuthScreen);

  // Auth forms
  document.getElementById("loginForm").addEventListener("submit", handleLogin);
  document.getElementById("registerForm").addEventListener("submit", handleRegister);
  document.getElementById("showRegister").addEventListener("click", showRegisterScreen);
  document.getElementById("showLogin").addEventListener("click", showLoginScreen);

  // Chat
  document.getElementById("send").addEventListener("click", sendMessage);
  document.getElementById("text").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // New Chat
  const newChatBtn = document.getElementById("newChatBtn");
  if (newChatBtn) newChatBtn.addEventListener("click", startNewChat);

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);

  // Settings
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById("settingsModal").style.display = "flex";
    });
  }

  // Attachment
  document.getElementById("attachment").addEventListener("click", () => {
    document.getElementById("fileUploadModal").style.display = "flex";
  });
  document.getElementById("fileInput").addEventListener("change", handleFileModalSelect);

  // History
  document.getElementById("historyButton").addEventListener("click", openHistoryModal);
  document.getElementById("closeHistory").addEventListener("click", closeHistoryModal);
  document.getElementById("sidebarOverlay").addEventListener("click", closeHistoryModal);

  // Sidebar toggle
  const sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", () => {
      document.getElementById("leftSidebar").classList.toggle("open");
    });
  }

  // Drag and Drop
  const dragDropArea = document.getElementById("dragDropArea");
  if (dragDropArea) {
    dragDropArea.addEventListener("click", () => document.getElementById("fileInput").click());
    dragDropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dragDropArea.classList.add("drag-over");
    });
    dragDropArea.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dragDropArea.classList.remove("drag-over");
    });
    dragDropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dragDropArea.classList.remove("drag-over");
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        document.getElementById("fileInput").files = e.dataTransfer.files;
        handleFileModalSelect();
      }
    });
  }

  // Close modals on backdrop click
  document.querySelectorAll('.auth-screen').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal && modal.id !== 'loginScreen' && modal.id !== 'registerScreen') {
        modal.style.display = 'none';
      }
    });
  });

  console.log("✅ EVOQ initialized");
});

// ==================== AUTH FUNCTIONS ====================
function checkAuth() {
  console.log("🔍 Checking authentication...");
  fetch("/api/me")
    .then(res => res.json())
    .then(data => {
      if (data.authenticated) {
        currentUser = data.username;
        isAuthenticated = true;
        showMainApp();
        document.getElementById("usernameDisplay").textContent = currentUser;
        console.log(`✅ Logged in as: ${currentUser}`);
      } else {
        showLandingScreen();
      }
    })
    .catch((error) => {
      console.error("Auth check error:", error);
      showLandingScreen();
    })
    .finally(() => {
      setTimeout(() => {
        document.getElementById("loadingScreen").classList.add("hidden");
      }, 2000);
    });
}

function showLandingScreen() {
  document.getElementById("landingScreen").style.display = "flex";
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appContainer").style.display = "none";
}

function showAuthScreen() {
  document.getElementById("landingScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appContainer").style.display = "none";
}

function showMainApp() {
  document.getElementById("landingScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("registerScreen").style.display = "none";
  document.getElementById("appContainer").style.display = "flex";

  const welcome = document.getElementById("welcomeContainer");
  if (welcome) welcome.classList.remove("hidden");
  isFirstMessage = true;
}

function showLoginScreen(e) {
  if (e) e.preventDefault();
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("registerScreen").style.display = "none";
  clearAuthErrors();
}

function showRegisterScreen(e) {
  if (e) e.preventDefault();
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
  if (el) { el.textContent = message; el.classList.add("visible"); }
}

// ==================== LOGIN ====================
async function handleLogin(e) {
  e.preventDefault();
  clearAuthErrors();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  if (!username || !password) { showAuthError("loginError", "Please enter username and password"); return; }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
      currentUser = username;
      isAuthenticated = true;
      document.getElementById("usernameDisplay").textContent = username;
      showMainApp();
      startNewChat();
    } else {
      showAuthError("loginError", data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    showAuthError("loginError", "Connection error. Please try again.");
  }
}

// ==================== REGISTER ====================
async function handleRegister(e) {
  e.preventDefault();
  clearAuthErrors();
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value.trim();
  if (!username || !password) { showAuthError("registerError", "Please enter username and password"); return; }
  if (password.length < 4) { showAuthError("registerError", "Password must be at least 4 characters"); return; }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();
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

// ==================== LOGOUT ====================
async function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;
  try {
    await fetch("/api/logout", { method: "POST" });
    currentUser = null;
    isAuthenticated = false;
    isFirstMessage = true;
    const chatContainer = document.getElementById("chatContainer");
    if (chatContainer) chatContainer.innerHTML = "";
    showAuthScreen();
  } catch (error) {
    console.error("Logout error:", error);
    alert("Logout failed. Please try again.");
  }
}

// ==================== NEW CHAT ====================
function startNewChat() {
  const chatContainer = document.getElementById("chatContainer");
  if (chatContainer) chatContainer.innerHTML = "";
  const welcome = document.getElementById("welcomeContainer");
  if (welcome) welcome.classList.remove("hidden");
  isFirstMessage = true;
  document.getElementById("text").value = "";
}

// ==================== SUGGESTION CARDS ====================
function useSuggestion(text) {
  const input = document.getElementById("text");
  if (input) {
    input.value = text;
    input.focus();
  }
}
window.useSuggestion = useSuggestion;

// ==================== SEND MESSAGE ====================
function sendMessage() {
  if (!isAuthenticated) { showAuthScreen(); return; }
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

// ==================== APPEND MESSAGE ====================
function appendMessage(sender, message, id = null) {
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;

  const avatar = sender === "user" ? "👤" : "✦";
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
  if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ==================== TYPING INDICATOR ====================
function showTypingIndicator() {
  removeTypingIndicator();
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;
  const typingHtml = `<div class="message EVOQ" id="typingIndicator">
    <div class="avatar">✦</div>
    <div class="msg-body">Thinking<span class="dots">...</span></div>
  </div>`;
  chatContainer.insertAdjacentHTML("beforeend", typingHtml);
  scrollToBottom();
}

function removeTypingIndicator() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// Alias for compatibility
function hideTypingIndicator() { removeTypingIndicator(); }

// ==================== FILE UPLOAD ====================
function handleFileModalSelect(e) {
  const input = document.getElementById("fileInput");
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (file.size > 10 * 1024 * 1024) {
    appendMessage("EVOQ", 'File is too large. Maximum size is 10MB');
    return;
  }
  document.getElementById("dragDropArea").style.display = "none";
  document.getElementById("uploadedFileItem").style.display = "flex";
  document.getElementById("fileUploadName").textContent = file.name;
  document.getElementById("fileUploadSize").textContent = (file.size / 1024 / 1024).toFixed(2) + " MB";
  let iconClass = "fas fa-file";
  if (file.type.startsWith("image/")) iconClass = "fas fa-file-image";
  else if (file.type === "application/pdf") iconClass = "fas fa-file-pdf";
  else if (file.type.includes("word")) iconClass = "fas fa-file-word";
  else if (file.type.startsWith("text/")) iconClass = "fas fa-file-alt";
  document.getElementById("fileUploadIcon").innerHTML = `<i class="${iconClass}"></i>`;
  currentFile = file;
}

function clearUploadModalFile() {
  document.getElementById("fileInput").value = "";
  currentFile = null;
  document.getElementById("uploadedFileItem").style.display = "none";
  document.getElementById("dragDropArea").style.display = "block";
}

function closeFileUploadModal() {
  document.getElementById("fileUploadModal").style.display = "none";
  clearUploadModalFile();
  document.getElementById("fileUploadQuestion").value = "";
}

function submitFileUpload() {
  if (!currentFile) { alert("Please select a file first."); return; }
  const question = document.getElementById("fileUploadQuestion").value;
  closeFileUploadModal();

  isUploading = true;
  let fileIcon = "fas fa-file";
  if (currentFile.type.startsWith("image/")) fileIcon = "fas fa-file-image";
  else if (currentFile.type === "application/pdf") fileIcon = "fas fa-file-pdf";

  let userMsg = `<div style="margin-bottom: 8px; display:flex; align-items:center; gap:12px; padding:12px; background:rgba(255,255,255,0.05); border-radius:12px;">
      <div style="font-size:24px; color:#8B5CF6;"><i class="${fileIcon}"></i></div>
      <div>
        <div style="font-weight:600; color:white;">${escapeHtml(currentFile.name)}</div>
        <div style="font-size:13px; color:rgba(255,255,255,0.4);">${(currentFile.size / 1024 / 1024).toFixed(2)} MB</div>
      </div>
    </div>`;
  if (question) userMsg += `<div>${escapeHtml(question)}</div>`;
  else userMsg += `<div>Uploaded file: ${escapeHtml(currentFile.name)}</div>`;

  appendMessage("user", userMsg);
  showTypingIndicator();

  setTimeout(() => {
    hideTypingIndicator();
    let resMsg = `I've received your file **${escapeHtml(currentFile.name)}**. `;
    if (question) resMsg += `To answer your question: Yes, I can analyze this file. `;
    resMsg += `This file appears to contain important documentation. How else can I assist you?`;
    appendMessage("EVOQ", resMsg);
    isUploading = false;
    currentFile = null;
  }, 2000);
}

// ==================== HISTORY ====================
function saveConversation() {
  const chatContainer = document.getElementById("chatContainer");
  if (!chatContainer) return;
  const messageElements = chatContainer.querySelectorAll(".message");
  if (messageElements.length === 0) return;
  const messages = [];
  messageElements.forEach(msg => {
    const sender = msg.classList.contains("user") ? "user" : "EVOQ";
    const textElement = msg.querySelector(".msg-body");
    if (textElement) messages.push({ sender, text: textElement.innerText });
  });
  if (messages.length > 0) {
    const conversation = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      messages,
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
  loadHistoryList();
  document.getElementById("historySidebar").classList.add("show");
  document.getElementById("sidebarOverlay").classList.add("show");
}

function closeHistoryModal() {
  document.getElementById("historySidebar").classList.remove("show");
  document.getElementById("sidebarOverlay").classList.remove("show");
}

function getDateCategory(dateStr) {
  let date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Earlier';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
  const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (compareDate.getTime() === today.getTime()) return 'Today';
  if (compareDate.getTime() === yesterday.getTime()) return 'Yesterday';
  if (compareDate.getTime() > weekAgo.getTime()) return 'This Week';
  return 'Earlier';
}

function loadHistoryList() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;
  let histories = localStorage.getItem("chatHistories");
  histories = histories ? JSON.parse(histories) : [];
  if (histories.length === 0) {
    historyList.innerHTML = '<div class="history-empty"><p>No conversations yet.<br>Start chatting!</p></div>';
    return;
  }
  const groups = { 'Today': [], 'Yesterday': [], 'This Week': [], 'Earlier': [] };
  const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  histories.forEach(conv => {
    const category = getDateCategory(conv.date);
    if (groups[category]) groups[category].push(conv);
  });
  historyList.innerHTML = '';
  order.forEach(category => {
    const items = groups[category];
    if (items.length === 0) return;
    const section = document.createElement('div');
    section.className = 'history-section';
    const header = document.createElement('div');
    header.className = 'history-group-header';
    header.innerHTML = `<i class="fas ${category === 'Today' ? 'fa-clock' : category === 'Yesterday' ? 'fa-calendar-day' : category === 'This Week' ? 'fa-calendar-week' : 'fa-calendar'}"></i> ${category}`;
    section.appendChild(header);
    items.forEach(conv => {
      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `<i class="fas fa-comment"></i><div class="history-preview">${escapeHtml(conv.preview)}</div>`;
      item.onclick = () => loadConversation(conv.id);
      section.appendChild(item);
    });
    historyList.appendChild(section);
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
    const avatar = msg.sender === "user" ? "👤" : "✦";
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

// ==================== VOICE ====================
function speakText() {
  const lastMsg = document.querySelector('.message.EVOQ:last-child .msg-body');
  if (lastMsg) {
    const utterance = new SpeechSynthesisUtterance(lastMsg.innerText);
    window.speechSynthesis.speak(utterance);
  }
}

function togglePauseResume() {
  if (window.speechSynthesis.speaking) {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    else window.speechSynthesis.pause();
  }
}

function cancelSpeech() { window.speechSynthesis.cancel(); }

// ==================== EXPOSE GLOBALS ====================
window.submitFileUpload = submitFileUpload;
window.clearUploadModalFile = clearUploadModalFile;
window.closeFileUploadModal = closeFileUploadModal;
window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.speakText = speakText;
window.togglePauseResume = togglePauseResume;
window.cancelSpeech = cancelSpeech;
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector("i");
  if (input.type === "password") { input.type = "text"; icon.className = "fas fa-eye-slash"; }
  else { input.type = "password"; icon.className = "fas fa-eye"; }
};