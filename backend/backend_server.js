// server.js - Node.js Backend Server for Interview Manager
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_manager',
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

// API Routes

// Get all interviews with detailed information
app.get('/api/interviews', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = 'SELECT * FROM interview_details WHERE 1=1';
        let params = [];

        if (search) {
            query += ' AND (candidate_name LIKE ? OR position_title LIKE ? OR interviewer_name LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        query += ' ORDER BY interview_date ASC';

        const [rows] = await pool.execute(query, params);
        const interviews = rows.map(formatInterviewData);
        res.json(interviews);
    } catch (error) {
        console.error('Error fetching interviews:', error);
        res.status(500).json({ error: 'Failed to fetch interviews' });
    }
});

// Get single interview by ID
app.get('/api/interviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.execute(
            'SELECT * FROM interview_details WHERE id = ?',
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(formatInterviewData(rows[0]));
    } catch (error) {
        console.error('Error fetching interview:', error);
        res.status(500).json({ error: 'Failed to fetch interview' });
    }
});

// Create new interview
app.post('/api/interviews', async (req, res) => {
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

        // Validate required fields
        if (!candidateName || !candidateEmail || !position || !interviewDate || !interviewer) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Split candidate name
        const nameParts = candidateName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || '';

        // Check if candidate exists, if not create one
        let candidateId;
        const [existingCandidate] = await connection.execute(
            'SELECT id FROM candidates WHERE email = ?',
            [candidateEmail]
        );

        if (existingCandidate.length > 0) {
            candidateId = existingCandidate[0].id;
        } else {
            const [candidateResult] = await connection.execute(`
                INSERT INTO candidates (first_name, last_name, email, phone, status)
                VALUES (?, ?, ?, ?, 'interviewing')
            `, [firstName, lastName, candidateEmail, candidatePhone || null]);
            candidateId = candidateResult.insertId;
        }

        // Get or create position
        let positionId;
        const [existingPosition] = await connection.execute(
            'SELECT p.id FROM positions p JOIN departments d ON p.department_id = d.id WHERE p.title = ?',
            [position]
        );

        if (existingPosition.length > 0) {
            positionId = existingPosition[0].id;
        } else {
            // Create position in first available department
            const [departments] = await connection.execute('SELECT id FROM departments LIMIT 1');
            if (departments.length === 0) {
                throw new Error('No departments found');
            }

            const [positionResult] = await connection.execute(`
                INSERT INTO positions (department_id, title, status)
                VALUES (?, ?, 'active')
            `, [departments[0].id, position]);
            positionId = positionResult.insertId;
        }

        // Get or create interviewer
        let interviewerId;
        const [existingInterviewer] = await connection.execute(
            'SELECT id FROM interviewers WHERE CONCAT(first_name, " ", last_name) = ? OR email = ?',
            [interviewer, interviewer]
        );

        if (existingInterviewer.length > 0) {
            interviewerId = existingInterviewer[0].id;
        } else {
            // Create interviewer
            const interviewerParts = interviewer.trim().split(' ');
            const intFirstName = interviewerParts[0];
            const intLastName = interviewerParts.slice(1).join(' ') || '';
            const intEmail = `${intFirstName.toLowerCase()}.${intLastName.toLowerCase()}@company.com`;

            const [companies] = await connection.execute('SELECT id FROM companies LIMIT 1');
            if (companies.length === 0) {
                throw new Error('No companies found');
            }

            const [interviewerResult] = await connection.execute(`
                INSERT INTO interviewers (company_id, first_name, last_name, email, job_title)
                VALUES (?, ?, ?, ?, 'Interviewer')
            `, [companies[0].id, intFirstName, intLastName, intEmail]);
            interviewerId = interviewerResult.insertId;
        }

        // Create interview
        const [interviewResult] = await connection.execute(`
            INSERT INTO interviews (
                candidate_id, position_id, interviewer_id, interview_date,
                interview_type, status, notes
            ) VALUES (?, ?, ?, ?, 'video', 'scheduled', ?)
        `, [candidateId, positionId, interviewerId, interviewDate, notes || null]);

        await connection.commit();

        // Fetch the created interview with full details
        const [newInterview] = await connection.execute(
            'SELECT * FROM interview_details WHERE id = ?',
            [interviewResult.insertId]
        );

        res.status(201).json(formatInterviewData(newInterview[0]));
    } catch (error) {
        await connection.rollback();
        console.error('Error creating interview:', error);
        res.status(500).json({ error: 'Failed to create interview: ' + error.message });
    } finally {
        connection.release();
    }
});

// Update interview
app.put('/api/interviews/:id', async (req, res) => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const {
            candidateName,
            candidateEmail,
            candidatePhone,
            position,
            interviewDate,
            interviewer,
            notes,
            status
        } = req.body;

        // Get current interview details
        const [currentInterview] = await connection.execute(`
            SELECT i.*, c.id as candidate_id, p.id as position_id, int.id as interviewer_id
            FROM interviews i
            JOIN candidates c ON i.candidate_id = c.id
            JOIN positions p ON i.position_id = p.id  
            JOIN interviewers int ON i.interviewer_id = int.id
            WHERE i.id = ?
        `, [id]);

        if (currentInterview.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        const current = currentInterview[0];

        // Update candidate if needed
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

        // Update interview
        await connection.execute(`
            UPDATE interviews 
            SET interview_date = COALESCE(?, interview_date),
                notes = COALESCE(?, notes),
                status = COALESCE(?, status),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [interviewDate, notes, status, id]);

        await connection.commit();

        // Fetch updated interview
        const [updatedInterview] = await connection.execute(
            'SELECT * FROM interview_details WHERE id = ?',
            [id]
        );

        res.json(formatInterviewData(updatedInterview[0]));
    } catch (error) {
        await connection.rollback();
        console.error('Error updating interview:', error);
        res.status(500).json({ error: 'Failed to update interview' });
    } finally {
        connection.release();
    }
});

// Delete interview
app.delete('/api/interviews/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute(
            'DELETE FROM interviews WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json({ message: 'Interview deleted successfully' });
    } catch (error) {
        console.error('Error deleting interview:', error);
        res.status(500).json({ error: 'Failed to delete interview' });
    }
});

// Update interview status
app.patch('/api/interviews/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        await pool.execute(
            'UPDATE interviews SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        // Fetch updated interview
        const [updatedInterview] = await pool.execute(
            'SELECT * FROM interview_details WHERE id = ?',
            [id]
        );

        if (updatedInterview.length === 0) {
            return res.status(404).json({ error: 'Interview not found' });
        }

        res.json(formatInterviewData(updatedInterview[0]));
    } catch (error) {
        console.error('Error updating interview status:', error);
        res.status(500).json({ error: 'Failed to update interview status' });
    }
});

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
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
app.get('/api/dashboard/upcoming', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT * FROM interview_details 
            WHERE status = 'scheduled' AND interview_date >= NOW()
            ORDER BY interview_date ASC 
            LIMIT 5
        `);

        const upcomingInterviews = rows.map(formatInterviewData);
        res.json(upcomingInterviews);
    } catch (error) {
        console.error('Error fetching upcoming interviews:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming interviews' });
    }
});

// Get all interviewers
app.get('/api/interviewers', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT id, CONCAT(first_name, ' ', last_name) as name, email
            FROM interviewers 
            WHERE is_active = TRUE
            ORDER BY first_name, last_name
        `);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching interviewers:', error);
        res.status(500).json({ error: 'Failed to fetch interviewers' });
    }
});

// Get all positions
app.get('/api/positions', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT p.id, p.title, d.name as department_name
            FROM positions p
            JOIN departments d ON p.department_id = d.id
            WHERE p.status = 'active'
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
        console.log(`🚀 Interview Manager Server running on http://localhost:${3000}`);
        console.log(`📊 API endpoints available at http://localhost:${3000}/api/`);
    });
}

startServer().catch(console.error);

module.exports = app;