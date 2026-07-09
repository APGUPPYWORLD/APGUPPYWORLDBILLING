/* AP GUPPY WORLD — API layer
 * Live:  POST JSON string to the Apps Script /exec URL (text/plain => no CORS preflight).
 * Demo:  in-memory sample data so the app is fully usable before wiring up Sheets.
 */
window.API = (function () {

  function call(action, data) {
    var url = window.getApiUrl();
    if (!url) return Promise.resolve(DEMO.route(action, data || {}));
    return fetch(url, { method: "POST", body: JSON.stringify({ action: action, data: data || {} }) })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.error) throw new Error(j.error); return j; });
  }

  // ---- demo store ----
  function iso(d) {
    var z = function (x) { return (x < 10 ? "0" : "") + x; };
    return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
  }
  function daysAgo(n) { var d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
  function demoStamp() {
    var d = new Date(), z = function (x) { return (x < 10 ? "0" : "") + x; };
    return z(d.getDate()) + "-" + z(d.getMonth() + 1) + "-" + d.getFullYear() + " " + z(d.getHours()) + ":" + z(d.getMinutes());
  }

  var DEMO = (function () {
    var couriers = ["Professional Courier", "DTDC", "ST Courier", "Direct Pickup", "Home Delivery"];
    var gp = [];
    var customers = [];
    var bills = [];
    function b(sno, date, name, mobile, loc, items, price, paid, courier, status, notes, cost, profit) {
      return { SNO: sno, Date: date, CustomerName: name, Mobile: mobile, Location: loc,
        BoughtItems: items, PriceDetails: price, Paid: paid, Courier: courier,
        Status: status, Notes: notes, Cost: cost, Profit: profit };
    }
    var seq = 0;

    function out(x) {
      return { sno: x.SNO, date: x.Date, name: x.CustomerName, mobile: x.Mobile, location: x.Location,
        items: x.BoughtItems, priceDetails: x.PriceDetails, paid: +x.Paid, courier: x.Courier,
        status: x.Status, notes: x.Notes, cost: +x.Cost, profit: +x.Profit };
    }
    function stats(mobile) {
      var bs = bills.filter(function (x) { return String(x.Mobile) === mobile; });
      var total = 0, last = "";
      bs.forEach(function (x) { total += +x.Paid; if (x.Date > last) last = x.Date; });
      return { orders: bs.length, total: total, last: last, bills: bs };
    }

    var route = function (action, d) {
      var today = iso(new Date()), month = today.substring(0, 7);
      switch (action) {
        case "dashboard": {
          var t = { s: 0, p: 0 }, m = { s: 0, p: 0 };
          bills.forEach(function (x) {
            if (x.Date === today) { t.s += +x.Paid; t.p += +x.Profit; }
            if (x.Date.substring(0, 7) === month) { m.s += +x.Paid; m.p += +x.Profit; }
          });
          return { todaySales: t.s, todayProfit: t.p, monthSales: m.s, monthProfit: m.p,
            totalCustomers: customers.length, totalOrders: bills.length,
            recent: bills.slice().reverse().slice(0, 8).map(out), demo: true };
        }
        case "saveBill": {
          if (d.mobile && !customers.some(function (c) { return c.Mobile === d.mobile; }))
            customers.push({ Mobile: d.mobile, Name: d.name, Location: d.location });
          var sno = ++seq;
          bills.push(b(sno, d.date || today, d.name, d.mobile, d.location, d.items, d.priceDetails,
            +d.paid || 0, d.courier, d.status, d.notes, +d.cost || 0, +d.profit || 0));
          return { ok: true, sno: sno, demo: true };
        }
        case "getBill": {
          var f = bills.filter(function (x) { return String(x.SNO) === String(d.sno); })[0];
          return f ? { found: true, bill: out(f) } : { found: false };
        }
        case "deleteBill": {
          bills = bills.filter(function (x) { return String(x.SNO) !== String(d.sno); });
          return { ok: true };
        }
        case "getCustomer": {
          var c = customers.filter(function (x) { return x.Mobile === String(d.mobile).trim(); })[0];
          if (!c) return { found: false };
          var st = stats(c.Mobile);
          return { found: true, mobile: c.Mobile, name: c.Name, location: c.Location,
            orders: st.orders, total: st.total, last: st.last,
            recent: st.bills.slice().reverse().slice(0, 5).map(function (x) {
              return { sno: x.SNO, date: x.Date, paid: +x.Paid, status: x.Status }; }) };
        }
        case "listCustomers": {
          var q = (d.q || "").toLowerCase();
          var list = customers.map(function (c) {
            var st = stats(c.Mobile);
            return { mobile: c.Mobile, name: c.Name, location: c.Location,
              orders: st.orders, total: st.total, last: st.last };
          });
          if (q) list = list.filter(function (c) {
            return [c.name, c.mobile, c.location].join(" ").toLowerCase().indexOf(q) > -1; });
          list.sort(function (a, b) { return a.name.localeCompare(b.name); });
          return { customers: list };
        }
        case "customerTimeline": {
          var cust = route("getCustomer", { mobile: d.mobile });
          var st = stats(String(d.mobile).trim());
          return { customer: cust, bills: st.bills.map(out).reverse(),
            summary: { orders: st.orders, total: st.total, last: st.last } };
        }
        case "updateCustomer": {
          var old = String(d.oldMobile || d.mobile).trim();
          customers.forEach(function (c) {
            if (c.Mobile === old) { c.Mobile = d.mobile; c.Name = d.name; c.Location = d.location; } });
          return { ok: true };
        }
        case "listBills": {
          var qq = (d.q || "").toLowerCase();
          var bl = bills.slice().reverse().map(out);
          if (qq) bl = bl.filter(function (x) {
            return [x.name, x.mobile, x.location, x.items].join(" ").toLowerCase().indexOf(qq) > -1; });
          return { bills: bl.slice(0, d.limit || 50) };
        }
        case "gpList": return { items: gp.slice() };
        case "addGP": gp.push({ Code: d.code, Name: d.name, Price: d.price, Notes: d.notes }); return { ok: true };
        case "updateGP": {
          var key = String(d.oldCode != null ? d.oldCode : d.code);
          gp.forEach(function (x) { if (String(x.Code) === key) { x.Code = d.code; x.Name = d.name; x.Price = d.price; x.Notes = d.notes; } });
          return { ok: true };
        }
        case "deleteGP": gp = gp.filter(function (x) { return String(x.Code) !== String(d.code); }); return { ok: true };
        case "appendNote": {
          var hn = bills.filter(function (x) { return String(x.SNO) === String(d.sno); })[0];
          if (!hn) return { ok: false };
          var line = "[" + demoStamp() + "] " + String(d.note || "").trim();
          hn.Notes = (hn.Notes ? hn.Notes + "\n" : "") + line;
          return { ok: true, notes: hn.Notes };
        }
        case "updateStatus": {
          var hs = bills.filter(function (x) { return String(x.SNO) === String(d.sno); })[0];
          if (!hs) return { ok: false };
          hs.Status = d.status || "";
          var l2 = "[" + demoStamp() + "] Status changed to " + (d.status || "—");
          hs.Notes = (hs.Notes ? hs.Notes + "\n" : "") + l2;
          return { ok: true, status: d.status };
        }
        case "snapshot":
          return { version: 1, exportedAt: new Date().toISOString(),
            bills: bills.slice(), customers: customers.slice(), varieties: gp.slice(), couriers: couriers.slice() };
        case "restore": {
          var snap = d.snapshot || d;
          if (snap.bills) { bills = snap.bills.slice(); seq = bills.reduce(function (m, x) { return Math.max(m, +x.SNO || 0); }, 0); }
          if (snap.customers) customers = snap.customers.slice();
          if (snap.varieties) gp = snap.varieties.slice();
          if (snap.couriers) couriers = snap.couriers.slice();
          return { ok: true, bills: (snap.bills || []).length, customers: (snap.customers || []).length, varieties: (snap.varieties || []).length };
        }
        case "couriers": return { couriers: couriers.slice() };
        case "addCourier": if (couriers.indexOf(d.name) < 0) couriers.push(d.name); return { ok: true, couriers: couriers.slice() };
        case "deleteCourier": couriers = couriers.filter(function (x) { return x !== d.name; }); return { ok: true, couriers: couriers.slice() };
        case "reports": {
          var agg = function (pred) {
            var n = 0, s = 0, p = 0, cost = 0;
            bills.forEach(function (x) { if (pred(x)) { n++; s += +x.Paid; p += +x.Profit; cost += +x.Cost; } });
            return { n: n, sales: s, profit: p, cost: cost };
          };
          var bm = {}, sc = {}, cm = {};
          bills.forEach(function (x) {
            var ym = x.Date.substring(0, 7);
            bm[ym] = bm[ym] || { ym: ym, n: 0, sales: 0, profit: 0 };
            bm[ym].n++; bm[ym].sales += +x.Paid; bm[ym].profit += +x.Profit;
            sc[x.Status] = (sc[x.Status] || 0) + 1;
            cm[x.Mobile] = cm[x.Mobile] || { name: x.CustomerName, mobile: x.Mobile, orders: 0, total: 0 };
            cm[x.Mobile].orders++; cm[x.Mobile].total += +x.Paid;
          });
          return {
            daily: agg(function (x) { return x.Date === today; }),
            monthly: agg(function (x) { return x.Date.substring(0, 7) === month; }),
            overall: agg(function () { return true; }),
            byMonth: Object.keys(bm).sort().map(function (k) { return bm[k]; }),
            statusCounts: sc,
            top: Object.keys(cm).map(function (k) { return cm[k]; }).sort(function (a, b) { return b.total - a.total; }).slice(0, 8)
          };
        }
        case "importBills": {
          var imported = 0, skipped = 0;
          (d.rows || []).forEach(function (r) {
            var dup = bills.some(function (x) {
              return String(x.Date) === String(r.date) && String(x.Mobile) === String(r.mobile) &&
                (+x.Paid) === (+r.paid || 0) && String(x.BoughtItems) === String(r.items || "");
            });
            if (dup) { skipped++; return; }
            route("saveBill", r); imported++;
          });
          return { ok: true, imported: imported, skipped: skipped };
        }
        default: return { error: "demo: unknown " + action };
      }
    };
    return { route: route };
  })();

  return { call: call };
})();
