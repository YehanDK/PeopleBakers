// ============================================================
//  CUSTOM CAKE MANAGEMENT
// ============================================================

// Fulfillment lifecycle the sales assistant drives on APPROVED custom cakes.
// (Approval itself is a separate axis tracked on custom_cake_orders.status.)
const CAKE_FULFILLMENT_STATUSES = ['Preparing', 'Ready for Pickup', 'Completed'];

// Cleaned: Removed unsafe role matching boundaries to ensure consistent active order views
function getVisibleCakeRequests() {
  const visibleStatuses = ['Approved', 'Preparing', 'Ready for Pickup', 'Completed'];
  return (customCakeRequests || []).filter(c => c && visibleStatuses.includes(c.status));
}

function fulfillmentBadgeClass(status) {
  switch (status) {
    case 'Preparing': return 'badge-orange';
    case 'Ready for Pickup': return 'badge-purple';
    case 'Completed': return 'badge-green';
    default: return 'badge-orange';
  }
}

function renderCustomCakeOrders() {
  const requests = getVisibleCakeRequests();

  let rows = requests.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge ${fulfillmentBadgeClass(c.status)}">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateCustomCakeStatus('${c.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="btn btn-sm btn-outline" onclick="printCustomCakeReceipt('${c.id}')" style="margin-left: 0.25rem;"><i class="fas fa-print"></i> Print</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-cake-candles" style="color:var(--primary);margin-right:0.5rem;"></i> Approved Custom Cakes</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <input class="search-box"  id="cakeOrderSearch" oninput="filterCustomCakeOrders()" />
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Design</th><th>Date</th><th>Status</th><th>Action</th></tr>
        <tbody id="customCakeOrdersBody">${rows}</tbody>
      </table>
    </div>
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-pen" style="color:var(--primary);margin-right:0.5rem;"></i> Update Fulfillment</h3>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Select Order</label>
          <select id="updateCustomCakeSelect">
            ${requests.map(c => `<option value="${c.id}">${c.id} - ${c.customer}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>New Status</label>
        <select id="updateCustomCakeStatusSelect">
          ${CAKE_FULFILLMENT_STATUSES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn" onclick="updateCustomCakeStatusFromSelect()">Update Status</button>
    </div>
  `;
}

function filterCustomCakeOrders() {
  const search = document.getElementById('cakeOrderSearch').value.toLowerCase();
  const requests = getVisibleCakeRequests();
  const filtered = requests.filter(c =>
    String(c.id).toLowerCase().includes(search) ||
    c.customer.toLowerCase().includes(search) ||
    c.design.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('customCakeOrdersBody');
  tbody.innerHTML = filtered.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge ${fulfillmentBadgeClass(c.status)}">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateCustomCakeStatus('${c.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="btn btn-sm btn-outline" onclick="printCustomCakeReceipt('${c.id}')" style="margin-left: 0.25rem;"><i class="fas fa-print"></i> Print</button>
      </td>
    </tr>
  `).join('');

  // Update the select dropdown in the update form to reflect filtered results
  const select = document.getElementById('updateCustomCakeSelect');
  select.innerHTML = filtered.map(c => `<option value="${c.id}">${c.id} - ${c.customer}</option>`).join('');
}

// ----- Sales Assistant: advance an approved cake through its fulfillment stages -----
async function updateCustomCakeStatus(id) {
  const order = getVisibleCakeRequests().find(c => String(c.id) === String(id));
  if (!order) return;
  
  // Fixed: Changed lookup parameter from order.fulfillmentStatus to order.status
  const currentIndex = CAKE_FULFILLMENT_STATUSES.indexOf(order.status);
  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
  
  if (nextIndex < CAKE_FULFILLMENT_STATUSES.length) {
    const nextStatus = CAKE_FULFILLMENT_STATUSES[nextIndex];
    const response = await OrdersAPI.updateStatus(order.id, nextStatus);
    if (!response.success) {
      alert(response.message || 'Failed to update custom cake status');
      return;
    }
    await loadAppData();
    showToast(`Custom cake ${id} status updated to ${nextStatus}`);
    renderTab(currentTab); // Fixed: Refreshes the active workspace dynamically
  } else {
    showToast(`Custom cake ${id} is already ${order.status}.`);
  }
}

async function updateCustomCakeStatusFromSelect() {
  const id = document.getElementById('updateCustomCakeSelect').value;
  const newStatus = document.getElementById('updateCustomCakeStatusSelect').value;
  const order = getVisibleCakeRequests().find(c => String(c.id) === String(id));
  if (!order) return;
  const response = await OrdersAPI.updateStatus(order.id, newStatus);
  if (!response.success) {
    alert(response.message || 'Failed to update custom cake status');
    return;
  }
  await loadAppData();
  showToast(`Custom cake ${id} status updated to ${newStatus}`);
  renderTab(currentTab); // Fixed: Refreshes the active workspace dynamically
}

function renderManualRequest() {
  return `
    <div class="card"><h3>Manual Custom Cake Request</h3>
      <p class="text-muted">Submit a new custom cake request</p>
      <div class="form-group"><label>Customer Name</label><input id="manualCustomer"  /></div>
      <div class="form-group"><label>Phone Number</label><input id="manualPhone"  /></div>
      <div class="form-group"><label>Cake Design</label><input id="manualDesign"  /></div>
      <div class="form-group"><label>Description</label><textarea id="manualDescription"  rows="4"></textarea></div>
      <div class="form-group"><label>Required Date <span style="color:var(--danger);">*</span></label><input type="date" id="manualDate" required /></div>
      <button class="btn" onclick="submitManualRequest()">Submit Request</button>
    </div>
  `;
}

async function submitManualRequest() {
  const customer = document.getElementById('manualCustomer').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  const design = document.getElementById('manualDesign').value.trim();
  const description = document.getElementById('manualDescription').value.trim();
  const requiredDate = document.getElementById('manualDate').value;

  if (!customer || !design || !requiredDate) {
    alert('Please fill in customer name, design, and required date.');
    return;
  }

  const response = await OrdersAPI.create({
    customer_name: customer,
    customer_id: null,
    phone: phone || null,
    order_type: 'Custom',
    total_amount: 0,
    items: [],
    design_details: design,
    description: description || 'No description provided',
    pickup_date: requiredDate
  });

  if (!response.success) {
    alert(response.message || 'Failed to submit custom cake request');
    return;
  }

  await loadAppData();
  showToast(`Custom cake request submitted for ${customer}`);
  renderTab(currentUser && currentUser.role === 'salessupervisor' ? 'view-cake' : 'custom-cake');
}

// ----- Sales Supervisor: Cake Management (Approved only) -----
function renderCustomCakeManagement() {
  const visibleCakes = getVisibleCakeRequests();

  let rows = visibleCakes.map(c => {
    const badgeClass = c.status === 'Approved' ? 'badge-green'
      : (c.status === 'Rejected' ? 'badge-red' : 'badge-orange');
    return `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge ${badgeClass}">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCustomCake('${c.id}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-cake-candles" style="color:var(--primary);margin-right:0.5rem;"></i> Custom Cake Requests</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box"  id="cakeSearch" oninput="filterCustomCakes()" />
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Design</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        <tbody id="customCakeBody">${rows || '<tr><td colspan="6" class="text-muted text-center py-2">No custom cake requests found.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function filterCustomCakes() {
  const search = document.getElementById('cakeSearch').value.toLowerCase();
  const visibleCakes = getVisibleCakeRequests();
  const filtered = visibleCakes.filter(c => (
    String(c.id).toLowerCase().includes(search) ||
    c.customer.toLowerCase().includes(search) ||
    c.design.toLowerCase().includes(search)
  ));
  const tbody = document.getElementById('customCakeBody');
  
  tbody.innerHTML = filtered.map(c => {
    const badgeClass = c.status === 'Approved' ? 'badge-green'
      : (c.status === 'Rejected' ? 'badge-red' : 'badge-orange');
    return `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge ${badgeClass}">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-muted text-center py-2">No cakes found matching your search.</td></tr>';
}

function viewCustomCake(id) {
  const cake = customCakeRequests.find(c => String(c.id) === String(id));
  if (!cake) return;
  const isPending = cake.status === 'Pending';
  const content = document.getElementById('viewCakeContent');
  content.innerHTML = `
    <div class="form-group"><label>Order ID</label><input value="${cake.id}" disabled /></div>
    <div class="form-row">
      <div class="form-group"><label>Customer</label><input value="${cake.customer}" disabled /></div>
      <div class="form-group"><label>Phone</label><input value="${cake.phone}" disabled /></div>
    </div>
    <div class="form-group"><label>Design</label><input value="${cake.design}" disabled /></div>
    <div class="form-group"><label>Description</label><textarea disabled rows="4">${cake.description}</textarea></div>
    <div class="form-row">
      <div class="form-group"><label>Status</label><input value="${cake.status}" disabled /></div>
      <div class="form-group"><label>Date</label><input value="${cake.date}" disabled /></div>
    </div>
    <div class="form-group"><label>Price (LKR)</label><input id="viewCakePrice" type="number" min="0" step="0.01"  value="${cake.price || ''}" ${isPending ? '' : 'disabled'} /></div>
    <div class="form-group"><label>Fulfillment</label><input value="${cake.fulfillmentStatus || 'Pending'}" disabled /></div>
    <div class="btn-group">
      ${isPending ? `
        <button class="btn btn-success" onclick="approveCustomCake('${cake.id}')"><i class="fas fa-check"></i> Approve</button>
        <button class="btn btn-danger" onclick="rejectCustomCake('${cake.id}')"><i class="fas fa-times"></i> Reject</button>
      ` : ''}
      <button class="btn btn-outline" onclick="closeViewCakeModal()">Close</button>
    </div>
  `;
  document.getElementById('viewCakeModal').classList.add('active');
}

async function approveCustomCake(id) {
  const returnTab = currentTab;
  const priceInput = document.getElementById('viewCakePrice');
  let price = priceInput ? parseFloat(priceInput.value) : 0;

  // Programmatic validation: Ensure a valid price is filled when accepting
  if (!priceInput || isNaN(price) || price <= 0) {
    alert("Please enter a valid pricing value amount (LKR) before accepting this order.");
    if (priceInput) priceInput.focus(); // Highlights the input box for the supervisor
    return; // Halts execution so the unpriced data is never sent to the backend module
  }

  const response = await CustomAPI.approve(id, null, price);
  if (!response.success) {
    alert(response.message || 'Failed to approve custom cake request');
    return;
  }
  await loadAppData();
  showToast(`Custom cake ${id} approved — order total set to ${price}.`);
  closeViewCakeModal();
  renderTab(returnTab);
}

async function rejectCustomCake(id) {
  const returnTab = currentTab;
  const response = await CustomAPI.reject(id);
  if (!response.success) {
    alert(response.message || 'Failed to reject custom cake request');
    return;
  }
  await loadAppData();
  showToast(`Custom cake ${id} rejected.`);
  closeViewCakeModal();
  renderTab(returnTab);
}

function closeViewCakeModal() {
  document.getElementById('viewCakeModal').classList.remove('active');
}

async function deleteCustomCake(id) {
  if (!confirm(`Are you sure you want to permanently delete custom cake request #${id}?`)) return;
  const response = await CustomAPI.delete(id);
  if (!response.success) {
    alert(response.message || 'Failed to delete custom cake request');
    return;
  }
  await loadAppData();
  showToast(`Custom cake #${id} deleted successfully.`);
  renderTab(currentTab);
}

function renderViewCustomCakeRequest() {
  const pendingCakes = customCakeRequests.filter(c => c.status === 'Pending');
  const rejectedCakes = customCakeRequests.filter(c => c.status === 'Rejected');

  let pendingRows = pendingCakes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-orange">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>
  `).join('');

  let rejectedRows = rejectedCakes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-red">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCustomCake('${c.id}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-clock" style="color:var(--orange);margin-right:0.5rem;"></i> Pending Cake Requests</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box"  id="viewCakeSearch" oninput="filterViewCustomCakes()" />
          <span class="badge badge-orange">${pendingCakes.length} Pending</span>
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Design</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        <tbody id="viewCakeBody">${pendingRows || '<tr><td colspan="6" class="text-muted text-center py-2">No pending requests.</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-times-circle" style="color:var(--red);margin-right:0.5rem;"></i> Rejected Cake Requests</h3>
        <span class="badge badge-red">${rejectedCakes.length} Rejected</span>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Design</th><th>Date</th><th>Status</th><th>Actions</th></tr>
        <tbody id="rejectedCakeBody">${rejectedRows || '<tr><td colspan="6" class="text-muted text-center py-2">No rejected requests.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function filterViewCustomCakes() {
  const search = document.getElementById('viewCakeSearch').value.toLowerCase();
  const pendingCakes = customCakeRequests.filter(c => 
      c.status === 'Pending' && (
      String(c.id).toLowerCase().includes(search) ||
      c.customer.toLowerCase().includes(search) ||
      c.design.toLowerCase().includes(search)
    )
  );
  const tbody = document.getElementById('viewCakeBody');
  tbody.innerHTML = pendingCakes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-orange">${c.status}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-muted text-center py-2">No pending requests matching your search.</td></tr>';
}

// Global function to print receipts for custom cake orders
window.printCustomCakeReceipt = function(orderId) {
  const order = customCakeRequests.find(c => String(c.id) === String(orderId));
  if (!order) {
    alert("Custom cake order data could not be located in application storage references.");
    return;
  }
  
  const now = new Date();
  const printWindow = window.open('', '_blank');
  const displayPrice = order.price && Number(order.price) > 0 ? `LKR ${Number(order.price).toFixed(2)}` : 'Pending Quote';
  
  printWindow.document.write(`
  <html>
  <head>
      <title>Peoples Bakers - Receipt #CK-${order.id}</title>
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          
          body { 
              min-height: 100vh; 
              display: flex; 
              flex-direction: column; 
              padding: 40px; 
              color: #1e1e2a; 
              background: #fff; 
          }
          .receipt-content { flex: 1; }
          
          .receipt-header { text-align: center; border-bottom: 2px solid #6b3fa0; padding-bottom: 15px; margin-bottom: 20px; }
          .receipt-header h1 { font-size: 28px; color: #4f2e7a; font-weight: 700; letter-spacing: -0.5px; }
          .receipt-header p { font-size: 13px; color: #5a5a72; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }
          
          .detail-block { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #e4dfed; }
          .detail-title { font-size: 12px; font-weight: 700; color: #5a5a72; text-transform: uppercase; margin-bottom: 4px; }
          .detail-value { font-size: 14px; color: #2d2d3f; font-weight: 500; }
          
          .total-block { border-top: 2px solid #4f2e7a; padding-top: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .total-block span { font-size: 14px; font-weight: 700; color: #5a5a72; }
          .total-block strong { font-size: 22px; font-weight: 700; color: #4f2e7a; }
          
          .metadata-section { font-size: 13px; line-height: 1.6; color: #2d2d3f; border-top: 1px solid #e4dfed; padding-top: 15px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .meta-label { font-weight: 600; color: #5a5a72; }
          .meta-value { font-weight: 500; color: #1e1e2a; }
          
          .thank-you { text-align: center; margin-top: 30px; font-size: 12px; color: #8c7aa8; font-weight: 500; }
          
          @media print { 
              body { padding: 20px; height: 100vh; } 
              @page { size: auto; margin: 0; } 
          }
      </style>
  </head>
  <body>
      <div class="receipt-content">
          <div class="receipt-header">
              <h1>Peoples Bakers</h1>
              <p>Custom Cake Request Receipt</p>
          </div>
          
          <div class="detail-block">
              <div class="detail-title">Cake Design Summary</div>
              <div class="detail-value"><strong>${order.design}</strong></div>
          </div>
          
          <div class="detail-block">
              <div class="detail-title">Thematic Description Details</div>
              <div class="detail-value">${order.description || 'No description provided.'}</div>
          </div>
          
          <div class="total-block">
              <span>NET AMOUNT</span>
              <strong>${displayPrice}</strong>
          </div>
          
          <div class="metadata-section">
              <div class="meta-row">
                  <span class="meta-label">Customer Name:</span>
                  <span class="meta-value">${order.customer}</span>
              </div>
              <div class="meta-row">
                  <span class="meta-label">Contact Phone:</span>
                  <span class="meta-value">${order.phone || 'N/A'}</span>
              </div>
              <div class="meta-row">
                  <span class="meta-label">Required Date:</span>
                  <span class="meta-value">${order.date || 'N/A'}</span>
              </div>
              <div class="meta-row">
                  <span class="meta-label">Printed Date:</span>
                  <span class="meta-value">${now.toLocaleDateString()} @ ${now.toLocaleTimeString()}</span>
              </div>
              <div class="meta-row" style="margin-top: 10px; font-size: 15px;">
                  <span class="meta-label" style="color: #4f2e7a; font-weight: 700;">ORDER ID:</span>
                  <span class="meta-value" style="color: #4f2e7a; font-weight: 700;">#CK-00${order.id}</span>
              </div>
          </div>
      </div>
      <p class="thank-you">Thank you for your business! Come back again.</p>
  </body>
  </html>
  `);
  
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
      printWindow.print();
      printWindow.close();
  }, 250);
};