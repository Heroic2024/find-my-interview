// backend/db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'Theo1000*',
  database: process.env.DB_NAME || 'recruitment_system'
});

// ==================== DB connection check ====================
// Test DB connection and log database name + version
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [info] = await connection.query("SELECT DATABASE() AS db, VERSION() AS version");
    console.log("✅ Database connected",info[0].db);
    console.log("MySQL version:", info[0].version);
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
}

async function insertCandidate(userData) {
    console.log("Inserting candidate:", userData);
    

const [result] = await pool.query(
      `INSERT INTO candidates (position, 
      first_name,
      last_name,
      email,
      phone,
      education,
      experience_years,
      skills,
      location,
      notes,
      resume_file_name,
      resume_file_path,
      password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.position,
        userData.first_name,
        userData.last_name, 
        userData.email,
        userData.phone,
        userData.education, 
        userData.experience,
        userData.skills,
        userData.location,
        userData.notes,
        userData.resume_file_name,
        userData.resume_file_path,
        userData.password_hash
      ]
    ); 
    console.log("Candidate inserted with ID:", result.insertId);
    return result;
  }


async function verifyCandidate(userData) {
    const [rows] = await pool.execute('SELECT * FROM candidates WHERE email = ?', [userData.email]);
    console.log("Rows found:", rows.length );
    if (rows.length === 0) return [];

    const user = rows[0];
    // support either column name used for the hash
    const storedHash = user.password_hash || user.password || null;
    if (!storedHash) {
      console.warn('No stored password hash for user:', user.email);
      return [];
    }

    // compare provided plain password with stored hash
    const match = await bcrypt.compare(userData.password, storedHash);
    if (!match) {
      console.log('Password mismatch for user:', user.email);
      return [];
    }

    // success — return the user row (keeps callsites expecting array)
    return [user];
  }

async function insertCompany(companyData) {
    console.log("Inserting company:", companyData);
    const [result] = await pool.query(
      `INSERT INTO companies (
      name, 
      industry,
      registration_number,
      gstin,
      official_email,
      website,
      contact_number,
      company_size,
      address,
      logo_file_name,
      logo_file_path,
      password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyData.companyName,
        companyData.industry,
        companyData.regNo,
        companyData.gstin,
        companyData.officialEmail,
        companyData.website,
        companyData.contact,
        companyData.size,
        companyData.address,
        companyData.logo_file_name,
        companyData.logo_file_path,
        companyData.password_hash
      ]
    );
    console.log("Company inserted with ID:", result.insertId);
    return result;
  }

module.exports = {testConnection, insertCandidate, verifyCandidate, insertCompany};

async function verifyCompany({ officialEmail, password }) {
  const [rows] = await pool.execute('SELECT * FROM companies WHERE official_email = ?', [officialEmail]);
  if (rows.length === 0) return null;

  const company = rows[0];
  const match = await bcrypt.compare(password, company.password_hash);
  if (!match) return null;

  return company;
}

module.exports = { testConnection, insertCandidate, verifyCandidate, insertCompany, verifyCompany };

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { testConnection, insertCandidate, verifyCandidate, insertCompany, verifyCompany, query };

async function getAllCandidates() {
  const [rows] = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
  return rows;
}

module.exports = { 
  testConnection, 
  insertCandidate, 
  verifyCandidate, 
  insertCompany, 
  verifyCompany, 
  query,
  getAllCandidates 
};

// ==================== Interview Functions (Simplified) ====================

// Get all interviews for a company
async function getCompanyInterviews(companyId) {
  const [rows] = await pool.query(`
    SELECT 
      i.*,
      c.first_name as candidate_first_name,
      c.last_name as candidate_last_name,
      c.email as candidate_email,
      c.phone as candidate_phone,
      c.position as position_title,
      r.name as round_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    JOIN rounds r ON i.round_id = r.id
    WHERE i.company_id = ?
    ORDER BY i.interview_date DESC
  `, [companyId]);
  return rows;
}

// Create new interview (simplified - no foreign key checks for positions/interviewers)
async function createInterview(interviewData) {
  const [result] = await pool.query(`
    INSERT INTO interviews (
      company_id,
      candidate_id,
      position_id,
      interviewer_id_1,
      round_id,
      interview_date,
      interview_link,
      interview_location,
      notes,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    interviewData.company_id,
    interviewData.candidate_id,
    interviewData.position_id || 1,
    interviewData.interviewer_id_1 || 1,
    interviewData.round_id,
    interviewData.interview_date,
    interviewData.interview_link || null,
    interviewData.interview_location || null,
    interviewData.notes || null,
    interviewData.status || 'scheduled'
  ]);
  return result;
}

// Update interview status
async function updateInterviewStatus(interviewId, status) {
  const [result] = await pool.query(
    'UPDATE interviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, interviewId]
  );
  return result;
}

// Get all position types (fixed list)
async function getAllPositionTypes() {
  const [rows] = await pool.query('SELECT * FROM position_types ORDER BY title');
  return rows;
}

// Get all interviewer names (fixed list)
async function getAllInterviewerNames() {
  const [rows] = await pool.query('SELECT * FROM interviewer_names ORDER BY id');
  return rows;
}

// Get all rounds
async function getAllRounds() {
  const [rows] = await pool.query('SELECT * FROM rounds ORDER BY id');
  return rows;
}

// Keep the notes functions as they are
async function saveCompanyNote(companyId, noteText) {
  const [result] = await pool.query(
    'INSERT INTO company_notes (company_id, note_text) VALUES (?, ?)',
    [companyId, noteText]
  );
  return result;
}

async function getCompanyNotes(companyId) {
  const [rows] = await pool.query(
    'SELECT * FROM company_notes WHERE company_id = ? ORDER BY created_at DESC',
    [companyId]
  );
  return rows;
}

async function deleteCompanyNote(noteId, companyId) {
  const [result] = await pool.query(
    'DELETE FROM company_notes WHERE id = ? AND company_id = ?',
    [noteId, companyId]
  );
  return result;
}


// Add these functions to your existing db.js

// Get all interviews for a company
async function getCompanyInterviews(companyId) {
  const [rows] = await pool.query(`
    SELECT * FROM interviews 
    WHERE company_id = ?
    ORDER BY interview_date DESC
  `, [companyId]);
  return rows;
}

// Create new interview
async function createInterview(interviewData) {
  const [result] = await pool.query(`
    INSERT INTO interviews (
      company_id,
      candidate_id,
      candidate_name,
      position,
      round,
      interviewer_1,
      interviewer_2,
      interviewer_3,
      interview_date,
      interview_link,
      interview_location,
      notes,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    interviewData.company_id,
    interviewData.candidate_id,
    interviewData.candidate_name,
    interviewData.position,
    interviewData.round,
    interviewData.interviewer_1,
    interviewData.interviewer_2 || null,
    interviewData.interviewer_3 || null,
    interviewData.interview_date,
    interviewData.interview_link || null,
    interviewData.interview_location || null,
    interviewData.notes || null,
    interviewData.status || 'scheduled'
  ]);
  return result;
}

// Update interview status
async function updateInterviewStatus(interviewId, status) {
  const [result] = await pool.query(
    'UPDATE interviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, interviewId]
  );
  return result;
}

// Update your module.exports to include these functions
module.exports = { 
  testConnection, 
  insertCandidate, 
  verifyCandidate, 
  insertCompany, 
  verifyCompany, 
  query,
  getAllCandidates,
  getCompanyInterviews,
  createInterview,
  updateInterviewStatus,
  saveCompanyNote,
  getCompanyNotes,
  deleteCompanyNote
};

// Add these functions to your existing db.js

// Get all interviews for feedback dropdown (only completed interviews without feedback)
async function getInterviewsForFeedback(companyId) {
  const [rows] = await pool.query(`
    SELECT i.*, c.first_name, c.last_name
    FROM interviews i
    JOIN candidates c ON i.candidate_id = c.id
    LEFT JOIN interview_feedback f ON i.id = f.interview_id
    WHERE i.company_id = ? 
    AND i.status = 'completed'
    AND f.id IS NULL
    ORDER BY i.interview_date DESC
  `, [companyId]);
  return rows;
}

// Submit feedback
async function submitFeedback(feedbackData) {
  const [result] = await pool.query(`
    INSERT INTO interview_feedback (
      company_id, interview_id, candidate_id, candidate_name, position,
      interviewer_name, interview_date, technical_skills, technical_comments,
      communication_skills, communication_comments, problem_solving, 
      problem_solving_comments, cultural_fit, cultural_fit_comments,
      leadership_potential, leadership_comments, overall_rating,
      strengths, weaknesses, additional_notes, recommendation,
      requires_followup, followup_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    feedbackData.company_id,
    feedbackData.interview_id,
    feedbackData.candidate_id,
    feedbackData.candidate_name,
    feedbackData.position,
    feedbackData.interviewer_name,
    feedbackData.interview_date,
    feedbackData.technical_skills,
    feedbackData.technical_comments || null,
    feedbackData.communication_skills,
    feedbackData.communication_comments || null,
    feedbackData.problem_solving,
    feedbackData.problem_solving_comments || null,
    feedbackData.cultural_fit,
    feedbackData.cultural_fit_comments || null,
    feedbackData.leadership_potential,
    feedbackData.leadership_comments || null,
    feedbackData.overall_rating,
    feedbackData.strengths || null,
    feedbackData.weaknesses || null,
    feedbackData.additional_notes || null,
    feedbackData.recommendation,
    feedbackData.requires_followup || 0,
    feedbackData.followup_notes || null
  ]);
  return result;
}

// Get all feedback for a company
async function getCompanyFeedback(companyId) {
  const [rows] = await pool.query(`
    SELECT * FROM interview_feedback 
    WHERE company_id = ?
    ORDER BY created_at DESC
  `, [companyId]);
  return rows;
}

// Get feedback by candidate
async function getFeedbackByCandidate(candidateId) {
  const [rows] = await pool.query(`
    SELECT * FROM interview_feedback 
    WHERE candidate_id = ?
    ORDER BY created_at DESC
  `, [candidateId]);
  return rows;
}

// Update module.exports to include these new functions
module.exports = { 
  testConnection, 
  insertCandidate, 
  verifyCandidate, 
  insertCompany, 
  verifyCompany, 
  query,
  getAllCandidates,
  getCompanyInterviews,
  createInterview,
  updateInterviewStatus,
  saveCompanyNote,
  getCompanyNotes,
  deleteCompanyNote,
  getInterviewsForFeedback,
  submitFeedback,
  getCompanyFeedback,
  getFeedbackByCandidate
};