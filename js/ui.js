/* AP GUPPY WORLD — UI helpers */
window.UI = (function () {

  function money(n) {
    n = Number(n) || 0;
    return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ISO (yyyy-mm-dd) -> dd-mm-yyyy
  function dmy(iso) {
    if (!iso) return "—";
    var p = String(iso).substring(0, 10).split("-");
    if (p.length !== 3) return iso;
    return p[2] + "-" + p[1] + "-" + p[0];
  }

  function todayISO() {
    var d = new Date(), z = function (x) { return (x < 10 ? "0" : "") + x; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }

  var STATUS = {
    "completed":     ["b-completed", "Completed"],
    "pending":       ["b-pending", "Pending"],
    "replacement":   ["b-replacement", "Replacement"],
    "courier issue": ["b-courier", "Courier Issue"],
    "cancelled":     ["b-cancelled", "Cancelled"]
  };
  function badge(status) {
    var key = String(status || "").toLowerCase();
    var m = STATUS[key];
    if (!m) return '<span class="badge-s b-none">' + (esc(status) || "—") + "</span>";
    return '<span class="badge-s ' + m[0] + '">' + m[1] + "</span>";
  }

  function toast(msg, type) {
    var host = document.getElementById("toastHost");
    var el = document.createElement("div");
    el.className = "toast-c " + (type || "");
    var ic = type === "err" ? "x-circle-fill" : type === "info" ? "info-circle-fill" : "check-circle-fill";
    el.innerHTML = '<i class="bi bi-' + ic + '"></i><span>' + esc(msg) + "</span>";
    host.appendChild(el);
    setTimeout(function () {
      el.style.opacity = "0";
      el.style.transform = "translateX(30px)";
      el.style.transition = ".3s";
      setTimeout(function () { el.remove(); }, 300);
    }, 2600);
  }

  // modal: {title, icon, body(html), footer(html)} -> returns element; close via UI.closeModal()
  function modal(opts) {
    var host = document.getElementById("modalHost");
    host.innerHTML =
      '<div class="mask" id="mask">' +
        '<div class="modal-c" role="dialog" aria-modal="true">' +
          '<div class="mh"><i class="bi bi-' + (opts.icon || "window") + '" style="color:var(--cyan);font-size:20px"></i>' +
            "<h3>" + esc(opts.title || "") + '</h3>' +
            '<button class="icon-btn" data-close><i class="bi bi-x-lg"></i></button></div>' +
          '<div class="mb">' + (opts.body || "") + "</div>" +
          (opts.footer ? '<div class="mf">' + opts.footer + "</div>" : "") +
        "</div></div>";
    var mask = document.getElementById("mask");
    mask.addEventListener("click", function (e) {
      if (e.target === mask || e.target.closest("[data-close]")) closeModal();
    });
    document.addEventListener("keydown", escClose);
    return host;
  }
  function escClose(e) { if (e.key === "Escape") closeModal(); }
  function closeModal() {
    document.getElementById("modalHost").innerHTML = "";
    document.removeEventListener("keydown", escClose);
  }

  function loading(target, label) {
    target.innerHTML =
      '<div class="empty" style="padding:60px"><div class="spinner-border text-info" role="status"></div>' +
      '<div class="mt-2 muted">' + (label || "Loading…") + "</div></div>";
  }

  return { money: money, esc: esc, dmy: dmy, todayISO: todayISO, badge: badge,
           toast: toast, modal: modal, closeModal: closeModal, loading: loading };
})();
