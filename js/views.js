/* AP GUPPY WORLD — views */
window.Views = (function () {
  var M = UI.money, E = UI.esc, D = UI.dmy;
  function el() { return document.getElementById("view"); }
  function mount(html) { var v = el(); v.innerHTML = html; v.scrollTop = 0; return v; }

  /* ============================= DASHBOARD ============================= */
  function dashboard() {
    var v = el(); UI.loading(v, "Loading dashboard…");
    API.call("dashboard").then(function (d) {
      var head = '<div class="page-head"><div><h1>Dashboard</h1><div class="sub">Today & this month at a glance</div></div>' +
        '<a href="#billing" class="btn-grad"><i class="bi bi-plus-lg"></i> <span>New Bill</span></a></div>';

      if (!d.totalOrders) {
        mount(head +
          '<div class="card"><div class="empty" style="padding:56px 20px">' +
            '<i class="bi bi-clipboard-data"></i>' +
            '<div class="big">No data available</div>' +
            "Import your Excel file to get started." +
            '<div style="margin-top:16px"><button class="btn-grad" onclick="Views.importExcel()"><i class="bi bi-upload"></i> Import Excel</button></div>' +
          "</div></div>");
        return;
      }

      var cards = [
        ["blue", "cash-stack", "Today's Sales", M(d.todaySales)],
        ["green", "graph-up-arrow", "Today's Profit", M(d.todayProfit)],
        ["cyan", "calendar-month", "Monthly Sales", M(d.monthSales)],
        ["teal", "wallet2", "Monthly Profit", M(d.monthProfit)],
        ["purple", "people-fill", "Total Customers", d.totalCustomers],
        ["orange", "receipt", "Total Orders", d.totalOrders]
      ].map(function (c) {
        return '<div class="stat ' + c[0] + '"><div class="wave"></div>' +
          '<div class="ic"><i class="bi bi-' + c[1] + '"></i></div>' +
          '<div class="val num">' + c[3] + "</div><div class=\"lbl\">" + c[2] + "</div></div>";
      }).join("");

      var rows = (d.recent || []).map(function (b) {
        return "<tr>" +
          "<td>#" + b.sno + "</td><td>" + D(b.date) + "</td>" +
          "<td>" + (E(b.name) || "—") + "</td><td>" + (E(b.mobile) || "—") + "</td>" +
          '<td class="t-right num">' + M(b.paid) + "</td>" +
          "<td>" + UI.badge(b.status) + "</td><td>" + (E(b.courier) || "—") + "</td>" +
          '<td class="t-right"><button class="btn-ghost btn-xs" onclick="location.hash=\'#bill/' + b.sno + '\'">View</button></td>' +
          "</tr>";
      }).join("") || '<tr><td colspan="8" class="empty"><i class="bi bi-inbox"></i>No orders found.</td></tr>';

      mount(head +
        '<div class="stat-grid">' + cards + "</div>" +
        '<div class="card" style="margin-top:16px"><div class="card-h"><h2><i class="bi bi-clock-history"></i>Recent Orders</h2></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        "<th>S.No</th><th>Date</th><th>Customer</th><th>Mobile</th><th class=t-right>Paid</th><th>Status</th><th>Courier</th><th></th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div>"
      );
    }).catch(fail);
  }

  /* ============================= BILLING ============================= */
  function billing() {
    var today = UI.todayISO();
    var statuses = ["Completed", "Pending", "Replacement", "Courier Issue", "Cancelled"];
    // render instantly; couriers load into the datalist afterwards
    (function () {
      mount(
        '<div class="page-head"><div><h1>Billing</h1><div class="sub">Enter a bill — pricing stays manual · <span class="muted small">Ctrl+Enter to save</span></div></div>' +
          '<button class="btn-ghost" id="gpBtn"><i class="bi bi-water"></i> View Varieties</button></div>' +

        '<form id="billForm"><div class="bill-cols">' +

          // LEFT column
          '<div class="card"><div class="card-b">' +
            '<div class="section"><div class="section-t"><span class="n">1</span> Customer Information</div>' +
              '<div class="grid-2">' +
                '<div class="field hint"><label>Contact Number</label>' +
                  '<input class="inp" id="f_mobile" placeholder="Type mobile to auto-fill" autocomplete="off">' +
                  '<span class="tag" id="mobTag"></span></div>' +
                '<div class="field"><label>Date</label><input class="inp" type="date" id="f_date" value="' + today + '"></div>' +
                '<div class="field"><label>Customer Name</label><input class="inp" id="f_name" autocomplete="off"></div>' +
                '<div class="field"><label>Location</label><input class="inp" id="f_location" autocomplete="off"></div>' +
              "</div>" +
              '<div id="custFound"></div>' +
            "</div>" +

            '<div class="section"><div class="section-t"><span class="n">2</span> Order Information</div>' +
              '<div class="grid-2">' +
                '<div class="field"><label>Bought Items</label><textarea class="inp mono" id="f_items" rows="6" placeholder="AFR - 2 Pair&#10;JB - 1 Pair&#10;Oscar - 3"></textarea></div>' +
                '<div class="field"><label>Price Details</label><textarea class="inp mono" id="f_price" rows="6" placeholder="150 × 2 = 300&#10;180 × 1 = 180&#10;Courier = 100&#10;Total = 580"></textarea></div>' +
              "</div></div>" +

            '<div class="section"><div class="section-t"><span class="n">4</span> Notes</div>' +
              '<textarea class="inp" id="f_notes" rows="2" placeholder="Replacement Sent · Fish Died · Courier Delay · Advance Received · Customer Request"></textarea>' +
            "</div>" +
          "</div></div>" +

          // RIGHT column
          '<div class="card"><div class="card-b">' +
            '<div class="section"><div class="section-t"><span class="n">3</span> Price Information</div>' +
              '<div class="grid-2">' +
                '<div class="field"><label>Paid Amount (₹)</label><input class="inp num" type="number" step="any" id="f_paid" placeholder="0"></div>' +
                '<div class="field"><label>Cost (₹)</label><input class="inp num" type="number" step="any" id="f_cost" placeholder="0"></div>' +
              "</div>" +
              '<div class="field"><label>Profit (₹) <span class="muted small">— auto-suggested, editable</span></label>' +
                '<input class="inp num" type="number" step="any" id="f_profit" placeholder="0"></div>' +
              '<div class="grid-2">' +
                '<div class="field"><label>Courier</label><input class="inp" id="f_courier" list="courierList" placeholder="Select or type">' +
                  '<datalist id="courierList"></datalist></div>' +
                '<div class="field"><label>Status</label><select class="inp" id="f_status"><option value="">— Select —</option>' +
                  statuses.map(function (s) { return "<option>" + s + "</option>"; }).join("") + "</select></div>" +
              "</div>" +
            "</div>" +
            '<div class="actions-bar">' +
              '<button type="button" class="btn-grad" id="saveBtn"><i class="bi bi-save"></i> Save</button>' +
              '<button type="button" class="btn-ghost" id="printBtn"><i class="bi bi-printer"></i> Save & Print</button>' +
              '<button type="button" class="btn-ghost" id="clearBtn"><i class="bi bi-eraser"></i> Clear</button>' +
            "</div>" +
          "</div></div>" +

        "</div></form>"
      );
      wireBilling();
    })();

    // populate couriers without blocking the form
    API.call("couriers").then(function (c) {
      var dl = document.getElementById("courierList");
      if (dl) dl.innerHTML = (c.couriers || []).map(function (x) { return '<option value="' + E(x) + '">'; }).join("");
    }).catch(function () {});

    // fast keyboard entry
    var mob0 = document.getElementById("f_mobile");
    if (mob0) mob0.focus();
  }

  function val(id) { var e = document.getElementById(id); return e ? e.value : ""; }
  function collectBill() {
    return { date: val("f_date"), mobile: val("f_mobile").trim(), name: val("f_name").trim(),
      location: val("f_location").trim(), items: val("f_items"), priceDetails: val("f_price"),
      paid: val("f_paid"), cost: val("f_cost"), profit: val("f_profit"),
      courier: val("f_courier"), status: val("f_status"), notes: val("f_notes") };
  }

  function wireBilling() {
    var mob = document.getElementById("f_mobile");
    var tag = document.getElementById("mobTag");
    var found = document.getElementById("custFound");
    var t;
    function lookup() {
      var m = mob.value.trim();
      found.innerHTML = ""; tag.textContent = "";
      if (m.length < 6) return;
      API.call("getCustomer", { mobile: m }).then(function (d) {
        if (!d.found) { tag.textContent = "New"; tag.style.color = "var(--muted)"; return; }
        tag.textContent = "Existing"; tag.style.color = "var(--teal)";
        var nm = document.getElementById("f_name"), lc = document.getElementById("f_location");
        if (!nm.value) nm.value = d.name || "";
        if (!lc.value) lc.value = d.location || "";
        var recent = (d.recent || []).map(function (r) {
          return '<div class="r"><span>' + D(r.date) + " · " + E(r.status) + "</span><b>" + M(r.paid) + "</b></div>";
        }).join("");
        found.innerHTML =
          '<div class="cust-found"><div class="cf-top"><i class="bi bi-patch-check-fill"></i> Existing customer' +
            '<a href="#customer/' + E(d.mobile) + '">View profile</a></div>' +
            '<div class="cf-stats"><div><div class="k">Orders</div><div class="v">' + d.orders + "</div></div>" +
              '<div><div class="k">Total Purchase</div><div class="v">' + M(d.total) + "</div></div>" +
              '<div><div class="k">Last Purchase</div><div class="v">' + (d.last ? D(d.last) : "—") + "</div></div></div>" +
            (recent ? '<div class="cf-recent">' + recent + "</div>" : "") + "</div>";
      });
    }
    mob.addEventListener("input", function () { clearTimeout(t); t = setTimeout(lookup, 400); });
    mob.addEventListener("blur", lookup);

    // profit auto-suggest (editable)
    var paid = document.getElementById("f_paid"), cost = document.getElementById("f_cost"), profit = document.getElementById("f_profit");
    var touched = false;
    profit.addEventListener("input", function () { touched = true; });
    function suggest() {
      if (touched) return;
      var p = parseFloat(paid.value), c = parseFloat(cost.value);
      if (!isNaN(p) && !isNaN(c)) profit.value = p - c;
    }
    paid.addEventListener("input", suggest);
    cost.addEventListener("input", suggest);

    document.getElementById("clearBtn").addEventListener("click", function () {
      document.getElementById("billForm").reset();
      document.getElementById("f_date").value = UI.todayISO();
      found.innerHTML = ""; tag.textContent = ""; touched = false;
    });

    function save(print) {
      var data = collectBill();
      if (!data.paid && !data.items) { UI.toast("Enter items or a paid amount first.", "err"); return; }
      var btn = print ? document.getElementById("printBtn") : document.getElementById("saveBtn");
      btn.disabled = true;
      API.call("saveBill", data).then(function (res) {
        UI.toast("Bill #" + res.sno + " saved.");
        location.hash = "#bill/" + res.sno + (print ? "?print=1" : "");
      }).catch(function (e) { btn.disabled = false; UI.toast("Save failed: " + e.message, "err"); });
    }
    document.getElementById("saveBtn").addEventListener("click", function () { save(false); });
    document.getElementById("printBtn").addEventListener("click", function () { save(true); });

    // Ctrl+Enter = Save · Ctrl+Shift+Enter = Save & Print
    document.getElementById("billForm").addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); save(e.shiftKey); }
    });

    document.getElementById("gpBtn").addEventListener("click", openGpModal);
  }

  function openGpModal() {
    UI.modal({ title: "Fish Varieties (reference)", icon: "water",
      body: '<input class="inp" id="gpModalSearch" placeholder="Search code or name" style="margin-bottom:10px"><div id="gpModalBody" class="muted">Loading…</div>',
      footer: '<button class="btn-ghost" onclick="location.hash=\'#varieties\';UI.closeModal()">Manage</button>' +
              '<button class="btn-grad" data-close>Close</button>' });
    API.call("gpList").then(function (d) {
      var all = d.items || [];
      function draw(list) {
        var rows = list.map(function (r) {
          return "<tr><td><b>" + (E(r.Code) || "—") + "</b></td><td>" + (E(r.Name) || "—") + "</td><td>" + (E(r.Price) || "—") + "</td><td>" + (E(r.Notes) || "") + "</td></tr>";
        }).join("") || '<tr><td colspan="4" class="empty">No varieties yet.</td></tr>';
        document.getElementById("gpModalBody").innerHTML =
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Variety</th><th>Pair Price</th><th>Notes</th></tr></thead><tbody>' +
          rows + "</tbody></table></div>";
      }
      draw(all);
      var sb = document.getElementById("gpModalSearch");
      if (sb) sb.addEventListener("input", function () {
        var q = sb.value.toLowerCase();
        draw(all.filter(function (r) { return [r.Code, r.Name, r.Notes].join(" ").toLowerCase().indexOf(q) > -1; }));
      });
    });
  }

  /* ============================= CUSTOMERS ============================= */
  function customers(q) {
    var v = el(); UI.loading(v, "Loading customers…");
    API.call("listCustomers", { q: q || "" }).then(function (d) {
      var rows = (d.customers || []).map(function (c) {
        return "<tr>" +
          '<td><b>' + (E(c.name) || "—") + "</b></td><td>" + E(c.mobile) + "</td><td>" + (E(c.location) || "—") + "</td>" +
          "<td>" + c.orders + '</td><td class="t-right num">' + M(c.total) + "</td>" +
          "<td>" + (c.last ? D(c.last) : "—") + "</td>" +
          '<td class="t-right"><button class="btn-ghost btn-xs" onclick="location.hash=\'#customer/' + E(c.mobile) + '\'">Timeline</button></td>' +
          "</tr>";
      }).join("") || '<tr><td colspan="7" class="empty"><i class="bi bi-people"></i>No customers found.</td></tr>';

      mount(
        '<div class="page-head"><div><h1>Customers</h1><div class="sub">' + (d.customers || []).length + " total</div></div>" +
          '<div class="search" style="max-width:320px"><i class="bi bi-search"></i>' +
          '<input id="custSearch" placeholder="Search name, mobile, location" value="' + E(q || "") + '"></div></div>' +
        '<div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr>' +
        "<th>Name</th><th>Mobile</th><th>Location</th><th>Orders</th><th class=t-right>Total Purchase</th><th>Last Purchase</th><th></th>" +
        "</tr></thead><tbody>" + rows + "</tbody></table></div></div>"
      );
      var s = document.getElementById("custSearch"), tt;
      s.addEventListener("input", function () { clearTimeout(tt); tt = setTimeout(function () { customers(s.value); }, 300); });
    }).catch(fail);
  }

  /* ============================= CUSTOMER TIMELINE ============================= */
  function customerProfile(mobile) {
    var v = el(); UI.loading(v, "Loading timeline…");
    API.call("customerTimeline", { mobile: mobile }).then(function (d) {
      var c = d.customer || {}, s = d.summary || {};
      var tl = (d.bills || []).map(function (b) {
        return '<div class="tl"><div class="dot"></div><div class="box">' +
          '<div class="row1"><span class="date">' + D(b.date) + "</span>" + UI.badge(b.status) +
            '<span class="paid">Paid: ' + M(b.paid) + "</span></div>" +
          (b.items ? '<div class="items">' + E(b.items) + "</div>" : "") +
          (b.notes ? '<div class="notes"><i class="bi bi-sticky"></i> ' + E(b.notes) + "</div>" : "") +
          '<div class="foot"><span class="muted small">Bill #' + b.sno + (b.courier ? " · " + E(b.courier) : "") + "</span>" +
            '<button class="btn-ghost btn-xs" onclick="location.hash=\'#bill/' + b.sno + '\'">Open</button></div>' +
          "</div></div>";
      }).join("") || '<div class="empty"><i class="bi bi-clock-history"></i>No orders yet.</div>';

      mount(
        '<div class="page-head"><div><a href="#customers" class="back-link"><i class="bi bi-arrow-left"></i> Customers</a>' +
          "<h1>" + (E(c.name) || "Customer") + '</h1></div>' +
          '<button class="btn-ghost" id="editCustBtn"><i class="bi bi-pencil"></i> Edit</button></div>' +
        '<div class="profile-grid">' +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-person-vcard"></i>Details</h2></div>' +
            '<div class="card-b dl">' +
              '<div><span class="k">Mobile</span><b>' + (E(c.mobile) || "—") + "</b></div>" +
              '<div><span class="k">Location</span><b>' + (E(c.location) || "—") + "</b></div>" +
              '<div><span class="k">Total Orders</span><b>' + (s.orders || 0) + "</b></div>" +
              '<div><span class="k">Total Purchase</span><b style="color:var(--teal)">' + M(s.total) + "</b></div>" +
              '<div><span class="k">Last Purchase</span><b>' + (s.last ? D(s.last) : "—") + "</b></div>" +
            "</div></div>" +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-activity"></i>Timeline</h2></div>' +
            '<div class="card-b"><div class="timeline">' + tl + "</div></div></div>" +
        "</div>"
      );
      document.getElementById("editCustBtn").addEventListener("click", function () { editCustomer(c); });
    }).catch(fail);
  }

  function editCustomer(c) {
    UI.modal({ title: "Edit Customer", icon: "pencil-square",
      body:
        '<div class="field"><label>Mobile</label><input class="inp" id="e_mobile" value="' + E(c.mobile) + '"></div>' +
        '<div class="field"><label>Name</label><input class="inp" id="e_name" value="' + E(c.name) + '"></div>' +
        '<div class="field"><label>Location</label><input class="inp" id="e_location" value="' + E(c.location) + '"></div>',
      footer: '<button class="btn-ghost" data-close>Cancel</button><button class="btn-grad" id="saveCust">Save changes</button>' });
    document.getElementById("saveCust").addEventListener("click", function () {
      var newMobile = document.getElementById("e_mobile").value.trim();
      API.call("updateCustomer", { oldMobile: c.mobile, mobile: newMobile,
        name: document.getElementById("e_name").value.trim(),
        location: document.getElementById("e_location").value.trim() })
        .then(function () {
          UI.closeModal(); UI.toast("Customer updated.");
          location.hash = "#customer/" + newMobile;
          customerProfile(newMobile);
        });
    });
  }

  /* ============================= REPORTS ============================= */
  var charts = {};
  function reports() {
    var v = el(); UI.loading(v, "Building reports…");
    API.call("reports").then(function (d) {
      var head = '<div class="page-head"><div><h1>Reports</h1><div class="sub">Sales, profit & Excel</div></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn-grad" id="exportBtn"><i class="bi bi-file-earmark-excel"></i> <span>Export</span></button>' +
        '<button class="btn-ghost" id="importBtn"><i class="bi bi-upload"></i> <span>Import</span></button></div></div>';

      if (!(d.overall && d.overall.n)) {
        mount(head +
          '<div class="card"><div class="empty" style="padding:56px 20px">' +
            '<i class="bi bi-bar-chart"></i><div class="big">No reports available</div>' +
            "Import your Excel file to begin." +
            '<div style="margin-top:16px"><button class="btn-grad" onclick="Views.importExcel()"><i class="bi bi-upload"></i> Import Excel</button></div>' +
          "</div></div>");
        document.getElementById("exportBtn").addEventListener("click", exportExcel);
        document.getElementById("importBtn").addEventListener("click", importExcel);
        return;
      }

      var mini = [
        ["var(--g-cyan)", "calendar-day", "Daily", d.daily],
        ["var(--g-blue)", "calendar-month", "This Month", d.monthly],
        ["var(--g-teal)", "infinity", "Overall", d.overall]
      ].map(function (m) {
        var a = m[3] || { n: 0, sales: 0, profit: 0 };
        return '<div class="mini"><div class="h"><i style="background:' + m[0] + '" class="bi bi-' + m[1] + '"></i>' + m[2] + "</div>" +
          '<div class="rows"><div><div class="k">Orders</div><div class="v">' + a.n + "</div></div>" +
          '<div><div class="k">Sales</div><div class="v">' + M(a.sales) + "</div></div>" +
          '<div><div class="k">Profit</div><div class="v" style="color:var(--teal)">' + M(a.profit) + "</div></div></div></div>";
      }).join("");

      var top = (d.top || []).map(function (c) {
        return "<tr><td><b>" + (E(c.name) || "—") + "</b></td><td>" + E(c.mobile) + "</td><td>" + c.orders +
          '</td><td class="t-right num">' + M(c.total) + "</td></tr>";
      }).join("") || '<tr><td colspan="4" class="empty">No data.</td></tr>';

      var byMonth = (d.byMonth || []).slice().reverse().map(function (m) {
        return "<tr><td>" + m.ym + "</td><td>" + m.n + '</td><td class="t-right num">' + M(m.sales) +
          '</td><td class="t-right num">' + M(m.profit) + "</td></tr>";
      }).join("") || '<tr><td colspan="4" class="empty">No data.</td></tr>';

      mount(head +
        '<div class="mini-grid">' + mini + "</div>" +
        '<div class="chart-grid">' +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-bar-chart-line"></i>Monthly Sales & Profit</h2></div>' +
            '<div class="card-b"><div class="chart-box"><canvas id="chMonthly"></canvas></div></div></div>' +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-pie-chart"></i>Order Status</h2></div>' +
            '<div class="card-b"><div class="chart-box"><canvas id="chStatus"></canvas></div></div></div>' +
        "</div>" +
        '<div class="report-grid">' +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-calendar3-range"></i>Monthly Breakdown</h2></div>' +
            '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Month</th><th>Orders</th><th class=t-right>Sales</th><th class=t-right>Profit</th></tr></thead><tbody>' + byMonth + "</tbody></table></div></div>" +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-trophy"></i>Top Customers</h2></div>' +
            '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Customer</th><th>Mobile</th><th>Orders</th><th class=t-right>Total</th></tr></thead><tbody>' + top + "</tbody></table></div></div>" +
        "</div>"
      );
      drawCharts(d);
      document.getElementById("exportBtn").addEventListener("click", exportExcel);
      document.getElementById("importBtn").addEventListener("click", importExcel);
    }).catch(fail);
  }

  function drawCharts(d) {
    Object.keys(charts).forEach(function (k) { if (charts[k]) charts[k].destroy(); });
    var bm = (d.byMonth || []);
    charts.m = new Chart(document.getElementById("chMonthly"), {
      type: "bar",
      data: { labels: bm.map(function (x) { return x.ym; }),
        datasets: [
          { label: "Sales", data: bm.map(function (x) { return x.sales; }), backgroundColor: "#2563EB", borderRadius: 6 },
          { label: "Profit", data: bm.map(function (x) { return x.profit; }), backgroundColor: "#14B8A6", borderRadius: 6 }
        ] },
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { font: { family: "Poppins" } } } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } }
    });
    var sc = d.statusCounts || {};
    var scMap = { "Completed": "#22C55E", "Pending": "#F59E0B", "Replacement": "#2563EB", "Courier Issue": "#8B5CF6", "Cancelled": "#EF4444" };
    var labels = Object.keys(sc);
    charts.s = new Chart(document.getElementById("chStatus"), {
      type: "doughnut",
      data: { labels: labels, datasets: [{ data: labels.map(function (k) { return sc[k]; }),
        backgroundColor: labels.map(function (k) { return scMap[k] || "#94A3B8"; }), borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: "62%",
        plugins: { legend: { position: "bottom", labels: { font: { family: "Poppins" }, padding: 14, usePointStyle: true } } } }
    });
  }

  function exportExcel() {
    API.call("listBills", { limit: 100000 }).then(function (d) {
      var rows = (d.bills || []).map(function (b) {
        return { "S.NO": b.sno, "Date": D(b.date), "Customer Name": b.name, "Contact Number": b.mobile,
          "Location": b.location, "Bought Items": b.items, "Price Details": b.priceDetails,
          "Paid Amount": b.paid, "Courier": b.courier, "Status": b.status, "Notes": b.notes,
          "Cost": b.cost, "Profit": b.profit };
      });
      var ws = XLSX.utils.json_to_sheet(rows);
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bills");
      XLSX.writeFile(wb, "guppy_bills_" + UI.todayISO() + ".xlsx");
      UI.toast("Exported " + rows.length + " bill(s).");
    });
  }

  function importExcel() {
    UI.modal({ title: "Import from Excel", icon: "file-earmark-excel",
      body: '<p class="muted small" style="margin-top:0">Upload your <b>.xlsx</b>. Columns are matched by header name (any order). If the file has multiple sheets, the <b>2026</b> sheet is used and 2025 is ignored.</p>' +
        '<p class="small mono">Date · Customer Name · Contact Number · Location · Bought Items · Price Details · Paid Amount · Courier · Status · Notes · Cost · Profit</p>' +
        '<input type="file" class="inp" id="xlFile" accept=".xlsx,.xls">' +
        '<div id="xlMsg" class="small" style="margin-top:8px"></div>',
      footer: '<button class="btn-ghost" data-close>Cancel</button><button class="btn-grad" id="doImport">Import</button>' });
    document.getElementById("doImport").addEventListener("click", function () {
      var f = document.getElementById("xlFile").files[0];
      var msg = document.getElementById("xlMsg");
      if (!f) { UI.toast("Choose a file first.", "err"); return; }
      msg.innerHTML = "Reading file…";
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var wb = XLSX.read(new Uint8Array(e.target.result), { type: "array", cellDates: true });
          var sheetName = chooseSheet(wb);
          var raw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
          var rows = raw.map(mapRow).filter(function (r) {
            return r.items || r.paid || r.name || r.mobile;
          });
          if (!rows.length) {
            msg.innerHTML = '<span style="color:var(--red)">No usable rows found on sheet "' + E(sheetName) + '". Check the column headers.</span>';
            return;
          }
          msg.innerHTML = "Importing " + rows.length + " row(s)…";
          API.call("importBills", { rows: rows }).then(function (res) {
            UI.closeModal();
            UI.toast("Imported " + res.imported + " record(s)" + (res.skipped ? " · " + res.skipped + " duplicate(s) skipped" : "") + ".");
            App.reload();
          }).catch(function (er) { msg.innerHTML = '<span style="color:var(--red)">Import failed: ' + E(er.message) + "</span>"; });
        } catch (err) { msg.innerHTML = '<span style="color:var(--red)">Could not read the file. Make sure it is a valid .xlsx.</span>'; }
      };
      reader.readAsArrayBuffer(f);
    });
  }

  // pick the sheet to import: prefer one named "…2026…", ignore "…2025…", else the fullest
  function chooseSheet(wb) {
    var names = wb.SheetNames.slice();
    var y26 = names.filter(function (n) { return /2026/.test(n); });
    if (y26.length) return y26[0];
    var pool = names.filter(function (n) { return !/2025/.test(n); });
    if (!pool.length) pool = names;
    var best = pool[0], bestN = -1;
    pool.forEach(function (n) {
      var c = XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "" }).length;
      if (c > bestN) { bestN = c; best = n; }
    });
    return best;
  }

  function pad2(x) { return (x < 10 ? "0" : "") + x; }
  function normDate(val) {
    if (val && typeof val.getFullYear === "function" && !isNaN(val.getTime()))
      return val.getFullYear() + "-" + pad2(val.getMonth() + 1) + "-" + pad2(val.getDate());
    var s = String(val || "").trim();
    if (!s) return "";
    var m = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);      // yyyy-mm-dd
    if (m) return m[1] + "-" + pad2(+m[2]) + "-" + pad2(+m[3]);
    m = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{2,4})/);        // dd-mm-yyyy
    if (m) { var y = m[3].length === 2 ? "20" + m[3] : m[3]; return y + "-" + pad2(+m[2]) + "-" + pad2(+m[1]); }
    return s.substring(0, 10);
  }

  function mapRow(r) {
    function pick() {
      var keys = Object.keys(r);
      for (var i = 0; i < arguments.length; i++) {
        for (var k = 0; k < keys.length; k++) {
          var norm = keys[k].toLowerCase().replace(/[\s._#\-]/g, "");
          if (norm === arguments[i]) return r[keys[k]];
        }
      }
      return "";
    }
    return {
      date: normDate(pick("date", "billdate", "orderdate")) || UI.todayISO(),
      name: pick("customername", "name", "customer", "custname"),
      mobile: String(pick("contactnumber", "mobile", "phone", "contact", "mobileno", "phoneno", "number") || ""),
      location: pick("location", "place", "address", "city", "area"),
      items: pick("boughtitems", "items", "products", "item", "fish", "variety", "varieties"),
      priceDetails: pick("pricedetails", "price", "pricing", "details"),
      paid: pick("paidamount", "paid", "amount", "total", "totalamount", "netamount"),
      courier: pick("courier", "delivery", "transport"),
      status: pick("status", "orderstatus"),
      notes: pick("notes", "remarks", "remark", "note", "comment"),
      cost: pick("cost", "costprice", "purchase"),
      profit: pick("profit", "margin", "gain")
    };
  }

  function backup() {
    API.call("snapshot").then(function (snap) {
      var blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "apguppyworld_backup_" + UI.todayISO() + ".json";
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 100);
      UI.toast("Backup downloaded.");
    }).catch(function (e) { UI.toast("Backup failed: " + e.message, "err"); });
  }

  function restore() {
    UI.modal({ title: "Restore from Backup", icon: "cloud-arrow-up",
      body: '<p class="muted small" style="margin-top:0">Upload a backup <b>.json</b> file created by Backup. This replaces current data with the backup contents.</p>' +
        '<input type="file" class="inp" id="rsFile" accept=".json,application/json"><div id="rsMsg" class="small" style="margin-top:8px"></div>',
      footer: '<button class="btn-ghost" data-close>Cancel</button><button class="btn-grad" id="doRestore">Restore</button>' });
    document.getElementById("doRestore").addEventListener("click", function () {
      var f = document.getElementById("rsFile").files[0];
      var msg = document.getElementById("rsMsg");
      if (!f) { UI.toast("Choose a backup file.", "err"); return; }
      var reader = new FileReader();
      reader.onload = function (e) {
        var snap;
        try { snap = JSON.parse(e.target.result); }
        catch (err) { msg.innerHTML = '<span style="color:var(--red)">Not a valid backup file.</span>'; return; }
        msg.innerHTML = "Restoring…";
        API.call("restore", { snapshot: snap }).then(function (res) {
          UI.closeModal();
          UI.toast("Restored " + (res.bills || 0) + " bill(s), " + (res.customers || 0) + " customer(s).");
          App.reload();
        }).catch(function (er) { msg.innerHTML = '<span style="color:var(--red)">Restore failed: ' + E(er.message) + "</span>"; });
      };
      reader.readAsText(f);
    });
  }

  /* ============================= GP LIST ============================= */
  function varieties(q) {
    var v = el(); UI.loading(v, "Loading fish varieties…");
    Promise.all([API.call("gpList"), API.call("couriers")]).then(function (res) {
      var items = res[0].items || [], couriers = res[1].couriers || [];
      var query = (q || "").toLowerCase();
      if (query) items = items.filter(function (r) {
        return [r.Code, r.Name, r.Notes].join(" ").toLowerCase().indexOf(query) > -1;
      });
      var rows = items.map(function (r) {
        var code = E(r.Code);
        return "<tr><td><b>" + (code || "—") + "</b></td><td>" + (E(r.Name) || "—") + "</td><td>" + (E(r.Price) || "—") +
          "</td><td>" + (E(r.Notes) || "") +
          '</td><td class="t-right" style="white-space:nowrap">' +
            '<button class="btn-ghost btn-xs" data-edit="' + code + '"><i class="bi bi-pencil"></i></button> ' +
            '<button class="btn-danger-soft btn-xs" data-del="' + code + '"><i class="bi bi-trash"></i></button></td></tr>';
      }).join("") || '<tr><td colspan="5" class="empty">' + (query ? "No varieties match your search." : "No fish varieties yet — add your first above.") + "</td></tr>";
      var chips = couriers.map(function (c) {
        return '<span class="chip">' + E(c) + '<button class="chip-x" data-courier="' + E(c) + '"><i class="bi bi-x"></i></button></span>';
      }).join("");

      mount(
        '<div class="page-head"><div><h1>Fish Varieties</h1><div class="sub">Your master list of varieties & pair prices</div></div>' +
          '<div class="search" style="max-width:280px"><i class="bi bi-search"></i>' +
          '<input id="varSearch" placeholder="Search code, name, notes" value="' + E(q || "") + '"></div></div>' +
        '<div class="report-grid">' +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-water"></i>Fish Varieties</h2></div><div class="card-b">' +
            '<div class="grid-2" style="margin-bottom:8px"><input class="inp" id="gp_code" placeholder="Short Code (e.g. AFR)"><input class="inp" id="gp_name" placeholder="Full Variety Name"></div>' +
            '<div class="add-row"><input class="inp" id="gp_price" placeholder="Pair Price"><input class="inp" id="gp_notes" placeholder="Notes (optional)"><button class="btn-grad" id="gpAdd"><i class="bi bi-plus-lg"></i> Add</button></div>' +
            '<div class="tbl-wrap" style="margin-top:14px"><table class="tbl"><thead><tr><th>Code</th><th>Variety Name</th><th>Pair Price</th><th>Notes</th><th></th></tr></thead><tbody id="gpBody">' + rows + "</tbody></table></div>" +
          "</div></div>" +
          '<div class="card"><div class="card-h"><h2><i class="bi bi-truck"></i>Courier Options</h2></div><div class="card-b">' +
            '<div class="add-row"><input class="inp" id="cr_name" placeholder="Add courier"><button class="btn-grad" id="crAdd"><i class="bi bi-plus-lg"></i></button></div>' +
            '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:14px" id="crWrap">' + chips + "</div>" +
            '<p class="muted small" style="margin-top:14px">Courier options appear in the billing dropdown.</p>' +
          "</div></div>" +
        "</div>"
      );

      var sBox = document.getElementById("varSearch"), st;
      sBox.addEventListener("input", function () { clearTimeout(st); st = setTimeout(function () { varieties(sBox.value); }, 250); });

      document.getElementById("gpAdd").addEventListener("click", function () {
        var code = document.getElementById("gp_code").value.trim();
        var name = document.getElementById("gp_name").value.trim();
        if (!code && !name) { UI.toast("Enter a code or variety name.", "err"); return; }
        API.call("addGP", { code: code, name: name, price: document.getElementById("gp_price").value.trim(),
          notes: document.getElementById("gp_notes").value.trim() }).then(function () { UI.toast("Variety added."); varieties(q); });
      });
      document.getElementById("crAdd").addEventListener("click", function () {
        var n = document.getElementById("cr_name").value.trim();
        if (!n) return;
        API.call("addCourier", { name: n }).then(function () { UI.toast("Courier added."); varieties(q); });
      });
      v.querySelectorAll("[data-edit]").forEach(function (b) {
        b.addEventListener("click", function () {
          var code = b.getAttribute("data-edit");
          var rec = (res[0].items || []).filter(function (x) { return String(x.Code) === code; })[0] || { Code: code };
          editVariety(rec, q);
        });
      });
      v.querySelectorAll("[data-del]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (!confirm("Delete variety " + b.getAttribute("data-del") + "?")) return;
          API.call("deleteGP", { code: b.getAttribute("data-del") }).then(function () { UI.toast("Deleted."); varieties(q); });
        });
      });
      v.querySelectorAll("[data-courier]").forEach(function (b) {
        b.addEventListener("click", function () {
          API.call("deleteCourier", { name: b.getAttribute("data-courier") }).then(function () { varieties(q); });
        });
      });
    }).catch(fail);
  }

  function editVariety(rec, q) {
    UI.modal({ title: "Edit Fish Variety", icon: "pencil-square",
      body:
        '<div class="grid-2"><div class="field"><label>Short Code</label><input class="inp" id="ev_code" value="' + E(rec.Code) + '"></div>' +
        '<div class="field"><label>Pair Price</label><input class="inp" id="ev_price" value="' + E(rec.Price) + '"></div></div>' +
        '<div class="field"><label>Full Variety Name</label><input class="inp" id="ev_name" value="' + E(rec.Name) + '"></div>' +
        '<div class="field"><label>Notes</label><input class="inp" id="ev_notes" value="' + E(rec.Notes) + '"></div>',
      footer: '<button class="btn-ghost" data-close>Cancel</button><button class="btn-grad" id="evSave">Save</button>' });
    document.getElementById("evSave").addEventListener("click", function () {
      API.call("updateGP", { oldCode: rec.Code, code: document.getElementById("ev_code").value.trim(),
        name: document.getElementById("ev_name").value.trim(), price: document.getElementById("ev_price").value.trim(),
        notes: document.getElementById("ev_notes").value.trim() })
        .then(function () { UI.closeModal(); UI.toast("Variety updated."); varieties(q); });
    });
  }

  /* ============================= SETTINGS ============================= */
  function settings() {
    var url = window.getApiUrl();
    mount(
      '<div class="page-head"><div><h1>Settings</h1><div class="sub">Data & connection</div></div></div>' +

      // ---- Data ----
      '<div class="card" style="max-width:720px;margin-bottom:15px"><div class="card-h"><h2><i class="bi bi-database"></i>Data</h2></div><div class="card-b">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn-grad" id="setImport"><i class="bi bi-file-earmark-excel"></i> Import Excel</button>' +
          '<button class="btn-ghost" id="setExport"><i class="bi bi-download"></i> Export Excel</button>' +
          '<button class="btn-ghost" id="setBackup"><i class="bi bi-cloud-arrow-down"></i> Backup</button>' +
          '<button class="btn-ghost" id="setRestore"><i class="bi bi-cloud-arrow-up"></i> Restore</button>' +
        "</div>" +
        '<p class="muted small" style="margin-bottom:0;margin-top:12px">Import brings in your Excel customers & orders. Backup saves a full copy as a file; Restore loads it back.</p>' +
      "</div></div>" +

      // ---- Google Sheets Connection (owner-only) ----
      '<div class="card" style="max-width:720px;margin-bottom:15px"><div class="card-h"><h2><i class="bi bi-cloud"></i>Google Sheets Connection</h2>' +
        '<span class="badge-s ' + (url ? "b-completed" : "b-cancelled") + '" id="connBadge" style="margin-left:auto">' + (url ? "Connected" : "Not Connected") + "</span></div><div class=\"card-b\">" +
        '<div class="field"><label>Web App URL</label>' +
          '<input class="inp mono" id="apiUrl" placeholder="https://script.google.com/macros/s/…/exec" value="' + E(url) + '"></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<button class="btn-grad" id="saveUrl"><i class="bi bi-check2"></i> Save Connection</button>' +
          '<button class="btn-ghost" id="testUrl"><i class="bi bi-wifi"></i> Test Connection</button>' +
        "</div>" +
        '<div id="connResult" class="small" style="margin-top:12px"></div>' +
        '<p class="muted small" style="margin-bottom:0">Owner-only. Set once — the app reconnects automatically on every start.</p>' +
      "</div></div>" +

      // ---- About ----
      '<div class="card" style="max-width:720px"><div class="card-h"><h2><i class="bi bi-info-circle"></i>About</h2></div><div class="card-b">' +
        '<div style="display:flex;align-items:center;gap:12px"><img src="assets/logo-mark.png" alt="AP Guppy World" style="height:34px">' +
          '<div><b>AP GUPPY WORLD — Billing</b><div class="muted small">Version 1.0 · Aquarium billing studio</div></div></div>' +
      "</div></div>"
    );

    document.getElementById("setImport").addEventListener("click", importExcel);
    document.getElementById("setExport").addEventListener("click", exportExcel);
    document.getElementById("setBackup").addEventListener("click", backup);
    document.getElementById("setRestore").addEventListener("click", restore);

    document.getElementById("saveUrl").addEventListener("click", function () {
      window.setApiUrl(document.getElementById("apiUrl").value.trim());
      UI.toast("Connection saved."); App.refreshConn(); test();
    });
    document.getElementById("testUrl").addEventListener("click", test);

    function setBadge(ok) {
      var badge = document.getElementById("connBadge");
      badge.textContent = ok ? "Connected" : "Not Connected";
      badge.className = "badge-s " + (ok ? "b-completed" : "b-cancelled");
      badge.style.marginLeft = "auto";
    }
    function test() {
      var r = document.getElementById("connResult");
      if (!window.getApiUrl()) { r.innerHTML = '<span style="color:var(--red)">🔴 Not Connected</span>'; setBadge(false); return; }
      r.innerHTML = "Testing…";
      API.call("ping").then(function (d) {
        var ok = d && d.ok;
        r.innerHTML = ok ? '<span style="color:var(--green)">🟢 Connected — ' + E(d.app || "Google Sheets") + "</span>"
          : '<span style="color:var(--red)">🔴 Reached URL but unexpected response.</span>';
        setBadge(ok);
      }).catch(function (e) { r.innerHTML = '<span style="color:var(--red)">🔴 Connection failed: ' + E(e.message) + "</span>"; setBadge(false); });
    }
  }

  /* ============================= BILL VIEW (print) ============================= */
  function billView(sno, autoprint) {
    var v = el(); UI.loading(v, "Loading bill…");
    API.call("getBill", { sno: sno }).then(function (d) {
      if (!d.found) { mount('<div class="empty"><i class="bi bi-exclamation-circle"></i>Bill not found.</div>'); return; }
      var b = d.bill;
      var statuses = ["Completed", "Pending", "Replacement", "Courier Issue", "Cancelled"];
      var statusOpts = '<option value="">— Select —</option>' + statuses.map(function (s) {
        return "<option" + (String(b.status) === s ? " selected" : "") + ">" + s + "</option>"; }).join("");

      mount(
        '<div class="page-head no-print"><div><a href="#dashboard" class="back-link"><i class="bi bi-arrow-left"></i> Dashboard</a>' +
          "<h1>Bill #" + b.sno + '</h1></div><div style="display:flex;gap:10px">' +
          '<button class="btn-grad" onclick="window.print()"><i class="bi bi-printer"></i> <span>Print</span></button>' +
          '<a href="#billing" class="btn-ghost"><i class="bi bi-plus-lg"></i> <span>New Bill</span></a>' +
          '<button class="btn-danger-soft btn-ghost" id="delBill"><i class="bi bi-trash"></i></button></div></div>' +
        '<div class="bill-paper">' +
          '<div class="bp-head"><div><div class="bp-brand">AP GUPPY WORLD</div><div class="muted small">Bill / Invoice</div></div>' +
            '<div class="bp-meta"><div>Bill No: <b>#' + b.sno + "</b></div><div>Date: <b>" + D(b.date) + "</b></div></div></div>" +
          '<div class="bp-cust"><div><span class="k">Customer</span>' + (E(b.name) || "—") + "</div>" +
            '<div><span class="k">Mobile</span>' + (E(b.mobile) || "—") + "</div>" +
            '<div><span class="k">Location</span>' + (E(b.location) || "—") + "</div></div>" +
          '<div class="bp-cols"><div class="bp-box"><h4>Bought Items</h4><pre>' + (E(b.items) || "—") + "</pre></div>" +
            '<div class="bp-box"><h4>Price Details</h4><pre>' + (E(b.priceDetails) || "—") + "</pre></div></div>" +
          '<div class="bp-box" style="margin-top:14px"><h4>Notes & History</h4><pre id="bpNotes">' + (E(b.notes) || "—") + "</pre></div>" +
          '<div class="bp-tot"><div><span class="k">Courier</span><b>' + (E(b.courier) || "—") + "</b></div>" +
            '<div><span class="k">Status</span><b id="bpStatus">' + (E(b.status) || "—") + "</b></div>" +
            '<div><span class="k">Cost</span><b>' + M(b.cost) + "</b></div>" +
            '<div><span class="k">Profit</span><b>' + M(b.profit) + "</b></div>" +
            '<div class="bp-paid"><span class="k">Paid Amount</span><div class="v">' + M(b.paid) + "</div></div></div>" +
          '<div class="muted small" style="text-align:center;margin-top:22px">Thank you — AP Guppy World</div>' +
        "</div>" +

        // ---- editable management (never printed) ----
        '<div class="card no-print" style="max-width:700px;margin:16px auto 0"><div class="card-b">' +
          '<div class="grid-2" style="align-items:end">' +
            '<div class="field" style="margin:0"><label>Status (editable anytime)</label>' +
              '<select class="inp" id="bvStatus">' + statusOpts + "</select></div>" +
            '<div style="display:flex;justify-content:flex-end"><button class="btn-grad" id="bvStatusSave"><i class="bi bi-check2"></i> Update Status</button></div>' +
          "</div>" +
          '<div class="field" style="margin-top:14px"><label>Add a note (appended with date &amp; time — never overwritten)</label>' +
            '<textarea class="inp" id="bvNote" rows="2" placeholder="Replacement sent · Advance received · Courier update…"></textarea></div>' +
          '<div style="display:flex;justify-content:flex-end"><button class="btn-grad" id="bvNoteSave"><i class="bi bi-plus-lg"></i> Add Note</button></div>' +
        "</div></div>"
      );

      var del = document.getElementById("delBill");
      if (del) del.addEventListener("click", function () {
        if (!confirm("Delete bill #" + b.sno + "?")) return;
        API.call("deleteBill", { sno: b.sno }).then(function () { UI.toast("Bill deleted."); location.hash = "#dashboard"; });
      });

      document.getElementById("bvStatusSave").addEventListener("click", function () {
        var st = document.getElementById("bvStatus").value;
        API.call("updateStatus", { sno: b.sno, status: st }).then(function () {
          UI.toast("Status updated to " + (st || "—") + ".");
          billView(b.sno, false);
        });
      });
      document.getElementById("bvNoteSave").addEventListener("click", function () {
        var note = document.getElementById("bvNote").value.trim();
        if (!note) { UI.toast("Type a note first.", "err"); return; }
        API.call("appendNote", { sno: b.sno, note: note }).then(function () {
          UI.toast("Note added.");
          billView(b.sno, false);
        });
      });

      if (autoprint) setTimeout(function () { window.print(); }, 400);
    }).catch(fail);
  }

  /* ============================= misc ============================= */
  function search(q) {
    var v = el();
    Promise.all([API.call("listCustomers", { q: q }), API.call("listBills", { q: q, limit: 50 })]).then(function (r) {
      var cs = r[0].customers || [], bs = r[1].bills || [];
      var custRows = cs.map(function (c) {
        return "<tr><td><b>" + (E(c.name) || "—") + "</b></td><td>" + E(c.mobile) + "</td><td>" + (E(c.location) || "—") +
          '</td><td class="t-right"><button class="btn-ghost btn-xs" onclick="location.hash=\'#customer/' + E(c.mobile) + '\'">Timeline</button></td></tr>';
      }).join("") || '<tr><td colspan="4" class="empty">No customers matched.</td></tr>';
      var billRows = bs.map(function (b) {
        return "<tr><td>#" + b.sno + "</td><td>" + D(b.date) + "</td><td>" + (E(b.name) || "—") + "</td>" +
          '<td class="t-right num">' + M(b.paid) + "</td><td>" + UI.badge(b.status) +
          '</td><td class="t-right"><button class="btn-ghost btn-xs" onclick="location.hash=\'#bill/' + b.sno + '\'">View</button></td></tr>';
      }).join("") || '<tr><td colspan="6" class="empty">No bills matched.</td></tr>';
      mount(
        '<div class="page-head"><div><h1>Search</h1><div class="sub">Results for “' + E(q) + '”</div></div></div>' +
        '<div class="card" style="margin-bottom:18px"><div class="card-h"><h2><i class="bi bi-people"></i>Customers</h2></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Mobile</th><th>Location</th><th></th></tr></thead><tbody>' + custRows + "</tbody></table></div></div>" +
        '<div class="card"><div class="card-h"><h2><i class="bi bi-receipt"></i>Bills</h2></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>S.No</th><th>Date</th><th>Customer</th><th class=t-right>Paid</th><th>Status</th><th></th></tr></thead><tbody>' + billRows + "</tbody></table></div></div>"
      );
    }).catch(fail);
  }

  function fail(e) {
    mount('<div class="card"><div class="card-b empty"><i class="bi bi-exclamation-triangle"></i>' +
      "Couldn't load data. " + E(e.message || "") +
      '<div class="mt-3"><a href="#settings" class="btn-grad">Check connection</a></div></div></div>');
  }

  return { dashboard: dashboard, billing: billing, customers: customers, customerProfile: customerProfile,
    reports: reports, varieties: varieties, settings: settings, billView: billView, search: search,
    importExcel: importExcel, exportExcel: exportExcel, backup: backup, restore: restore };
})();
