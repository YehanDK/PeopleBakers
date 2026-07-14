// ============================================================
//  INVENTORY MANAGEMENT
// ============================================================

let editIndex = -1;

async function renderInventoryManagement() {
  await loadAppData();
  let rows = inventoryItems.map((item, index) => {
    const stock = Number(item.stock_qty ?? item.stock ?? 0);
    const statusClass = stock < 10 ? 'badge-red' :
      stock < 20 ? 'badge-orange' : 'badge-green';
    const statusText = stock < 10 ? 'Critical' :
      stock < 20 ? 'Low' : 'In Stock';
    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${stock}</td>
      <td>$${Number(item.price || 0).toFixed(2)}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewItem(${index})"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-yellow" onclick="openEditItem(${index})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem(${index})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-boxes-stacked" style="color:var(--primary);margin-right:0.5rem;"></i> Inventory Items</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <input class="search-box" placeholder="Search items..." id="inventorySearch" oninput="filterInventoryItems()" />
          <button class="btn btn-success" onclick="openAddItemModal()"><i class="fas fa-plus"></i> Add New Item</button>
        </div>
      </div>
      <table>
        <tr><th>Item Name</th><th>Quantity</th><th>Price</th><th>Status</th><th>Actions</th></tr>
        <tbody id="inventoryBody">${rows || '<tr><td colspan="5" class="text-muted text-center py-2">No items in inventory.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function filterInventoryItems() {
  const search = document.getElementById('inventorySearch').value.toLowerCase();
  const filtered = inventoryItems.filter(item =>
    (item.name || '').toLowerCase().includes(search)
  );
  const tbody = document.getElementById('inventoryBody');
  tbody.innerHTML = filtered.map((item, index) => {
    const stock = Number(item.stock_qty ?? item.stock ?? 0);
    const statusClass = stock < 10 ? 'badge-red' :
      stock < 20 ? 'badge-orange' : 'badge-green';
    const statusText = stock < 10 ? 'Critical' :
      stock < 20 ? 'Low' : 'In Stock';
    const origIndex = inventoryItems.indexOf(item);
    return `<tr>
      <td><strong>${item.name}</strong></td>
      <td>${stock}</td>
      <td>$${Number(item.price || 0).toFixed(2)}</td>
      <td><span class="badge ${statusClass}">${statusText}</span></td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewItem(${origIndex})"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-yellow" onclick="openEditItem(${origIndex})"><i class="fas fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteItem(${origIndex})"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="5" class="text-muted text-center py-2">No items found matching your search.</td></tr>';
}
// Restock functions
let editRestockId = null;

function openRestockModal() {
  document.getElementById('restockId').value = '';

  const select = document.getElementById('restockItem');
  select.innerHTML = '<option value="">Select item</option>' +
    inventoryItems.map(item => `<option value="${item.product_id || item.id}">${item.name}</option>`).join('');

  const supplierSelect = document.getElementById('restockSupplier');
  supplierSelect.innerHTML = '<option value="">Select supplier</option>' +
    suppliers.map(s => `<option value="${s.supplier_id || s.id}">${s.name}</option>`).join('');

  document.getElementById('restockDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('restockModal').classList.add('active');
}

function closeRestockModal() {
  document.getElementById('restockModal').classList.remove('active');
  document.getElementById('restockForm').reset();
}

async function saveRestock(e) {
  e.preventDefault();
  const product_id = document.getElementById('restockItem').value;
  const supplier_id = document.getElementById('restockSupplier').value;
  const qty = parseInt(document.getElementById('restockQty').value);
  const unitCost = parseFloat(document.getElementById('restockUnitCost').value);
  const date = document.getElementById('restockDate').value;
  const notes = document.getElementById('restockNotes').value;

  if (!product_id || !supplier_id || !qty || !unitCost || !date) {
    alert('Please fill in all required fields.');
    return;
  }

  const response = await RestockAPI.create({ product_id, supplier_id, quantity: qty, unit_cost: unitCost, restock_date: date, notes });
  if (response.success) {
    await loadAppData();
    closeRestockModal();
    renderTab('restock');
    showToast('Restock recorded successfully.');
  } else {
    alert(response.message || 'Failed to record restock');
  }
}

async function deleteRestock(id) {
  if (!confirm(`Delete restock ${id}?`)) return;
  const response = await RestockAPI.delete(id);
  if (response.success) {
    await loadAppData();
    renderTab('restock');
    showToast(`Restock ${id} deleted.`);
  } else {
    alert(response.message || 'Failed to delete restock');
  }
}

function closeViewRestockModal() {
  document.getElementById('viewRestockModal').classList.remove('active');
}

function viewRestock(id) {
  const record = restockRecords.find(r => String(r.id) === String(id));
  if (!record) return;
  const content = document.getElementById('viewRestockContent');
  content.innerHTML = `
    <div class="form-group"><label>Restock ID</label><input value="${record.id}" disabled /></div>
    <div class="form-row">
      <div class="form-group"><label>Item</label><input value="${record.item}" disabled /></div>
      <div class="form-group"><label>Supplier</label><input value="${record.supplier}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Quantity</label><input value="${record.qty}" disabled /></div>
      <div class="form-group"><label>Unit Cost</label><input value="$${record.unitCost.toFixed(2)}" disabled /></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label>Total Cost</label><input value="$${(record.qty * record.unitCost).toFixed(2)}" disabled /></div>
      <div class="form-group"><label>Date</label><input value="${record.date}" disabled /></div>
    </div>
    <div class="form-group"><label>Notes</label><textarea disabled rows="3">${record.notes || 'N/A'}</textarea></div>
  `;
  document.getElementById('viewRestockModal').classList.add('active');
}

function editRestock(id) {
  const record = restockRecords.find(r => String(r.id) === String(id));
  if (!record) return;
  editRestockId = id;
  document.getElementById('editRestockId').value = record.id;
  document.getElementById('editRestockItem').value = record.item;

  const supplierSelect = document.getElementById('editRestockSupplier');
  supplierSelect.innerHTML = suppliers.map(s =>
    `<option value="${s.supplier_id || s.id}" ${String(s.supplier_id || s.id) === String(record.supplier_id) ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  document.getElementById('editRestockQty').value = record.qty;
  document.getElementById('editRestockUnitCost').value = record.unitCost;
  document.getElementById('editRestockDate').value = record.date;
  document.getElementById('editRestockNotes').value = record.notes || '';
  document.getElementById('editRestockModal').classList.add('active');
}

function closeEditRestockModal() {
  document.getElementById('editRestockModal').classList.remove('active');
  editRestockId = null;
}

async function renderStockNotification() {
  await loadAppData();
  const critical = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 5);
  const low = inventoryItems.filter(i => Number(i.stock_qty ?? i.stock ?? 0) < 15 && Number(i.stock_qty ?? i.stock ?? 0) >= 5);

  let notifications = '';
  
  critical.forEach(item => {
    notifications += `
      <div class="notification-item critical">
        <div><span class="msg-icon"><i class="fas fa-exclamation-circle"></i></span></div>
        <div class="msg-content">
          <div class="msg-title">⚠️ Critical Stock: ${item.name}</div>
          <div class="msg-desc">Only ${Number(item.stock_qty ?? item.stock ?? 0)} units remaining. Please restock immediately!</div>
        </div>
        <div class="msg-time">Now</div>
      </div>
    `;
  });
  
  low.forEach(item => {
    notifications += `
      <div class="notification-item warning">
        <div><span class="msg-icon"><i class="fas fa-triangle-exclamation"></i></span></div>
        <div class="msg-content">
          <div class="msg-title">Low Stock: ${item.name}</div>
          <div class="msg-desc">${Number(item.stock_qty ?? item.stock ?? 0)} units remaining. Consider restocking soon.</div>
        </div>
        <div class="msg-time">Now</div>
      </div>
    `;
  });
  
  if (!notifications) {
    notifications = `<div class="notification-item info"><div><span class="msg-icon"><i class="fas fa-check-circle" style="color:var(--green);"></i></span></div><div class="msg-content"><div class="msg-title">All Stock Levels Are Healthy</div><div class="msg-desc">No critical or low stock items currently.</div></div></div>`;
  }
  
  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-bell" style="color:var(--primary);margin-right:0.5rem;"></i> Stock Notifications</h3>
        <span class="badge ${critical.length > 0 ? 'badge-red' : 'badge-green'}">${critical.length} Critical, ${low.length} Low</span>
      </div>
      ${notifications}
    </div>
  `;
}

// View Item Modal
function viewItem(index) {
  const item = inventoryItems[index];
  if (!item) return;

  const stock = Number(item.stock_qty ?? item.stock ?? 0);
  const statusClass = stock < 10 ? 'badge-red' :
    stock < 20 ? 'badge-orange' : 'badge-green';
  const statusText = stock < 10 ? 'Critical' :
    stock < 20 ? 'Low' : 'In Stock';
  
  const modalContent = `
    <div class="modal-overlay active" id="viewItemModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3><i class="fas fa-eye" style="color:var(--primary);margin-right:0.5rem;"></i> Item Details</h3>
          <button class="modal-close" onclick="closeViewItemModal()">&times;</button>
        </div>
        <div class="view-item-detail">
          <div class="detail-row">
            <span class="label">Item Name</span>
            <span class="value"><strong>${item.name}</strong></span>
          </div>
          <div class="detail-row">
            <span class="label">Quantity</span>
            <span class="value">${stock} units</span>
          </div>
          <div class="detail-row">
            <span class="label">Price</span>
            <span class="value">$${Number(item.price || 0).toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Total Value</span>
            <span class="value">$${(stock * Number(item.price || 0)).toFixed(2)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Status</span>
            <span class="value"><span class="badge ${statusClass}">${statusText}</span></span>
          </div>
          <div class="detail-row">
            <span class="label">Category</span>
            <span class="value">${item.category || 'N/A'}</span>
          </div>
        </div>
        <div class="btn-group mt-2">
          <button class="btn btn-yellow" onclick="closeViewItemModal();openEditItem(${index})"><i class="fas fa-pen"></i> Edit Item</button>
          <button class="btn btn-outline" onclick="closeViewItemModal()">Close</button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('viewItemModal');
  if (existingModal) {
    existingModal.remove();
  }
  
  document.body.insertAdjacentHTML('beforeend', modalContent);
}

function closeViewItemModal() {
  const modal = document.getElementById('viewItemModal');
  if (modal) {
    modal.remove();
  }
}

async function getCategories() {

    const response = await fetch(
        'modules/products/api.php?action=categories'
    );

    return await response.json();

}
async function openAddItemModal() {
  document.getElementById('addItemForm').reset();

  const categories = await getCategories();

  const select = document.getElementById('newItemCategory');

  select.innerHTML = `
      <option value="">None</option>
  `;

  categories.forEach(category => {

      select.innerHTML += `
          <option value="${category.category_id}">
              ${category.category_name}
          </option>
      `;

  });

  document.getElementById('addItemModal').classList.add('active');
}


function closeAddItemModal() {
  document.getElementById('addItemModal').classList.remove('active');
}

async function handleAddItem(e) {
  e.preventDefault();
  const name = document.getElementById('newItemName').value.trim();
  const price = parseFloat(document.getElementById('newItemPrice').value);
  const stock = parseInt(document.getElementById('newItemStock').value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert('Please fill in all required fields.');
    return;
  }
  if (inventoryItems.some(i => (i.name || '').toLowerCase() === name.toLowerCase())) {
    alert('Item already exists. Use the Adjust function to modify it.');
    return;
  }
  const category_id = document.getElementById("newItemCategory").value || null;
  const response = await InventoryAPI.create({ name, price, stock_qty: stock, category_id });
  if (response.success) {
    await loadAppData();
    closeAddItemModal();
    renderTab('inventory');
    showToast(`"${name}" added to inventory.`);
  } else {
    alert(response.message || 'Failed to add item');
  }
}

async function deleteItem(index) {
  const item = inventoryItems[index];
  const name = item?.name || 'item';
  if (!confirm(`Remove "${name}" from inventory?`)) return;

  const response = await InventoryAPI.delete(item.product_id || item.id);
  if (response.success) {
    await loadAppData();
    renderTab('inventory');
    showToast(`"${name}" removed.`);
  } else {
    alert(response.message || 'Failed to delete item');
  }
}

function openEditItem(index) {
  editIndex = index;
  const item = inventoryItems[index];
  if (!item) return;
  document.getElementById('editItemName').value = item.name;
  document.getElementById('editItemPrice').value = Number(item.price || 0);
  document.getElementById('editItemStock').value = Number(item.stock_qty ?? item.stock ?? 0);
  document.getElementById('editItemModal').classList.add('active');
}

function closeEditItemModal() {
  document.getElementById('editItemModal').classList.remove('active');
  editIndex = -1;
}

async function handleEditItem(e) {
  e.preventDefault();
  if (editIndex < 0 || editIndex >= inventoryItems.length) return;
  const item = inventoryItems[editIndex];
  const price = parseFloat(document.getElementById('editItemPrice').value);
  const stock = parseInt(document.getElementById('editItemStock').value);
  if (isNaN(price) || isNaN(stock) || price < 0 || stock < 0) {
    alert('Please enter valid positive numbers.');
    return;
  }

  const response = await InventoryAPI.update({ product_id: item.product_id || item.id, price, stock_qty: stock });
  if (response.success) {
    await loadAppData();
    closeEditItemModal();
    renderTab('inventory');
    showToast('Item updated.');
  } else {
    alert(response.message || 'Failed to update item');
  }
}

// ----- Restock Management with Search -----
function renderRestockManagement() {
  let tableRows = restockRecords.map((r, index) => {
    const total = (r.qty * r.unitCost).toFixed(2);
    return `<tr>
      <td><span class="employee-id">${r.id}</span></td>
      <td>${r.item}</td>
      <td>${r.supplier}</td>
      <td>${r.qty}</td>
      <td>$${r.unitCost.toFixed(2)}</td>
      <td>$${total}</td>
      <td>${r.date}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewRestock('${r.id}')"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-yellow" onclick="editRestock('${r.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteRestock('${r.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-arrows-rotate" style="color:var(--primary);margin-right:0.5rem;"></i> Restock Records</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
          <input class="search-box" placeholder="Search restocks..." id="restockSearch" oninput="filterRestockRecords()" />
          <button class="btn btn-success" onclick="openRestockModal()"><i class="fas fa-plus"></i> Record Restock</button>
        </div>
      </div>
      <table>
        <tr><th>Restock ID</th><th>Item</th><th>Supplier</th><th>Qty</th><th>Unit Cost</th><th>Total Cost</th><th>Restock Date</th><th>Actions</th></tr>
        <tbody id="restockBody">${tableRows || '<tr><td colspan="8" class="text-muted text-center py-2">No restock records yet.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function filterRestockRecords() {
  const search = document.getElementById('restockSearch').value.toLowerCase();
  const filtered = restockRecords.filter(r =>
    String(r.id).toLowerCase().includes(search) ||
    r.item.toLowerCase().includes(search) ||
    r.supplier.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('restockBody');
  tbody.innerHTML = filtered.map(r => {
    const total = (r.qty * r.unitCost).toFixed(2);
    return `<tr>
      <td><span class="employee-id">${r.id}</span></td>
      <td>${r.item}</td>
      <td>${r.supplier}</td>
      <td>${r.qty}</td>
      <td>$${r.unitCost.toFixed(2)}</td>
      <td>$${total}</td>
      <td>${r.date}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewRestock('${r.id}')"><i class="fas fa-eye"></i></button>
        <button class="btn btn-sm btn-yellow" onclick="editRestock('${r.id}')"><i class="fas fa-edit"></i></button>
        <button class="btn btn-sm btn-danger" onclick="deleteRestock('${r.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" class="text-muted text-center py-2">No restock records found matching your search.</td></tr>';
}
async function handleEditRestock(e) {
  e.preventDefault();
  if (!editRestockId) {
    alert('No restock record selected for editing.');
    return;
  }

  const record = restockRecords.find(r => String(r.id) === String(editRestockId));
  if (!record) {
    alert('Restock record not found.');
    return;
  }

  const supplier_id = document.getElementById('editRestockSupplier').value.trim();
  const qty = parseInt(document.getElementById('editRestockQty').value);
  const unitCost = parseFloat(document.getElementById('editRestockUnitCost').value);
  const date = document.getElementById('editRestockDate').value;
  const notes = document.getElementById('editRestockNotes').value.trim();

  if (!supplier_id || !qty || !unitCost || !date) {
    alert('Please fill in all required fields.');
    return;
  }

  const response = await RestockAPI.update({ restock_id: record.id, supplier_id, quantity: qty, unit_cost: unitCost, restock_date: date, notes });
  if (response.success) {
    await loadAppData();
    closeEditRestockModal();
    renderTab('restock');
    showToast(`Restock ${record.id} updated successfully.`);
  } else {
    alert(response.message || 'Failed to update restock');
  }
}

