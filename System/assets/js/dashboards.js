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
    <div class="card">
      <div class="card-header"><h3>Recent Leave Activity</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Employee</th><th>Type</th><th>Status</th></tr>
        ${leaveRequests.slice(0, 3).map(l => `
          <tr><td>${l.employee}</td><td>${l.type}</td><td><span class="badge ${l.status === 'Pending' ? 'badge-orange' : l.status === 'Approved' ? 'badge-green' : 'badge-red'}">${l.status}</span></td></tr>
        `).join('')}
      </table>
    </div>
  `;
}

// ----- Company Manager Dashboard -----
function renderCompanyManagerDashboard() {
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${employees.length}</div><div class="label">Total Employees</div></div>
      <div class="stat-card"><div class="num">$124,500</div><div class="label">Monthly Revenue</div></div>
      <div class="stat-card"><div class="num">1,245</div><div class="label">Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Company Overview</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Employees</td><td>${employees.length}</td></tr>
        <tr><td>Total Revenue (YTD)</td><td>$356,780</td></tr>
        <tr><td>Active Orders</td><td>28</td></tr>
      </table>
    </div>
  `;
}

// ----- Finance Manager Dashboard -----
function renderFinanceManagerDashboard() {
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">$124.5k</div><div class="label">Monthly Revenue</div></div>
      <div class="stat-card"><div class="num">$45.2k</div><div class="label">Total Salaries</div></div>
      <div class="stat-card"><div class="num">87%</div><div class="label">Profit Margin</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Financial Summary</h3><span class="text-muted">Q2 2026</span></div>
      <table><tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Revenue</td><td>$356,780</td></tr>
        <tr><td>Expenses</td><td>$124,500</td></tr>
        <tr><td>Net Profit</td><td>$232,280</td></tr>
      </table>
    </div>
  `;
}

// ----- Inventory Manager Dashboard -----
function renderInventoryManagerDashboard() {
  const totalItems = inventoryItems.reduce((s, i) => s + Number(i.stock_qty ?? i.stock ?? 0), 0);
  const lowCount = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 15).length;
  const criticalCount = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 5).length;
  return `
    <div class="grid-3">
      <div class="stat-card"><div class="num">${totalItems}</div><div class="label">Total Items</div></div>
      <div class="stat-card"><div class="num">${lowCount}</div><div class="label">Low Stock</div></div>
      <div class="stat-card"><div class="num">${restockRecords.length}</div><div class="label">Restock Orders</div></div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Recent Activity</h3><span class="text-muted">Today</span></div>
      <table><tr><th>Event</th><th>Time</th></tr>
        <tr><td>Restock #${restockRecords[restockRecords.length-1]?.id || 'N/A'} recorded</td><td>10:30 AM</td></tr>
        <tr><td>${criticalCount > 0 ? `⚠️ ${criticalCount} critical stock alerts` : '✅ All stock levels are healthy'}</td><td>09:15 AM</td></tr>
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