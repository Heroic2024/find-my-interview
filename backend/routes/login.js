window.onload = () => {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    try {
      const resp = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        alert("❌ Login failed: " + (data.error || "Invalid credentials"));
        return;
      }

      // Save JWT token
      if (data.token) localStorage.setItem("token", data.token);

      // Redirect to candidate landing page
      window.location.href = "candidate_landing_page.html";
    } catch (err) {
      console.error("Network/login error:", err);
      alert("⚠️ Network error during login");
    }
  });

  // Optional: link to registration page
  const signupLink = document.getElementById("signupLink");
  if (signupLink) signupLink.href = "candidate_registration.html";
};
