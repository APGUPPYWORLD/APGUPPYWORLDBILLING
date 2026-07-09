/* AP GUPPY WORLD — app router */
window.App = (function () {

  function setActive(view) {
    document.querySelectorAll("#menu a").forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("data-view") === view);
    });
  }

  function closeSidebar() {
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("scrim").classList.remove("show");
  }

  // routes: #dashboard  #billing  #customers  #reports  #varieties  #settings
  //         #customer/<mobile>   #bill/<sno>[?print=1]   #search/<q>
  function route() {
    var raw = (location.hash || "#dashboard").slice(1);
    var query = "";
    var qIdx = raw.indexOf("?");
    if (qIdx > -1) { query = raw.slice(qIdx + 1); raw = raw.slice(0, qIdx); }
    var parts = raw.split("/");
    var view = parts[0] || "dashboard";
    var arg = parts.slice(1).join("/");
    closeSidebar();

    switch (view) {
      case "dashboard": setActive("dashboard"); Views.dashboard(); break;
      case "billing":   setActive("billing");   Views.billing(); break;
      case "customers": setActive("customers"); Views.customers(); break;
      case "customer":  setActive("customers"); Views.customerProfile(decodeURIComponent(arg)); break;
      case "reports":   setActive("reports");   Views.reports(); break;
      case "varieties": setActive("varieties"); Views.varieties(); break;
      case "settings":  setActive("settings");  Views.settings(); break;
      case "bill":      setActive("billing");   Views.billView(arg, query.indexOf("print=1") > -1); break;
      case "search":    setActive("");          Views.search(decodeURIComponent(arg)); break;
      default:          setActive("dashboard"); Views.dashboard();
    }
  }

  function refreshConn() {
    // sidebar indicator removed; connection status now lives in Settings only
  }

  function wireGlobalSearch() {
    var input = document.getElementById("globalSearch");
    var pop = document.getElementById("searchPop");
    var t;

    function render(cs, bs, q) {
      var html = "";
      if (cs.length) {
        html += '<div class="sp-head">Customers</div>' + cs.slice(0, 4).map(function (c) {
          return '<div class="sp-item" data-hash="#customer/' + encodeURIComponent(c.mobile) + '">' +
            '<div class="sp-ic" style="background:var(--g-teal)"><i class="bi bi-person"></i></div>' +
            "<div><div><b>" + UI.esc(c.name || "—") + "</b></div><div class='muted small'>" + UI.esc(c.mobile) +
            (c.location ? " · " + UI.esc(c.location) : "") + "</div></div></div>";
        }).join("");
      }
      if (bs.length) {
        html += '<div class="sp-head">Bills</div>' + bs.slice(0, 4).map(function (b) {
          return '<div class="sp-item" data-hash="#bill/' + b.sno + '">' +
            '<div class="sp-ic" style="background:var(--g-blue)"><i class="bi bi-receipt"></i></div>' +
            "<div><div><b>#" + b.sno + " · " + UI.esc(b.name || "—") + "</b></div>" +
            "<div class='muted small'>" + UI.dmy(b.date) + " · " + UI.money(b.paid) + "</div></div></div>";
        }).join("");
      }
      html += '<div class="sp-item" data-hash="#search/' + encodeURIComponent(q) + '" style="color:var(--blue);font-weight:600">' +
        '<div class="sp-ic" style="background:var(--g-cyan)"><i class="bi bi-search"></i></div>See all results for “' + UI.esc(q) + '”</div>';
      pop.innerHTML = html || '<div class="empty small">No matches.</div>';
      pop.classList.add("show");
      pop.querySelectorAll("[data-hash]").forEach(function (it) {
        it.addEventListener("click", function () {
          location.hash = it.getAttribute("data-hash"); pop.classList.remove("show"); input.value = "";
        });
      });
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      clearTimeout(t);
      if (q.length < 2) { pop.classList.remove("show"); return; }
      t = setTimeout(function () {
        Promise.all([API.call("listCustomers", { q: q }), API.call("listBills", { q: q, limit: 8 })])
          .then(function (r) { render(r[0].customers || [], r[1].bills || [], q); });
      }, 250);
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && input.value.trim()) {
        location.hash = "#search/" + encodeURIComponent(input.value.trim());
        pop.classList.remove("show"); input.blur();
      }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search")) pop.classList.remove("show");
    });
  }

  function init() {
    document.getElementById("todayLabel").textContent = UI.dmy(UI.todayISO());
    refreshConn();
    wireGlobalSearch();

    document.getElementById("hamb").addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("open");
      document.getElementById("scrim").classList.toggle("show");
    });
    document.getElementById("scrim").addEventListener("click", closeSidebar);

    var imp = document.getElementById("importHdr");
    if (imp) imp.addEventListener("click", function () { Views.importExcel(); });

    // global keyboard: "/" focuses search, Alt+N starts a new bill
    document.addEventListener("keydown", function (e) {
      var tag = (e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable;
      if (e.key === "/" && !typing) { e.preventDefault(); document.getElementById("globalSearch").focus(); }
      if (e.altKey && (e.key === "n" || e.key === "N")) { e.preventDefault(); location.hash = "#billing"; }
    });

    window.addEventListener("hashchange", route);
    if (!location.hash) location.hash = "#dashboard";
    route();
  }

  function reload() { route(); }

  return { init: init, refreshConn: refreshConn, reload: reload };
})();

document.addEventListener("DOMContentLoaded", App.init);
