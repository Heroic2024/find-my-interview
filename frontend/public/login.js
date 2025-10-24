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
        window.location.href = "/candidateLanding";
      }

    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  });
};
