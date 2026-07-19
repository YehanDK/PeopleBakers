// ============================================================
//  CUSTOMER WORKSPACE COMPONENT VIEW ENGINE - WITH CART MATRIX
// ============================================================

// Global application session cart array
let onlineCart = [];

// 1. ONLINE STORE COMPONENT (With Live Search, Type Filters, and persistent Cart Frame)
async function renderOnlineStore() {
  await loadAppData(); // Synchronize live asset states from the database

  // Extract unique validation types across active database assets
  const categories = [...new Set(inventoryItems.map(item => item.category))];
  const filterOptions = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-shop" style="color:var(--primary);margin-right:0.5rem;"></i> Peoples Bakers Storefront</h3>
        <div style="display:flex; gap:1rem; align-items:center; flex-wrap:wrap; width:100%; max-width:600px;">
            <input type="text" class="search-box" style="max-width:100%; flex:2;"  id="storeSearchInput" oninput="filterOnlineStore()" />
            <select id="storeCategoryFilter" class="form-group" style="margin-bottom:0; flex:1; border-radius:40px; padding:0.5rem 1rem; border:1.5px solid var(--border-light);" onchange="filterOnlineStore()">
            <option value="all">All Categories</option>
            ${filterOptions}
          </select>
        </div>
      </div>
      <p class="text-muted">Freshly baked daily goods delivered directly straight to your neighborhood doorstep.</p>
    </div>
    
    <div style="display: grid; grid-template-columns: 2.8fr 1.2fr; gap: 1.5rem; align-items: start; margin-bottom: 2rem;">
      <div>
        <div id="customerStoreGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:1.5rem;">
          ${generateStoreProductCards(inventoryItems)}
        </div>
      </div>
      
      <div class="card" id="onlineCartContainer" style="position: sticky; top: 90px; padding: 1.5rem; border: 1px solid var(--border-light);">
        ${generateOnlineCartHTML()}
      </div>
    </div>
  `;
}

// Sub-component handler mapping dataset rows into responsive layout item cards
function generateStoreProductCards(items) {
  if (items.length === 0) {
    return `<div class="card text-center text-muted" style="grid-column: 1 / -1; padding:2rem;">No items matched your search criteria.</div>`;
  }

  return items.map(item => {
    const isOutOfStock = item.stock <= 0;
    // Clean strings safely to avoid breakages in JavaScript click listeners
    const escapedName = item.name.replace(/'/g, "\\'");
    return `
      <div class="card product-card" data-name="${item.name.toLowerCase()}" data-category="${item.category}" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:space-between; transition:0.2s; border:1px solid var(--border-light);">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
            <span class="badge badge-purple">${item.category}</span>
            <span class="badge ${isOutOfStock ? 'badge-red' : 'badge-green'}">${isOutOfStock ? 'Out of Stock' : 'In Stock: ' + item.stock}</span>
          </div>
          <h4 style="font-size:1.1rem; font-weight:600; color:var(--text-dark); margin: 0.5rem 0 0.25rem 0;">${item.name}</h4>
          <span style="font-size:1.3rem; font-weight:700; color:var(--primary-dark); display:block; margin-bottom:1rem;">LKR ${Number(item.price).toFixed(2)}</span>
        </div>
        
        <button class="btn ${isOutOfStock ? 'btn-outline' : 'btn-success'}" style="width:100%; justify-content:center;" ${isOutOfStock ? 'disabled' : `onclick="addItemToOnlineCart('${item.product_id}', '${escapedName}', ${item.price}, ${item.stock})"`}>
          <i class="fas ${isOutOfStock ? 'fa-ban' : 'fa-plus-circle'}"></i> ${isOutOfStock ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>
    `;
  }).join('');
}

// 2. LIVE SEARCH & FILTER EVENT CONTROLLER LOOP
function filterOnlineStore() {
  const query = document.getElementById('storeSearchInput').value.toLowerCase().trim();
  const selectedCategory = document.getElementById('storeCategoryFilter').value;

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(query);
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  document.getElementById('customerStoreGrid').innerHTML = generateStoreProductCards(filteredItems);
}

// ============================================================
//  NEW: SHOPPING CART MANAGEMENT INFRASTRUCTURE
// ============================================================

// Generates structural HTML elements for the shopping cart card
function generateOnlineCartHTML() {
  if (onlineCart.length === 0) {
    return `
      <div style="text-align:center; padding: 2rem 0; color: var(--text-gray);">
        <i class="fas fa-shopping-basket" style="font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.4;"></i>
        <p style="font-size: 0.95rem; margin:0;">Your shopping cart is empty.</p>
      </div>
    `;
  }

  let totalSum = 0;
  const itemsHTML = onlineCart.map(item => {
    const itemTotal = item.price * item.quantity;
    totalSum += itemTotal;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; padding: 0.75rem 0; border-bottom: 1px dashed var(--border-light);">
        <div style="flex:1; padding-right: 0.5rem;">
          <h5 style="margin:0; font-size:0.9rem; font-weight:600; color:var(--text-dark);">${item.name}</h5>
          <span style="font-size:0.8rem; color:var(--primary-dark); font-weight:600;">LKR ${item.price.toFixed(2)}</span>
        </div>
        
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <button class="btn" style="padding: 0.2rem 0.5rem; background:#f0ebf7; color:var(--primary); font-size:0.75rem; min-width:unset;" onclick="updateOnlineCartQuantity('${item.product_id}', ${item.quantity - 1}, ${item.maxStock})">-</button>
          <span style="font-size:0.85rem; font-weight:600; width:20px; text-align:center;">${item.quantity}</span>
          <button class="btn" style="padding: 0.2rem 0.5rem; background:#f0ebf7; color:var(--primary); font-size:0.75rem; min-width:unset;" onclick="updateOnlineCartQuantity('${item.product_id}', ${item.quantity + 1}, ${item.maxStock})">+</button>
        </div>
        
        <button style="background:none; border:none; color:var(--red); margin-left:0.75rem; cursor:pointer; font-size:0.9rem;" onclick="removeFromOnlineCart('${item.product_id}')" title="Remove item">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;
  }).join('');

  return `
    <h4 style="margin-top:0; margin-bottom:1rem; display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid var(--border-light); padding-bottom:0.5rem;">
      <span><i class="fas fa-shopping-cart" style="color:var(--primary);"></i> My Cart</span>
      <span class="badge badge-purple" style="font-size:0.75rem; padding: 0.2rem 0.6rem;">${onlineCart.reduce((acc, curr) => acc + curr.quantity, 0)} Items</span>
    </h4>
    
    <div style="max-height: 280px; overflow-y:auto; padding-right:0.25rem; margin-bottom:1rem;">
      ${itemsHTML}
    </div>
    
    <div style="border-top:1px solid var(--border-light); padding-top:1rem; margin-bottom:1.25rem; display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:600; color:var(--text-gray); font-size:0.9rem;">Estimated Total:</span>
      <span style="font-size:1.4rem; font-weight:700; color:var(--primary-dark);">LKR ${totalSum.toFixed(2)}</span>
    </div>
    
    <button class="btn btn-success" style="width:100%; justify-content:center; padding:0.75rem;" onclick="checkoutOnlineCart(${totalSum})">
      <i class="fas fa-credit-card"></i> Proceed to Checkout
    </button>
  `;
}

// Intercepts catalog item clicks and logs entries safely into active state map arrays
function addItemToOnlineCart(productId, name, price, maxStock) {
  const existingItem = onlineCart.find(item => item.product_id === productId);

  if (existingItem) {
    if (existingItem.quantity >= maxStock) {
      alert(`Cannot add more items. Only ${maxStock} units available in baking storage reserve.`);
      return;
    }
    existingItem.quantity += 1;
  } else {
    onlineCart.push({
      product_id: productId,
      name: name,
      price: Number(price),
      quantity: 1,
      maxStock: Number(maxStock)
    });
  }

  // Update layout viewport without forcing product catalog grid to redraw completely
  document.getElementById('onlineCartContainer').innerHTML = generateOnlineCartHTML();
  showToast(`${name} added to cart!`);
}

// Handles updating specific item indices up or down based on inventory levels
function updateOnlineCartQuantity(productId, newQty, maxStock) {
  if (newQty <= 0) {
    removeFromOnlineCart(productId);
    return;
  }
  if (newQty > maxStock) {
    alert(`Baking supply volume exception: Only ${maxStock} items currently available.`);
    return;
  }

  const targetItem = onlineCart.find(item => item.product_id === productId);
  if (targetItem) {
    targetItem.quantity = newQty;
  }
  document.getElementById('onlineCartContainer').innerHTML = generateOnlineCartHTML();
}

// Erases specific primary row item nodes completely out of the cart allocation scope
function removeFromOnlineCart(productId) {
  onlineCart = onlineCart.filter(item => item.product_id !== productId);
  document.getElementById('onlineCartContainer').innerHTML = generateOnlineCartHTML();
}

// Submits the complete cart contents as an integrated bulk purchase transaction
// ============================================================
//  UPDATED: SHOPPING CART CHECKOUT (STRICTLY CARD PAYMENT ONLY)
// ============================================================
async function checkoutOnlineCart(totalSum) {
  // 1. Render and append a card-only checkout overlay wrapper directly onto the DOM body
  const checkoutModal = document.createElement('div');
  checkoutModal.id = 'checkoutPaymentModal';
  checkoutModal.className = 'modal-overlay active';
  checkoutModal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; justify-content:center; align-items:center; z-index:10000;';

  checkoutModal.innerHTML = `
    <div class="modal-card" style="background:#fff; padding:2rem; border-radius:16px; width:100%; max-width:480px; box-shadow:0 12px 40px rgba(0,0,0,0.2); position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; border-bottom:1px solid var(--border-light); padding-bottom:0.5rem;">
        <h3 style="margin:0; color:var(--text-dark);"><i class="fas fa-credit-card" style="color:var(--primary);"></i> Secure Checkout</h3>
        <button id="closeCheckoutModalBtn" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-gray); font-weight:700;">&times;</button>
      </div>

      <div style="background:var(--primary-light); padding:1rem; border-radius:12px; margin-bottom:1.5rem; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; color:var(--primary-dark);">Total Amount:</span>
        <span style="font-size:1.4rem; font-weight:700; color:var(--primary-dark);">LKR ${totalSum.toFixed(2)}</span>
      </div>

      <form id="checkoutPaymentForm">
        <div id="cardDetailsFormFields">
          <div class="form-group">
            <label><i class="far fa-credit-card"></i> Card Number</label>
            <input type="text" id="cartCardNum"  maxlength="19" required />
          </div>
          <div class="form-row" style="display:flex; gap:1rem;">
            <div class="form-group" style="flex:1;">
              <label>Expiry Date</label>
              <input type="text" id="cartCardExpiry"  maxlength="5" required />
            </div>
            <div class="form-group" style="flex:1;">
              <label>CVC Security Code</label>
              <input type="password" id="cartCardCVC"  maxlength="3" required />
            </div>
          </div>
        </div>

        <div style="display:flex; gap:1rem; margin-top:2rem;">
          <button type="submit" class="btn btn-success" style="flex:1; justify-content:center; padding:0.8rem;"><i class="fas fa-lock"></i> Pay & Place Order</button>
          <button type="button" id="cancelCheckoutModalBtn" class="btn btn-outline" style="flex:1; justify-content:center;">Cancel</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(checkoutModal);

  // Helper cleanup reference closure closures
  const destroyModal = () => { checkoutModal.remove(); };
  document.getElementById('closeCheckoutModalBtn').addEventListener('click', destroyModal);
  document.getElementById('cancelCheckoutModalBtn').addEventListener('click', destroyModal);

  // Handle processing payment dispatch actions
  document.getElementById('checkoutPaymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Extract values and strip any whitespace formatting
    const cardNum = document.getElementById('cartCardNum').value.replace(/\s+/g, '');
    const expiry = document.getElementById('cartCardExpiry').value.trim();
    const cvc = document.getElementById('cartCardCVC').value.trim();

    // 1. Card Number Validation (Must be exactly 16 digits)
    if (!/^\d{16}$/.test(cardNum)) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }

    // 2. Expiry Date Validation (Format must match MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      alert('Please enter expiration date in MM/YY format.');
      return;
    }

    const [month, year] = expiry.split('/').map(Number);
    if (month < 1 || month > 12) {
      alert('Invalid expiry month. Must be between 01 and 12.');
      return;
    }

    // Check against real-time 2026 system date thresholds
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = Number(now.getFullYear().toString().slice(-2)); // Extracts '26'

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      alert('The card has expired. Please use a valid card.');
      return;
    }

    // 3. CVC Security Code Validation (Must be exactly 3 digits)
    if (!/^\d{3}$/.test(cvc)) {
      alert('Please enter a valid 3-digit CVC code.');
      return;
    }

    // Proceeding to API transmission if all conditions clear
    try {
      const response = await OrdersAPI.create({
        customer_id: currentUser.customer_id,
        customer_name: currentUser.name,
        order_type: 'Online',
        total_amount: Number(totalSum),
        payment_method: 'Card', 
        items: onlineCart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      });
      if (response.success) {
        showToast('Card payment authorized successfully! Your order has been placed.');
        onlineCart = [];
        destroyModal();
        await loadAppData();
        renderTab('online-store');
      } else {
        alert(response.message || 'Payment processing failed.');
      }
    } catch (error) {
      alert('Checkout transaction error: ' + error.message);
    }
  });
}

// ============================================================
//  4. CUSTOM CAKE REQUEST TAB VIEW (Requested formatting match)
// ============================================================
function renderCustomerCakeRequest() {
  return `
    <div class="card">
      <h3>Custom Cake Request</h3>
      <p class="text-muted">Have a vision for the perfect cake? Tell us your ideas, and we’ll make them a reality.</p><br>
      
      <div class="form-group">
        <label>Customer Name</label>
        <input id="manualCustomer" value="${currentUser.name}" disabled style="background:#f0ebf7; color:#555;" />
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input id="manualPhone" value="${currentUser.phone || ''}"  />
      </div>
      <div class="form-group">
        <label>Cake Design</label>
        <input id="manualDesign"  />
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea id="manualDescription"  rows="4"></textarea>
      </div>
      <div class="form-group">
        <label>Required Pickup Date <span style="color:var(--danger);">*</span></label>
        <input type="date" id="manualDate" required />
      </div>
      <button class="btn" onclick="submitCustomerCakeRequest()">Submit Request</button>
    </div>
  `;
}

// Custom cake processing transaction logic bridge
async function submitCustomerCakeRequest() {
  const design = document.getElementById('manualDesign').value.trim();
  const description = document.getElementById('manualDescription').value.trim();
  const phone = document.getElementById('manualPhone').value.trim();
  const pickup_date = document.getElementById('manualDate').value;

  if (!design) {
    alert('Please enter your requested cake design layout summary.');
    return;
  }


  const response = await OrdersAPI.create({
    customer_name: currentUser.name,
    customer_id: currentUser.customer_id,
    phone: phone,
    order_type: 'Custom',
    total_amount: 0,
    items: [],
    design_details: design,
    description: description || 'No specific descriptions applied.',
    pickup_date: pickup_date
  });

  if (!response.success) {
    alert(response.message || 'Custom request rejected.');
    return;
  }

  await loadAppData();
  showToast(`Custom cake design configuration submitted securely!`);
  renderTab('online-store');
}

// ============================================================
//  NEW: CUSTOMER ORDER & CAKE REQUEST HISTORY INTERFACE
// ============================================================
async function renderCustomerOrderHistory() {
  // Pull latest asynchronous real-time orders state directly from the database schema
  await loadAppData();

  const currentCustomerId = Number(currentUser.customer_id);

  // 1. Filter standard storefront online purchases for this customer
  const myOnlineOrders = onlineOrders.filter(order => 
        order.customer_id && Number(order.customer_id) === currentCustomerId
    );

  // 2. Filter custom cake request configurations for this customer
  const myCakeRequests = customCakeRequests.filter(cake => 
      cake.customer_id && Number(cake.customer_id) === currentCustomerId
  );

  // Helper utility to apply context-aware semantic status badges cleanly[cite: 5]
  const getStatusBadge = (status) => {
    const s = status.toLowerCase();
    if (['delivered', 'completed', 'confirmed'].includes(s)) return 'badge-green';
    if (['pending', 'preparing', 'out for delivery'].includes(s)) return 'badge-orange';
    return 'badge-red'; // For Cancelled or Rejected states[cite: 5]
  };

  // Compile individual table rows for standard storefront orders[cite: 5]
  let storeRows = myOnlineOrders.map(o => {
  const itemSummary = o.items.map(i => `${i.qty}x ${i.name}`).join(', ') || 'Product asset unlinked'; //
    return `
      <tr>
        <td><span class="employee-id">#ON-00${o.id}</span></td>
        <td>${o.date ? new Date(o.date).toLocaleDateString() : 'N/A'}</td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemSummary}">${itemSummary}</td>
        <td><strong>LKR ${o.total.toFixed(2)}</strong></td>
        <td><span class="badge ${getStatusBadge(o.status)}">${o.status}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="viewOnlineOrderDetails('${o.id}')"><i class="fas fa-eye"></i> View</button>
        </td>
      </tr>
    `;
  }).join('');

  // Compile individual table rows for custom cake workshop designs[cite: 5]
  // Compile individual table rows for custom bakery workshop designs
  let cakeRows = myCakeRequests.map(c => {
    const displayPrice = c.price && Number(c.price) > 0 ? `LKR ${Number(c.price).toFixed(2)}` : 'Pending Quote';
    return `
      <tr>
        <td><span class="employee-id">#CK-00${c.id}</span></td>
        <td>${c.date ? new Date(c.date).toLocaleDateString() : 'N/A'}</td>
        <td><strong>${c.design}</strong></td>
        <td style="max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.description}">${c.description}</td>
        <td><strong>${displayPrice}</strong></td>
        <td><span class="badge ${getStatusBadge(c.status)}">${c.status}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="viewCustomCake('${c.id}')"><i class="fas fa-eye"></i> View</button>
        </td>
      </tr>
    `;
  }).join('');

  // Return the combined dashboard workspace interface[cite: 5]
  return `
    <!-- Standard Storefront Orders Card -->
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-shopping-bag" style="color:var(--primary); margin-right:0.5rem;"></i> My Online Purchases</h3>
        <span class="badge badge-purple">${myOnlineOrders.length} Orders</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order Ref</th>
            <th>Purchase Date</th>
            <th>Purchased Items</th>
            <th>Total Amount</th>
            <th>Delivery Status</th>
          </tr>
        </thead>
        <tbody>
          ${storeRows || '<tr><td colspan="5" class="text-muted text-center py-2">You haven\'t placed any online storefront orders yet.</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Custom Bakery Workshop Decoration Requests Card -->
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h3><i class="fas fa-birthday-cake" style="color:var(--orange); margin-right:0.5rem;"></i> My Custom Cake Requests</h3>
        <span class="badge badge-purple">${myCakeRequests.length} Requests</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Submission Date</th>
            <th>Cake Design Summary</th>
            <th>Description Details</th>
            <th>Price</th>
            <th>Approval Status</th>
          </tr>
        </thead>
        <tbody>
          ${cakeRows || '<tr><td colspan="5" class="text-muted text-center py-2">You haven\'t submitted any custom cake designs yet.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
}

// ============================================================
//  5. CUSTOMER PROFILE MANAGEMENT TAB VIEW
// ============================================================
function renderCustomerProfileTab() {
  return `
    <div class="card" style="max-width: 700px; margin: 0 auto;">
      <h3><i class="fas fa-user-edit" style="color:var(--primary); margin-right:0.5rem;"></i> Edit My Profile Details</h3>
      <p class="text-muted">Modify your account details below.</p><br>
      
      <form id="customerProfileUpdateForm" onsubmit="saveCustomerProfileChanges(event)">
        <div class="form-row">
          <div class="form-group">
            <label>Customer Account ID</label>
            <input value="CUST-00${currentUser.customer_id}" disabled style="background:#f0ebf7; color:#555;" />
          </div>
          <div class="form-group">
            <label>Full Profile Name <span style="color:var(--danger);">*</span></label>
            <input type="text" id="profName" value="${currentUser.name}" required />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Registered Email <span style="color:var(--danger);">*</span></label>
            <input type="email" id="profEmail" value="${currentUser.email}" required />
          </div>
          <div class="form-group">
            <label>Contact Phone Line</label>
            <input type="text" id="profPhone" value="${currentUser.phone || ''}"  />
          </div>
        </div>
        
        <div class="form-group">
          <label>Primary Fulfillment Delivery Address</label>
          <textarea id="profAddress" style="border-radius:12px; resize:vertical;" rows="3" >${currentUser.address || ''}</textarea>
        </div>

        <div class="form-group" style="border-top: 1px dashed var(--border-light); padding-top: 1rem; margin-top: 1.5rem;">
          <label><i class="fas fa-key"></i> New Password (Leave completely blank to keep existing password)</label>
          <input type="password" id="profPassword"  autocomplete="new-password" />
        </div>

        <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1.5rem;">
          <button type="submit" class="btn btn-success" style="padding: 0.75rem 2rem;">
            <i class="fas fa-save"></i> Save Changes
          </button>
        </div>
      </form>
    </div>
  `;
}

// Transaction Bridge function transmitting structural profile modifications
async function saveCustomerProfileChanges(event) {
    event.preventDefault();
    const name = document.getElementById('profName').value.trim();
    const email = document.getElementById('profEmail').value.trim();
    const phone = document.getElementById('profPhone').value.trim();
    const address = document.getElementById('profAddress').value.trim();
    const password = document.getElementById('profPassword').value;

    try {
        const response = await CustomerAPI.update({
            customer_id: currentUser.customer_id,
            name, email, phone, address, password
        });
        
        if (response.success) {
            // FIX: Ensure currentUser is updated before setting property
            currentUser = { ...currentUser, name: name, email: email, phone: phone, address: address };
            currentUser.displayRole = 'Valued Customer'; 
            
            localStorage.setItem('peoplesBakersUser', JSON.stringify(currentUser));
            showToast('Your profile records have been updated successfully.');
            document.getElementById('userNameDisplay').textContent = currentUser.name;
            renderTab('customer-profile');
        } else {
            alert(response.message || 'Failed to apply modifications.');
        }
    } catch (error) {
        console.error('Profile adjustment error:', error);
        alert('Logistics endpoint transmission error: ' + error.message);
    }
}