/**
 * AP GUPPY WORLD — Backend (Google Apps Script + Google Sheets)
 * Deploy: Extensions ▸ Apps Script ▸ paste ▸ Deploy ▸ New deployment
 *         Type: Web app · Execute as: Me · Who has access: Anyone
 * Copy the /exec URL into the app's Settings page.
 *
 * The frontend POSTs a JSON string { action, data }.  We read it from
 * e.postData.contents (Content-Type text/plain), so there is NO CORS preflight.
 */

var SHEETS = {
  Bills:     ['SNO','Date','CustomerName','Mobile','Location','BoughtItems','PriceDetails','Paid','Courier','Status','Notes','Cost','Profit','Timestamp'],
  Customers: ['Mobile','Name','Location','CreatedAt'],
  GPList:    ['Code','Name','Price','Notes'],
  Settings:  ['Key','Value']
};

var DEFAULT_COURIERS = ['Professional Courier','DTDC','ST Courier','Direct Pickup','Home Delivery'];

// ------------------------------------------------------------------ entry
function doPost(e) {
  var out;
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    out = route(body.action, body.data || {});
  } catch (err) {
    out = { error: String(err) };
  }
  return json(out);
}

function doGet(e) {
  // allows a quick browser sanity check + simple GET actions
  var action = (e && e.parameter && e.parameter.action) || 'ping';
  try { return json(route(action, e.parameter || {})); }
  catch (err) { return json({ error: String(err) }); }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function route(action, d) {
  switch (action) {
    case 'ping':             return { ok: true, app: 'AP GUPPY WORLD', time: new Date() };
    case 'dashboard':        return dashboard();
    case 'saveBill':         return saveBill(d);
    case 'getBill':          return getBill(d.sno);
    case 'deleteBill':       return deleteBill(d.sno);
    case 'getCustomer':      return getCustomer(d.mobile);
    case 'listCustomers':    return listCustomers(d.q || '');
    case 'customerTimeline': return customerTimeline(d.mobile);
    case 'updateCustomer':   return updateCustomer(d);
    case 'listBills':        return listBills(d.q || '', d.limit || 50);
    case 'gpList':           return gpList();
    case 'addGP':            return addGP(d);
    case 'updateGP':         return updateGP(d);
    case 'deleteGP':         return deleteGP(d.code);
    case 'appendNote':       return appendNote(d);
    case 'updateStatus':     return updateStatus(d);
    case 'snapshot':         return snapshot();
    case 'restore':          return restore(d);
    case 'couriers':         return { couriers: getCouriers() };
    case 'addCourier':       return addCourier(d.name);
    case 'deleteCourier':    return deleteCourier(d.name);
    case 'reports':          return reports();
    case 'importBills':      return importBills(d.rows || []);
    default:                 return { error: 'Unknown action: ' + action };
  }
}

// ------------------------------------------------------------------ sheet utils
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet(name) {
  var s = ss().getSheetByName(name);
  if (!s) {
    s = ss().insertSheet(name);
    s.appendRow(SHEETS[name]);
    if (name === 'Settings') s.appendRow(['couriers', DEFAULT_COURIERS.join(',')]);
  }
  // make sure header exists
  if (s.getLastRow() === 0) s.appendRow(SHEETS[name]);
  return s;
}

function readAll(name) {
  var s = sheet(name);
  var values = s.getDataRange().getValues();
  var head = values.shift() || SHEETS[name];
  return values.filter(function (r) { return r.join('') !== ''; })
    .map(function (r) {
      var o = {};
      head.forEach(function (h, i) { o[h] = r[i]; });
      return o;
    });
}

function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
function iso(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var s = String(v || '').trim();
  return s ? s.substring(0, 10) : '';
}
function todayISO() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }

// ------------------------------------------------------------------ dashboard
function dashboard() {
  var bills = readAll('Bills');
  var today = todayISO(), month = today.substring(0, 7);
  var td = { s: 0, p: 0 }, mo = { s: 0, p: 0 };
  bills.forEach(function (b) {
    var dt = iso(b.Date);
    if (dt === today) { td.s += num(b.Paid); td.p += num(b.Profit); }
    if (dt.substring(0, 7) === month) { mo.s += num(b.Paid); mo.p += num(b.Profit); }
  });
  var recent = bills.slice(-8).reverse().map(billOut);
  return {
    todaySales: td.s, todayProfit: td.p,
    monthSales: mo.s, monthProfit: mo.p,
    totalCustomers: readAll('Customers').length,
    totalOrders: bills.length,
    recent: recent
  };
}

function billOut(b) {
  return {
    sno: b.SNO, date: iso(b.Date), name: b.CustomerName, mobile: b.Mobile,
    location: b.Location, items: b.BoughtItems, priceDetails: b.PriceDetails,
    paid: num(b.Paid), courier: b.Courier, status: b.Status, notes: b.Notes,
    cost: num(b.Cost), profit: num(b.Profit)
  };
}

// ------------------------------------------------------------------ bills
function nextSno() {
  var s = sheet('Bills');
  var last = s.getLastRow();
  if (last <= 1) return 1;
  var prev = s.getRange(last, 1).getValue();
  return (parseInt(prev, 10) || last - 1) + 1;
}

function saveBill(d) {
  var mobile = String(d.mobile || '').trim();
  var name = String(d.name || '').trim();
  var location = String(d.location || '').trim();
  if (mobile) upsertCustomer(mobile, name, location);

  var sno = nextSno();
  sheet('Bills').appendRow([
    sno, d.date || todayISO(), name, mobile, location,
    d.items || '', d.priceDetails || '', num(d.paid), d.courier || '',
    d.status || '', d.notes || '', num(d.cost), num(d.profit), new Date()
  ]);
  return { ok: true, sno: sno };
}

function getBill(sno) {
  var bills = readAll('Bills');
  for (var i = 0; i < bills.length; i++) {
    if (String(bills[i].SNO) === String(sno)) return { found: true, bill: billOut(bills[i]) };
  }
  return { found: false };
}

function deleteBill(sno) {
  var s = sheet('Bills');
  var vals = s.getDataRange().getValues();
  for (var r = vals.length - 1; r >= 1; r--) {
    if (String(vals[r][0]) === String(sno)) { s.deleteRow(r + 1); return { ok: true }; }
  }
  return { ok: false };
}

function listBills(q, limit) {
  q = String(q || '').toLowerCase();
  var bills = readAll('Bills').map(billOut).reverse();
  if (q) bills = bills.filter(function (b) {
    return [b.name, b.mobile, b.location, b.items].join(' ').toLowerCase().indexOf(q) > -1;
  });
  return { bills: bills.slice(0, limit) };
}

// ------------------------------------------------------------------ customers
function upsertCustomer(mobile, name, location) {
  var s = sheet('Customers');
  var vals = s.getDataRange().getValues();
  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][0]).trim() === mobile) {
      if (name) s.getRange(r + 1, 2).setValue(name);
      if (location) s.getRange(r + 1, 3).setValue(location);
      return;
    }
  }
  s.appendRow([mobile, name, location, new Date()]);
}

function customerStats(mobile) {
  var bills = readAll('Bills').filter(function (b) { return String(b.Mobile).trim() === mobile; });
  var total = 0, last = '';
  bills.forEach(function (b) {
    total += num(b.Paid);
    var dt = iso(b.Date);
    if (dt > last) last = dt;
  });
  return { orders: bills.length, total: total, last: last, bills: bills };
}

function getCustomer(mobile) {
  mobile = String(mobile || '').trim();
  var cust = null, all = readAll('Customers');
  for (var i = 0; i < all.length; i++) {
    if (String(all[i].Mobile).trim() === mobile) { cust = all[i]; break; }
  }
  if (!cust) return { found: false };
  var st = customerStats(mobile);
  var recent = st.bills.slice(-5).reverse().map(function (b) {
    return { sno: b.SNO, date: iso(b.Date), paid: num(b.Paid), status: b.Status };
  });
  return {
    found: true, mobile: mobile, name: cust.Name || '', location: cust.Location || '',
    orders: st.orders, total: st.total, last: st.last, recent: recent
  };
}

function listCustomers(q) {
  q = String(q || '').toLowerCase();
  var custs = readAll('Customers').map(function (c) {
    var st = customerStats(String(c.Mobile).trim());
    return { mobile: c.Mobile, name: c.Name || '', location: c.Location || '',
             orders: st.orders, total: st.total, last: st.last };
  });
  if (q) custs = custs.filter(function (c) {
    return [c.name, c.mobile, c.location].join(' ').toLowerCase().indexOf(q) > -1;
  });
  custs.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  return { customers: custs };
}

function customerTimeline(mobile) {
  mobile = String(mobile || '').trim();
  var cust = getCustomer(mobile);
  var st = customerStats(mobile);
  var bills = st.bills.map(billOut).sort(function (a, b) { return b.date < a.date ? -1 : 1; });
  return { customer: cust, bills: bills, summary: { orders: st.orders, total: st.total, last: st.last } };
}

function updateCustomer(d) {
  var s = sheet('Customers');
  var vals = s.getDataRange().getValues();
  var old = String(d.oldMobile || d.mobile).trim();
  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][0]).trim() === old) {
      s.getRange(r + 1, 1, 1, 3).setValues([[String(d.mobile).trim(), d.name || '', d.location || '']]);
      return { ok: true };
    }
  }
  return { ok: false };
}

// ------------------------------------------------------------------ Fish Varieties
function gpList() { return { items: readAll('GPList') }; }

function addGP(d) {
  sheet('GPList').appendRow([d.code || '', d.name || '', d.price || '', d.notes || '']);
  return { ok: true };
}

function updateGP(d) {
  var s = sheet('GPList');
  var vals = s.getDataRange().getValues();
  var key = String(d.oldCode != null ? d.oldCode : d.code);
  for (var r = 1; r < vals.length; r++) {
    if (String(vals[r][0]) === key) {
      s.getRange(r + 1, 1, 1, 4).setValues([[d.code || '', d.name || '', d.price || '', d.notes || '']]);
      return { ok: true };
    }
  }
  return { ok: false };
}

function deleteGP(code) {
  var s = sheet('GPList');
  var vals = s.getDataRange().getValues();
  for (var r = vals.length - 1; r >= 1; r--) {
    if (String(vals[r][0]) === String(code)) { s.deleteRow(r + 1); return { ok: true }; }
  }
  return { ok: false };
}

// ------------------------------------------------------------------ notes / status history
function stamp() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MM-yyyy HH:mm');
}

function billRowIndex(sno) {
  var s = sheet('Bills');
  var vals = s.getDataRange().getValues();
  for (var r = 1; r < vals.length; r++) if (String(vals[r][0]) === String(sno)) return { s: s, row: r + 1, head: vals[0], values: vals[r] };
  return null;
}

function appendNote(d) {
  var hit = billRowIndex(d.sno);
  if (!hit) return { ok: false };
  var col = hit.head.indexOf('Notes') + 1;
  var existing = hit.s.getRange(hit.row, col).getValue();
  var line = '[' + stamp() + '] ' + String(d.note || '').trim();
  var updated = (existing ? existing + '\n' : '') + line;
  hit.s.getRange(hit.row, col).setValue(updated);
  return { ok: true, notes: updated };
}

function updateStatus(d) {
  var hit = billRowIndex(d.sno);
  if (!hit) return { ok: false };
  var sc = hit.head.indexOf('Status') + 1;
  var nc = hit.head.indexOf('Notes') + 1;
  hit.s.getRange(hit.row, sc).setValue(d.status || '');
  var existing = hit.s.getRange(hit.row, nc).getValue();
  var line = '[' + stamp() + '] Status changed to ' + (d.status || '—');
  hit.s.getRange(hit.row, nc).setValue((existing ? existing + '\n' : '') + line);
  return { ok: true, status: d.status };
}

// ------------------------------------------------------------------ backup / restore
function snapshot() {
  return {
    version: 1, exportedAt: new Date(),
    bills: readAll('Bills'), customers: readAll('Customers'),
    varieties: readAll('GPList'), couriers: getCouriers()
  };
}

function restore(d) {
  var snap = d.snapshot || d;
  function rewrite(name, rows, headers) {
    var s = sheet(name);
    s.clearContents();
    s.appendRow(headers);
    (rows || []).forEach(function (o) {
      s.appendRow(headers.map(function (h) { return o[h] != null ? o[h] : ''; }));
    });
  }
  if (snap.bills)     rewrite('Bills', snap.bills, SHEETS.Bills);
  if (snap.customers) rewrite('Customers', snap.customers, SHEETS.Customers);
  if (snap.varieties) rewrite('GPList', snap.varieties, SHEETS.GPList);
  if (snap.couriers)  setCouriers(snap.couriers);
  return { ok: true,
    bills: (snap.bills || []).length,
    customers: (snap.customers || []).length,
    varieties: (snap.varieties || []).length };
}

// ------------------------------------------------------------------ couriers
function getCouriers() {
  var rows = readAll('Settings');
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].Key === 'couriers') {
      return String(rows[i].Value || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    }
  }
  return DEFAULT_COURIERS.slice();
}

function setCouriers(list) {
  var s = sheet('Settings');
  var vals = s.getDataRange().getValues();
  for (var r = 1; r < vals.length; r++) {
    if (vals[r][0] === 'couriers') { s.getRange(r + 1, 2).setValue(list.join(',')); return; }
  }
  s.appendRow(['couriers', list.join(',')]);
}

function addCourier(name) {
  name = String(name || '').trim();
  var list = getCouriers();
  if (name && list.indexOf(name) === -1) { list.push(name); setCouriers(list); }
  return { ok: true, couriers: list };
}

function deleteCourier(name) {
  var list = getCouriers().filter(function (c) { return c !== name; });
  setCouriers(list);
  return { ok: true, couriers: list };
}

// ------------------------------------------------------------------ reports
function reports() {
  var bills = readAll('Bills');
  var today = todayISO(), month = today.substring(0, 7);
  var daily = agg(bills, function (b) { return iso(b.Date) === today; });
  var monthly = agg(bills, function (b) { return iso(b.Date).substring(0, 7) === month; });
  var overall = agg(bills, function () { return true; });

  var byMonthMap = {}, statusCounts = {}, custMap = {};
  bills.forEach(function (b) {
    var ym = iso(b.Date).substring(0, 7);
    if (ym) {
      byMonthMap[ym] = byMonthMap[ym] || { ym: ym, n: 0, sales: 0, profit: 0 };
      byMonthMap[ym].n++; byMonthMap[ym].sales += num(b.Paid); byMonthMap[ym].profit += num(b.Profit);
    }
    var st = b.Status || 'Other';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    var m = String(b.Mobile).trim();
    if (m) {
      custMap[m] = custMap[m] || { name: b.CustomerName, mobile: m, orders: 0, total: 0 };
      custMap[m].orders++; custMap[m].total += num(b.Paid);
    }
  });
  var byMonth = Object.keys(byMonthMap).sort().slice(-12).map(function (k) { return byMonthMap[k]; });
  var top = Object.keys(custMap).map(function (k) { return custMap[k]; })
    .sort(function (a, b) { return b.total - a.total; }).slice(0, 8);

  return { daily: daily, monthly: monthly, overall: overall,
           byMonth: byMonth, statusCounts: statusCounts, top: top };
}

function agg(bills, pred) {
  var n = 0, sales = 0, profit = 0, cost = 0;
  bills.forEach(function (b) {
    if (pred(b)) { n++; sales += num(b.Paid); profit += num(b.Profit); cost += num(b.Cost); }
  });
  return { n: n, sales: sales, profit: profit, cost: cost };
}

// ------------------------------------------------------------------ import
function importBills(rows) {
  var existing = readAll('Bills');
  function isDup(d) {
    return existing.some(function (b) {
      return iso(b.Date) === String(d.date) && String(b.Mobile).trim() === String(d.mobile).trim() &&
        num(b.Paid) === num(d.paid) && String(b.BoughtItems) === String(d.items || '');
    });
  }
  var imported = 0, skipped = 0;
  rows.forEach(function (d) {
    if (isDup(d)) { skipped++; return; }
    saveBill(d);
    existing.push({ Date: d.date, Mobile: d.mobile, Paid: d.paid, BoughtItems: d.items || '' });
    imported++;
  });
  return { ok: true, imported: imported, skipped: skipped };
}
