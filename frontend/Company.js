document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("companyForm");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const companyName = document.getElementById("companyName").value.trim();
    const industry = document.getElementById("industry").value.trim();
    const regNo = document.getElementById("regNo").value.trim();
    const gstin = document.getElementById("gstin").value.trim();
    const email = document.getElementById("officialEmail").value.trim();
    const website = document.getElementById("website").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const size = document.getElementById("size").value;
    const address = document.getElementById("address").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!companyName || !industry || !regNo || !email || !contact || !size || !address) {
      alert("❌ Please fill all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      alert("⚠️ Passwords do not match.");
      return;
    }

    alert("✅ Company registered successfully! Awaiting verification.");
    window.location.href = "login.html";
  });
});
