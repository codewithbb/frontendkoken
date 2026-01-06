const API_BASE = "http://127.0.0.1:5000";

const form = document.getElementById("form");
const msg = document.getElementById("msg");

function show(text, ok=false){
  msg.textContent = text;
  msg.classList.remove("hidden");
  msg.classList.toggle("alert-error", !ok);
}

function linesToList(text) {
  return (text || "")
    .split("\n")
    .map(s => s.trim())
    .filter(Boolean);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.classList.add("hidden");

  const fd = new FormData(form);
  const payload = {
    title: fd.get("title"),
    description: fd.get("description"),
    image_url: (fd.get("image_url") || "").trim() || null,
    servings: Number(fd.get("servings") || 1),
    prep_time_minutes: Number(fd.get("prep_time_minutes") || 0),
    cook_time_minutes: Number(fd.get("cook_time_minutes") || 0),
    cuisine: (fd.get("cuisine") || "").trim() || null,
    diet: (fd.get("diet") || "").trim() || null,
    difficulty: (fd.get("difficulty") || "").toString() || null,
    is_public: fd.get("is_public") === "on",
    voice_summary: (fd.get("voice_summary") || "").trim() || null,
    ingredients: linesToList(fd.get("ingredients")),
    steps: linesToList(fd.get("steps")).map((instruction, idx) => ({
      step_number: idx + 1,
      instruction,
      skill_level: null,
      technique: null,
      can_be_spoken: true
    })),
    tags: (fd.get("tags") || "")
      .split(",")
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
  };

  const res = await fetch(`${API_BASE}/recipes`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    credentials: "include", // belangrijk voor session cookie
    body: JSON.stringify(payload)
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return show(body.error || "Opslaan mislukt (ben je ingelogd?)");
  }

  show("Recept opgeslagen! Je gaat nu naar de detailpagina…", true);
  setTimeout(() => window.location.href = `recipe.html?id=${body.id}`, 600);
});
