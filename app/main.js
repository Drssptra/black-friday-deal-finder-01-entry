// The deal finder: hash routes, live search and filters, sorting.
//   #/            the board, with search + filters that work
//   #/deal/<id>   one deal, with its verdict and its source
//
// window.__shotReady is false while a page renders and true once it is on
// screen, so a screenshot script knows when to capture.

import { deals, discountPct, saveAmount } from "./data.js";
import { dealView, listView, missingView, rows } from "./views.js";

const app = document.getElementById("app");

const state = { q: "", cat: "", store: "", min: 0, verdict: "", sort: "off" };

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let list = deals.filter((d) => {
    if (state.cat && d.category !== state.cat) return false;
    if (state.store && d.store !== state.store) return false;
    if (state.verdict && d.verdict !== state.verdict) return false;
    if (discountPct(d) < state.min) return false;
    if (q && !(d.title + " " + d.store + " " + d.category).toLowerCase().includes(q)) return false;
    return true;
  });
  if (state.sort === "off") list.sort((a, b) => discountPct(b) - discountPct(a) || saveAmount(b) - saveAmount(a));
  else if (state.sort === "save") list.sort((a, b) => saveAmount(b) - saveAmount(a));
  else if (state.sort === "price") list.sort((a, b) => a.price - b.price);
  else if (state.sort === "name") list.sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

function renderList() {
  const shown = applyFilters();
  app.innerHTML = listView(deals, { ...state, shown });
  const count = document.getElementById("count");
  count.textContent = `Showing ${shown.length} of ${deals.length} deals · checked 27 Nov 2026, 13:30 WIB · prices change hourly, re-check at the store`;
  const grid = document.getElementById("deals");
  const refresh = () => {
    const next = applyFilters();
    grid.innerHTML = rows(next);
    count.textContent = `Showing ${next.length} of ${deals.length} deals · checked 27 Nov 2026, 13:30 WIB · prices change hourly, re-check at the store`;
  };
  document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value; refresh(); });
  document.getElementById("f-cat").addEventListener("change", (e) => { state.cat = e.target.value; refresh(); });
  document.getElementById("f-store").addEventListener("change", (e) => { state.store = e.target.value; refresh(); });
  document.getElementById("f-min").addEventListener("change", (e) => { state.min = Number(e.target.value); refresh(); });
  document.getElementById("f-verdict").addEventListener("change", (e) => { state.verdict = e.target.value; refresh(); });
  document.getElementById("f-sort").addEventListener("change", (e) => { state.sort = e.target.value; refresh(); });
}

function render() {
  window.__shotReady = false;
  const match = location.hash.match(/^#\/deal\/([^/?]+)/);
  if (match) {
    const found = deals.find((d) => d.id === decodeURIComponent(match[1]));
    document.title = `${found ? found.title : "Not found"} | Black Friday Deal Board`;
    app.innerHTML = found ? dealView(found, deals) : missingView();
  } else {
    document.title = "Black Friday Deal Board 2026 — 45 real deals, checked 27 Nov";
    renderList();
  }
  window.scrollTo(0, 0);
  window.__shotReady = true;
}

window.addEventListener("hashchange", render);
render();
