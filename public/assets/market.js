/* Marketplace behaviour (prototype, all client-side). */

const filters = { location: "all", produce: "all", search: "" };
let selectedWallet = null;
let activeStall = null;

function allStalls() {
  return store.get("myStalls", []).concat(BW.STALLS);
}

function priceOf(name) {
  const p = BW.PRODUCE.find(x => x.name === name);
  return p || { name, unit: "kg", price: 15, trend: "flat" };
}

function matches(stall) {
  if (filters.location !== "all" && stall.location !== filters.location) return false;
  if (filters.produce !== "all" && !stall.items.includes(filters.produce)) return false;
  if (filters.search) {
    const hay = (stall.name + " " + stall.owner + " " + stall.items.join(" ")).toLowerCase();
    if (!hay.includes(filters.search.toLowerCase())) return false;
  }
  return true;
}

function walletDots(w) {
  return ["orange", "smega", "myzaka"]
    .filter(k => w[k])
    .map(k => `<span class="dot ${k}" title="${BW.WALLETS[k].name}"></span>`).join("");
}

function renderStalls() {
  const list = allStalls().filter(matches);
  const grid = document.getElementById("stallGrid");
  const season = BW.currentSeason();
  const inSeason = BW.produceFor(season.key).map(p => p.name);

  grid.innerHTML = list.map(s => `
    <article class="stall-card" data-id="${s.id}">
      <div class="thumb">${thumbFor(s)}</div>
      <div class="stall-body">
        <h3>${s.name}</h3>
        <div class="small muted">${s.location}${s.area ? " · " + s.area : ""} · ★ ${s.rating}</div>
        <div class="tags">
          ${s.items.slice(0, 4).map(i => `<span class="pill ${inSeason.includes(i) ? "" : "line"}">${i}</span>`).join("")}
        </div>
        <div class="wallet-dots">${walletDots(s.wallets)} <span class="small muted">wallets, ${s.bank && BW.BANKS[s.bank.id] ? BW.BANKS[s.bank.id].short : "bank"} transfer &amp; cards</span></div>
      </div>
    </article>`).join("");

  document.getElementById("resultCount").textContent =
    list.length + (list.length === 1 ? " stall" : " stalls") +
    (filters.location === "all" ? " across Botswana" : " in " + filters.location);
  document.getElementById("emptyState").style.display = list.length ? "none" : "block";

  grid.querySelectorAll(".stall-card").forEach(card =>
    card.addEventListener("click", () => openStall(card.dataset.id)));
}

function stallMonogram(s) {
  return (s.name || "?").trim().charAt(0).toUpperCase();
}

/* every payment rail this stall can be paid on */
function stallMethods(s) {
  const list = [];
  ["orange", "smega", "myzaka"].forEach(k => {
    if (s.wallets && s.wallets[k]) list.push({ id: k, name: BW.WALLETS[k].name, detail: "+267 " + s.wallets[k], group: "Mobile wallets" });
  });
  if (s.bank && BW.BANKS[s.bank.id]) {
    list.push({ id: "bank:" + s.bank.id, name: BW.BANKS[s.bank.id].name, detail: "Acc " + s.bank.account, group: "Bank transfer" });
  }
  Object.values(BW.BANKS).forEach(b => {
    if (!s.bank || b.id !== s.bank.id) list.push({ id: "bank:" + b.id, name: b.name, detail: "Interbank settlement", group: "Bank transfer" });
  });
  Object.values(BW.GLOBAL).forEach(g =>
    list.push({ id: "global:" + g.id, name: g.name, detail: "Settled to the farmer in Pula", group: "Global payments" }));
  return list;
}

function methodGroupsHtml(s, selected) {
  const list = stallMethods(s);
  const groups = ["Mobile wallets", "Bank transfer", "Global payments"];
  return groups.map(g => `
    <div class="method-group">
      <div class="method-group-title">${g}</div>
      <div class="wallet-choice">
        ${list.filter(m => m.group === g).map(m => `
          <button type="button" data-w="${m.id}" class="${m.id === selected ? "sel" : ""}">
            ${m.name}<br /><span class="small muted">${m.detail}</span>
          </button>`).join("")}
      </div>
    </div>`).join("");
}

/* what the buyer's saved profile offers for a given method */
function profileValueFor(id) {
  const prof = store.get("profile", {});
  if (!id) return "";
  if (id.indexOf("bank:") === 0) return prof.account || "";
  if (id === "global:paypal") return prof.paypal || "";
  if (id === "global:visa" || id === "global:mastercard") return prof.card || "";
  if (id === "global:swift") return prof.account || "";
  return prof[id] || "";
}

function methodLabel(s, id) {
  const m = stallMethods(s).find(x => x.id === id);
  return m ? m : { name: id, detail: "" };
}

function thumbFor(s) {
  return s.img
    ? `<img src="${s.img}" alt="${s.name} produce stall in ${s.location}" loading="lazy" />`
    : `<div class="media-placeholder"><span class="ph-mono">${stallMonogram(s)}</span></div>`;
}

function coverFor(s) {
  return s.img
    ? `<img class="cover" src="${s.img}" alt="${s.name}" />`
    : `<div class="media-placeholder cover"><span class="ph-mono">${stallMonogram(s)}</span></div>`;
}

/* ---------- stall modal + simulated checkout ---------- */
function openStall(id) {
  const s = allStalls().find(x => x.id === id);
  if (!s) return;
  activeStall = s;
  const profile = store.get("profile", {});
  const available = stallMethods(s).map(m => m.id);
  selectedWallet = (profile.preferred && available.indexOf(profile.preferred) > -1) ? profile.preferred : available[0];

  document.getElementById("modalContent").innerHTML = `
    ${coverFor(s)}
    <div class="modal-body">
      <div class="eyebrow">${s.location}${s.area ? " · " + s.area : ""}</div>
      <h2 style="margin-bottom:8px">${s.name}</h2>
      <p class="muted small">Run by ${s.owner} · ★ ${s.rating} · ${s.delivery}</p>
      <p>${s.blurb || ""}</p>

      <h3 style="margin-top:22px">On the stall today</h3>
      <div class="produce-grid">
        ${s.items.map(i => { const p = priceOf(i); return produceCard(p); }).join("")}
      </div>

      <h3 style="margin-top:26px">Pay this stall</h3>
      <p class="small muted">Mobile wallets, Botswana banks (FNB, ABSA, Stanbic, Standard Chartered) and global cards or PayPal all settle to the farmer.</p>
      <div id="walletChoice">${methodGroupsHtml(s, selectedWallet)}</div>
      <div class="field-row">
        <div class="field">
          <label for="buyItem">Produce</label>
          <select id="buyItem">${s.items.map(i => `<option>${i}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label for="buyQty">Quantity</label>
          <input id="buyQty" type="number" min="1" value="3" />
        </div>
      </div>
      <div class="field">
        <label for="buyMsisdn">Your mobile number</label>
        <input id="buyMsisdn" type="tel" placeholder="76 000 000" value="${profileValueFor(selectedWallet)}" />
      </div>
      <p class="small muted" id="buyTotal"></p>
      <button class="btn btn-primary btn-block" id="payBtn">Pay now</button>
      <div id="payResult"></div>
      <p class="notice" style="margin-top:16px">Simulated payment. In production AgriWise settles between Orange Money, Smega, MyZaka, Botswana banks such as FNB and ABSA, and global card or online methods, so any buyer method can pay any farmer account.</p>
    </div>`;

  document.getElementById("modal").classList.add("open");

  const syncTotal = () => {
    const item = priceOf(document.getElementById("buyItem").value);
    const qty = parseInt(document.getElementById("buyQty").value, 10) || 0;
    document.getElementById("buyTotal").textContent =
      `${qty} × ${item.unit} of ${item.name} at ${P(item.price)} = ${P(item.price * qty)}`;
  };
  document.getElementById("buyItem").addEventListener("change", syncTotal);
  document.getElementById("buyQty").addEventListener("input", syncTotal);
  syncTotal();

  const choice = document.getElementById("walletChoice");
  const paint = () => choice.querySelectorAll("button").forEach(b =>
    b.classList.toggle("sel", b.dataset.w === selectedWallet));
  choice.querySelectorAll("button").forEach(b =>
    b.addEventListener("click", () => {
      selectedWallet = b.dataset.w;
      document.getElementById("buyMsisdn").value = profileValueFor(selectedWallet);
      paint();
    }));
  paint();

  document.getElementById("payBtn").addEventListener("click", pay);
}

function pay() {
  const s = activeStall;
  const item = priceOf(document.getElementById("buyItem").value);
  const qty = parseInt(document.getElementById("buyQty").value, 10) || 0;
  const msisdn = document.getElementById("buyMsisdn").value.trim();
  if (!selectedWallet) { toast("Choose a payment method"); return; }
  if (qty <= 0) { toast("Enter a quantity"); return; }
  if (!msisdn) { toast("Enter your number or account"); return; }

  const total = item.price * qty;
  const reference = ref("AGW");
  const method = methodLabel(s, selectedWallet);
  const btn = document.getElementById("payBtn");
  btn.textContent = "Waiting for your PIN prompt…";
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = "Pay now";
    btn.disabled = false;
    document.getElementById("payResult").innerHTML = `
      <div class="receipt">
        <strong>Payment confirmed (simulated)</strong>
        <div class="row"><span>Reference</span><span class="mono">${reference}</span></div>
        <div class="row"><span>Stall</span><span>${s.name}</span></div>
        <div class="row"><span>Order</span><span>${qty} × ${item.unit} ${item.name}</span></div>
        <div class="row"><span>Paid with</span><span>${method.name} · ${msisdn}</span></div>
        <div class="row"><span>Settled to</span><span>${s.name} · ${method.detail}</span></div>
        <div class="row"><strong>Total</strong><strong class="mono">${P(total)}</strong></div>
      </div>`;

    const orders = store.get("orders", []);
    orders.unshift({
      ref: reference, stall: s.name, item: item.name, qty,
      total, wallet: method.name, when: new Date().toLocaleString("en-GB")
    });
    store.set("orders", orders);
    renderOrders();
    toast("Paid " + P(total) + " · " + reference);
  }, 1400);
}

/* ---------- profile & orders ---------- */
function renderOrders() {
  const orders = store.get("orders", []);
  const el = document.getElementById("orderList");
  if (!orders.length) {
    el.innerHTML = `<p class="muted small">No orders yet. Your simulated purchases will appear here.</p>`;
    return;
  }
  el.innerHTML = orders.slice(0, 8).map(o => `
    <div class="txn">
      <div>
        <div class="t-title">${o.qty} × ${o.item} · ${o.stall}</div>
        <div class="t-meta">${o.wallet} · ${o.when} · ${o.ref}</div>
      </div>
      <div class="t-amt out mono">${P(o.total)}</div>
    </div>`).join("");
}

function loadProfile() {
  const p = store.get("profile", {});
  if (p.name) document.getElementById("pName").value = p.name;
  if (p.location) document.getElementById("pLocation").value = p.location;
  ["orange", "smega", "myzaka"].forEach(k => {
    if (p[k]) document.getElementById("p" + k.charAt(0).toUpperCase() + k.slice(1)).value = p[k];
  });
  if (p.bank) document.getElementById("pBank").value = p.bank;
  if (p.account) document.getElementById("pAccount").value = p.account;
  if (p.card) document.getElementById("pCard").value = p.card;
  if (p.preferred) document.getElementById("pPreferred").value = p.preferred;
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", function () {
  if (!requireRole("consumer")) return;
  const season = BW.currentSeason();
  document.querySelectorAll("[data-season-name]").forEach(el => el.textContent = "In season: " + season.name);

  document.getElementById("fLocation").innerHTML =
    `<option value="all">All of Botswana</option>` + BW.LOCATIONS.map(l => `<option>${l}</option>`).join("");
  document.getElementById("pLocation").innerHTML = BW.LOCATIONS.map(l => `<option>${l}</option>`).join("");
  document.getElementById("pBank").innerHTML =
    `<option value="">No bank account</option>` + Object.values(BW.BANKS).map(b => `<option value="${b.id}">${b.name}</option>`).join("");
  document.getElementById("pPreferred").innerHTML = paymentOptions();
  document.getElementById("fProduce").innerHTML =
    `<option value="all">Everything</option>` + BW.PRODUCE.map(p => `<option>${p.name}</option>`).join("");

  document.getElementById("seasonChips").innerHTML =
    BW.produceFor(season.key).slice(0, 8).map(p => `<button class="chip" type="button">${p.name}</button>`).join("");
  document.querySelectorAll("#seasonChips .chip").forEach(chip =>
    chip.addEventListener("click", () => {
      const name = chip.textContent.trim();
      filters.produce = filters.produce === name ? "all" : name;
      document.getElementById("fProduce").value = filters.produce;
      document.querySelectorAll("#seasonChips .chip").forEach(c => c.classList.remove("active"));
      if (filters.produce !== "all") chip.classList.add("active");
      renderStalls();
    }));

  document.getElementById("fLocation").addEventListener("change", e => { filters.location = e.target.value; renderStalls(); });
  document.getElementById("fProduce").addEventListener("change", e => { filters.produce = e.target.value; renderStalls(); });
  document.getElementById("fSearch").addEventListener("input", e => { filters.search = e.target.value; renderStalls(); });
  document.getElementById("fReset").addEventListener("click", () => {
    filters.location = "all"; filters.produce = "all"; filters.search = "";
    document.getElementById("fLocation").value = "all";
    document.getElementById("fProduce").value = "all";
    document.getElementById("fSearch").value = "";
    document.querySelectorAll("#seasonChips .chip").forEach(c => c.classList.remove("active"));
    renderStalls();
  });

  document.getElementById("modalClose").addEventListener("click", () =>
    document.getElementById("modal").classList.remove("open"));
  document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") e.target.classList.remove("open");
  });

  document.getElementById("profileForm").addEventListener("submit", e => {
    e.preventDefault();
    store.set("profile", {
      name: document.getElementById("pName").value.trim(),
      location: document.getElementById("pLocation").value,
      orange: document.getElementById("pOrange").value.trim(),
      smega: document.getElementById("pSmega").value.trim(),
      myzaka: document.getElementById("pMyzaka").value.trim(),
      bank: document.getElementById("pBank").value,
      account: document.getElementById("pAccount").value.trim(),
      card: document.getElementById("pCard").value.trim(),
      preferred: document.getElementById("pPreferred").value
    });
    toast("Profile saved");
  });

  loadProfile();
  renderOrders();
  renderStalls();
});
