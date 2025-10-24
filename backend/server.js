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
const PRIVATE_DIR = path.join(__dirname, "../frontend/private");
const PUBLIC_DIR = path.join(__dirname, "../frontend/public");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join("../frontend", 'public')));

  
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

function authenticateCompany(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.company = decoded; // attach decoded company info to request
      next();
  } catch (err) {
      return res.status(403).json({ error: "Token invalid or expired" });
  }
}

// ==================== DB CONNECTION CHECK ==================== //
// Lightweight DB status endpoint
app.get("/api/db-status", async (req, res) => {
  
});

// ==================== ROUTES ==================== //

app.get('/', (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR,'Landing_Page1.html'));
    
});

app.get('/companyRegistration', (req, res) => {
    console.log("Serving company registration page");
    res.sendFile(path.join(PUBLIC_DIR, 'company_register_test.html'));
    
});
// Serve registration page
app.get("/candidateRegistration", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_registration.html"));
});
// serve com
/*app.get("/companyLogin", (req, res) => {
  console.log("Serving company login page");
  res.sendFile(path.join(PUBLIC_DIR, "company_login.html"));
});*/

// serve candidate landing page
app.get("/candidateLanding", (req, res) => {
  res.sendFile(path.join(PRIVATE_DIR, "candidate_landing_page.html"));
});

app.get("/hrHomePage", (req, res) => {
  res.sendFile(path.join(PRIVATE_DIR, "HR_HomePage.html"));
});


// ==================== ROUTES END HERE ==================== //


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
  console.log("Received company registration data:", req.body);
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


// ==================== AUTH ROUTES ==================== // 
app.post('/api/auth/login', async (req, res) => {
    console.log('Login attempt for candidate:', req.body.email);
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


app.post('/api/companies/login', async (req, res) => {
  const { officialEmail, password } = req.body;

  if (!officialEmail || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const company = await db.verifyCompany({ officialEmail, password });

    if (!company) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { companyId: company.id, email: company.official_email },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful",
      token,
      company: { id: company.id, name: company.name, email: company.official_email },
    });
  } catch (err) {
    console.error("Company login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

app.get("/api/companies", authenticateCompany, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const rows = await db.query("SELECT * FROM companies WHERE official_email = ?", [email]);
    console.log("🔹 Raw DB rows:", rows);

    // Handle mysql vs mysql2
    const company = Array.isArray(rows) ? rows[0] : rows;
    console.log("🔹 Company object to send:", company);

    if (!company) return res.status(404).json({ message: "Company not found" });

    res.json(company);
  } catch (err) {
    console.error("❌ Error fetching company:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/candidates", authenticateCompany, async (req, res) => {
  try {
    const candidates = await db.getAllCandidates();
    
    const formattedCandidates = candidates.map(candidate => ({
      id: candidate.id,
      name: `${candidate.first_name} ${candidate.last_name}`.trim(),
      email: candidate.email,
      phone: candidate.phone,
      position: candidate.position,
      experience: `${candidate.experience_years} years`,
      education: candidate.education,
      skills: candidate.skills,
      location: candidate.location,
      status: "pending",
      appliedDate: new Date().toISOString().split('T')[0],
      resume_file_name: candidate.resume_file_name,
      resume_file_path: candidate.resume_file_path
    }));

    res.json(formattedCandidates);
  } catch (err) {
    console.error("❌ Error fetching candidates:", err);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
});

// Auth helpers
function generateToken(user) {
    console.log('Generating token for user ID:', user.id);
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

//const authRoutes = require('./routes/auth');
//const candidateRoutes = require('./routes/candidates');
//const companyRoutes = require('./routes/companies');

//app.use('/api/auth', authRoutes);
//app.use('/api/candidates', candidateRoutes);
//app.use('/api/companies', companyRoutes);

