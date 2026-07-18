// ============================================================
//  CUSTOM CAKE MANAGEMENT ( Cleaned & Synchronized Workflow )
// ============================================================

const CAKE_FULFILLMENT_STATUSES = ['Preparing', 'Ready for Pickup', 'Completed'];

// Sales assistants only ever see cakes the supervisor has approved.
function getVisibleCakeRequests() {
  if (currentUser && currentUser.role === 'salesassistant') {
    const visibleStatuses = ['Approved', 'Preparing', 'Ready for Pickup', 'Completed'];
    return customCakeRequests.filter(c => visibleStatuses.includes(c.status));
  }
  return customCakeRequests;
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
      <td><span class="badge ${fulfillmentBadgeClass(c.fulfillmentStatus)}">${c.fulfillmentStatus}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateCustomCakeStatus('${c.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-cake-candles" style="color:var(--primary);margin-right:0.5rem;"></i> Approved Custom Cakes</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <input class="search-box" placeholder="Search by customer or design..." id="cakeOrderSearch" oninput="filterCustomCakeOrders()" />
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Design</th><th>Date</th><th>Fulfillment Status</th><th>Action</th></tr>
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
      <td><span class="badge ${fulfillmentBadgeClass(c.fulfillmentStatus)}">${c.fulfillmentStatus}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateCustomCakeStatus('${c.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>
  `).join('');

  const select = document.getElementById('updateCustomCakeSelect');
  select.innerHTML = filtered.map(c => `<option value="${c.id}">${c.id} - ${c.customer}</option>`).join('');
}

async function updateCustomCakeStatus(id) {
  const order = getVisibleCakeRequests().find(c => String(c.id) === String(id));
  if (!order) return;
  const currentIndex = CAKE_FULFILLMENT_STATUSES.indexOf(order.fulfillmentStatus);
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
    renderTab('custom-cake');
  } else {
    showToast(`Custom cake ${id} is already ${order.fulfillmentStatus}.`);
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
  renderTab('custom-cake');
}

function renderManualRequest() {
  return `
    <div class="card"><h3>Manual Custom Cake Request</h3>
      <p class="text-muted">Submit a new custom cake request</p>
      <div class="form-group"><label>Customer Name</label><input id="manualCustomer" placeholder="Customer name" required/></div>
      <div class="form-group"><label>Phone Number</label><input id="manualPhone" placeholder="(555) 000-0000" required/></div>
      <div class="form-group"><label>Cake Design</label><input id="manualDesign" placeholder="e.g. 2-tier floral" required/></div>
      <div class="form-group"><label>Description</label><textarea id="manualDescription" placeholder="Describe the cake design, colors, theme, etc." rows="4" required></textarea></div>
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

function renderCustomCakeManagement() {
  const allCakes = customCakeRequests;

  let rows = allCakes.map(c => {
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
  }).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-cake-candles" style="color:var(--primary);margin-right:0.5rem;"></i> Custom Cake Requests</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box" placeholder="Search cakes..." id="cakeSearch" oninput="filterCustomCakes()" />
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
  const filtered = customCakeRequests.filter(c => (
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
        <button class="btn btn-sm btn-yellow" onclick="openEditCakeModal('${c.id}')"><i class="fas fa-edit"></i> Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteCustomCake('${c.id}')"><i class="fas fa-trash"></i> Delete</button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="6" class="text-muted text-center py-2">No cakes found matching your search.</td></tr>';
}

function openEditCakeModal(id) {
  const cake = customCakeRequests.find(c => String(c.id) === String(id));
  if (!cake) return;

  const modalContent = `
    <div class="modal-overlay active" id="editCakeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3><i class="fas fa-edit" style="color:var(--primary);margin-right:0.5rem;"></i> Edit Custom Cake</h3>
          <button class="modal-close" onclick="closeEditCakeModal()">&times;</button>
        </div>
        <form id="editCakeForm">
          <div class="form-group">
            <label>Order ID</label>
            <input value="${cake.id}" disabled style="background:#f0ebf7;color:#555;" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Customer Name</label>
              <input id="editCakeCustomer" value="${cake.customer}" required />
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input id="editCakePhone" value="${cake.phone}" />
            </div>
          </div>
          <div class="form-group">
            <label>Design</label>
            <input id="editCakeDesign" value="${cake.design}" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea id="editCakeDescription" rows="4">${cake.description}</textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Price (LKR)</label>
              <input type="number" id="editCakePrice" min="0" step="0.01" placeholder="0.00" value="${cake.price || ''}" />
            </div>
            <div class="form-group">
              <label>Date</label>
              <input type="date" id="editCakeDate" value="${cake.date}" />
            </div>
          </div>
          <div class="btn-group">
            <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> Update Cake</button>
            <button type="button" class="btn btn-outline" onclick="closeEditCakeModal()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const existingModal = document.getElementById('editCakeModal');
  if (existingModal) {
    existingModal.remove();
  }

  document.body.insertAdjacentHTML('beforeend', modalContent);
  document.getElementById('editCakeForm').dataset.cakeId = id;

  document.getElementById('editCakeForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const cakeId = this.dataset.cakeId;
    const cake = customCakeRequests.find(c => String(c.id) === String(cakeId));
    if (!cake) return;

    const payload = {
      order_id: cakeId,
      design_details: document.getElementById('editCakeDesign').value.trim(),
      description: document.getElementById('editCakeDescription').value.trim(),
      pickup_date: document.getElementById('editCakeDate').value,
      status: cake.status || 'Pending'
    };

    const response = await OrdersAPI.update(payload);
    if (!response.success) {
      alert(response.message || 'Failed to update custom cake request');
      return;
    }

    await loadAppData();
    closeEditCakeModal();
    showToast(`Custom cake ${cakeId} updated successfully!`);
    renderTab('cake-mgmt');
  });
}

function closeEditCakeModal() {
  const modal = document.getElementById('editCakeModal');
  if (modal) {
    modal.remove();
  }
}

function viewCustomCake(id) {
  const cake = customCakeRequests.find(c => String(c.id) === String(id));
  if (!cake) return;
  const isPending = cake.status === 'Pending' || cake.status === 'PendingApproval';
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
    <div class="form-group">
      <label>Price (LKR)</label>
      <input id="viewCakePrice" type="number" min="0" step="0.01" placeholder="0.00" value="${cake.price || ''}" ${isPending ? '' : 'disabled'} />
    </div>
    <div class="btn-group">
      ${isPending ? `
        <button class="btn btn-success" onclick="approveCustomCake('${cake.id}')"><i class="fas fa-check"></i> Accept</button>
        <button class="btn btn-danger" onclick="rejectCustomCake('${cake.id}')"><i class="fas fa-times"></i> Reject</button>
      ` : ''}
      <button class="btn btn-outline" onclick="closeViewCakeModal()">Close</button>
    </div>
  `;
  document.getElementById('viewCakeModal').classList.add('active');
}

async function approveCustomCake(id) {
  const priceInput = document.getElementById('viewCakePrice');
  let price = priceInput ? parseFloat(priceInput.value) : 0;

  // Prompt for dynamic pricing details if called outside modal or left blank
  if (isNaN(price) || price <= 0) {
    const promptedPrice = prompt("Enter the finalized contract pricing amount (LKR) for this custom cake order:");
    if (promptedPrice === null) return; 
    price = parseFloat(promptedPrice);
    if (isNaN(price) || price <= 0) {
        alert("Please provide a valid pricing configuration balance.");
        return;
    }
  }

  const response = await CustomAPI.approve(id, null, price);
  if (!response.success) {
    alert(response.message || 'Failed to authorize order selection parameters.');
    return;
  }
  await loadAppData();
  showToast(`Custom cake order #${id} has been accepted and pricing set to LKR ${price.toFixed(2)}.`);
  closeViewCakeModal();
  renderTab(currentTab);
}

async function rejectCustomCake(id) {
  if (!confirm(`Are you sure you want to reject custom cake order #${id}?`)) return;
  const response = await CustomAPI.reject(id);
  if (!response.success) {
    alert(response.message || 'Failed to reject custom cake request');
    return;
  }
  await loadAppData();
  showToast(`Custom cake ${id} rejected.`);
  closeViewCakeModal();
  renderTab(currentTab);
}

function closeViewCakeModal() {
  document.getElementById('viewCakeModal').classList.remove('active');
}

async function deleteCustomCake(id) {
  if (!confirm(`Delete custom cake request ${id}?`)) return;
  const response = await CustomAPI.delete(id);
  if (!response.success) {
    alert(response.message || 'Failed to delete custom cake request');
    return;
  }
  await loadAppData();
  showToast(`Custom cake ${id} deleted.`);
  renderTab(currentTab);
}

function renderViewCustomCakeRequest() {
  const pendingCakes = customCakeRequests.filter(c => c.status === 'Pending' || c.status === 'PendingApproval');
  const rejectedCakes = customCakeRequests.filter(c => c.status === 'Rejected');

  // Unified button configuration arrays tracking Accept, Reject, View configurations cleanly
  let pendingRows = pendingCakes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-orange">Pending</span></td>
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
          <input class="search-box" placeholder="Search pending requests..." id="viewCakeSearch" oninput="filterViewCustomCakes()" />
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
    (c.status === 'Pending' || c.status === 'PendingApproval') &&
    (String(c.id).toLowerCase().includes(search) ||
     c.customer.toLowerCase().includes(search) ||
     c.design.toLowerCase().includes(search))
  );

  const tbody = document.getElementById('viewCakeBody');
  tbody.innerHTML = pendingCakes.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.customer}</td>
      <td>${c.design}</td>
      <td>${c.date}</td>
      <td><span class="badge badge-orange">Pending</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-muted text-center py-2">No pending requests matching your search.</td></tr>';
}