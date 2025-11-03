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

app.get("/feedback", (req, res) => {
  res.sendFile(path.join(PRIVATE_DIR, "feedback.html"));
});

app.get("/interviewScheduler", (req, res) => {
  res.sendFile(path.join(PRIVATE_DIR, "interview_scheduler.html"));
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

// ------------------- Company Notes Routes -------------------

// Save a note
app.post("/api/notes", authenticateCompany, async (req, res) => {
  try {
    const companyId =
      req.company.companyId || req.company.id || req.company.userId;
    const { noteText } = req.body;

    if (!noteText || !noteText.trim()) {
      return res.status(400).json({ error: "noteText is required" });
    }

    const result = await db.saveCompanyNote(companyId, noteText.trim());
    res.json({ message: "Note saved successfully", id: result.insertId });
  } catch (error) {
    console.error("❌ Error saving note:", error);
    res.status(500).json({ error: "Failed to save note" });
  }
});

// Get all notes for a company
app.get("/api/notes", authenticateCompany, async (req, res) => {
  try {
    const companyId =
      req.company.companyId || req.company.id || req.company.userId;
    const notes = await db.getCompanyNotes(companyId);
    res.json(notes);
  } catch (error) {
    console.error("❌ Error fetching notes:", error);
    res.status(500).json({ error: "Failed to load notes" });
  }
});

// Delete a specific note
app.delete("/api/notes/:id", authenticateCompany, async (req, res) => {
  try {
    const companyId =
      req.company.companyId || req.company.id || req.company.userId;
    const noteId = parseInt(req.params.id, 10);

    if (!noteId) {
      return res.status(400).json({ error: "Invalid note ID" });
    }

    const result = await db.deleteCompanyNote(noteId, companyId);
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Note not found or not authorized to delete" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting note:", error);
    res.status(500).json({ error: "Failed to delete note" });
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

// Auth helpers
function generateToken(user) {
    console.log('Generating token for user ID:', user.id);
    return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '8h' });
}

// Add these routes to your server.js file

// ==================== JWT Token Generation ====================
// Keep this one (the correct one)
function generateToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}

// ==================== Candidate Authentication Middleware ====================
function authenticateCandidate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.candidate = decoded; // attach decoded candidate info to request
    next();
  } catch (err) {
    return res.status(403).json({ error: "Token invalid or expired" });
  }
}

// ==================== Candidate Dashboard Routes ====================

// GET candidate profile
app.get("/api/candidate/profile", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const candidate = await db.getCandidateById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    res.json(candidate);
  } catch (err) {
    console.error("❌ Error fetching candidate profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// GET candidate's interviews
app.get("/api/candidate/interviews", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const interviews = await db.getCandidateInterviews(candidateId);
    res.json(interviews);
  } catch (err) {
    console.error("❌ Error fetching candidate interviews:", err);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// GET candidate's feedback
app.get("/api/candidate/feedback", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const feedback = await db.getCandidateFeedback(candidateId);
    res.json(feedback);
  } catch (err) {
    console.error("❌ Error fetching candidate feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

// UPDATE candidate profile
app.put("/api/candidate/profile", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const updateData = req.body;
    
    await db.updateCandidateProfile(candidateId, updateData);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ==================== Candidate Login Page Route ====================
app.get("/candidateLogin", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_login.html"));
});

app.get("/candidateDashboard", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_dashboard.html"));
});

// Add this with your other route definitions
app.get("/updateProfile", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "update_profile.html"));
});

// Add these routes to your server.js

// ==================== Serve New Pages ====================
app.get("/viewApplications", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_applications.html"));
});

app.get("/candidateSettings", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_settings.html"));
});

app.get("/resumeManager", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "resume_manager.html"));
});

// ==================== Applications API ====================

// Get candidate's applications
app.get("/api/candidate/applications", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const applications = await db.getCandidateApplications(candidateId);
    res.json(applications);
  } catch (err) {
    console.error("❌ Error fetching applications:", err);
    res.status(500).json({ error: "Failed to fetch applications" });
  }
});

// Withdraw application
app.patch("/api/candidate/applications/:id/withdraw", authenticateCandidate, async (req, res) => {
  try {
    const applicationId = req.params.id;
    const candidateId = req.candidate.userId;
    
    await db.withdrawApplication(applicationId, candidateId);
    res.json({ message: "Application withdrawn successfully" });
  } catch (err) {
    console.error("❌ Error withdrawing application:", err);
    res.status(500).json({ error: "Failed to withdraw application" });
  }
});

// ==================== Resume API ====================

// Get resume data
app.get("/api/candidate/resume", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const resumeData = await db.getCandidateResume(candidateId);
    res.json(resumeData);
  } catch (err) {
    console.error("❌ Error fetching resume:", err);
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

// Upload new resume
app.post("/api/candidate/resume/upload", authenticateCandidate, upload.single("resume"), async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    await db.uploadResume(candidateId, {
      file_name: file.originalname,
      file_path: file.path,
      file_size: file.size
    });

    res.json({ message: "Resume uploaded successfully" });
  } catch (err) {
    console.error("❌ Error uploading resume:", err);
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

// Download resume
app.get("/api/candidate/resume/download", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const resumePath = await db.getCandidateResumePath(candidateId);
    
    if (!resumePath || !fs.existsSync(resumePath)) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.download(resumePath);
  } catch (err) {
    console.error("❌ Error downloading resume:", err);
    res.status(500).json({ error: "Failed to download resume" });
  }
});

// View resume
app.get("/api/candidate/resume/view", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const resumePath = await db.getCandidateResumePath(candidateId);
    
    if (!resumePath || !fs.existsSync(resumePath)) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.sendFile(resumePath);
  } catch (err) {
    console.error("❌ Error viewing resume:", err);
    res.status(500).json({ error: "Failed to view resume" });
  }
});

// ==================== Password Change API ====================
app.post("/api/candidate/change-password", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const { currentPassword, newPassword } = req.body;

    const isValid = await db.verifyPassword(candidateId, currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await db.updatePassword(candidateId, newPasswordHash);

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("❌ Error changing password:", err);
    res.status(500).json({ error: "Failed to change password" });
  }
});

// ==================== Serve Skill Assessment Page ====================
app.get("/skillAssessment", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "skill_assessment.html"));
});

// ==================== Assessment API Routes ====================

// Get all assessments with candidate's progress
app.get("/api/assessments", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const assessments = await db.getAllAssessments(candidateId);
    res.json(assessments);
  } catch (err) {
    console.error("❌ Error fetching assessments:", err);
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

// Start an assessment (get questions)
app.post("/api/assessments/:id/start", authenticateCandidate, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const assessment = await db.getAssessmentWithQuestions(assessmentId);
    res.json(assessment);
  } catch (err) {
    console.error("❌ Error starting assessment:", err);
    res.status(500).json({ error: "Failed to start assessment" });
  }
});

// Submit assessment
app.post("/api/assessments/:id/submit", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const assessmentId = req.params.id;
    const { answers, time_taken } = req.body;

    const results = await db.submitAssessment(candidateId, assessmentId, answers, time_taken);
    
    // Check and award badges
    await db.checkAndAwardBadges(candidateId);
    
    res.json(results);
  } catch (err) {
    console.error("❌ Error submitting assessment:", err);
    res.status(500).json({ error: "Failed to submit assessment" });
  }
});

// Get assessment stats
app.get("/api/assessments/stats", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const stats = await db.getAssessmentStats(candidateId);
    res.json(stats);
  } catch (err) {
    console.error("❌ Error fetching stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get badges
app.get("/api/assessments/badges", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const badges = await db.getCandidateBadges(candidateId);
    res.json(badges);
  } catch (err) {
    console.error("❌ Error fetching badges:", err);
    res.status(500).json({ error: "Failed to fetch badges" });
  }
});

// Get recent results
app.get("/api/assessments/recent-results", authenticateCandidate, async (req, res) => {
  try {
    const candidateId = req.candidate.userId;
    const results = await db.getRecentResults(candidateId);
    res.json(results);
  } catch (err) {
    console.error("❌ Error fetching recent results:", err);
    res.status(500).json({ error: "Failed to fetch recent results" });
  }
});

// Fallback route for unknown endpoints
app.use((req, res) => {
  res.status(404).send("Page not found");
});

app.get("/candidateDashboard", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "candidate_dashboard.html"));
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

