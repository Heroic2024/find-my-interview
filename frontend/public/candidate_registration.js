// Progress bar updates as user fills fields
//to check if this the file used
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

// replace the fake submit handler with real submit code using fetch + FormData
form.addEventListener("submit", async function(e) {
  e.preventDefault();
  const formData = new FormData(form);

  // rename fullname -> fullname, resume is file input in the form already
  try {
    alert('Submitting application...');
    const resp = await fetch('api/candidates/apply', {
      method: 'POST',
      body: formData
    });

    if (!resp.ok) {
      const err = await resp.json().catch(()=>({ error: 'Unknown error' }));
      alert('Submission failed: ' + (err.error || 'Server error'));
      return;
    }

    const body = await resp.json();
    alert('✅ Application submitted (id: ' + body.id + ')');
    window.location.href = 'login.html';
    progress.style.width = "0%";
  } catch (err) {
    console.error(err);
    alert('Network error while submitting application');
  }
});
