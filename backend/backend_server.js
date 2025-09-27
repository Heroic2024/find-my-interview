// server.js - Node.js Backend Server for Interview Manager
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || '3306',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'recruitment_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

// Helper function to format interview data
function formatInterviewData(interview) {
    return {
        id: interview.id,
        candidateName: interview.candidate_name,
        candidateEmail: interview.candidate_email,
        candidatePhone: interview.candidate_phone,
        position: interview.position_title,
        interviewDate: interview.interview_date,
        interviewer: interview.interviewer_name,
        notes: interview.notes,
        status: interview.status,
        rating: interview.rating,
        feedback: interview.feedback,
        createdAt: interview.created_at
    };
}

// Auth helpers
function generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

async function getUserById(id) {
    const [rows] = await pool.execute('SELECT id, email, role, is_active FROM auth_users WHERE id = ?', [id]);
    return rows[0];
}

// Middleware: authenticate and attach req.user
async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication token required' });

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = await getUserById(payload.id);
        if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid or inactive user' });
        req.user = { id: user.id, role: user.role };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

function checkRole(allowedRoles = []) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
        if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
        next();
    };
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

        const [rows] = await pool.execute('SELECT id, email, password_hash, role, is_active FROM auth_users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match || !user.is_active) return res.status(401).json({ error: 'Invalid credentials or inactive user' });

        const token = generateToken(user);
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// API Routes (protected where appropriate)

// Get all interviews with detailed information
app.get('/api/interviews', authenticateToken, async (req, res) => {
    try {
        const { search, status } = req.query;
        let where = ' WHERE 1=1';
        const params = [];

        if (search) {
            where += ' AND (c.first_name LIKE ? OR c.last_name LIKE ? OR p.title LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ?)';
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        if (status) {
            where += ' AND i.status = ?';
            params.push(status);
        }

        const query = `
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                c.email AS candidate_email,
                c.phone AS candidate_phone,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.notes,
                i.status,
                ie.rating,
                ie.feedback,
                i.created_at
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            LEFT JOIN interview_evaluations ie ON ie.interview_id = i.id
            ${where}
            ORDER BY i.interview_date ASC
        `;

        const [rows] = await pool.execute(query, params);
        const interviews = rows.map(formatInterviewData);
        res.json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
});

// Get single interview by ID
app.get('/api/interviews/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(`
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                c.email AS candidate_email,
                c.phone AS candidate_phone,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.notes,
                i.status,
                ie.rating,
                ie.feedback,
                i.created_at
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            LEFT JOIN interview_evaluations ie ON ie.interview_id = i.id
            WHERE i.id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ error: 'Interview not found' });
        res.json(formatInterviewData(rows[0]));
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
});

// Create new interview (hr or interviewer)
app.post('/api/interviews', authenticateToken, checkRole(['hr', 'interviewer']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const {
            candidateName,
            candidateEmail,
            candidatePhone,
            position,
            interviewDate,
            interviewer,
            notes
        } = req.body;

        if (!candidateName || !candidateEmail || !position || !interviewDate || !interviewer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const nameParts = candidateName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Candidate
        let candidateId;
        const [existingCandidate] = await connection.execute('SELECT id FROM candidates WHERE email = ?', [candidateEmail]);
        if (existingCandidate.length > 0) {
            candidateId = existingCandidate[0].id;
        } else {
            const [candidateResult] = await connection.execute(`
                INSERT INTO candidates (first_name, last_name, email, phone, status, applied_on)
                VALUES (?, ?, ?, ?, 'interview_scheduled', CURDATE())
            `, [firstName, lastName, candidateEmail, candidatePhone || null]);
            candidateId = candidateResult.insertId;
        }

        // Position
        let positionId;
        const [existingPosition] = await connection.execute('SELECT id FROM positions WHERE title = ?', [position]);
        if (existingPosition.length > 0) {
            positionId = existingPosition[0].id;
        } else {
            const [departments] = await connection.execute('SELECT id FROM departments LIMIT 1');
            if (departments.length === 0) throw new Error('No departments found');
            const [positionResult] = await connection.execute(`
                INSERT INTO positions (department_id, title, status, date_of_description)
                VALUES (?, ?, 'open', CURDATE())
            `, [departments[0].id, position]);
            positionId = positionResult.insertId;
        }

        // Interviewer -> employees table
        let interviewerId;
        const [existingInterviewer] = await connection.execute(
            'SELECT id FROM employees WHERE CONCAT(first_name, " ", last_name) = ? OR email = ?',
            [interviewer, interviewer]
        );

        if (existingInterviewer.length > 0) {
            interviewerId = existingInterviewer[0].id;
        } else {
            const parts = interviewer.trim().split(' ');
            const iFirst = parts[0];
            const iLast = parts.slice(1).join(' ') || '';
            const iEmail = `${iFirst.toLowerCase()}.${(iLast || 'x').toLowerCase()}@company.com`;

            const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
            if (companies.length === 0) throw new Error('No companies found');

            const [interviewerResult] = await connection.execute(`
                INSERT INTO employees (company_id, department_id, first_name, last_name, email, username, role)
                VALUES (?, ?, ?, ?, ?, ?, 'interviewer')
            `, [companies[0].id, 1, iFirst, iLast, iEmail, `${iFirst.toLowerCase()}_${iLast.toLowerCase()}`]);
            interviewerId = interviewerResult.insertId;
        }

        // Create interview (using interviewer_id_1 to match schema with multiple interviewer fields)
        const [interviewResult] = await connection.execute(`
            INSERT INTO interviews (
                candidate_id, position_id, interviewer_id_1, interviewer_id_2, interviewer_id_3, round_id,
                interview_date, status, notes, created_at
            ) VALUES (?, ?, ?, NULL, NULL, NULL, ?, 'scheduled', ?, NOW())
        `, [candidateId, positionId, interviewerId, interviewDate, notes || null]);

        await connection.commit();

        // Fetch created interview
        const [newInterview] = await pool.execute(`
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                c.email AS candidate_email,
                c.phone AS candidate_phone,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.notes,
                i.status,
                i.created_at
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            WHERE i.id = ?
        `, [interviewResult.insertId]);

        res.status(201).json(formatInterviewData(newInterview[0]));
    } catch (error) {
        await connection.rollback();
        console.error('Error creating interview:', error);
        res.status(500).json({ error: 'Failed to create interview: ' + error.message });
    } finally {
        connection.release();
    }
});

// Update interview (hr or interviewer)
app.put('/api/interviews/:id', authenticateToken, checkRole(['hr', 'interviewer']), async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            candidateName,
            candidateEmail,
            candidatePhone,
            interviewDate,
            notes,
            status
        } = req.body;

        const [currentInterview] = await connection.execute(`
            SELECT i.id, c.id AS candidate_id
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            WHERE i.id = ?
        `, [id]);

        if (currentInterview.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const current = currentInterview[0];

        if (candidateName || candidateEmail || candidatePhone) {
            const nameParts = candidateName ? candidateName.trim().split(' ') : [];
            const firstName = nameParts[0] || null;
            const lastName = nameParts.slice(1).join(' ') || null;

            await connection.execute(`
                UPDATE candidates 
                SET first_name = COALESCE(?, first_name),
                    last_name = COALESCE(?, last_name),
                    email = COALESCE(?, email),
                    phone = COALESCE(?, phone)
                WHERE id = ?
            `, [firstName, lastName, candidateEmail, candidatePhone, current.candidate_id]);
        }

        await connection.execute(`
            UPDATE interviews 
            SET interview_date = COALESCE(?, interview_date),
                notes = COALESCE(?, notes),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [interviewDate, notes, status, id]);

        await connection.commit();

        const [updatedInterview] = await pool.execute(`
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                c.email AS candidate_email,
                c.phone AS candidate_phone,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.notes,
                i.status,
                i.created_at
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            WHERE i.id = ?
        `, [id]);

        res.json(formatInterviewData(updatedInterview[0]));
    } catch (error) {
        await connection.rollback();
        console.error('Error updating interview:', error);
        res.status(500).json({ error: 'Failed to update interview' });
    } finally {
        connection.release();
    }
});

// Delete interview (hr only)
app.delete('/api/interviews/:id', authenticateToken, checkRole(['hr']), async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM interviews WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Interview not found' });
        res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({ error: 'Failed to delete interview' });
    }
});

// Update interview status (hr or interviewer)
app.patch('/api/interviews/:id/status', authenticateToken, checkRole(['hr', 'interviewer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowed = ['scheduled', 'completed', 'canceled', 'pending', 'interview_scheduled', 'no-show'];
        if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });

        await pool.execute('UPDATE interviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);

        const [updatedInterview] = await pool.execute(`
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                c.email AS candidate_email,
                c.phone AS candidate_phone,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.notes,
                i.status,
                i.created_at
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            WHERE i.id = ?
        `, [id]);

        if (updatedInterview.length === 0) return res.status(404).json({ error: 'Interview not found' });

        res.json(formatInterviewData(updatedInterview[0]));
    } catch (error) {
        console.error('Error updating interview status:', error);
        res.status(500).json({ error: 'Failed to update interview status' });
    }
});

// Get dashboard statistics (protected)
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_interviews,
                SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                SUM(CASE WHEN WEEK(interview_date) = WEEK(CURDATE()) AND YEAR(interview_date) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as this_week_count
            FROM interviews
        `);
        res.json(stats[0]);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get upcoming interviews for dashboard
app.get('/api/dashboard/upcoming', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT
                i.id,
                CONCAT(c.first_name, ' ', c.last_name) AS candidate_name,
                p.title AS position_title,
                i.interview_date,
                CONCAT(e.first_name, ' ', e.last_name) AS interviewer_name,
                i.status
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id
            LEFT JOIN employees e ON i.interviewer_id_1 = e.id
            WHERE i.status = 'scheduled' AND i.interview_date >= NOW()
            ORDER BY i.interview_date ASC
            LIMIT 5
        `);
        res.json(rows.map(r => ({
            id: r.id,
            candidateName: r.candidate_name,
            position: r.position_title,
            interviewDate: r.interview_date,
            interviewer: r.interviewer_name,
            status: r.status
        })));
    } catch (error) {
        console.error('Error fetching upcoming interviews:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming interviews' });
    }
});

// Get all interviewers (protected)
app.get('/api/interviewers', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, CONCAT(first_name, ' ', last_name) as name, email
            FROM employees 
            WHERE role = 'interviewer' AND (is_active IS NULL OR is_active = TRUE)
            ORDER BY first_name, last_name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching interviewers:', error);
        res.status(500).json({ error: 'Failed to fetch interviewers' });
    }
});

// Get all positions (protected)
app.get('/api/positions', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.id, p.title, d.name as department_name
            FROM positions p
            JOIN departments d ON p.department_id = d.id
            WHERE p.status = 'open'
            ORDER BY p.title
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching positions:', error);
        res.status(500).json({ error: 'Failed to fetch positions' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Interview Manager API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
async function startServer() {
    await testConnection();
    app.listen(PORT, () => {
        console.log(`🚀 Interview Manager Server running on http://localhost:${PORT}`);
        console.log(`📊 API endpoints available at http://localhost:${PORT}/api/`);
    });
}

startServer().catch(console.error);

module.exports = app;