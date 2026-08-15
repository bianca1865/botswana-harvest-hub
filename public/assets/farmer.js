/* Farmer dashboard behaviour (prototype, all client-side). */

const DEFAULT_BALANCES = {
  orange: 4820.5, smega: 2140.0, myzaka: 1265.75,
  "bank:fnb": 7310.4, "bank:absa": 5185.9
};
const MSISDN = { orange: "76 214 889", smega: "71 903 447", myzaka: "74 118 902" };
const BANK_ACCOUNTS = { "bank:fnb": "6255 019 447", "bank:absa": "1042 887 331" };

/* every account money can sit in or move between */
function accountList() {
  const wallets = Object.values(BW.WALLETS).map(w => ({
    id: w.id, name: w.name, cls: w.cls, fee: w.fee, kind: "Mobile wallet", ref: "+267 " + MSISDN[w.id]
  }));
  const banks = Object.keys(BANK_ACCOUNTS).map(id => {
    const b = BW.BANKS[id.split(":")[1]];
    return { id: id, name: b.name, cls: "bank", fee: b.fee, kind: "Bank account", ref: "Acc " + BANK_ACCOUNTS[id] };
  });
  return wallets.concat(banks);
}

function accountById(id) { return accountList().find(a => a.id === id); }

let balances = Object.assign({}, DEFAULT_BALANCES, store.get("balances", {}));
let txns = store.get("txns", BW.TXNS);
let uploaded = [];

/* ---------- wallets ---------- */
function renderWallets() {
  const accounts = accountList();
  const card = a => `
    <div class="wallet-card ${a.cls}">
      <div class="w-name">${a.name}</div>
      <div class="w-bal mono">${P(balances[a.id] || 0)}</div>
      <div class="w-msisdn">${a.kind} · ${a.ref}</div>
    </div>`;
  document.getElementById("walletCards").innerHTML =
    accounts.filter(a => a.kind === "Mobile wallet").map(card).join("");
  const bankEl = document.getElementById("bankCards");
  if (bankEl) bankEl.innerHTML = accounts.filter(a => a.kind === "Bank account").map(card).join("");

  const total = accountList().reduce((sum, a) => sum + (balances[a.id] || 0), 0);
  document.getElementById("totalBalance").textContent = P(total);
}

/* ---------- transfers ---------- */
function fillWalletSelects() {
  const opts = accountList().map(a => `<option value="${a.id}">${a.name}</option>`).join("");
  const from = document.getElementById("fromWallet");
  const to = document.getElementById("toWallet");
  from.innerHTML = opts; to.innerHTML = opts;
  from.value = "myzaka"; to.value = "orange";
}

function syncRoute() {
  const from = accountById(document.getElementById("fromWallet").value);
  const to = accountById(document.getElementById("toWallet").value);
  document.getElementById("routeFrom").textContent = from.name;
  document.getElementById("routeTo").textContent = to.name;
  document.getElementById("destMsisdn").value = to.ref;
  const amt = parseFloat(document.getElementById("amount").value) || 0;
  const fee = amt * (from.fee + to.fee) / 2;
  document.getElementById("feeLine").textContent =
    `Settlement fee ${P(fee)} · ${to.name} receives ${P(Math.max(0, amt - fee))}`;
}

function doTransfer() {
  const fromId = document.getElementById("fromWallet").value;
  const toId = document.getElementById("toWallet").value;
  const amt = parseFloat(document.getElementById("amount").value) || 0;
  const result = document.getElementById("transferResult");

  if (fromId === toId) { toast("Choose two different accounts"); return; }
  if (amt <= 0) { toast("Enter an amount"); return; }
  if (amt > balances[fromId]) { toast("Not enough balance in " + accountById(fromId).name); return; }

  const from = accountById(fromId), to = accountById(toId);
  const fee = amt * (from.fee + to.fee) / 2;
  const net = amt - fee;

  balances[fromId] -= amt;
  balances[toId] += net;
  store.set("balances", balances);

  const reference = ref("AGW");
  txns.unshift({
    title: `Settlement · ${from.name} to ${to.name}`,
    wallet: "Cross-network", dir: "out", amount: amt, when: "Just now"
  });
  store.set("txns", txns);

  renderWallets();
  renderTxns();
  renderLoan();

  result.innerHTML = `
    <div class="receipt">
      <strong>Transfer settled (simulated)</strong>
      <div class="row"><span>Reference</span><span class="mono">${reference}</span></div>
      <div class="row"><span>From</span><span>${from.name} · ${from.ref}</span></div>
      <div class="row"><span>To</span><span>${to.name} · ${document.getElementById("destMsisdn").value}</span></div>
      <div class="row"><span>Amount sent</span><span class="mono">${P(amt)}</span></div>
      <div class="row"><span>Settlement fee</span><span class="mono">-${P(fee)}</span></div>
      <div class="row"><strong>Received</strong><strong class="mono">${P(net)}</strong></div>
    </div>`;
  toast("Transfer settled · " + reference);
}

/* ---------- transactions ---------- */
function renderTxns() {
  document.getElementById("txnList").innerHTML = txns.slice(0, 7).map(t => `
    <div class="txn">
      <div>
        <div class="t-title">${t.title}</div>
        <div class="t-meta">${t.wallet} · ${t.when}</div>
      </div>
      <div class="t-amt ${t.dir} mono">${t.dir === "in" ? "+" : "−"}${P(t.amount)}</div>
    </div>`).join("");
}

/* ---------- loan readiness ---------- */
function renderLoan() {
  const income = txns.filter(t => t.dir === "in").reduce((a, b) => a + b.amount, 0);
  const listing = store.get("myStall", null);
  const checks = [
    { label: "6 months of settled sales on AgriWise", done: true },
    { label: "Income recorded on more than one wallet", done: true },
    { label: "Bank account linked (FNB / ABSA)", done: true },
    { label: "Published stall listing (proof of trade)", done: !!listing },
    { label: "CIPA business registration uploaded", done: false },
    { label: "Land board / lease certificate uploaded", done: false },
    { label: "12-month seasonal cash-flow projection", done: true }
  ];
  const score = Math.round(checks.filter(c => c.done).length / checks.length * 100);

  document.getElementById("loanScore").textContent = score;
  document.getElementById("loanMeter").style.width = score + "%";
  document.getElementById("loanChecks").innerHTML = checks.map(c => `
    <li><span class="${c.done ? "ok" : "todo"}">${c.done ? "✓" : "•"}</span><span>${c.label}</span></li>
  `).join("") + `<li><span class="ok">≈</span><span>Indicative facility on record: <strong>${P(income * 3)}</strong></span></li>`;
}

/* ---------- advisor chat ---------- */
const SUGGESTIONS = [
  "What should I plant next season?",
  "What are prices doing?",
  "Where is the demand?",
  "Which payment methods should I accept?",
  "Prepare me for an ABSA loan",
  "Tell me about tomatoes"
];

function pushMsg(text, who) {
  const log = document.getElementById("chatLog");
  const div = document.createElement("div");
  div.className = "msg " + who;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function ask(text) {
  pushMsg(text, "user");
  setTimeout(() => pushMsg(advisorAnswer(text), "bot"), 380);
}

/* ---------- advertise ---------- */
function fillLocations() {
  document.getElementById("adLocation").innerHTML =
    locationOptions();
  document.getElementById("adBank").innerHTML =
    `<option value="">No bank account</option>` +
    Object.values(BW.BANKS).map(b => `<option value="${b.id}">${b.name}</option>`).join("");
}

function handleAdImages(e) {
  const files = Array.from(e.target.files).slice(0, 4);
  uploaded = [];
  const preview = document.getElementById("adPreview");
  preview.innerHTML = "";
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      uploaded.push(ev.target.result);
      const img = document.createElement("img");
      img.src = ev.target.result;
      img.alt = file.name;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
}

function publishListing(e) {
  e.preventDefault();
  const val = id => document.getElementById(id).value.trim();
  const stall = {
    id: "own-" + Date.now(),
    name: val("adName"),
    owner: val("adOwner"),
    location: val("adLocation"),
    area: val("adArea"),
    blurb: val("adBlurb"),
    items: val("adItems").split(",").map(s => s.trim()).filter(Boolean),
    wallets: { orange: val("adOrange"), smega: val("adSmega"), myzaka: val("adMyzaka") },
    bank: document.getElementById("adBank").value
      ? { id: document.getElementById("adBank").value, account: val("adAccount") }
      : null,
    cards: true,
    img: uploaded[0] || "",
    gallery: uploaded,
    rating: 5.0,
    delivery: "Contact the farmer to arrange collection or delivery",
    mine: true
  };
  const mine = store.get("myStalls", []);
  mine.unshift(stall);
  store.set("myStalls", mine);
  store.set("myStall", stall);
  renderLoan();
  toast("Listing published to the marketplace");
  e.target.reset();
  document.getElementById("adPreview").innerHTML = "";
  uploaded = [];
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", function () {
  if (!requireRole("farmer")) return;
  const season = renderSeasonBlock({
    nameSel: "[data-season-name]",
    monthsSel: "[data-season-months]",
    noteSel: "[data-season-note]",
    gridSel: "[data-season-grid]"
  });
  document.querySelectorAll("[data-season-name]").forEach(el => el.textContent = season.name);

  const next = BW.nextSeason();
  document.getElementById("nextSeasonName").textContent = next.name + " · " + next.months;
  document.getElementById("nextSeasonNote").textContent = next.note;

  renderWallets();
  fillWalletSelects();
  syncRoute();
  renderTxns();
  renderLoan();
  fillLocations();

  ["fromWallet", "toWallet", "amount"].forEach(id =>
    document.getElementById(id).addEventListener("input", syncRoute));
  document.getElementById("sendBtn").addEventListener("click", doTransfer);

  document.getElementById("chatChips").innerHTML =
    SUGGESTIONS.map(s => `<button class="chip" type="button">${s}</button>`).join("");
  document.querySelectorAll("#chatChips .chip").forEach(chip =>
    chip.addEventListener("click", () => ask(chip.textContent)));

  document.getElementById("chatForm").addEventListener("submit", e => {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    if (!input.value.trim()) return;
    ask(input.value.trim());
    input.value = "";
  });

  pushMsg(advisorAnswer("hello"), "bot");

  document.getElementById("adImages").addEventListener("change", handleAdImages);
  document.getElementById("adForm").addEventListener("submit", publishListing);

  document.getElementById("exportBtn").addEventListener("click", () => {
    const income = txns.filter(t => t.dir === "in").reduce((a, b) => a + b.amount, 0);
    const lines = [
      "AGRIWISE — INCOME STATEMENT (simulated)",
      "Farmer: Mmapula Kgosi · Mmapula Fresh Produce · Gaborone",
      "Generated: " + new Date().toDateString(),
      "",
      "Settled income on record: " + P(income),
      "Accounts: Orange Money, Smega, MyZaka, FNB Botswana, ABSA Botswana",
      "",
      ...txns.map(t => `${t.when} | ${t.wallet} | ${t.dir === "in" ? "+" : "-"}${P(t.amount)} | ${t.title}`)
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "agriwise-income-statement.txt";
    a.click();
    toast("Income statement downloaded");
  });
});
