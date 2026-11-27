// Rendering for the deal board: cards, the filterable list, and one deal's page.
// All prices come from data.js; nothing here fetches the network.

import { CHECKED_LABEL, discountPct, saveAmount } from "./data.js";

const VERDICTS = {
  "new-low": { label: "NEW LOW", cls: "v-new", hint: "Reported all-time low" },
  strong: { label: "STRONG DEAL", cls: "v-strong", hint: "40%+ off" },
  good: { label: "GOOD PRICE", cls: "v-good", hint: "25–39% off" },
  decent: { label: "DECENT", cls: "v-decent", hint: "15–24% off" },
  routine: { label: "ROUTINE SALE", cls: "v-routine", hint: "Under 15% off" },
};

export function money(n) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/\.00$/, "");
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function verdictBadge(d) {
  const v = VERDICTS[d.verdict] || VERDICTS.decent;
  return `<span class="verdict ${v.cls}" title="${esc(v.hint)}">${v.label}</span>`;
}

export function card(d) {
  const pct = discountPct(d);
  const save = saveAmount(d);
  return `<article class="card" data-id="${esc(d.id)}">
    <div class="card-top"><span class="cat">${esc(d.category)}</span><span class="store">${esc(d.store)}</span></div>
    <h3><a href="#/deal/${esc(d.id)}">${esc(d.title)}</a></h3>
    <div class="prices"><span class="price">${money(d.price)}</span><span class="was">${money(d.was)}</span><span class="off">−${pct}%</span></div>
    <div class="save">You save ${money(save)}</div>
    <div class="card-verdict">${verdictBadge(d)}</div>
    <p class="note">${esc(d.note)}</p>
    <div class="card-foot"><span class="checked">Checked ${esc(CHECKED_LABEL)}</span><a class="shop" href="${esc(d.url)}" target="_blank" rel="noopener">View at ${esc(d.store)} →</a></div>
  </article>`;
}

export function rows(list) {
  if (!list.length) return `<p class="empty">No deals match those filters. Try clearing the search or lowering the minimum discount.</p>`;
  return list.map(card).join("");
}

export function statsBar(list) {
  const total = list.length;
  const maxOff = total ? Math.max(...list.map(discountPct)) : 0;
  const totalSave = list.reduce((s, d) => s + saveAmount(d), 0);
  const newLows = list.filter((d) => d.verdict === "new-low").length;
  const stores = [...new Set(list.map((d) => d.store))].length;
  return `<div class="stats">
    <div class="stat"><b>${total}</b><span>real deals checked</span></div>
    <div class="stat"><b>${newLows}</b><span>reported all-time lows</span></div>
    <div class="stat"><b>−${maxOff}%</b><span>deepest cut</span></div>
    <div class="stat"><b>${money(totalSave)}</b><span>total savings on this board</span></div>
    <div class="stat"><b>${stores}</b><span>stores</span></div>
  </div>`;
}

export function listView(all, opts) {
  const cats = [...new Set(all.map((d) => d.category))].sort();
  const stores = [...new Set(all.map((d) => d.store))].sort();
  return `<section class="hero">
    <p class="kicker">BLACK FRIDAY · 27 NOV — CYBER MONDAY · 30 NOV 2026</p>
    <h1>Black Friday Deal Board</h1>
    <p class="lede">Every deal below was checked by hand against a store or a deals source on 27 November 2026. Each card shows the sale price, the usual price, the saving — and an honest verdict on whether it is really a deal, with the evidence.</p>
    ${statsBar(all)}
  </section>
  <section class="filters" aria-label="Filter deals">
    <input id="q" type="search" placeholder="Search deals — try “AirPods”, “OLED”, “Dyson”…" value="${esc(opts.q || "")}" aria-label="Search deals">
    <select id="f-cat" aria-label="Category"><option value="">All categories</option>${cats.map((c) => `<option${opts.cat === c ? " selected" : ""}>${esc(c)}</option>`).join("")}</select>
    <select id="f-store" aria-label="Store"><option value="">All stores</option>${stores.map((s) => `<option${opts.store === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>
    <select id="f-min" aria-label="Minimum discount">
      <option value="0"${opts.min === 0 ? " selected" : ""}>Any discount</option>
      <option value="25"${opts.min === 25 ? " selected" : ""}>25% off or more</option>
      <option value="40"${opts.min === 40 ? " selected" : ""}>40% off or more</option>
      <option value="50"${opts.min === 50 ? " selected" : ""}>50% off or more</option>
    </select>
    <select id="f-verdict" aria-label="Verdict">
      <option value="">Any verdict</option>
      <option value="new-low"${opts.verdict === "new-low" ? " selected" : ""}>New lows only</option>
      <option value="strong"${opts.verdict === "strong" ? " selected" : ""}>Strong deals only</option>
      <option value="routine"${opts.verdict === "routine" ? " selected" : ""}>Routine sales (the traps)</option>
    </select>
    <select id="f-sort" aria-label="Sort by">
      <option value="off"${opts.sort === "off" ? " selected" : ""}>Biggest % off</option>
      <option value="save"${opts.sort === "save" ? " selected" : ""}>Biggest $ saving</option>
      <option value="price"${opts.sort === "price" ? " selected" : ""}>Lowest price</option>
      <option value="name"${opts.sort === "name" ? " selected" : ""}>A–Z</option>
    </select>
  </section>
  <p class="count" id="count"></p>
  <section class="deals" id="deals">${rows(opts.shown)}</section>
  <section class="method">
    <h2>How this board checks a deal</h2>
    <ol>
      <li><b>Read the price where it is sold.</b> Every price was read from the store's own sale page, a retailer release, or a deals roundup that names the store and the price — on 27 November 2026. The source is printed on every deal page.</li>
      <li><b>Compare against the real usual price.</b> A discount only counts against the price the store actually charged before the sale. Where a store raised its list price first, the verdict says so.</li>
      <li><b>Give a verdict, not just a percentage.</b> <span class="verdict v-new">NEW LOW</span> means a deals site reported an all-time low. <span class="verdict v-strong">STRONG DEAL</span> is 40%+ off a current model. <span class="verdict v-routine">ROUTINE SALE</span> is under 15% off — a red sticker, not a deal.</li>
      <li><b>Say when it was checked.</b> Prices move hourly on Black Friday. Every deal carries its check time; re-check before you buy.</li>
    </ol>
    <h2>Sale windows</h2>
    <table class="windows">
      <tr><th>Store</th><th>Black Friday sale</th><th>Cyber Monday</th></tr>
      <tr><td>Amazon</td><td>19–30 Nov (Black Friday Week)</td><td>30 Nov</td></tr>
      <tr><td>Best Buy</td><td>19–28 Nov, stores 6 a.m.–10 p.m. 27 Nov</td><td>29–30 Nov (Cyber Sunday &amp; Monday)</td></tr>
      <tr><td>Walmart</td><td>23–29 Nov (online from 23 Nov)</td><td>30 Nov–2 Dec</td></tr>
    </table>
    <p class="sources">Sources read for this board (27 Nov 2026): BeeBulletin Black Friday tech deals (Best Buy release 17 Nov; Costco page; 9to5Toys 20–23 Nov); Tom's Guide / Gizmodo via TechResearchOnline (25 Nov); 9to5Google deals; Yahoo Shopping Black Friday roundup (22 Nov); ComicBook Walmart roundup; Passion for Savings Walmart ad; Top10-Best top 10 (checked 6–11 Nov). Adobe's 2026 forecast: electronics peak ~30% off on Cyber Monday, TVs ~23% off on Black Friday.</p>
  </section>`;
}

export function dealView(d, all) {
  const pct = discountPct(d);
  const save = saveAmount(d);
  const v = VERDICTS[d.verdict] || VERDICTS.decent;
  const same = all.filter((x) => x.id !== d.id && (x.category === d.category || x.store === d.store)).slice(0, 4);
  return `<p class="back"><a href="#/">← All ${all.length} deals</a></p>
  <article class="detail">
    <div class="detail-top"><span class="cat">${esc(d.category)}</span><span class="store">${esc(d.store)}</span>${verdictBadge(d)}</div>
    <h1>${esc(d.title)}</h1>
    <div class="detail-prices"><span class="price big">${money(d.price)}</span><span class="was big">${money(d.was)}</span><span class="off big">−${pct}%</span></div>
    <p class="save big">You save ${money(save)} (${pct}% off the usual price of ${money(d.was)}).</p>
    <h2>Is it really a deal?</h2>
    <p><b>${v.label} — ${esc(v.hint)}.</b> ${esc(d.note)}</p>
    <h2>Where the price was read</h2>
    <p>Checked ${esc(CHECKED_LABEL)} (06:30 UTC). Source: ${esc(d.source)}. Prices on Black Friday move hourly — open the store link to confirm the price is still live before you buy.</p>
    <p><a class="shop big" href="${esc(d.url)}" target="_blank" rel="noopener">View this product at ${esc(d.store)} →</a></p>
    <h2>More in ${esc(d.category)} or at ${esc(d.store)}</h2>
    <div class="deals">${same.map(card).join("")}</div>
  </article>`;
}

export function missingView() {
  return `<p class="empty">That deal is not on this board. <a href="#/">Back to all deals</a>.</p>`;
}
