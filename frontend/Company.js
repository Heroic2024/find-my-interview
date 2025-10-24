// index.js (Company Registration Backend)

const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3003;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from "public" folder (HTML, CSS, JS)
app.use(express.static('public'));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',           // Your MySQL username
    password: 'root',  // Your MySQL password
    database: 'recruitment_system'
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Error connecting to MySQL:', err);
        return;
    }
    console.log('✅ Connected to MySQL');
});

// Serve the registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Company_Register.html'));
});

// Handle Company Registration
app.post('/register-company', async (req, res) => {
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
        password
    } = req.body;

    if (!companyName || !industry || !regNo || !officialEmail || !contact || !size || !address || !password) {
        return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    try {
        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `
            INSERT INTO company 
            (company_name, industry, registration_number, gstin, official_email, website, contact_number, company_size, address, password_hash) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(query, [
            companyName,
            industry,
            regNo,
            gstin || null,
            officialEmail,
            website || null,
            contact,
            size,
            address,
            hashedPassword
        ], (err, result) => {
            if (err) {
                console.error('❌ Database error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log('✅ Company registered:', companyName);
            res.status(201).json({ message: 'Company registered successfully!' });
        });
    } catch (err) {
        console.error('❌ Server error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
