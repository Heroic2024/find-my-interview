console.log("💡 HR_HomePage.js loaded");

document.addEventListener("DOMContentLoaded", () => {
  const email = localStorage.getItem("companyEmail");
  const token = localStorage.getItem("companyToken");

  console.log("🔍 Debug info: email =", email, ", token =", token);

  if (!email || !token) {
    console.error("❌ No logged-in company info found!");
    document.getElementById("companyProfile").textContent = "Please log in first.";
    return;
  }

  fetch(`/api/company?email=${email}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then(async (res) => {
      console.log("📡 Response status:", res.status);

      // Parse JSON safely
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("❌ Failed to parse JSON response:", err, "Text:", text);
        throw new Error("Invalid JSON from server");
      }
      console.log("📦 Response data:", data);

      if (!res.ok) throw new Error(data.error || data.message || "Unknown error");
      return data;
    })
    .then((company) => {
      console.log("🏢 Company fetched successfully:", company);

      document.getElementById("companyName").textContent = company.name || "N/A";
      document.getElementById("companyEmail").textContent = company.official_email || "N/A";
      document.getElementById("companyIndustry").textContent = company.industry || "N/A";
      document.getElementById("companyContact").textContent = company.contact_number || "N/A";
      document.getElementById("companyWebsite").textContent = company.website || "N/A";
    })
    .catch((err) => {
      console.error("❌ Error fetching company details:", err);
      document.getElementById("companyProfile").textContent =
        "Error loading company details. Check console for info.";
    });
});
 