/* FARMA PRO — demostración web (todo funciona en el navegador del visitante; no hay servidor ni datos reales).
   Cada visitante tiene su propia farmacia de ejemplo guardada en su navegador (localStorage) y puede reiniciarla. */
"use strict";

const CONFIG = {
  user: "demo", password: "Prueba2026",
  download: "https://github.com/jcramigofiel20-collab/farma-pro-descargas/releases/latest/download/FARMA_PRO_Instalador.exe",
  downloadsPage: "https://jcramigofiel20-collab.github.io/farma-pro-descargas/",
  site: "https://jcramigofiel20-collab.github.io",
  whatsapp: "51929509865", phone: "+51 929 509 865", support: "Joab Chavez Romero",
};
const KEY = "farmapro_demo_web_v1";
const IGV = 0.18;
const METHODS = ["Efectivo", "Tarjeta", "Yape", "Plin"];

/* ------------------------------------------------------------------ utilidades */
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) => "S/ " + Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const round2 = (n) => Math.round(n * 100) / 100;
const pad = (n) => String(n).padStart(2, "0");
// Fecha local (no UTC: en Perú, de noche, UTC ya es el día siguiente)
const dayISO = (offset = 0) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const dmy = (iso) => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
const daysTo = (iso) => Math.round((new Date(iso + "T00:00:00") - new Date(dayISO() + "T00:00:00")) / 86400000);
function toast(text) {
  const t = document.createElement("div"); t.className = "toast"; t.textContent = text; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}
function rng(seed) { return () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }; }

/* ------------------------------------------------------------------ datos de ejemplo (ficticios) */
function seed() {
  const P = (code, name, active, lab, cat, pres, price, min, cond, lots) =>
    ({ id: code, code, name, active, lab, cat, pres, price, min, cond, lots: lots.map(([lot, days, qty, cost]) =>
      ({ lot, expiry: dayISO(days), qty, cost })) });
  const products = [
    P("P0001", "Paracetamol 500 mg", "Paracetamol", "Laboratorios Andinos", "Analgésicos", "Tableta", 0.5, 50, "OTC", [["LT2401", 420, 380, 0.12]]),
    P("P0002", "Ibuprofeno 400 mg", "Ibuprofeno", "Farmacéutica del Pacífico", "Antiinflamatorios", "Tableta", 0.8, 40, "OTC", [["LT2402", 300, 260, 0.2], ["LT2311", 20, 30, 0.2]]),
    P("P0003", "Amoxicilina 500 mg", "Amoxicilina", "BioSalud Perú", "Antibióticos", "Cápsula", 1.2, 30, "RX", [["LT2403", 380, 300, 0.35]]),
    P("P0004", "Loratadina 10 mg", "Loratadina", "Genéricos Unidos", "Antialérgicos", "Tableta", 0.7, 30, "OTC", [["LT2405", 60, 27, 0.15]]),
    P("P0005", "Omeprazol 20 mg", "Omeprazol", "Genéricos Unidos", "Gastrointestinal", "Cápsula", 0.6, 40, "OTC", [["LT2406", 500, 150, 0.15]]),
    P("P0006", "Azitromicina 500 mg", "Azitromicina", "Farmacéutica del Pacífico", "Antibióticos", "Tableta", 6.5, 15, "RX", [["LT2407", 25, 40, 2.1]]),
    P("P0007", "Pediatos jarabe 120 mg/5 mL", "Paracetamol", "Genéricos Unidos", "Pediátricos", "Frasco 60 mL", 9.9, 10, "OTC", [["LT2408", 15, 18, 4.2], ["LT2501", 400, 30, 4.2]]),
    P("P0008", "Dermacalm crema 1 %", "Hidrocortisona", "Laboratorios Andinos", "Dermatológicos", "Tubo 20 g", 18.5, 10, "OTC", [["LT2409", 200, 6, 8.5]]),
    P("P0009", "Vitamina C 1 g", "Ácido ascórbico", "BioSalud Perú", "Vitaminas", "Tableta efervescente", 1.5, 30, "OTC", [["LT2410", 600, 90, 0.5]]),
    P("P0010", "Termómetro digital", "", "BioSalud Perú", "Dispositivos", "Unidad", 25, 5, "OTC", [["SN-001", 3000, 2, 11]]),
    P("P0011", "Naproxeno 550 mg", "Naproxeno", "Laboratorios Andinos", "Antiinflamatorios", "Tableta", 1.0, 20, "OTC", [["LT2412", 350, 120, 0.3]]),
    P("P0012", "Clorfenamina 4 mg", "Clorfenamina", "Genéricos Unidos", "Antialérgicos", "Tableta", 0.3, 40, "OTC", [["LT2413", -10, 40, 0.08], ["LT2501B", 420, 200, 0.08]]),
    P("P0013", "Suero oral 500 mL", "Sales de rehidratación", "BioSalud Perú", "Gastrointestinal", "Frasco", 4.5, 12, "OTC", [["LT2414", 180, 36, 2.0]]),
    P("P0014", "Alcohol 70° 1 L", "Alcohol etílico", "Industrias Químicas", "Cuidado personal", "Frasco", 12, 8, "OTC", [["LT2415", 700, 24, 6.0]]),
    P("P0015", "Metformina 850 mg", "Metformina", "Farmacéutica del Pacífico", "Diabetes", "Tableta", 0.9, 30, "RX", [["LT2416", 330, 180, 0.25]]),
    P("P0016", "Losartán 50 mg", "Losartán", "Genéricos Unidos", "Cardiovascular", "Tableta", 0.8, 30, "RX", [["LT2417", 45, 210, 0.2]]),
    P("P0017", "Gasa estéril 10x10", "", "Industrias Químicas", "Curaciones", "Sobre", 1.2, 30, "OTC", [["LT2418", 900, 150, 0.4]]),
    P("P0018", "Mascarilla KN95", "", "Industrias Químicas", "Cuidado personal", "Unidad", 2.5, 20, "OTC", [["LT2419", 800, 0, 0.9]]),
  ];
  // Ventas de los últimos 7 días (siempre las mismas, para que la demo se vea igual a todos)
  const r = rng(20261101), sales = [];
  let n = 0;
  for (let d = -6; d <= 0; d++) {
    const count = 3 + Math.floor(r() * 6);
    for (let i = 0; i < count; i++) {
      const lines = [], used = new Set();
      const k = 1 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) {
        const p = products[Math.floor(r() * 9)];
        if (used.has(p.id)) continue; used.add(p.id);
        const qty = 1 + Math.floor(r() * 4);
        lines.push({ pid: p.id, name: `${p.name} - ${p.pres}`, qty, price: p.price, total: round2(qty * p.price), lots: p.lots[0].lot });
      }
      const total = round2(lines.reduce((a, l) => a + l.total, 0));
      const hour = String(8 + Math.floor(r() * 12)).padStart(2, "0"), min = String(Math.floor(r() * 60)).padStart(2, "0");
      sales.push({ number: `T001-${String(++n).padStart(8, "0")}`, date: `${dayISO(d)}T${hour}:${min}`, lines, total,
        method: METHODS[Math.floor(r() * 3)], received: total, change: 0, status: "OK", user: "demo" });
    }
  }
  return { products, sales, nextSale: n + 1, nextProduct: products.length + 1,
           cash: { number: "CJ-000001", opened: dayISO() + "T08:00", fund: 150, closed: [] } };
}
let db = load();
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* almacenamiento bloqueado */ }
  return seed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* sin almacenamiento: solo en memoria */ } }
function resetDemo() {
  ask("Reiniciar la demostración", "Se borrarán los cambios que hizo y la demo volverá a quedar como nueva.", "Reiniciar",
      () => { db = seed(); cart = []; save(); toast("Demostración reiniciada"); render(); });
}

/* ------------------------------------------------------------------ cálculos de stock */
const product = (id) => db.products.find((p) => p.id === id);
const sellable = (p) => p.lots.filter((l) => daysTo(l.expiry) >= 0).reduce((a, l) => a + l.qty, 0);
const expiredQty = (p) => p.lots.filter((l) => daysTo(l.expiry) < 0).reduce((a, l) => a + l.qty, 0);
const nextExpiry = (p) => p.lots.filter((l) => l.qty > 0 && daysTo(l.expiry) >= 0).map((l) => l.expiry).sort()[0] || "";
function stockStatus(p) {
  const s = sellable(p);
  if (s <= 0) return ["Agotado", "bad"];
  if (s < p.min) return ["Stock bajo", "warn"];
  return ["Normal", "ok"];
}
function expiryPill(iso) {
  const d = daysTo(iso);
  if (d < 0) return `<span class="pill bad">Vencido</span>`;
  if (d <= 90) return `<span class="pill warn">Vence en ${d} días</span>`;
  return `<span class="pill ok">Vigente</span>`;
}

/* ------------------------------------------------------------------ ingreso */
function showLogin() {
  $("#app").classList.add("hidden"); $("#login").classList.remove("hidden");
  $("#u").value = CONFIG.user; $("#p").value = "";
  $("#p").focus();
}
$("#login-form").addEventListener("submit", (ev) => {
  ev.preventDefault();
  if ($("#u").value.trim().toLowerCase() === CONFIG.user && $("#p").value === CONFIG.password) {
    sessionStorage.setItem("fp_demo_in", "1"); $("#login-error").classList.add("hidden"); startApp();
  } else {
    $("#login-error").textContent = "Usuario o contraseña incorrectos. Use los datos de la demostración (recuadro naranja).";
    $("#login-error").classList.remove("hidden");
  }
});
$("#fill").addEventListener("click", () => { $("#u").value = CONFIG.user; $("#p").value = CONFIG.password; });

/* ------------------------------------------------------------------ estructura */
const MODULES = [
  ["panel", "📊", "Panel principal"], ["pos", "🛒", "Punto de venta"], ["ventas", "🧾", "Ventas"],
  ["productos", "💊", "Productos"], ["inventario", "📦", "Inventario y lotes"], ["caja", "💵", "Caja"],
];
const LOCKED = [
  ["Compras y proveedores", "🚚"], ["Clientes y créditos", "👥"], ["Reportes PDF y Excel", "📈"], ["Promociones", "🏷️"],
  ["Sorteos", "🎟️"], ["Boletas y facturas (SUNAT)", "📄"], ["Usuarios y permisos", "🛡️"], ["App del celular", "📱"],
  ["Copias de seguridad", "💾"],
];
function startApp() {
  $("#login").classList.add("hidden"); $("#app").classList.remove("hidden");
  $("#nav").innerHTML = MODULES.map(([k, ic, t]) => `<a href="#${k}" data-k="${k}">${ic} ${esc(t)}</a>`).join("") +
    `<div class="sep">SOLO EN EL SISTEMA COMPLETO</div>` +
    LOCKED.map(([t, ic]) => `<a href="#" class="locked" data-locked="${esc(t)}">${ic} ${esc(t)}</a>`).join("");
  document.querySelectorAll("[data-locked]").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault(); promo(`«${a.dataset.locked}» está en el sistema completo`);
  }));
  $("#today").textContent = new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  if (!location.hash) location.hash = "#panel"; else render();
}
window.addEventListener("hashchange", render);
$("#logout").addEventListener("click", () => { sessionStorage.removeItem("fp_demo_in"); location.hash = ""; showLogin(); });
$("#reset").addEventListener("click", resetDemo);
$("#want").addEventListener("click", () => promo());
$("#menu").addEventListener("click", (e) => { e.stopPropagation(); $(".sidebar").classList.toggle("open"); });
$(".main").addEventListener("click", () => $(".sidebar").classList.remove("open"));

function render() {
  if (!sessionStorage.getItem("fp_demo_in")) return showLogin();
  const k = (location.hash || "#panel").slice(1).split("?")[0];
  document.querySelectorAll("#nav a[data-k]").forEach((a) => a.classList.toggle("active", a.dataset.k === k));
  $(".sidebar").classList.remove("open");
  const views = { panel: viewPanel, pos: viewPos, ventas: viewSales, productos: viewProducts, inventario: viewInventory, caja: viewCash };
  (views[k] || viewPanel)();
  window.scrollTo(0, 0);
}
const head = (icon, grad, title, sub, actions = "") =>
  `<div class="page-head"><div class="badge-ic ${grad}">${icon}</div><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
   <div class="actions">${actions}</div></div>`;

/* ------------------------------------------------------------------ ventana genérica */
function modal(html, onReady) {
  const bg = document.createElement("div"); bg.className = "modal-bg";
  bg.innerHTML = `<div class="modal">${html}</div>`;
  bg.addEventListener("click", (e) => { if (e.target === bg) bg.remove(); });
  document.body.appendChild(bg);
  bg.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => bg.remove()));
  if (onReady) onReady(bg);
  return bg;
}
function ask(title, text, yes, onYes) {
  modal(`<h3>${esc(title)}</h3><p>${esc(text)}</p>
    <div class="foot"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="yes">${esc(yes)}</button></div>`, (bg) => {
    bg.querySelector("#yes").addEventListener("click", () => { bg.remove(); onYes(); });
  });
}
function promo(title) {
  const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, probé la demo de FARMA PRO y quiero más información.")}`;
  modal(`<div class="promo">
    <h3>${esc(title || "¿Le gustó FARMA PRO? Lléveselo a su farmacia")}</h3>
    <div>El sistema completo se instala en Windows y además incluye:</div>
    <ul>
      <li>Compras a proveedores con ingreso por lote y cuentas por pagar</li>
      <li>Clientes, ventas al crédito y cobranzas</li>
      <li>Boletas y facturas electrónicas (SUNAT)</li>
      <li>Reportes en PDF y Excel, promociones y sorteos</li>
      <li>Varias cajas en red, usuarios con permisos y auditoría</li>
      <li>App del celular para el dueño y copias de seguridad automáticas</li>
    </ul>
    <a class="btn green big" href="${esc(wa)}" target="_blank" rel="noopener">💬 Escribir por WhatsApp</a>
    <a class="btn big" href="${esc(CONFIG.download)}">⬇️ Descargar instalador (prueba 15 días)</a>
    <a class="btn big" href="${esc(CONFIG.site)}" target="_blank" rel="noopener">💲 Ver planes y precios</a>
    <p class="small" style="opacity:.85;margin-top:10px">${esc(CONFIG.support)} · teléfono y WhatsApp ${esc(CONFIG.phone)}</p>
  </div><div class="foot"><button class="btn" data-close>Seguir probando la demo</button></div>`);
}

/* ------------------------------------------------------------------ panel principal */
function salesOf(iso) { return db.sales.filter((s) => s.status === "OK" && s.date.slice(0, 10) === iso); }
function viewPanel() {
  const today = salesOf(dayISO()), sumToday = today.reduce((a, s) => a + s.total, 0);
  const week = [...Array(7)].map((_, i) => { const iso = dayISO(i - 6); return [iso, salesOf(iso).reduce((a, s) => a + s.total, 0)]; });
  const sumWeek = week.reduce((a, [, v]) => a + v, 0), max = Math.max(1, ...week.map(([, v]) => v));
  const low = db.products.filter((p) => stockStatus(p)[1] !== "ok");
  const soon = db.products.flatMap((p) => p.lots.filter((l) => l.qty > 0 && daysTo(l.expiry) >= 0 && daysTo(l.expiry) <= 90).map((l) => ({ p, l })));
  const expired = db.products.flatMap((p) => p.lots.filter((l) => l.qty > 0 && daysTo(l.expiry) < 0).map((l) => ({ p, l })));
  const top = {};
  db.sales.filter((s) => s.status === "OK").forEach((s) => s.lines.forEach((l) => { top[l.name] = (top[l.name] || 0) + l.qty; }));
  const topList = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  $("#view").innerHTML = head("🏠", "g-blue", "Panel principal", "Resumen general de la farmacia", `<a class="btn primary" href="#pos">🛒 Nueva venta</a>`) + `
    <div class="kpis">
      <div class="kpi g-blue"><div class="t">Ventas de hoy</div><div class="v">${money(sumToday)}</div><div class="n">${today.length} venta(s)</div></div>
      <div class="kpi g-green"><div class="t">Ventas de 7 días</div><div class="v">${money(sumWeek)}</div><div class="n">Promedio ${money(sumWeek / 7)} por día</div></div>
      <div class="kpi g-purple"><div class="t">Productos</div><div class="v">${db.products.length}</div><div class="n">en el catálogo</div></div>
      <div class="kpi g-orange"><div class="t">Alertas de inventario</div><div class="v">${low.length + soon.length + expired.length}</div><div class="n">stock bajo, por vencer y vencidos</div></div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>📊 Ventas de los últimos 7 días</h3><div class="bars">${week.map(([iso, v]) =>
        `<div class="bar"><div class="val">${Math.round(v)}</div><div class="col" style="height:${Math.max(2, v / max * 100)}%"></div>
         <div class="lab">${days[new Date(iso + "T12:00").getDay()]} ${iso.slice(8)}</div></div>`).join("")}</div></div>
      <div class="panel"><h3>⭐ Más vendidos</h3>${topList.map(([n, q], i) =>
        `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F1F5F9"><span>${i + 1}. ${esc(n)}</span><b>${q} und.</b></div>`).join("") || `<p class="muted">Aún no hay ventas.</p>`}</div>
    </div>
    <div class="grid2">
      <div class="panel"><h3>⚠️ Alertas de inventario</h3>
        ${low.map((p) => `<div style="padding:5px 0">${esc(p.name)} · <span class="pill ${stockStatus(p)[1]}">${stockStatus(p)[0]}</span> <span class="muted small">(${sellable(p)} und., mínimo ${p.min})</span></div>`).join("")}
        ${soon.map(({ p, l }) => `<div style="padding:5px 0">${esc(p.name)} · lote ${esc(l.lot)} ${expiryPill(l.expiry)}</div>`).join("")}
        ${expired.map(({ p, l }) => `<div style="padding:5px 0">${esc(p.name)} · lote ${esc(l.lot)} <span class="pill bad">Vencido con ${l.qty} und.</span></div>`).join("")}
        ${low.length + soon.length + expired.length ? "" : `<p class="muted">Todo en orden.</p>`}</div>
      <div class="panel promo"><h3>¿Le gusta lo que ve?</h3>
        <div>Esta es una demostración en línea con lo esencial. El sistema completo trae compras, clientes, reportes,
        boletas y facturas electrónicas, varias cajas y la app del celular para el dueño.</div>
        <div style="margin-top:12px"><button class="btn green" id="promo-btn">Quiero FARMA PRO</button></div></div>
    </div>`;
  $("#promo-btn").addEventListener("click", () => promo());
}

/* ------------------------------------------------------------------ punto de venta */
let cart = [], payMethod = "Efectivo";
function viewPos() {
  $("#view").innerHTML = head("🛒", "g-blue", "Punto de venta", "Busque el producto, agréguelo y cobre. El sistema descuenta el stock por lote (primero el que vence antes).") + `
    <div class="pos">
      <div>
        <div class="panel"><input id="q" placeholder="🔍 Buscar producto por nombre, principio activo o código (ej.: paracetamol)" autocomplete="off">
          <div class="results" id="results"></div></div>
        <div class="panel"><h3>🧾 Venta en curso</h3><div class="table-wrap"><table><thead><tr><th>Producto</th><th class="r">Precio</th><th>Cantidad</th><th class="r">Importe</th><th></th></tr></thead>
          <tbody id="cart"></tbody></table></div></div>
      </div>
      <div>
        <div class="panel"><h3>💳 Forma de pago</h3><div class="pay-tiles">${METHODS.map((m) => `<button data-m="${m}" class="${m === payMethod ? "sel" : ""}">${m}</button>`).join("")}</div></div>
        <div class="panel"><div id="tax" class="small muted" style="margin-bottom:8px"></div><div class="total-box"><div>TOTAL</div><div class="v" id="total">S/ 0.00</div></div>
          <button class="btn green block big" id="charge">💵 Cobrar</button>
          <button class="btn block" id="clear">Nueva venta</button></div>
        <div class="panel small muted">Pruebe: busque «paracetamol», agréguelo, cambie la cantidad y cobre. Los productos con receta piden confirmarla.</div>
      </div>
    </div>`;
  const q = $("#q");
  q.addEventListener("input", () => showResults(q.value));
  q.addEventListener("keydown", (e) => { if (e.key === "Enter") { const first = document.querySelector("#results .result"); if (first) first.click(); } });
  document.querySelectorAll(".pay-tiles button").forEach((b) => b.addEventListener("click", () => {
    payMethod = b.dataset.m; document.querySelectorAll(".pay-tiles button").forEach((x) => x.classList.toggle("sel", x === b));
  }));
  $("#charge").addEventListener("click", charge);
  $("#clear").addEventListener("click", () => { cart = []; drawCart(); });
  showResults(""); drawCart(); q.focus();
}
function showResults(text) {
  const t = text.trim().toLowerCase();
  const list = db.products.filter((p) => !t || [p.name, p.active, p.code].some((v) => v.toLowerCase().includes(t))).slice(0, 8);
  $("#results").innerHTML = list.map((p) => {
    const s = sellable(p), [label, tone] = stockStatus(p);
    return `<div class="result" data-id="${esc(p.id)}"><div><b>${esc(p.name)}</b> <span class="muted small">${esc(p.pres)}${p.cond === "RX" ? " · <b style='color:#B45309'>Receta</b>" : ""}</span>
      <div class="small muted">${esc(p.active || "—")} · ${esc(p.lab)} · Stock ${s} <span class="pill ${tone}">${label}</span></div></div><b>${money(p.price)}</b></div>`;
  }).join("") || `<div class="empty">No se encontró. Pruebe con otro nombre.</div>`;
  document.querySelectorAll("#results .result").forEach((r) => r.addEventListener("click", () => addToCart(r.dataset.id)));
}
function addToCart(id) {
  const p = product(id), line = cart.find((c) => c.id === id), have = line ? line.qty : 0;
  if (sellable(p) <= have) return toast(sellable(p) ? "No hay más stock vendible de este producto." : "Producto agotado: ingrese stock en Inventario.");
  if (line) line.qty++; else cart.push({ id, qty: 1 });
  drawCart(); toast(`${p.name} agregado`);
}
function drawCart() {
  const tb = $("#cart");
  tb.innerHTML = cart.map((c, i) => {
    const p = product(c.id);
    return `<tr><td>${esc(p.name)}<div class="small muted">${esc(p.pres)}</div></td><td class="r">${money(p.price)}</td>
      <td><span class="qty"><button data-d="${i}">−</button><b style="min-width:26px;text-align:center">${c.qty}</b><button data-u="${i}">+</button></span></td>
      <td class="r"><b>${money(c.qty * p.price)}</b></td><td><button class="btn danger" data-x="${i}" title="Quitar">✕</button></td></tr>`;
  }).join("") || `<tr><td colspan="5" class="empty">Busque un producto y tóquelo para agregarlo a la venta.</td></tr>`;
  tb.querySelectorAll("[data-u]").forEach((b) => b.addEventListener("click", () => {
    const c = cart[b.dataset.u]; if (c.qty < sellable(product(c.id))) { c.qty++; drawCart(); } else toast("No hay más stock vendible.");
  }));
  tb.querySelectorAll("[data-d]").forEach((b) => b.addEventListener("click", () => { const c = cart[b.dataset.d]; c.qty > 1 ? c.qty-- : cart.splice(b.dataset.d, 1); drawCart(); }));
  tb.querySelectorAll("[data-x]").forEach((b) => b.addEventListener("click", () => { cart.splice(b.dataset.x, 1); drawCart(); }));
  const total = cart.reduce((a, c) => a + c.qty * product(c.id).price, 0), base = total / (1 + IGV);
  $("#total").textContent = money(total);
  $("#tax").textContent = cart.length ? `Op. gravada ${money(base)} · IGV ${money(total - base)} · ${cart.reduce((a, c) => a + c.qty, 0)} unidad(es)` : "";
}
function charge() {
  if (!cart.length) return toast("Agregue al menos un producto.");
  const rx = cart.map((c) => product(c.id)).filter((p) => p.cond === "RX");
  if (rx.length) return ask("Producto con receta médica", `Requieren receta: ${rx.map((p) => p.name).join(", ")}. ¿Verificó la receta?`,
                            "Sí, la verifiqué", collect);
  collect();
}
function collect() {
  const total = round2(cart.reduce((a, c) => a + c.qty * product(c.id).price, 0));
  if (payMethod !== "Efectivo") return finishSale(total, total);
  modal(`<h3>Cobrar en efectivo</h3><p>Total a cobrar: <b style="font-size:20px">${money(total)}</b></p>
    <label>Monto recibido (S/)</label><input id="recv" type="number" step="0.1" min="0" value="${Math.ceil(total)}">
    <p id="chg" class="muted"></p><div class="foot"><button class="btn" data-close>Cancelar</button><button class="btn green" id="ok">Cobrar</button></div>`, (bg) => {
    const recv = bg.querySelector("#recv"), upd = () => {
      const r = Number(recv.value || 0); bg.querySelector("#chg").innerHTML = r >= total ? `Vuelto: <b>${money(r - total)}</b>` : "Monto insuficiente";
    };
    recv.addEventListener("input", upd); upd(); recv.select();
    bg.querySelector("#ok").addEventListener("click", () => {
      const r = Number(recv.value || 0); if (r < total) return toast("El monto recibido no alcanza.");
      bg.remove(); finishSale(total, r);
    });
  });
}
function finishSale(total, received) {
  const lines = cart.map((c) => {
    const p = product(c.id); let need = c.qty; const used = [];
    p.lots.filter((l) => l.qty > 0 && daysTo(l.expiry) >= 0).sort((a, b) => a.expiry.localeCompare(b.expiry)).forEach((l) => {
      if (need <= 0) return; const take = Math.min(need, l.qty); l.qty -= take; need -= take; used.push(l.lot);
    });
    return { pid: p.id, name: `${p.name} - ${p.pres}`, qty: c.qty, price: p.price, total: round2(c.qty * p.price), lots: used.join(", ") };
  });
  const now = new Date(), stamp = `${dayISO()}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sale = { number: `T001-${String(db.nextSale++).padStart(8, "0")}`, date: stamp, lines, total, method: payMethod,
    received, change: round2(received - total), status: "OK", user: "demo" };
  db.sales.push(sale); save(); cart = []; drawCart(); showResults($("#q").value);
  ticket(sale);
}
function ticket(s) {
  const base = s.total / (1 + IGV);
  const body = [`BOTICA DEMOSTRACIÓN`, `Av. Principal 123 - Lima (ficticia)`, `Ticket ${s.number}`, `${dmy(s.date)} ${s.date.slice(11, 16)}  Cajero: ${s.user}`,
    "-".repeat(38), ...s.lines.map((l) => `${l.name}\n  ${l.qty} x ${l.price.toFixed(2)}${" ".repeat(Math.max(1, 20 - String(l.qty).length - l.price.toFixed(2).length))}${l.total.toFixed(2)}\n  Lote: ${l.lots}`),
    "-".repeat(38), `Op. gravada          ${base.toFixed(2)}`, `IGV 18%              ${(s.total - base).toFixed(2)}`, `TOTAL           S/ ${s.total.toFixed(2)}`,
    `${s.method}${s.method === "Efectivo" ? `  Recibido ${s.received.toFixed(2)}  Vuelto ${s.change.toFixed(2)}` : ""}`,
    s.status === "ANULADA" ? "\n*** VENTA ANULADA ***" : "", "\nTicket de DEMOSTRACIÓN · FARMA PRO"].filter(Boolean).join("\n");
  modal(`<h3>✅ Venta ${esc(s.number)}</h3><div class="ticket">${esc(body)}</div>
    <div class="foot"><button class="btn" onclick="window.print()">🖨️ Imprimir</button><button class="btn primary" data-close>Listo</button></div>`);
}

/* ------------------------------------------------------------------ ventas */
function viewSales() {
  const list = [...db.sales].reverse();
  const ok = list.filter((s) => s.status === "OK"), total = ok.reduce((a, s) => a + s.total, 0);
  $("#view").innerHTML = head("🧾", "g-green", "Ventas", "Historial de tickets con su detalle. Las ventas nunca se borran: se anulan y el stock vuelve al lote.") + `
    <div class="tiles"><div class="tile"><div class="t">Ventas completadas</div><div class="v">${ok.length}</div></div>
      <div class="tile green"><div class="t">Total vendido</div><div class="v">${money(total)}</div></div>
      <div class="tile red"><div class="t">Anuladas</div><div class="v">${list.length - ok.length}</div></div></div>
    <div class="table-wrap"><table><thead><tr><th>Ticket</th><th>Fecha</th><th class="r">Total</th><th>Pago</th><th>Estado</th><th></th></tr></thead><tbody>
    ${list.map((s, i) => `<tr><td>${esc(s.number)}</td><td>${dmy(s.date)} ${s.date.slice(11, 16)}</td><td class="r"><b>${money(s.total)}</b></td><td>${esc(s.method)}</td>
      <td><span class="pill ${s.status === "OK" ? "ok" : "bad"}">${s.status === "OK" ? "Completada" : "Anulada"}</span></td>
      <td><button class="btn" data-t="${i}">Ver ticket</button> ${s.status === "OK" ? `<button class="btn danger" data-v="${i}">Anular</button>` : ""}</td></tr>`).join("")}
    </tbody></table></div>`;
  document.querySelectorAll("[data-t]").forEach((b) => b.addEventListener("click", () => ticket(list[b.dataset.t])));
  document.querySelectorAll("[data-v]").forEach((b) => b.addEventListener("click", () => {
    const s = list[b.dataset.v];
    ask(`Anular la venta ${s.number}`, "La venta queda anulada (no se borra) y el stock vuelve al inventario.", "Anular venta", () => {
      s.status = "ANULADA";
      s.lines.forEach((l) => { const p = product(l.pid); if (p) { const lot = p.lots.find((x) => l.lots.split(", ")[0] === x.lot) || p.lots[0]; if (lot) lot.qty += l.qty; } });
      save(); toast("Venta anulada: el stock volvió al inventario"); viewSales();
    });
  }));
}

/* ------------------------------------------------------------------ productos */
function viewProducts() {
  $("#view").innerHTML = head("💊", "g-purple", "Productos", "Catálogo con principio activo, laboratorio, presentación, precio y condición de venta.",
    `<button class="btn primary" id="new">➕ Nuevo producto</button>`) + `
    <div class="toolbar"><input id="f" placeholder="🔍 Buscar por nombre, principio activo, código o laboratorio"></div>
    <div class="table-wrap"><table><thead><tr><th>Código</th><th>Producto</th><th>Principio activo</th><th>Laboratorio</th><th>Presentación</th><th class="r">Precio</th><th class="r">Stock</th><th>Condición</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`;
  const draw = () => {
    const t = $("#f").value.trim().toLowerCase();
    $("#rows").innerHTML = db.products.filter((p) => !t || [p.name, p.active, p.code, p.lab].some((v) => v.toLowerCase().includes(t))).map((p) =>
      `<tr><td>${esc(p.code)}</td><td><b>${esc(p.name)}</b></td><td>${esc(p.active || "—")}</td><td>${esc(p.lab)}</td><td>${esc(p.pres)}</td>
       <td class="r">${money(p.price)}</td><td class="r">${sellable(p)}</td><td>${p.cond === "RX" ? `<span class="pill warn">Con receta</span>` : `<span class="pill ok">Venta libre</span>`}</td>
       <td><button class="btn" data-e="${esc(p.id)}">Editar</button></td></tr>`).join("") || `<tr><td colspan="9" class="empty">Sin resultados.</td></tr>`;
    document.querySelectorAll("[data-e]").forEach((b) => b.addEventListener("click", () => productForm(product(b.dataset.e))));
  };
  $("#f").addEventListener("input", draw); $("#new").addEventListener("click", () => productForm(null)); draw();
}
function productForm(p) {
  const v = p || { name: "", active: "", lab: "", cat: "", pres: "Tableta", price: "", min: 10, cond: "OTC" };
  modal(`<h3>${p ? "Editar producto" : "Nuevo producto"}</h3>
    <label>Nombre comercial *</label><input id="n" value="${esc(v.name)}" placeholder="Ej.: Paracetamol 500 mg">
    <div class="row"><div><label>Principio activo</label><input id="a" value="${esc(v.active)}"></div><div><label>Laboratorio *</label><input id="l" value="${esc(v.lab)}"></div></div>
    <div class="row"><div><label>Categoría</label><input id="c" value="${esc(v.cat)}"></div><div><label>Presentación</label><input id="pr" value="${esc(v.pres)}"></div></div>
    <div class="row"><div><label>Precio de venta (S/) *</label><input id="pc" type="number" step="0.1" min="0" value="${esc(v.price)}"></div>
      <div><label>Stock mínimo</label><input id="m" type="number" min="0" value="${esc(v.min)}"></div></div>
    <label>Condición de venta</label><select id="cd"><option value="OTC">Venta libre</option><option value="RX"${v.cond === "RX" ? " selected" : ""}>Con receta médica</option></select>
    <p class="small muted">${p ? "" : "El producto se crea sin stock: luego ingréselo en Inventario y lotes (con su lote y vencimiento)."}</p>
    <div class="foot"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Guardar</button></div>`, (bg) => {
    bg.querySelector("#n").focus();
    bg.querySelector("#ok").addEventListener("click", () => {
      const g = (id) => bg.querySelector(id).value.trim();
      if (!g("#n") || !g("#l") || !(Number(g("#pc")) > 0)) return toast("Complete nombre, laboratorio y un precio mayor que 0.");
      const data = { name: g("#n"), active: g("#a"), lab: g("#l"), cat: g("#c"), pres: g("#pr") || "Unidad", price: round2(Number(g("#pc"))),
        min: Math.max(0, Number(g("#m") || 0)), cond: bg.querySelector("#cd").value };
      if (p) Object.assign(p, data);
      else { const code = `P${String(db.nextProduct++).padStart(4, "0")}`; db.products.push({ id: code, code, lots: [], ...data }); }
      save(); bg.remove(); toast(p ? "Producto actualizado" : "Producto creado: ahora ingrese su stock en Inventario"); viewProducts();
    });
  });
}

/* ------------------------------------------------------------------ inventario */
function viewInventory() {
  const lots = db.products.flatMap((p) => p.lots.filter((l) => l.qty > 0).map((l) => ({ p, l }))).sort((a, b) => a.l.expiry.localeCompare(b.l.expiry));
  const value = lots.reduce((a, { l }) => a + l.qty * l.cost, 0);
  const low = db.products.filter((p) => stockStatus(p)[1] === "warn").length, out = db.products.filter((p) => stockStatus(p)[1] === "bad").length;
  const soon = lots.filter(({ l }) => daysTo(l.expiry) >= 0 && daysTo(l.expiry) <= 90).length, exp = lots.filter(({ l }) => daysTo(l.expiry) < 0).length;
  $("#view").innerHTML = head("📦", "g-orange", "Inventario y lotes", "Existencias por lote con su vencimiento. Se vende primero lo que vence antes; los lotes vencidos no se venden.",
    `<button class="btn primary" id="in">⬇️ Ingreso de mercadería</button>`) + `
    <div class="tiles"><div class="tile"><div class="t">Productos</div><div class="v">${db.products.length}</div></div>
      <div class="tile amber"><div class="t">Stock bajo</div><div class="v">${low}</div></div>
      <div class="tile red"><div class="t">Agotados</div><div class="v">${out}</div></div>
      <div class="tile amber"><div class="t">Lotes por vencer (90 días)</div><div class="v">${soon}</div></div>
      <div class="tile red"><div class="t">Lotes vencidos</div><div class="v">${exp}</div></div>
      <div class="tile green"><div class="t">Valor del stock (costo)</div><div class="v">${money(value)}</div></div></div>
    <div class="panel"><h3>Existencias por producto</h3><div class="table-wrap"><table><thead><tr><th>Producto</th><th class="r">Vendible</th><th class="r">Vencido</th><th class="r">Mínimo</th><th>Próx. vencimiento</th><th>Estado</th></tr></thead><tbody>
      ${db.products.map((p) => { const [s, t] = stockStatus(p); return `<tr><td><b>${esc(p.name)}</b> <span class="muted small">${esc(p.pres)}</span></td><td class="r">${sellable(p)}</td>
        <td class="r">${expiredQty(p) || ""}</td><td class="r">${p.min}</td><td>${dmy(nextExpiry(p))}</td><td><span class="pill ${t}">${s}</span></td></tr>`; }).join("")}
    </tbody></table></div></div>
    <div class="panel"><h3>Lotes (ordenados por vencimiento)</h3><div class="table-wrap"><table><thead><tr><th>Producto</th><th>Lote</th><th>Vence</th><th class="r">Saldo</th><th class="r">Costo unit.</th><th>Situación</th></tr></thead><tbody>
      ${lots.map(({ p, l }) => `<tr><td>${esc(p.name)}</td><td>${esc(l.lot)}</td><td>${dmy(l.expiry)}</td><td class="r">${l.qty}</td><td class="r">${l.cost.toFixed(2)}</td><td>${expiryPill(l.expiry)}</td></tr>`).join("") || `<tr><td colspan="6" class="empty">Sin lotes.</td></tr>`}
    </tbody></table></div></div>`;
  $("#in").addEventListener("click", entryForm);
}
function entryForm() {
  modal(`<h3>Ingreso de mercadería</h3><p class="small muted">Registre el stock que llega (compra, bonificación o inventario inicial) con su lote y vencimiento.</p>
    <label>Producto *</label><select id="pp">${db.products.map((p) => `<option value="${esc(p.id)}">${esc(p.name)} — ${esc(p.pres)}</option>`).join("")}</select>
    <div class="row"><div><label>Lote *</label><input id="lt" placeholder="Número impreso en la caja"></div><div><label>Vencimiento *</label><input id="ex" type="date" value="${dayISO(365)}"></div></div>
    <div class="row"><div><label>Cantidad (unidades) *</label><input id="qt" type="number" min="1" value="50"></div><div><label>Costo unitario (S/)</label><input id="ct" type="number" step="0.01" min="0" value="0.50"></div></div>
    <div class="foot"><button class="btn" data-close>Cancelar</button><button class="btn primary" id="ok">Registrar ingreso</button></div>`, (bg) => {
    bg.querySelector("#lt").focus();
    bg.querySelector("#ok").addEventListener("click", () => {
      const p = product(bg.querySelector("#pp").value), lot = bg.querySelector("#lt").value.trim(), ex = bg.querySelector("#ex").value;
      const qty = Math.floor(Number(bg.querySelector("#qt").value || 0)), cost = Number(bg.querySelector("#ct").value || 0);
      if (!lot || !ex || qty <= 0) return toast("Complete lote, vencimiento y una cantidad mayor que 0.");
      if (daysTo(ex) < 0) return toast("No se puede ingresar un lote ya vencido.");
      const same = p.lots.find((l) => l.lot === lot && l.expiry === ex);
      if (same) same.qty += qty; else p.lots.push({ lot, expiry: ex, qty, cost });
      save(); bg.remove(); toast(`Ingresadas ${qty} und. de ${p.name}`); viewInventory();
    });
  });
}

/* ------------------------------------------------------------------ caja */
function viewCash() {
  const since = db.cash.opened, list = db.sales.filter((s) => s.status === "OK" && s.date >= since);
  const by = Object.fromEntries(METHODS.map((m) => [m, list.filter((s) => s.method === m).reduce((a, s) => a + s.total, 0)]));
  const expected = db.cash.fund + by.Efectivo;
  $("#view").innerHTML = head("💵", "g-green", "Caja", "Fondo inicial, cobros por medio de pago, efectivo esperado y arqueo de cierre.",
    `<button class="btn danger" id="close">🔒 Arqueo y cierre</button>`) + `
    <div class="tiles"><div class="tile"><div class="t">Caja</div><div class="v">${esc(db.cash.number)}</div><div class="small muted">Abierta ${dmy(since)} ${since.slice(11, 16)}</div></div>
      <div class="tile purple"><div class="t">Fondo inicial</div><div class="v">${money(db.cash.fund)}</div></div>
      <div class="tile"><div class="t">Cobros</div><div class="v">${list.length}</div></div>
      <div class="tile green"><div class="t">Efectivo esperado en el cajón</div><div class="v">${money(expected)}</div></div></div>
    <div class="grid2"><div class="panel"><h3>Cobros por medio de pago</h3><div class="table-wrap"><table><thead><tr><th>Medio</th><th class="r">Total</th></tr></thead><tbody>
      ${METHODS.map((m) => `<tr><td>${m}</td><td class="r"><b>${money(by[m])}</b></td></tr>`).join("")}</tbody></table></div></div>
      <div class="panel"><h3>Cierres anteriores</h3>${db.cash.closed.slice(-5).reverse().map((c) =>
        `<div style="padding:5px 0">${esc(c.number)} · contado ${money(c.counted)} · <span class="pill ${c.diff === 0 ? "ok" : "bad"}">${c.diff === 0 ? "Cuadró" : (c.diff > 0 ? "Sobró " : "Faltó ") + money(Math.abs(c.diff))}</span></div>`).join("") || `<p class="muted">Aún no cerró ninguna caja en la demo.</p>`}</div></div>
    <div class="panel"><h3>Movimientos de esta caja</h3><div class="table-wrap"><table><thead><tr><th>Hora</th><th>Tipo</th><th>Medio</th><th class="r">Importe</th><th>Venta</th></tr></thead><tbody>
      ${list.slice().reverse().map((s) => `<tr><td>${dmy(s.date)} ${s.date.slice(11, 16)}</td><td>Cobro de venta</td><td>${esc(s.method)}</td><td class="r">+${s.total.toFixed(2)}</td><td>${esc(s.number)}</td></tr>`).join("") || `<tr><td colspan="5" class="empty">Aún no hay cobros en esta caja: haga una venta en el Punto de venta.</td></tr>`}
    </tbody></table></div></div>`;
  $("#close").addEventListener("click", () => modal(`<h3>Arqueo y cierre de ${esc(db.cash.number)}</h3><p>Efectivo esperado: <b>${money(expected)}</b></p>
    <label>Efectivo contado en el cajón (S/)</label><input id="cnt" type="number" step="0.1" min="0" value="${expected.toFixed(2)}"><p id="df"></p>
    <div class="foot"><button class="btn" data-close>Cancelar</button><button class="btn danger" id="ok">Cerrar caja</button></div>`, (bg) => {
    const cnt = bg.querySelector("#cnt"), upd = () => { const d = round2(Number(cnt.value || 0) - expected);
      bg.querySelector("#df").innerHTML = d === 0 ? `<span class="pill ok">Cuadra</span>` : `<span class="pill bad">${d > 0 ? "Sobrante" : "Faltante"} ${money(Math.abs(d))}</span>`; };
    cnt.addEventListener("input", upd); upd();
    bg.querySelector("#ok").addEventListener("click", () => {
      const counted = Number(cnt.value || 0);
      db.cash.closed.push({ number: db.cash.number, counted, diff: round2(counted - expected) });
      const n = Number(db.cash.number.slice(3)) + 1, now = new Date();
      db.cash = { ...db.cash, number: `CJ-${String(n).padStart(6, "0")}`, opened: `${dayISO()}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`, fund: 150 };
      save(); bg.remove(); toast("Caja cerrada. Se abrió una caja nueva con fondo S/ 150.00"); viewCash();
    });
  }));
}

/* ------------------------------------------------------------------ inicio */
if (sessionStorage.getItem("fp_demo_in")) startApp(); else showLogin();
