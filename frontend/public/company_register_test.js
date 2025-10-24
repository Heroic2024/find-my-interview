/*const http = require('http');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const mysql = require('mysql');*/

// MySQL connection
/*const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Admin',
  database: 'recruitment_system'
});

db.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database!');
});*/

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

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('companyForm');
  const message = document.getElementById('message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // collect fields (pick first address if duplicates exist)
    const companyName = form.elements['companyName']?.value?.trim() || '';
    const industry = form.elements['industry']?.value?.trim() || '';
    const regNo = form.elements['regNo']?.value?.trim() || '';
    const gstin = form.elements['gstin']?.value?.trim() || '';
    const officialEmail = form.elements['officialEmail']?.value?.trim() || '';
    const website = form.elements['website']?.value?.trim() || '';
    const contact = form.elements['contact']?.value?.trim() || '';
    const size = form.elements['size']?.value || '';
    const addressEl = form.querySelector('[name="address"]'); // picks first address
    const address = addressEl ? addressEl.value.trim() : '';
    const password = form.elements['password']?.value || '';
    const confirmPassword = form.elements['confirmPassword']?.value || '';
    const logoInput = document.getElementById('logo');

    // basic validation
    if (!companyName || !industry || !regNo || !officialEmail || !contact || !size || !address) {
      message.innerText = 'Please fill all required fields.';
      message.style.color = 'red';
      return;
    }

    if (password !== confirmPassword) {
      message.innerText = 'Passwords do not match.';
      message.style.color = 'red';
      return;
    }

    // assemble FormData (suitable for file upload)
    const formData = new FormData();
    formData.append('companyName', companyName);
    formData.append('industry', industry);
    formData.append('regNo', regNo);
    formData.append('gstin', gstin);
    formData.append('officialEmail', officialEmail);
    formData.append('website', website);
    formData.append('contact', contact);
    formData.append('size', size);
    formData.append('address', address);
    formData.append('password', password);

    if (logoInput && logoInput.files && logoInput.files[0]) {
      formData.append('logo', logoInput.files[0]);
    }

    // try to POST to backend; fallback to showing collected data if request fails
    try {
      alert("Submitting company registration...");
      const resp = await fetch('/api/companies/apply', {
        method: 'POST',
        body: formData
      });

      if (!resp.ok) {
        alert("Company registration failed.");
        const err = await resp.json().catch(() => ({ error: 'Server error' }));
        message.innerText = 'Registration failed: ' + (err.error || resp.statusText);
        message.style.color = 'red';
        console.error('Company register error:', err);
        return;
      }
      alert("Company registered successfully.");
      const result = await resp.json().catch(() => ({}));
      message.innerText = 'Company registered successfully';
      message.style.color = 'green';
      form.reset();
    } catch (err) {
      // network or backend not available — show collected payload for debugging
      console.error('Network error while submitting company form:', err);
      message.innerText = 'Could not reach server. Collected data logged to console.';
      message.style.color = 'orange';

      // log collected data (without file) for debugging
      const collected = {
        companyName, industry, regNo, gstin, officialEmail, website, contact, size, address
      };
      console.log('Collected company form data (no file):', collected);
      if (logoInput && logoInput.files && logoInput.files[0]) {
        console.log('Logo file present:', logoInput.files[0].name, logoInput.files[0].size);
      }
    }
  });
});
