// backend/server.js

// ==================== Imports ====================
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs");
const db = require("./db");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// ==================== Express Setup ====================
const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Public directory inside frontend
const PUBLIC_DIR = path.join(__dirname, "../frontend/public");

// ==================== Middleware ====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve static files from frontend/public
app.use(express.static(PUBLIC_DIR));

// Middleware to protect company routes
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

// ==================== Multer Setup ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ==================== DB Check ====================
app.get("/api/db-status", async (req, res) => {
  try {
    await db.testConnection();
    res.json({ status: "✅ Database connected successfully" });
  } catch (error) {
    res.status(500).json({ error: "❌ Database connection failed" });
  }
});

// ==================== Frontend Routes ====================
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "Landing_Page1.html"));
});

app.get("/companyRegistration", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "company_register.html"));
});

app.get("/candidateRegistration", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_registration.html"));
});

// ==================== Candidate Apply ====================
app.post("/api/candidates/apply", upload.single("resume"), async (req, res) => {
  try {
    const password_hash = await bcrypt.hash(req.body.password, 10);
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
    } = req.body;

    const resume_file_name = req.file ? req.file.originalname : null;
    const resume_file_path = req.file ? req.file.path : null;

    const nameParts = fullname.trim().split(" ");
    const first_name = nameParts.shift();
    const last_name = nameParts.join(" ") || "";

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
      password_hash,
    });

    console.log("✅ Application submitted with ID:", result.insertId);
    res.json({ message: "Application submitted", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Company Register ====================
app.post("/api/companies/apply", upload.single("logo"), async (req, res) => {
  try {
    const password_hash = await bcrypt.hash(req.body.password, 10);
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
    } = req.body;

    const logo_file_name = req.file ? req.file.originalname : null;
    const logo_file_path = req.file ? req.file.path : null;

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
      password_hash,
    });

    console.log("✅ Company registered with ID:", result.insertId);
    res.json({ message: "Company registered", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== Auth Routes ====================
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const [rows] = await db.verifyCandidate({ email, password });
    if (rows.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = rows[0];
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// ==================== Company Login ====================
app.post('/api/company/login', async (req, res) => {
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

// ==================== Company Dashboard ====================
/*app.get('/api/companies/:id/dashboard', authenticateCompany, async (req, res) => {
  const companyName = req.company.name; // get company name from token

  try {
      // Fetch all stats from the companies table
      const companyData = await db.query(
          'SELECT total_candidates, pending_interviews, feedback_submitted, upcoming_interviews_json, application_stats_json, success_rate_json, time_to_hire_json ' +
          'FROM companies WHERE name = ?',
          [companyName]
      );

      if (!companyData[0]) {
          return res.status(404).json({ error: "Company not found" });
      }

      const company = companyData[0];

      // Parse any JSON fields if stored as JSON strings
      const upcomingInterviews = company.upcoming_interviews_json ? JSON.parse(company.upcoming_interviews_json) : [];
      const applicationStats = company.application_stats_json ? JSON.parse(company.application_stats_json) : { labels: [], data: [] };
      const successRate = company.success_rate_json ? JSON.parse(company.success_rate_json) : { passed: 0, failed: 0 };
      const timeToHire = company.time_to_hire_json ? JSON.parse(company.time_to_hire_json) : { labels: [], data: [] };

      res.json({
          totalCandidates: company.total_candidates || 0,
          pendingInterviews: company.pending_interviews || 0,
          feedbackSubmitted: company.feedback_submitted || 0,
          upcomingInterviews,
          applicationStats,
          successRate,
          timeToHire
      });

  } catch (err) {
      console.error("Dashboard fetch error:", err);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});*/

// GET company details
app.get("/api/company", authenticateCompany, async (req, res) => {
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

// ==================== Get All Candidates ====================
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

// Add these routes to your existing server.js

// ==================== Interview Routes ====================

// Get all interviews for a company
app.get("/api/interviews", authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const interviews = await db.getCompanyInterviews(companyId);
    res.json(interviews);
  } catch (err) {
    console.error("❌ Error fetching interviews:", err);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// Create new interview
app.post("/api/interviews", authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const interviewData = {
      company_id: companyId,
      ...req.body
    };

    const result = await db.createInterview(interviewData);
    res.json({ message: "Interview scheduled successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error creating interview:", err);
    res.status(500).json({ error: "Failed to schedule interview" });
  }
});

// Update interview status
app.patch("/api/interviews/:id/status", authenticateCompany, async (req, res) => {
  try {
    const { status } = req.body;
    await db.updateInterviewStatus(req.params.id, status);
    res.json({ message: "Interview status updated" });
  } catch (err) {
    console.error("❌ Error updating interview:", err);
    res.status(500).json({ error: "Failed to update interview" });
  }
});

// Add these routes to your existing server.js

// ==================== Feedback Routes ====================

// Get interviews available for feedback
app.get("/api/interviews/for-feedback", authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const interviews = await db.getInterviewsForFeedback(companyId);
    res.json(interviews);
  } catch (err) {
    console.error("❌ Error fetching interviews for feedback:", err);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// Submit feedback
app.post("/api/feedback", authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const feedbackData = {
      company_id: companyId,
      ...req.body
    };

    const result = await db.submitFeedback(feedbackData);
    res.json({ message: "Feedback submitted successfully", id: result.insertId });
  } catch (err) {
    console.error("❌ Error submitting feedback:", err);
    res.status(500).json({ error: "Failed to submit feedback" });
  }
});

// Get all feedback for company
app.get("/api/feedback", authenticateCompany, async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const feedback = await db.getCompanyFeedback(companyId);
    res.json(feedback);
  } catch (err) {
    console.error("❌ Error fetching feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// Get feedback by candidate
app.get("/api/feedback/candidate/:candidateId", authenticateCompany, async (req, res) => {
  try {
    const feedback = await db.getFeedbackByCandidate(req.params.candidateId);
    res.json(feedback);
  } catch (err) {
    console.error("❌ Error fetching candidate feedback:", err);
    res.status(500).json({ error: "Failed to fetch candidate feedback" });
  }
});

// ==================== Fallback & Test ====================
app.get("/test", (req, res) => res.send("✅ Server is working"));
app.use((req, res) => res.status(404).send("Page not found"));

// ==================== Start Server ====================
async function startServer() {
  await db.testConnection();
  app.listen(PORT, () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  );
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

