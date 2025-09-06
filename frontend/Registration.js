// Progress bar updates as user fills fields
const form = document.getElementById("registrationForm");
const inputs = form.querySelectorAll("input, select, textarea");
const progress = document.querySelector(".progress");

inputs.forEach(input => {
  input.addEventListener("input", () => {
    let filled = [...inputs].filter(i => i.value.trim() !== "").length;
    let percent = (filled / inputs.length) * 100;
    progress.style.width = percent + "%";
  });
});

// Fake submit success
form.addEventListener("submit", function(e) {
  e.preventDefault();
  alert("✅ Registration submitted successfully!");
  form.reset();
  progress.style.width = "0%";
});
