// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer"); // for file uploads
const fs = require("fs");
const db  = require("./db"); // mysql2 connection 
require("dotenv").config();
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, "../frontend");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
//app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "../frontend/public")));

// Multer setup for resume uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// ==================== DB CONNECTION CHECK ==================== //
// Lightweight DB status endpoint
app.get("/api/db-status", async (req, res) => {
  
});

// ==================== ROUTES ==================== //

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'Landing_Page1.html'));
    
});

app.get('/companyRegistration', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, 'company_register_test.html'));
    
});
// Serve registration page
app.get("/candidateRegistration", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_registration.html"));
});

app.get

// Candidate apply route
app.post("/api/candidates/apply", upload.single("resume"), async (req, res) => {
  const password_hash = await bcrypt.hash(req.body.password, 10);
  try {
    const {
      fullname,
      email,
      phone,
      position,
      education,
      experience,
      skills,
      location,
      notes,
      //password
    } = req.body;

    const resume_file_name = req.file ? req.file.originalname : null;
    const resume_file_path = req.file ? req.file.path : null;

    // Split fullname into first_name / last_name
    const nameParts = fullname.trim().split(" ");
    const first_name = nameParts.shift();
    const last_name = nameParts.join(" ") || "";

    // Insert candidate into DB
    const result = await db.insertCandidate({
      first_name,
      last_name,
      email,
      phone,
      position,
      education,
      experience,
      skills,
      location,
      notes,
      resume_file_name,
      resume_file_path,
      password_hash
  });
    
    console.log("Application submitted with ID:", result.insertId);
    res.json({ message: "Application submitted", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Company register route
app.post("/api/companies/apply", upload.single("logo"), async (req, res) => {
  const password_hash = await bcrypt.hash(req.body.password, 10);
  try {
    const {
      companyName,
      industry,
      regNo,
      gstin,
      officialEmail,
      website,  
      contact,
      size,
      address,
      //password_hash
    } = req.body;

    const logo_file_name = req.file ? req.file.originalname : null;
    const logo_file_path = req.file ? req.file.path : null;
    
    // Insert company into DB
    const result = await db.insertCompany({
      companyName,
      industry,
      regNo,
      gstin,  
      officialEmail,
      website,
      contact,          
      size,
      address,
      logo_file_name,
      logo_file_path,
      password_hash
    });
    
    console.log("Company registered with ID:", result.insertId);
    res.json({ message: "Company registered", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const [rows] = await db.verifyCandidate({ email, password });
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials or inactive user' });

        const user = rows[0];
        console.log("User found:", rows.id);
        //const match = await bcrypt.compare(password, user.password_hash);
        //if (!match || !user.is_active) return res.status(401).json({ error: 'Invalid credentials or inactive user' });

        const token = generateToken(rows);
        res.json({ token, user: { id: rows.id, email: rows.email } });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Auth helpers
function generateToken(user) {
    return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
}



// Fallback route for unknown endpoints
app.use((req, res) => {
  res.status(404).send("Page not found");
});

// Start server after verifying DB
async function startServer() {
  await db.testConnection();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

app.get("/test", (req, res) => res.send("Server is working"));

const authRoutes = require('./routes/auth');
const candidateRoutes = require('./routes/candidates');
//const companyRoutes = require('./routes/companies');

app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidateRoutes);
//app.use('/api/companies', companyRoutes);

