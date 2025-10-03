// backend/db.js
const mysql = require('mysql2/promise');


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
        userData.password
      ]
    ); 
    console.log("Candidate inserted with ID:", result.insertId);
    return result;
  }


  async function verifyCandidate(userData) {
    const [rows] = await pool.execute('SELECT * FROM candidates WHERE email = ? and password = ?', [userData.email, userData.password]);
    console.log("Rows found:", rows.length );
    return rows;
  }
    
module.exports = {testConnection, insertCandidate, verifyCandidate};
