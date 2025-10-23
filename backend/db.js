// backend/db.js
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
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

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}
module.exports = {testConnection, insertCandidate, verifyCandidate, insertCompany, verifyCompany, query};
