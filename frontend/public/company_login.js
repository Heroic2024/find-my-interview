document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('loginMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect input values
    const officialEmail = form.elements['officialEmail']?.value?.trim() || '';
    const password = form.elements['password']?.value || '';

    // Basic validation
    if (!officialEmail || !password) {
      message.innerText = 'Please fill in all fields.';
      message.style.color = 'red';
      return;
    }

    try {
      // Send POST request to backend
      const resp = await fetch('http://localhost:3000/api/companies/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officialEmail, password })
    });

      const data = await resp.json();

      if (!resp.ok) {
        // Show backend error messages
        message.innerText = data.error || 'Invalid login credentials.';
        message.style.color = 'red';
        return;
      }

      // Login successful
      message.innerText = 'Login successful! Redirecting...';
      message.style.color = 'green';

      // Store JWT token in localStorage for future authenticated requests
      localStorage.setItem('companyToken', data.token);

      // ✅ Store logged-in company info
      localStorage.setItem('companyEmail', data.company.email);
      localStorage.setItem('companyName', data.company.name);

      // Redirect to HR home page
      setTimeout(() => {
        window.location.href = '/hrHomePage';
      }, 1500);

    } catch (err) {
      console.error('Login error:', err);
      message.innerText = 'Server unreachable. Try again later.';
      message.style.color = 'orange';
    }
  });
});
 