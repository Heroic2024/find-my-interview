const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const mysql = require('mysql');

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root*',
  database: 'recruitment_system'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});

// Helper function to get content type
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.css': return 'text/css';
    case '.js': return 'text/javascript';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.html': return 'text/html';
    default: return 'application/octet-stream';
  }
}

// Create server
const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'Company_Register.html' : req.url);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('File not found.');
      }
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      res.end(data);
    });

  } else if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const formData = querystring.parse(body);
      const { companyName, industry, regNo, gstin, officialEmail, website, contact, size, address, password } = formData;

      const sql = `
        INSERT INTO companies 
        (companyName, industry, regNo, gstin, officialEmail, website, contact, size, address, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.query(sql, [companyName, industry, regNo, gstin, officialEmail, website, contact, size, address, password], (err, result) => {
        if (err) {
          console.error(err);
          res.writeHead(500);
          return res.end('Database error.');
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('Company registered successfully!');
      });
    });
  }
});

// Start server
const PORT = 3002;
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
 