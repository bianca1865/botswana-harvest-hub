/* Shared helpers: formatting, storage, toasts, seasonal rendering. */

const P = (n) => "P" + Number(n).toLocaleString("en-BW", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("tfm:" + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("tfm:" + key, JSON.stringify(value)); } catch (e) {}
  }
};

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  requestAnimationFrame(() => el.classList.add("show"));
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3200);
}

function ref(prefix) {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return prefix + "-" + s;
}

function trendLabel(t) {
  return t === "up" ? "▲ rising" : t === "down" ? "▼ easing" : "◆ steady";
}

function produceCard(p) {
  return `
    <article class="produce-card">
      <div class="produce-mono">${p.name.charAt(0)}</div>
      <h4>${p.name}</h4>
      <div class="produce-price mono">${P(p.price)} <span class="muted small">/ ${p.unit}</span></div>
      <div class="trend ${p.trend}">${trendLabel(p.trend)}</div>
    </article>`;
}

function renderSeasonBlock(opts) {
  const season = BW.currentSeason();
  const list = BW.produceFor(season.key);
  const nameEl = document.querySelector(opts.nameSel);
  const monthsEl = document.querySelector(opts.monthsSel);
  const noteEl = document.querySelector(opts.noteSel);
  const gridEl = document.querySelector(opts.gridSel);
  if (nameEl) nameEl.textContent = season.name;
  if (monthsEl) monthsEl.textContent = season.months;
  if (noteEl) noteEl.textContent = season.note;
  if (gridEl) gridEl.innerHTML = list.map(produceCard).join("");
  return season;
}

function setYear() {
  document.querySelectorAll("[data-year]").forEach(el => { el.textContent = new Date().getFullYear(); });
}

/* every payment method AgriWise supports, as <option> markup */
function paymentOptions() {
  const groups = [
    ["Mobile wallets", Object.values(BW.WALLETS).map(w => [w.id, w.name])],
    ["Botswana banks", Object.values(BW.BANKS).map(b => ["bank:" + b.id, b.name])],
    ["Global payments", Object.values(BW.GLOBAL).map(g => ["global:" + g.id, g.name])]
  ];
  return groups.map(([label, items]) =>
    `<optgroup label="${label}">` +
    items.map(([v, n]) => `<option value="${v}">${n}</option>`).join("") +
    `</optgroup>`).join("");
}

function methodName(id) {
  if (!id) return "";
  const key = id.indexOf(":") > -1 ? id.split(":")[1] : id;
  const m = BW.METHODS[key];
  return m ? m.name : id;
}

/* ---------- accounts & roles (prototype, localStorage only) ---------- */
function currentAccount() { return store.get("account", null); }

function signOut() {
  store.set("account", null);
  location.href = "/index.html";
}

function requireRole(role) {
  const acc = currentAccount();
  if (!acc) { location.href = "/signup.html?role=" + role; return false; }
  if (acc.role !== role) {
    location.href = acc.role === "farmer" ? "/farmer.html" : "/market.html";
    return false;
  }
  return true;
}

function applyAccountUI() {
  const acc = currentAccount();
  document.querySelectorAll("[data-role-only]").forEach(el => {
    el.style.display = acc && el.dataset.roleOnly !== acc.role ? "none" : "";
  });
  document.querySelectorAll("[data-account]").forEach(el => {
    el.textContent = acc ? "Sign out (" + (acc.name || acc.role) + ")" : "Sign up";
    el.href = acc ? "#" : "/signup.html";
    if (acc) el.addEventListener("click", e => { e.preventDefault(); signOut(); });
  });
}

document.addEventListener("DOMContentLoaded", function () {
  setYear();
  applyAccountUI();
});
