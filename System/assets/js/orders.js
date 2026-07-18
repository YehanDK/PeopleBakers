// ============================================================
//  ORDER MANAGEMENT
// ============================================================
// to retrive the in stoore customer name without being overriden by a refresh. ( don't know something keeps hapening, the element is there but the value is beign overriden)
let tempCustomerName = '';
function updateTempCustomerName(val) {
    tempCustomerName = val;
}

function renderInStoreOrders() {
  const itemOptions = inventoryItems.map(item => `<option value="${item.name}">${item.name} - LKR ${Number(item.price || 0).toFixed(2)}</option>`).join('');
  const cartEmpty = instoreCart.length === 0;
  const cartSummary = cartEmpty ?
    `<div class="text-muted">No items added yet.</div>` :
    `
      <table class="instore-cart-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${instoreCart.map(line => `
            <tr>
              <td>${line.name}</td>
              <td>${line.qty}</td>
              <td>${line.price.toFixed(2)}</td>
              <td>LKR ${(line.qty * line.price).toFixed(2)}</td>
              <td><button class="btn btn-sm btn-danger" type="button" onclick="removeInStoreCartItem('${line.name}')">Remove</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  const totalAmount = instoreCart.reduce((sum, line) => sum + line.qty * line.price, 0).toFixed(2);

  let rows = inStoreOrders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>LKR ${o.total.toFixed(2)}</td>
      <td><span class="badge badge-green">${o.status || 'Completed'}</span></td>
      <td>${o.date}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewInStoreOrderDetails('${o.id}')"><i class="fas fa-eye"></i> View Order</button>
        <button class="btn btn-sm btn-outline" onclick="printInStoreReceipt('${o.id}')" style="margin-left: 0.25rem;"><i class="fas fa-print"></i> Print Receipt</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-store" style="color:var(--primary);margin-right:0.5rem;"></i> Create In-Store Order</h3>
      </div>
      <div class="form-row" style="gap:1rem;flex-wrap:wrap;align-items:flex-end;">
        <div class="form-group" style="flex:1;min-width:220px;">
          <label>Customer Name</label>
          <input type="text" id="instoreCustomer" placeholder="Customer Name" oninput="updateTempCustomerName(this.value)"/>
        </div>
        <div class="form-group" style="flex:1;min-width:220px;">
          <label>Item</label>
          <select id="instoreItemSelect">${itemOptions}</select>
        </div>
        <div class="form-group" style="width:120px;">
          <label>Quantity</label>
          <input type="number" id="instoreItemQty" value="1" min="1" />
        </div>
        <div class="form-group" style="margin-top:1.7rem;">
          <button class="btn btn-outline" type="button" onclick="addInStoreCartItem()"><i class="fas fa-plus"></i> Add Item</button>
        </div>
      </div>
      <div class="instore-order-summary card" style="margin-top:1rem;padding:1rem;">
        <div class="card-header" style="justify-content:space-between;gap:1rem;">
          <h3 style="margin:0;font-size:1rem;">Order Summary</h3>
          <span>Total: <strong>LKR ${totalAmount}</strong></span>
        </div>
        <div id="instoreCartSummary" style="padding:1rem 0;">${cartSummary}</div>
        <div style="display:flex;justify-content:flex-end;gap:1rem;align-items:center;">
          <button class="btn btn-success" type="button" onclick="placeInStoreOrder()"><i class="fas fa-check"></i> Place Order</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-top:1rem;">
      <div class="card-header">
        <h3><i class="fas fa-list" style="color:var(--primary);margin-right:0.5rem;"></i> In-Store Orders</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box" placeholder="Search orders..." id="inStoreSearch" oninput="filterInStoreOrders()" />
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Action</th></tr>
        <tbody id="inStoreBody">${rows}</tbody>
      </table>
    </div>
  `;
}

// print recipt for in store orders
function printInStoreReceipt(orderId) {
  const order = inStoreOrders.find(o => String(o.id) === String(orderId));
  if (!order) {
    alert("Order data could not be located in application storage references.");
    return;
  }

  const now = new Date();
  const printWindow = window.open('', '_blank');

  // Build the item rows safely parsing pricing limits
  const itemRowsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px dashed #e4dfed; color: #2d2d3f; font-weight: 500;">${item.name}</td>
      <td style="padding: 10px 0; border-bottom: 1px dashed #e4dfed; color: #5a5a72; text-align: center;">${item.qty}</td>
      <td style="padding: 10px 0; border-bottom: 1px dashed #e4dfed; color: #1e1e2a; text-align: right; font-weight: 600;">LKR ${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  printWindow.document.write(`
  <html>
  <head>
      <title>Peoples Bakers - Receipt #${order.id}</title>
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
          
          /* UPDATED: Body set to full height and flex-column to stretch content */
          body { 
              min-height: 100vh; 
              display: flex; 
              flex-direction: column; 
              padding: 40px; 
              color: #1e1e2a; 
              background: #fff; 
          }

          /* Content wrapper to allow the footer to push to bottom */
          .receipt-content { flex: 1; }
          
          .receipt-header { text-align: center; border-bottom: 2px solid #6b3fa0; padding-bottom: 15px; margin-bottom: 20px; }
          .receipt-header h1 { font-size: 28px; color: #4f2e7a; font-weight: 700; letter-spacing: -0.5px; }
          .receipt-header p { font-size: 13px; color: #5a5a72; font-weight: 600; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { text-align: left; padding: 8px 0; border-bottom: 2px solid #e4dfed; color: #5a5a72; font-size: 12px; text-transform: uppercase; font-weight: 700; }
          
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
              <p>In Store Order</p>
          </div>

          <table>
              <thead>
                  <tr>
                      <th>Product Name</th>
                      <th style="text-align: center;">QTY</th>
                      <th style="text-align: right;">Total</th>
                  </tr>
              </thead>
              <tbody>
                  ${itemRowsHtml}
              </tbody>
          </table>

          <div class="total-block">
              <span>NET AMOUNT</span>
              <strong>LKR ${order.total.toFixed(2)}</strong>
          </div>

          <div class="metadata-section">
              <div class="meta-row">
                  <span class="meta-label">Customer Name:</span>
                  <span class="meta-value">${order.customer}</span>
              </div>
              <div class="meta-row">
                  <span class="meta-label">Order Date:</span>
                  <span class="meta-value">${order.date}</span>
              </div>
              <div class="meta-row">
                  <span class="meta-label">Printed Date:</span>
                  <span class="meta-value">${now.toLocaleDateString()} @ ${now.toLocaleTimeString()}</span>
              </div>
              <div class="meta-row" style="margin-top: 10px; font-size: 15px;">
                  <span class="meta-label" style="color: #4f2e7a; font-weight: 700;">ORDER ID:</span>
                  <span class="meta-value" style="color: #4f2e7a; font-weight: 700;">#ORD-${order.id}</span>
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
}

function addInStoreCartItem() {
  const itemName = document.getElementById('instoreItemSelect').value;
  const qty = parseInt(document.getElementById('instoreItemQty').value, 10);
  const item = inventoryItems.find(i => i.name === itemName);

  if (!item) {
    alert('Please select a valid item.');
    return;
  }
  if (isNaN(qty) || qty <= 0) {
    alert('Please enter a valid quantity.');
    return;
  }

  // add stock validation for in store orders
  if (qty > item.stock) {
        alert(`Insufficient stock! Only ${item.stock} units available.`);
        return;
    }

  const existing = instoreCart.find(line => line.name === itemName);
  if (existing) {
    // Validate against cart total
        if (existing.qty + qty > item.stock) {
            alert(`Cannot add more. Total stock for ${item.name} is ${item.stock}.`);
            return;
        }

    existing.qty += qty;
  } else {
    instoreCart.push({ name: item.name, qty, price: Number(item.price || 0) });
  }

  document.getElementById('instoreItemQty').value = '1';
  renderTab('instore-orders');
}

async function placeInStoreOrder() {
  let customer = document.getElementById('instoreCustomer').value.trim();
  customer = customer || tempCustomerName || 'Guest Customer';

  if (instoreCart.length === 0) {
    alert('Please add at least one item to the order.');
    return;
  }

  const total = instoreCart.reduce((sum, line) => sum + line.qty * line.price, 0);
  const response = await OrdersAPI.create({
    customer_name: customer,
    customer_id: null,
    order_type: 'InStore',
    total_amount: total,
    items: instoreCart.map(line => ({ product_id: inventoryItems.find(item => item.name === line.name)?.product_id || null, quantity: line.qty, price: line.price }))
  });

  if (!response.success) {
    alert(response.message || 'Failed to place order');
    return;
  }

  await loadAppData();
  instoreCart = [];
  document.getElementById('instoreCustomer').value = '';
  renderTab('instore-orders');
  showToast('In-store order placed successfully.');
}

function removeInStoreCartItem(name) {
  instoreCart = instoreCart.filter(line => line.name !== name);
  renderTab('instore-orders');
}

function filterInStoreOrders() {
  const search = document.getElementById('inStoreSearch').value.toLowerCase();
  const filtered = inStoreOrders.filter(o =>
    String(o.id).toLowerCase().includes(search) ||
    o.customer.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('inStoreBody');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>LKR ${o.total.toFixed(2)}</td>
      <td><span class="badge badge-green">${o.status || 'Completed'}</span></td>
      <td>${o.date}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewInStoreOrderDetails('${o.id}')"><i class="fas fa-eye"></i> View Order</button>
        <button class="btn btn-sm btn-outline" onclick="printInStoreReceipt('${o.id}')" style="margin-left: 0.25rem;"><i class="fas fa-print"></i> Print Receipt</button>
      </td>
    </tr>
  `).join('');
}

async function updateInStoreStatus(id) {
  const order = inStoreOrders.find(o => String(o.id) === String(id));
  if (!order) return;
  const statuses = ['Pending', 'Preparing', 'Completed'];
  const currentIndex = statuses.indexOf(order.status);
  if (currentIndex < 2) {
    const nextStatus = statuses[currentIndex + 1];
    const response = await OrdersAPI.updateStatus(order.id, nextStatus);
    if (!response.success) {
      alert(response.message || 'Failed to update order status');
      return;
    }
    await loadAppData();
    showToast(`Order ${id} status updated to ${nextStatus}`);
    renderTab('instore-orders');
  } else {
    showToast(`Order ${id} is already completed.`);
  }
}

function viewInStoreOrderDetails(id) {
  const order = inStoreOrders.find(o => String(o.id) === String(id));
  if (!order) return;
  document.getElementById('detailOrderId').value = order.id;
  document.getElementById('detailCustomer').value = order.customer;
  document.getElementById('detailStatus').value = order.status;
  document.getElementById('detailItems').value = order.items.map(i => `${i.qty}x ${i.name} (LKR ${i.price.toFixed(2)})`).join('\n');
  document.getElementById('detailTotal').value = `LKR ${order.total.toFixed(2)}`;
  document.getElementById('orderDetailsModal').classList.add('active');
}
function renderOnlineOrders() {
  let rows = onlineOrders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>LKR ${o.total.toFixed(2)}</td>
      <td><span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${o.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateOnlineOrderStatus('${o.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewOnlineOrderDetails('${o.id}')"><i class="fas fa-eye"></i> Details</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-truck" style="color:var(--primary);margin-right:0.5rem;"></i> Online Orders</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box" placeholder="Search orders..." id="onlineOrderSearch" oninput="filterOnlineOrders()" />
        </div>
      </div>
      <table>
        <tr><th>Order ID</th><th>Customer</th><th>Total</th><th>Status</th><th>Actions</th></tr>
        <tbody id="onlineOrdersBody">${rows}</tbody>
      </table>
    </div>
    <div class="card">
      <div class="card-header">
        <h3>Update Order Status</h3>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Select Order</label>
          <select id="updateOnlineOrderSelect">
            ${onlineOrders.map(o => `<option value="${o.id}">${o.id} - ${o.customer}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>New Status</label>
          <select id="updateOnlineOrderStatus">
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
      <button class="btn" onclick="updateOnlineOrderStatusFromSelect()">Update Status</button>
    </div>
  `;
}

function filterOnlineOrders() {
  const search = document.getElementById('onlineOrderSearch').value.toLowerCase();
  const filtered = onlineOrders.filter(o =>
    String(o.id).toLowerCase().includes(search) ||
    o.customer.toLowerCase().includes(search)
  );
  const tbody = document.getElementById('onlineOrdersBody');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>LKR ${o.total.toFixed(2)}</td>
      <td><span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Pending' ? 'badge-orange' : 'badge-orange'}">${o.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateOnlineOrderStatus('${o.id}')"><i class="fas fa-sync"></i> Update Status</button>
        <button class="btn btn-sm btn-info" onclick="viewOnlineOrderDetails('${o.id}')"><i class="fas fa-eye"></i> Details</button>
      </td>
    </tr>
  `).join('');
}

async function updateOnlineOrderStatusFromSelect() {
  const id = document.getElementById('updateOnlineOrderSelect').value;
  const newStatus = document.getElementById('updateOnlineOrderStatus').value;
  
  // Directly call the API with the selected status
  const response = await OrdersAPI.updateStatus(id, newStatus);
  
  if (!response.success) {
    alert(response.message || 'Failed to update order status');
    return;
  }
  
  await loadAppData();
  showToast(`Order ${id} status updated to ${newStatus}`);
  renderTab('online-orders');
}

async function updateOnlineOrderStatus(id) {
  const order = onlineOrders.find(o => String(o.id) === String(id));
  if (!order) return;

  // Only advance through the statuses listed in the "New Status" combobox on this tab,
  // so the action button stays consistent with the available options (e.g. Pending, Preparing).
  const statusSelect = document.getElementById('updateOnlineOrderStatus');
  const allowedStatuses = statusSelect
    ? Array.from(statusSelect.options).map(opt => opt.value)
    : ['Pending', 'Preparing'];

  const currentIndex = allowedStatuses.indexOf(order.status);

  // Order is already in a later stage than this tab can handle (e.g. handed to delivery).
  if (currentIndex === -1) {
    showToast(`Order ${id} is already at '${order.status}'. No further update available here.`);
    return;
  }

  if (currentIndex < allowedStatuses.length - 1) {
    const nextStatus = allowedStatuses[currentIndex + 1];
    const response = await OrdersAPI.updateStatus(order.id, nextStatus);
    if (!response.success) {
      alert(response.message || 'Failed to update order status');
      return;
    }
    await loadAppData();
    showToast(`Order ${id} status updated to ${nextStatus}`);
    renderTab('online-orders');
  } else {
    showToast(`Order ${id} is already at '${order.status}'.`);
  }
}

function viewOnlineOrderDetails(id) {
  const order = onlineOrders.find(o => String(o.id) === String(id));
  if (!order) return;
  document.getElementById('detailOrderId').value = order.id;
  document.getElementById('detailCustomer').value = order.customer;
  document.getElementById('detailStatus').value = order.status;
  document.getElementById('detailItems').value = order.items.map(i => `${i.qty}x ${i.name} (LKR ${i.price.toFixed(2)})`).join('\n');
  document.getElementById('detailTotal').value = `LKR ${order.total.toFixed(2)}`;
  document.getElementById('orderDetailsModal').classList.add('active');
}

// ... rest of online order functions ...

// ----- Delivery Management with Search -----
function renderDeliveryManagement() {
  let rows = onlineOrders.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.customer_phone || o.phone || 'N/A'}</td>
      <td>${o.address || 'N/A'}</td>
      <td><span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Out for Delivery' ? 'badge-orange' : 'badge-orange'}">${o.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateDeliveryStatus('${o.id}')"><i class="fas fa-sync"></i> Update Status</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-truck-fast" style="color:var(--primary);margin-right:0.5rem;"></i> Delivery Management</h3>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <input class="search-box" placeholder="Search deliveries..." id="deliverySearch" oninput="filterDeliveryOrders()" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Select Order</label>
          <select id="deliveryOrderSelect">
            ${onlineOrders.map(o => `<option value="${o.id}">${o.id} - ${o.customer}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Update Status To</label>
          <select id="deliveryStatusSelect">
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
      </div>
      <button class="btn" onclick="updateDeliveryFromSelect()"><i class="fas fa-sync"></i> Update Status</button>
      <table class="mt-2">
        <tr><th>Order ID</th><th>Customer</th><th>Phone</th><th>Address</th><th>Status</th><th>Actions</th></tr>
        <tbody id="deliveryBody">${rows}</tbody>
      </table>
    </div>
  `;
}

function filterDeliveryOrders() {
  const search = document.getElementById('deliverySearch').value.toLowerCase();
  const filtered = onlineOrders.filter(o =>
    String(o.id).toLowerCase().includes(search) ||
    o.customer.toLowerCase().includes(search) ||
    String(o.address || '').toLowerCase().includes(search)
  );
  const tbody = document.getElementById('deliveryBody');
  tbody.innerHTML = filtered.map(o => `
    <tr>
      <td>${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.customer_phone || o.phone || 'N/A'}</td>
      <td>${o.address || 'N/A'}</td>
      <td><span class="badge ${o.status === 'Delivered' ? 'badge-green' : o.status === 'Out for Delivery' ? 'badge-orange' : 'badge-orange'}">${o.status}</span></td>
      <td>
        <button class="btn btn-sm btn-yellow" onclick="updateDeliveryStatus('${o.id}')"><i class="fas fa-sync"></i> Update Status</button>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="text-muted text-center py-2">No deliveries found matching your search.</td></tr>';
}

async function updateDeliveryStatus(id) {
  const order = onlineOrders.find(o => String(o.id) === String(id));
  if (!order) return;

  // Only advance through the statuses listed in the "Update Status To" combobox on this tab,
  // so the action button stays consistent with the available options (e.g. Out for Delivery, Delivered).
  const statusSelect = document.getElementById('deliveryStatusSelect');
  const allowedStatuses = statusSelect
    ? Array.from(statusSelect.options).map(opt => opt.value)
    : ['Out for Delivery', 'Delivered'];

  const currentIndex = allowedStatuses.indexOf(order.status);

  // Order is before this tab's stages (e.g. Pending/Preparing) -> jump to the first allowed status.
  if (currentIndex === -1) {
    const firstStatus = allowedStatuses[0];
    const response = await OrdersAPI.updateStatus(order.id, firstStatus);
    if (!response.success) {
      alert(response.message || 'Failed to update delivery status');
      return;
    }
    await loadAppData();
    showToast(`Order ${id} status updated to ${firstStatus}`);
    renderTab('delivery-mgmt');
    return;
  }

  if (currentIndex < allowedStatuses.length - 1) {
    const nextStatus = allowedStatuses[currentIndex + 1];
    const response = await OrdersAPI.updateStatus(order.id, nextStatus);
    if (!response.success) {
      alert(response.message || 'Failed to update delivery status');
      return;
    }
    await loadAppData();
    showToast(`Order ${id} status updated to ${nextStatus}`);
    renderTab('delivery-mgmt');
  } else {
    showToast(`Order ${id} is already at '${order.status}'.`);
  }
}

async function updateDeliveryFromSelect() {
  const id = document.getElementById('deliveryOrderSelect').value;
  const newStatus = document.getElementById('deliveryStatusSelect').value;
  const order = onlineOrders.find(o => String(o.id) === String(id));
  if (!order) return;
  const response = await OrdersAPI.updateStatus(order.id, newStatus);
  if (!response.success) {
    alert(response.message || 'Failed to update delivery status');
    return;
  }
  await loadAppData();
  showToast(`Order ${id} status updated to ${newStatus}`);
  renderTab('delivery-mgmt');
}