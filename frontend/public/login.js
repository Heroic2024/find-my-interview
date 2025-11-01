window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const role = params.get("role") || "candidate";

  // Update login page title dynamically
 // document.getElementById("roleTitle").innerText =
  //  role === "hr" ? " HR Login" : "Candidate Login";

  // Update signup link with role
  //document.getElementById("signupLink").href = `signup.html?role=${role}`;

  const form = document.getElementById("loginForm");

  form.addEventListener("submit", async function(e) {
    e.preventDefault();

    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const resp = await fetch("api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert(data.error || "Login failed");
        return;
      }

      // ✅ Save JWT for future authenticated requests
      localStorage.setItem("token", data.token);

      // Redirect based on role
      if (role === "hr") {
        window.location.href = "HR_HomePage.html";
      } else {
        window.location.href = "/candidateDashboard";
      }

    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });
};
// login.js

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const submitBtn = document.querySelector('.submit-btn');

  // Disable button during request
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    // Store the token in localStorage
    localStorage.setItem('candidateToken', data.token);

    // Show success message
    alert('Login successful! Redirecting to dashboard...');

    // Redirect to candidate dashboard
    window.location.href = '/candidateDashboard';

  } catch (error) {
    console.error('Login error:', error);
    alert(error.message || 'Login failed. Please check your credentials.');
    
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.textContent = 'Login';
  }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('candidateToken');
  if (token) {
    // Verify token is still valid
    fetch('/api/candidate/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (response.ok) {
        // Already logged in, redirect to dashboard
        window.location.href = '/candidateDashboard';
      } else {
        // Token invalid, remove it
        localStorage.removeItem('candidateToken');
      }
    })
    .catch(() => {
      // Error checking token, remove it
      localStorage.removeItem('candidateToken');
    });
  }
});