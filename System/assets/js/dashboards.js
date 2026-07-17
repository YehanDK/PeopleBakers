//----- Employee Dashboard -----
function renderEmployeeDashboard() {
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">3</div><div class="label">My Leave Requests</div></div>
      <div class="stat-card"><div class="num">1</div><div class="label">Pending Requests</div></div>
      <div class="stat-card"><div class="num">2</div><div class="label">Approved Leaves</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>My Recent Activity</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Event</th><th>Time</th></tr>
        <tr><td>Leave request submitted</td><td>10:30 AM</td></tr>
        <tr><td>Profile updated</td><td>09:15 AM</td></tr>
      </table>
    </div>
  `;
}

// ----- Employee Manager Dashboard -----
function renderEmployeeManagerDashboard() {
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending').length;
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${employees.length}</div><div class="label">Active Employees</div></div>
      <div class="stat-card"><div class="num">${pendingLeaves}</div><div class="label">Pending Leaves</div></div>
      <div class="stat-card"><div class="num">${leaveRequests.filter(l => l.status === 'Approved').length}</div><div class="label">Approved Leaves</div></div>
    </div>
  `;
}

// ----- Company Manager Dashboard -----
function renderCompanyManagerDashboard() {
  // Revenue & order count from live sales data (loaded in loadAppData)
  const orders = [...onlineOrders, ...inStoreOrders];
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const orderCount = orders.length;

  const money = (n) => 'LKR ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${employees.length}</div><div class="label">Total Employees</div></div>
      <div class="stat-card"><div class="num">${money(revenue)}</div><div class="label">Total Revenue</div></div>
      <div class="stat-card"><div class="num">${orderCount}</div><div class="label">Total Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Company Overview</h3><span class="text-muted">Live</span></div>
      <table><tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Employees</td><td>${employees.length}</td></tr>
        <tr><td>Total Revenue</td><td>${money(revenue)}</td></tr>
        <tr><td>Total Orders</td><td>${orderCount}</td></tr>
      </table>
    </div>
  `;
}

// ----- Finance Manager Dashboard -----
async function renderFinanceManagerDashboard() {
  // Revenue = total of all online + in-store order sales (loaded in loadAppData)
  const orders = [...onlineOrders, ...inStoreOrders];
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Salaries = sum of all recorded salary payouts (fetched live)
  let salaries = 0;
  try {
    const salaryResponse = await SalaryAPI.list();
    if (salaryResponse.success) {
      salaries = (salaryResponse.data || []).reduce((s, sal) => s + Number(sal.amount || 0), 0);
    }
  } catch (e) {
    console.error('Failed to load salaries:', e);
  }

  // Restock cost = sum of all restock records (unit cost × quantity), loaded in loadAppData
  const restockTotal = restockRecords.reduce((s, r) => s + (Number(r.unitCost || 0) * Number(r.qty || 0)), 0);

  // Net profit deducts both salaries and restock costs from revenue
  const netProfit = revenue - salaries - restockTotal;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const money = (n) => 'LKR ' + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${money(revenue)}</div><div class="label">Total Revenue</div></div>
      <div class="stat-card"><div class="num">${money(salaries + restockTotal)}</div><div class="label">Total Expenses</div></div>
      <div class="stat-card"><div class="num">${profitMargin.toFixed(1)}%</div><div class="label">Profit Margin</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Financial Summary</h3><span class="text-muted">Live</span></div>
      <table><tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Revenue</td><td>${money(revenue)}</td></tr>
        <tr><td>Salaries</td><td>${money(salaries)}</td></tr>
        <tr><td>Restock Cost</td><td>${money(restockTotal)}</td></tr>
        <tr><td>Net Profit</td><td>${money(netProfit)}</td></tr>
      </table>
    </div>
  `;
}

// ----- Inventory Manager Dashboard -----
function renderInventoryManagerDashboard() {
  const productCount = inventoryItems.length;
  const lowCount = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 15).length;
  const criticalCount = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 5).length;

  // Most recent restock records (by id) for the live activity feed
  const recent = [...restockRecords]
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
    .slice(0, 3);

  const activity = recent.length
    ? recent.map(r => `
        <tr><td>Restock #${r.id || 'N/A'} recorded (${r.item || 'Item'})</td><td>${r.date || 'N/A'}</td></tr>
      `).join('')
    : `<tr><td colspan="2" class="text-muted text-center py-2">No restock activity recorded.</td></tr>`;

  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${productCount}</div><div class="label">Total Products</div></div>
      <div class="stat-card"><div class="num">${lowCount}</div><div class="label">Low Stock</div></div>
      <div class="stat-card"><div class="num">${restockRecords.length}</div><div class="label">Restock Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Activity</h3><span class="text-muted">Live</span></div>
      <table><tr><th>Event</th><th>Date</th></tr>
        ${activity}
        <tr><td>${criticalCount > 0 ? `⚠️ ${criticalCount} critical stock alert(s)` : lowCount > 0 ? `⚠️ ${lowCount} low stock item(s)` : '✅ All stock levels are healthy'}</td><td>Now</td></tr>
      </table>
    </div>
  `;
}

// ----- Sales Assistant Dashboard -----
function renderSalesAssistantDashboard() {
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${onlineOrders.length + inStoreOrders.length}</div><div class="label">Today's Orders</div></div>
      <div class="stat-card"><div class="num">${onlineOrders.length}</div><div class="label">Online Orders</div></div>
      <div class="stat-card"><div class="num">${inStoreOrders.length}</div><div class="label">In-Store Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Orders</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Order ID</th><th>Type</th><th>Status</th></tr>
        <tr><td>${onlineOrders[0]?.id || 'N/A'}</td><td>Online</td><td><span class="badge ${onlineOrders[0]?.status === 'Delivered' ? 'badge-green' : onlineOrders[0]?.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${onlineOrders[0]?.status || 'N/A'}</span></td></tr>
        <tr><td>${inStoreOrders[0]?.id || 'N/A'}</td><td>In-Store</td><td><span class="badge ${inStoreOrders[0]?.status === 'Completed' ? 'badge-green' : inStoreOrders[0]?.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${inStoreOrders[0]?.status || 'N/A'}</span></td></tr>
      </table>
    </div>
  `;
}

// ----- Sales Supervisor Dashboard -----
function renderSalesSupervisorDashboard() {
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${onlineOrders.length + inStoreOrders.length}</div><div class="label">Today's Orders</div></div>
      <div class="stat-card"><div class="num">${onlineOrders.length}</div><div class="label">Online Orders</div></div>
      <div class="stat-card"><div class="num">${inStoreOrders.length}</div><div class="label">In-Store Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Orders</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Order ID</th><th>Type</th><th>Status</th></tr>
        <tr><td>${onlineOrders[0]?.id || 'N/A'}</td><td>Online</td><td><span class="badge ${onlineOrders[0]?.status === 'Delivered' ? 'badge-green' : onlineOrders[0]?.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${onlineOrders[0]?.status || 'N/A'}</span></td></tr>
        <tr><td>${inStoreOrders[0]?.id || 'N/A'}</td><td>In-Store</td><td><span class="badge ${inStoreOrders[0]?.status === 'Completed' ? 'badge-green' : inStoreOrders[0]?.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${inStoreOrders[0]?.status || 'N/A'}</span></td></tr>
      </table>
    </div>
  `;
}

// ----- Delivery Employee Dashboard -----
function renderDeliveryEmployeeDashboard() {
  const outForDelivery = onlineOrders.filter(o => o.status === 'Out for Delivery').length;
  const preparing = onlineOrders.filter(o => o.status === 'Preparing').length;
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${onlineOrders.length}</div><div class="label">Total Deliveries</div></div>
      <div class="stat-card"><div class="num">${outForDelivery}</div><div class="label">Out for Delivery</div></div>
      <div class="stat-card"><div class="num">${preparing}</div><div class="label">Preparing</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>My Deliveries</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Order ID</th><th>Address</th><th>Status</th></tr>
        ${onlineOrders.map(o => `
          <tr><td>${o.id}</td><td>${o.address}</td><td><span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Out for Delivery' ? 'badge-orange' : 'badge-orange'}">${o.status}</span></td></tr>
        `).join('')}
      </table>
    </div>
  `;
}