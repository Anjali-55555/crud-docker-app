/* ═══════════════════════════════════════════
   UserVault — Enhanced CRUD Frontend
   Features: Auth, Validation, Stats, Toast, Confirm
═══════════════════════════════════════════ */

const API = "";
let token = localStorage.getItem("uv_token") || null;
let username = localStorage.getItem("uv_user") || null;
let pendingDeleteId = null;
let pendingDeleteName = null;
let toastTimer = null;

/* ──────────── INIT ──────────── */

(function init() {
  if (token) showApp();
  else showAuth();

  // Enter key in auth fields
  document.getElementById("loginPassword").addEventListener("keydown", e => {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("regPassword").addEventListener("keydown", e => {
    if (e.key === "Enter") doRegister();
  });
})();

/* ──────────── AUTH ──────────── */

function showAuth() {
  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("appScreen").classList.add("hidden");
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("appScreen").classList.remove("hidden");
  document.getElementById("loggedInAs").textContent = `👤 ${username}`;
  fetchStats();
  fetchUsers();
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b, i) => {
    b.classList.toggle("active", (i === 0 && tab === "login") || (i === 1 && tab === "register"));
  });
  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("registerForm").classList.toggle("hidden", tab !== "register");
  document.getElementById("authError").classList.add("hidden");
}

async function doLogin() {
  const username_ = document.getElementById("loginUsername").value.trim();
  const password_ = document.getElementById("loginPassword").value;
  clearAuthError();
  if (!username_ || !password_) return showAuthError("Please enter username and password");

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username_, password: password_ })
    });
    const data = await res.json();
    if (!res.ok) return showAuthError(data.message);
    saveSession(data.token, data.username);
    showApp();
  } catch {
    showAuthError("Connection failed – is the server running?");
  }
}

async function doRegister() {
  const username_ = document.getElementById("regUsername").value.trim();
  const password_ = document.getElementById("regPassword").value;
  clearAuthError();
  if (!username_ || !password_) return showAuthError("Please fill all fields");
  if (password_.length < 6) return showAuthError("Password must be at least 6 characters");

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username_, password: password_ })
    });
    const data = await res.json();
    if (!res.ok) return showAuthError(data.message);
    saveSession(data.token, data.username);
    showApp();
  } catch {
    showAuthError("Connection failed – is the server running?");
  }
}

function doLogout() {
  localStorage.removeItem("uv_token");
  localStorage.removeItem("uv_user");
  token = null;
  username = null;
  showAuth();
}

function saveSession(t, u) {
  token = t;
  username = u;
  localStorage.setItem("uv_token", t);
  localStorage.setItem("uv_user", u);
}

function showAuthError(msg) {
  const el = document.getElementById("authError");
  el.textContent = msg;
  el.classList.remove("hidden");
}

function clearAuthError() {
  document.getElementById("authError").classList.add("hidden");
}

/* ──────────── STATS ──────────── */

async function fetchStats() {
  try {
    const res = await apiFetch("/users/stats");
    if (!res.ok) return;
    const s = await res.json();
    document.getElementById("statTotalVal").textContent = s.total;
    document.getElementById("statAvgAgeVal").textContent = s.avgAge;
    document.getElementById("statNewestVal").textContent = s.newest;
    document.getElementById("statOldestVal").textContent = s.oldest;
  } catch {}
}

/* ──────────── FETCH USERS ──────────── */

async function fetchUsers() {
  const container = document.getElementById("usersContainer");
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <span>Loading users…</span>
    </div>`;
  document.getElementById("listStatus").textContent = "";

  try {
    const res = await apiFetch("/users");
    if (res.status === 401) { doLogout(); return; }
    const users = await res.json();

    if (users.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          No users yet — add one above!
        </div>`;
      return;
    }

    document.getElementById("listStatus").textContent = `${users.length} user${users.length !== 1 ? "s" : ""}`;
    container.innerHTML = "";
    users.forEach((u, i) => {
      const card = buildCard(u, i);
      container.appendChild(card);
    });
  } catch {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        Failed to load users. Check the server connection.
      </div>`;
  }
}

function buildCard(user, index) {
  const card = document.createElement("div");
  card.className = "user-card";
  card.id = `card-${user._id}`;
  card.style.animationDelay = `${index * 0.04}s`;

  const initial = user.name.charAt(0).toUpperCase();
  const joined = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  card.innerHTML = `
    <!-- VIEW MODE -->
    <div class="user-view">
      <div class="user-avatar">${initial}</div>
      <div class="user-details">
        <div class="user-name">${escHtml(user.name)}</div>
        <div class="user-meta">
          <span>✉ ${escHtml(user.email)}</span>
          <span>🎂 Age ${user.age}</span>
          <span>📅 ${joined}</span>
        </div>
      </div>
    </div>
    <div class="user-actions">
      <button class="edit-btn" onclick="enableEdit('${user._id}')">✏ Edit</button>
      <button class="delete-btn" onclick="confirmDelete('${user._id}', '${escHtml(user.name)}')">🗑 Delete</button>
    </div>

    <!-- EDIT MODE -->
    <div class="user-edit" id="edit-${user._id}">
      <div class="field-group">
        <label>Name</label>
        <input id="eName-${user._id}" value="${escHtml(user.name)}" placeholder="Name">
        <span class="field-error" id="eErr-name-${user._id}"></span>
      </div>
      <div class="field-group">
        <label>Email</label>
        <input id="eEmail-${user._id}" value="${escHtml(user.email)}" placeholder="Email">
        <span class="field-error" id="eErr-email-${user._id}"></span>
      </div>
      <div class="field-group">
        <label>Age</label>
        <input id="eAge-${user._id}" type="number" value="${user.age}" min="1" max="120">
        <span class="field-error" id="eErr-age-${user._id}"></span>
      </div>
    </div>
    <div class="edit-actions hidden" id="editAct-${user._id}">
      <button class="save-btn" onclick="saveUser('${user._id}')">💾 Save</button>
      <button class="cancel-edit-btn" onclick="cancelEdit('${user._id}')">✕ Cancel</button>
    </div>
  `;
  return card;
}

/* ──────────── CREATE ──────────── */

async function addUser() {
  const name  = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const age   = document.getElementById("age").value.trim();

  clearFieldErrors(["name", "email", "age"]);
  hideFormMessage();

  let valid = true;
  if (!name) { showFieldError("name", "Name is required"); valid = false; }
  if (!email) {
    showFieldError("email", "Email is required"); valid = false;
  } else if (!validEmail(email)) {
    showFieldError("email", "Enter a valid email (e.g. user@example.com)"); valid = false;
  }
  if (!age) {
    showFieldError("age", "Age is required"); valid = false;
  } else if (!validAge(age)) {
    showFieldError("age", "Age must be a whole number between 1–120"); valid = false;
  }
  if (!valid) return;

  try {
    const res = await apiFetch("/users", "POST", { name, email, age: Number(age) });
    const data = await res.json();
    if (!res.ok) { showFormMessage(data.message, "error"); return; }

    document.getElementById("name").value  = "";
    document.getElementById("email").value = "";
    document.getElementById("age").value   = "";
    showFormMessage("✓ User added successfully!", "success");
    toast("✓ User added successfully!", "success");
    fetchUsers();
    fetchStats();
  } catch {
    showFormMessage("Connection error – try again", "error");
  }
}

/* ──────────── EDIT ──────────── */

function enableEdit(id) {
  const card = document.getElementById(`card-${id}`);
  card.classList.add("editing");
  document.getElementById(`editAct-${id}`).classList.remove("hidden");
  document.getElementById(`eName-${id}`).focus();
}

function cancelEdit(id) {
  const card = document.getElementById(`card-${id}`);
  card.classList.remove("editing");
  document.getElementById(`editAct-${id}`).classList.add("hidden");
  clearEditErrors(id);
}

async function saveUser(id) {
  const name  = document.getElementById(`eName-${id}`).value.trim();
  const email = document.getElementById(`eEmail-${id}`).value.trim();
  const age   = document.getElementById(`eAge-${id}`).value.trim();

  clearEditErrors(id);
  let valid = true;
  if (!name) { setEditError(id, "name", "Name required"); valid = false; }
  if (!email) {
    setEditError(id, "email", "Email required"); valid = false;
  } else if (!validEmail(email)) {
    setEditError(id, "email", "Invalid email format"); valid = false;
  }
  if (!age) {
    setEditError(id, "age", "Age required"); valid = false;
  } else if (!validAge(age)) {
    setEditError(id, "age", "Number 1–120 required"); valid = false;
  }
  if (!valid) return;

  try {
    const res = await apiFetch(`/users/${id}`, "PUT", { name, email, age: Number(age) });
    const data = await res.json();
    if (!res.ok) { setEditError(id, "name", data.message); return; }

    toast("✓ User updated successfully!", "success");
    fetchUsers();
    fetchStats();
  } catch {
    toast("Connection error – try again", "error");
  }
}

/* ──────────── DELETE ──────────── */

function confirmDelete(id, name) {
  pendingDeleteId   = id;
  pendingDeleteName = name;
  document.getElementById("confirmText").textContent = `Delete "${name}"? This cannot be undone.`;
  document.getElementById("confirmModal").classList.remove("hidden");
  document.getElementById("confirmDeleteBtn").onclick = executeDelete;
}

function closeConfirm() {
  document.getElementById("confirmModal").classList.add("hidden");
  pendingDeleteId = null;
}

async function executeDelete() {
  closeConfirm();
  try {
    const res = await apiFetch(`/users/${pendingDeleteId || ""}`, "DELETE");
    if (!res.ok) { toast("Failed to delete user", "error"); return; }
    toast(`🗑 "${pendingDeleteName}" deleted`, "success");
    fetchUsers();
    fetchStats();
  } catch {
    toast("Connection error – try again", "error");
  }
}

/* ──────────── HELPERS ──────────── */

function apiFetch(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(`${API}${path}`, opts);
}

function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
function validAge(a)   { const n = Number(a); return !isNaN(n) && Number.isInteger(n) && n >= 1 && n <= 120; }
function escHtml(s)    { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function showFieldError(field, msg) {
  document.getElementById(`err-${field}`).textContent = msg;
  document.getElementById(field).classList.add("error");
}

function clearFieldErrors(fields) {
  fields.forEach(f => {
    document.getElementById(`err-${f}`).textContent = "";
    document.getElementById(f).classList.remove("error");
  });
}

function setEditError(id, field, msg) {
  document.getElementById(`eErr-${field}-${id}`).textContent = msg;
  document.getElementById(`e${field.charAt(0).toUpperCase()+field.slice(1)}-${id}`)?.classList.add("error");
}

function clearEditErrors(id) {
  ["name","email","age"].forEach(f => {
    const el = document.getElementById(`eErr-${f}-${id}`);
    if (el) el.textContent = "";
    const inp = document.getElementById(`e${f.charAt(0).toUpperCase()+f.slice(1)}-${id}`);
    if (inp) inp.classList.remove("error");
  });
}

function showFormMessage(msg, type) {
  const el = document.getElementById("formMessage");
  el.textContent = msg;
  el.className = `form-message ${type}`;
  el.classList.remove("hidden");
  if (type === "success") setTimeout(hideFormMessage, 4000);
}

function hideFormMessage() {
  document.getElementById("formMessage").classList.add("hidden");
}

function toast(msg, type = "success") {
  if (toastTimer) clearTimeout(toastTimer);
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove("hidden");
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3500);
}

// Close modal on overlay click
document.getElementById("confirmModal").addEventListener("click", function(e) {
  if (e.target === this) closeConfirm();
});
