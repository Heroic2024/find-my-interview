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

async function verifyCompany({ officialEmail, password }) {
  const [rows] = await pool.execute('SELECT * FROM companies WHERE official_email = ?', [officialEmail]);
  if (rows.length === 0) return null;

  const company = rows[0];
  const match = await bcrypt.compare(password, company.password_hash);
  if (!match) return null;

  return company;
}

async function getAllCandidates() {
  const [rows] = await pool.query('SELECT * FROM candidates ORDER BY id DESC');
  return rows;
}

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

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
// Get positions for a company
async function getCompanyPositions(companyId) {
  const [rows] = await pool.query(`
    SELECT p.* 
    FROM positions p
    JOIN departments d ON p.department_id = d.id
    WHERE d.company_id = ?
  `, [companyId]);
  return rows;
}

// Get employees (interviewers) for a company
async function getCompanyEmployees(companyId) {
  const [rows] = await pool.query(
    'SELECT * FROM employees WHERE company_id = ? AND role = "interviewer"',
    [companyId]
  );
  return rows;
}

// Get all rounds
async function getAllRounds() {
  const [rows] = await pool.query('SELECT * FROM rounds ORDER BY id');
  return rows;
}

// Save company note
async function saveCompanyNote(companyId, noteText) {
  const [result] = await pool.query(
    'INSERT INTO company_notes (company_id, note_text) VALUES (?, ?)',
    [companyId, noteText]
  );
  return result;
}

// Get company notes
async function getCompanyNotes(companyId) {
  const [rows] = await pool.query(
    'SELECT * FROM company_notes WHERE company_id = ? ORDER BY created_at DESC',
    [companyId]
  );
  return rows;
}

// Delete company note
async function deleteCompanyNote(noteId, companyId) {
  const [result] = await pool.query(
    'DELETE FROM company_notes WHERE id = ? AND company_id = ?',
    [noteId, companyId]
  );
  return result;
}

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

// Add these functions to your db.js file

// ==================== Candidate Dashboard Functions ====================

// Get candidate by ID
async function getCandidateById(candidateId) {
  const [rows] = await pool.query(
    'SELECT * FROM candidates WHERE id = ?',
    [candidateId]
  );
  return rows[0] || null;
}

// Get all interviews for a specific candidate
async function getCandidateInterviews(candidateId) {
  const [rows] = await pool.query(`
    SELECT 
      i.*,
      c.name as company_name
    FROM interviews i
    LEFT JOIN companies c ON i.company_id = c.id
    WHERE i.candidate_id = ?
    ORDER BY i.interview_date DESC
  `, [candidateId]);
  return rows;
}

// Get feedback for a specific candidate
async function getCandidateFeedback(candidateId) {
  const [rows] = await pool.query(`
    SELECT * FROM interview_feedback
    WHERE candidate_id = ?
    ORDER BY created_at DESC
  `, [candidateId]);
  return rows;
}

// Update the existing updateCandidateProfile function
async function updateCandidateProfile(candidateId, updateData) {
  const allowedFields = [
    'first_name', 'last_name', 'phone', 'position',
    'education', 'experience_years', 'skills', 'location', 'notes'
  ];
  
  const updates = [];
  const values = [];
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }
  
  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  // Add updated_at timestamp if you want to track when profile was last updated
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(candidateId);
  
  const [result] = await pool.query(
    `UPDATE candidates SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  return result;
}
// ==================== Update module.exports ====================
// Add these to your existing module.exports:
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
  getFeedbackByCandidate,
  // NEW FUNCTIONS FOR CANDIDATE DASHBOARD:
  getCandidateById,
  getCandidateInterviews,
  getCandidateFeedback,
  updateCandidateProfile
};

// Add these functions to your db.js

// ==================== Applications Functions ====================

async function getCandidateApplications(candidateId) {
  const [rows] = await pool.query(`
    SELECT 
      i.id,
      c.name as company_name,
      i.position,
      i.interview_date as applied_date,
      i.status,
      i.interview_location as location,
      'Full-time' as job_type,
      i.updated_at as last_updated
    FROM interviews i
    LEFT JOIN companies c ON i.company_id = c.id
    WHERE i.candidate_id = ?
    ORDER BY i.interview_date DESC
  `, [candidateId]);
  
  // Add mock stages for demo
  return rows.map(row => ({
    ...row,
    stages: [
      { name: 'Applied', status: 'completed', date: row.applied_date },
      { name: 'Screening', status: row.status === 'completed' ? 'completed' : 'current', date: null },
      { name: 'Interview', status: row.status === 'completed' ? 'completed' : 'pending', date: row.status === 'interview' ? row.applied_date : null },
      { name: 'Offer', status: 'pending', date: null }
    ]
  }));
}

async function withdrawApplication(applicationId, candidateId) {
  const [result] = await pool.query(
    'UPDATE interviews SET status = "canceled" WHERE id = ? AND candidate_id = ?',
    [applicationId, candidateId]
  );
  return result;
}

// ==================== Resume Functions ====================

// Add at top of db.js if not already there
const fs = require('fs');

// Replace the getCandidateResume function
async function getCandidateResume(candidateId) {
  // Try to get with created_at first, fallback without it
  let query = 'SELECT resume_file_name, resume_file_path';
  
  // Check if created_at column exists
  try {
    const [columns] = await pool.query(
      "SHOW COLUMNS FROM candidates LIKE 'created_at'"
    );
    if (columns.length > 0) {
      query += ', created_at as uploaded_at';
    }
  } catch (err) {
    console.warn('Could not check for created_at column');
  }
  
  query += ' FROM candidates WHERE id = ?';
  
  const [rows] = await pool.query(query, [candidateId]);
  
  const current = rows[0] || null;
  
  // Calculate file size if file exists
  let fileSize = 0;
  if (current && current.resume_file_path) {
    try {
      if (fs.existsSync(current.resume_file_path)) {
        const stats = fs.statSync(current.resume_file_path);
        fileSize = stats.size;
      }
    } catch (err) {
      console.warn('Could not get file size:', err.message);
    }
  }
  
  // For now, return empty history (you can implement resume_history table later)
  return {
    current: current ? {
      resume_file_name: current.resume_file_name,
      uploaded_at: current.uploaded_at || new Date(),
      file_size: fileSize
    } : null,
    history: [],
    stats: {
      totalUploads: current ? 1 : 0,
      applicationsUsed: 0
    }
  };
}

async function uploadResume(candidateId, fileData) {
  const [result] = await pool.query(
    'UPDATE candidates SET resume_file_name = ?, resume_file_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [fileData.file_name, fileData.file_path, candidateId]
  );
  return result;
}

async function getCandidateResumePath(candidateId) {
  const [rows] = await pool.query(
    'SELECT resume_file_path FROM candidates WHERE id = ?',
    [candidateId]
  );
  return rows[0]?.resume_file_path || null;
}

// ==================== Password Functions ====================

async function verifyPassword(candidateId, password) {
  const [rows] = await pool.query(
    'SELECT password FROM candidates WHERE id = ?',
    [candidateId]
  );
  
  if (rows.length === 0) return false;
  
  const storedHash = rows[0].password;
  return await bcrypt.compare(password, storedHash);
}

async function updatePassword(candidateId, newPasswordHash) {
  const [result] = await pool.query(
    'UPDATE candidates SET password = ? WHERE id = ?',
    [newPasswordHash, candidateId]
  );
  return result;
}

// ==================== Update module.exports ====================
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
  getFeedbackByCandidate,
  getCandidateById,
  getCandidateInterviews,
  getCandidateFeedback,
  updateCandidateProfile,
  // NEW FUNCTIONS:
  getCandidateApplications,
  withdrawApplication,
  getCandidateResume,
  uploadResume,
  getCandidateResumePath,
  verifyPassword,
  updatePassword,
  getAllAssessments,
  getAssessmentWithQuestions,
  submitAssessment,
  getAssessmentStats,
  getCandidateBadges,
  checkAndAwardBadges,
  getRecentResults
};

// ==================== Assessment Functions ====================

// Get all assessments with candidate's progress
async function getAllAssessments(candidateId) {
  const [rows] = await pool.query(`
    SELECT 
      a.*,
      CASE WHEN car.id IS NOT NULL THEN 1 ELSE 0 END as completed,
      COALESCE(car.score, 0) as score
    FROM assessments a
    LEFT JOIN candidate_assessment_results car ON a.id = car.assessment_id AND car.candidate_id = ?
    WHERE a.is_active = 1
    ORDER BY a.category, a.difficulty
  `, [candidateId]);
  return rows;
}

// Get assessment with questions
async function getAssessmentWithQuestions(assessmentId) {
  const [assessmentRows] = await pool.query(
    'SELECT * FROM assessments WHERE id = ?',
    [assessmentId]
  );
  
  if (assessmentRows.length === 0) {
    throw new Error('Assessment not found');
  }
  
  const assessment = assessmentRows[0];
  
  const [questions] = await pool.query(`
    SELECT id, question_text, option_a, option_b, option_c, option_d
    FROM assessment_questions
    WHERE assessment_id = ?
    ORDER BY RAND()
  `, [assessmentId]);
  
  // Format questions with options array
  assessment.questions = questions.map(q => ({
    id: q.id,
    question_text: q.question_text,
    options: [q.option_a, q.option_b, q.option_c, q.option_d]
  }));
  
  return assessment;
}

// Submit assessment and calculate score
async function submitAssessment(candidateId, assessmentId, answers, timeTaken) {
  // Get correct answers
  const [questions] = await pool.query(
    'SELECT id, correct_answer, explanation FROM assessment_questions WHERE assessment_id = ? ORDER BY id',
    [assessmentId]
  );
  
  // Calculate score
  let correct = 0;
  const suggestions = [];
  
  questions.forEach((q, index) => {
    if (answers[index] === q.correct_answer) {
      correct++;
    } else {
      suggestions.push(`Review question ${index + 1}: ${q.explanation || 'Study this topic more'}`);
    }
  });
  
  const incorrect = questions.length - correct;
  const score = Math.round((correct / questions.length) * 100);
  
  // Get passing score
  const [assessmentInfo] = await pool.query(
    'SELECT passing_score FROM assessments WHERE id = ?',
    [assessmentId]
  );
  const passed = score >= assessmentInfo[0].passing_score;
  
  // Save result
  await pool.query(`
    INSERT INTO candidate_assessment_results 
    (candidate_id, assessment_id, score, correct_answers, incorrect_answers, time_taken, passed, answers)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [candidateId, assessmentId, score, correct, incorrect, timeTaken, passed, JSON.stringify(answers)]);
  
  return {
    score,
    correct,
    incorrect,
    passed,
    suggestions: suggestions.slice(0, 3) // Top 3 suggestions
  };
}

// Get assessment stats
async function getAssessmentStats(candidateId) {
  const [stats] = await pool.query(`
    SELECT 
      COUNT(*) as total_completed,
      ROUND(AVG(score), 0) as average_score,
      COUNT(CASE WHEN passed = 1 THEN 1 END) as total_passed
    FROM candidate_assessment_results
    WHERE candidate_id = ?
  `, [candidateId]);
  
  const [badgeCount] = await pool.query(
    'SELECT COUNT(*) as badges_earned FROM candidate_badges WHERE candidate_id = ?',
    [candidateId]
  );
  
  return {
    total_completed: stats[0].total_completed || 0,
    average_score: stats[0].average_score || 0,
    badges_earned: badgeCount[0].badges_earned || 0,
    rank: null // Can implement ranking system later
  };
}

// Get candidate badges
async function getCandidateBadges(candidateId) {
  const [allBadges] = await pool.query('SELECT * FROM badges');
  const [earnedBadges] = await pool.query(
    'SELECT badge_id FROM candidate_badges WHERE candidate_id = ?',
    [candidateId]
  );
  
  const earnedIds = earnedBadges.map(b => b.badge_id);
  
  return allBadges.map(badge => ({
    ...badge,
    earned: earnedIds.includes(badge.id)
  }));
}

// Check and award badges
async function checkAndAwardBadges(candidateId) {
  const [results] = await pool.query(`
    SELECT COUNT(*) as total, MAX(score) as max_score
    FROM candidate_assessment_results
    WHERE candidate_id = ?
  `, [candidateId]);
  
  const total = results[0].total;
  const maxScore = results[0].max_score;
  
  // Award "First Steps" badge
  if (total >= 1) {
    await pool.query(`
      INSERT IGNORE INTO candidate_badges (candidate_id, badge_id)
      SELECT ?, id FROM badges WHERE name = 'First Steps'
    `, [candidateId]);
  }
  
  // Award "Quick Learner" badge
  if (maxScore >= 80) {
    await pool.query(`
      INSERT IGNORE INTO candidate_badges (candidate_id, badge_id)
      SELECT ?, id FROM badges WHERE name = 'Quick Learner'
    `, [candidateId]);
  }
  
  // Award "Perfect Score" badge
  if (maxScore >= 100) {
    await pool.query(`
      INSERT IGNORE INTO candidate_badges (candidate_id, badge_id)
      SELECT ?, id FROM badges WHERE name = 'Perfect Score'
    `, [candidateId]);
  }
  
  // Award "Assessment Master" badge
  if (total >= 10) {
    await pool.query(`
      INSERT IGNORE INTO candidate_badges (candidate_id, badge_id)
      SELECT ?, id FROM badges WHERE name = 'Assessment Master'
    `, [candidateId]);
  }
}

// Get recent results
async function getRecentResults(candidateId) {
  const [rows] = await pool.query(`
    SELECT 
      car.*,
      a.title as assessment_name
    FROM candidate_assessment_results car
    JOIN assessments a ON car.assessment_id = a.id
    WHERE car.candidate_id = ?
    ORDER BY car.completed_at DESC
    LIMIT 10
  `, [candidateId]);
  return rows;
}

