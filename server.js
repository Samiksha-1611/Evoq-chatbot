require('dotenv').config();

const express = require("express");
const Groq = require("groq-sdk");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();

// ============ AUTH SETUP ============
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// In-memory user storage (use database in production)
const users = {};

// ============ GROQ SETUP ============
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// ============ MIDDLEWARE ============
app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));

// ============ AUTH MIDDLEWARE ============
function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// ============ AUTH ROUTES ============

// Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    if (users[username]) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    users[username] = {
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    console.log(`✅ User registered: ${username}`);
    res.json({ success: true, message: "User created successfully" });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = users[username];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(`✅ User logged in: ${username}`);
    res.json({
      success: true,
      username,
      message: "Login successful"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Logout
app.post("/api/logout", (req, res) => {
  res.clearCookie('token');
  console.log("👋 User logged out");
  res.json({ success: true, message: "Logged out successfully" });
});

// Check auth status
app.get("/api/me", authenticateToken, (req, res) => {
  res.json({
    authenticated: true,
    username: req.user.username
  });
});

// ============ FILE UPLOAD CONFIG ============
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ============ TEXT EXTRACTION ============
async function extractTextFromFile(filePath, mimetype) {
  const fileBuffer = fs.readFileSync(filePath);

  if (mimetype.startsWith('image/')) {
    return {
      type: 'image',
      data: fileBuffer.toString('base64'),
      mimeType: mimetype
    };
  }

  if (mimetype === 'application/pdf') {
    try {
      const data = await pdfParse(fileBuffer);
      return { type: 'text', data: data.text, pageCount: data.numpages };
    } catch (err) {
      console.error("PDF parse error:", err.message);
      return null;
    }
  }

  if (mimetype === 'application/msword' ||
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return { type: 'text', data: result.value };
    } catch (err) {
      console.error("Word parse error:", err.message);
      return null;
    }
  }

  if (mimetype === 'text/plain') {
    const text = fileBuffer.toString('utf-8');
    return { type: 'text', data: text };
  }

  return null;
}

// ============ CHAT ROUTES (Protected) ============

// Text chat
app.post("/api/chat", authenticateToken, async (req, res) => {
  try {
    const userMessage = req.body.message;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: userMessage }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    res.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message });
  }
});

// File upload
app.post("/api/upload", authenticateToken, upload.single("file"), async (req, res) => {
  let filePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    filePath = req.file.path;
    const file = req.file;
    const userQuestion = req.body.question || "What can you tell me about this file?";
    const fileType = file.mimetype;

    console.log(`📄 ${req.user.username} uploaded: ${file.originalname}`);

    const extractedContent = await extractTextFromFile(filePath, fileType);

    if (!extractedContent) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Unsupported file type" });
    }

    let aiResponse = "";

    // Images → Llama 4 Scout
    if (extractedContent.type === 'image') {
      try {
        const visionResponse = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userQuestion },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${extractedContent.mimeType};base64,${extractedContent.data}`
                  }
                }
              ]
            }
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0.7,
          max_tokens: 1000
        });

        aiResponse = visionResponse.choices[0]?.message?.content || "Could not analyze image.";
        console.log("✅ Image analyzed with Llama 4 Scout");

      } catch (visionError) {
        console.error("Vision error:", visionError.message);
        aiResponse = `📷 I received your image "${file.originalname}".\n\nI couldn't analyze it: ${visionError.message}\n\nPlease try describing the image.`;
      }
    }

    // Documents → Llama 3.3
    else {
      const textContent = extractedContent.data;

      if (!textContent || textContent.trim().length === 0) {
        aiResponse = `⚠️ I couldn't extract text from "${file.originalname}".`;
      } else {
        const maxLength = 5000;
        const contentToSend = textContent.length > maxLength ?
          textContent.substring(0, maxLength) + "\n...[truncated]" :
          textContent;

        const chatCompletion = await groq.chat.completions.create({
          messages: [{
            role: "user",
            content: `Document: "${file.originalname}"\n\nContent:\n${contentToSend}\n\nQuestion: ${userQuestion}\n\nAnswer based on the document.`
          }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
        });

        aiResponse = chatCompletion.choices[0]?.message?.content || "Could not process document.";
        console.log("✅ Document analyzed");
      }
    }

    fs.unlinkSync(filePath);

    res.json({
      response: aiResponse,
      filename: file.originalname
    });

  } catch (error) {
    console.error("Upload error:", error);
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.status(500).json({ error: error.message });
  }
});
// ============ LOGOUT ENDPOINT ============
app.post("/api/logout", (req, res) => {
  res.clearCookie('token');
  console.log("👋 User logged out");
  res.json({ success: true, message: "Logged out successfully" });
});

// ============ SERVER START ============
app.listen(3000, () => {
  console.log("\n" + "=".repeat(50));
  console.log("✅ EVOQ Server Running!");
  console.log("=".repeat(50));
  console.log(`📡 URL: http://localhost:3000`);
  console.log(`🔐 Auth: Login/Register enabled`);
  console.log(`🖼️  Images: Llama 4 Scout (FREE)`);
  console.log(`📄 Documents: Llama 3.3 70B`);
  console.log("=".repeat(50) + "\n");
  console.log("📝 Demo Accounts (or register new):");
  console.log("   Username: demo | Password: demo123");
  console.log("   Username: test | Password: test123\n");
});