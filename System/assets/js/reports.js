// ============================================================
//  REPORTS & CALCULATIONS ( Unified & Timezone Synchronized )
// ============================================================

/**
 * Aggregates, filters, and sorts sales data based on the chosen duration.
 * Uses local browser calendar attributes to maintain timezone alignment.
 * @param {string} duration - 'daily' or 'monthly'
 */
function getFilteredSalesSummaryData(duration) {
  const inStore = typeof inStoreOrders !== 'undefined' ? inStoreOrders : [];
  const online = typeof onlineOrders !== 'undefined' ? onlineOrders : [];
  const cakes = typeof customCakeRequests !== 'undefined' ? customCakeRequests : [];

  // Generate accurate local calendar YYYY-MM-DD strings
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const todayStr = `${year}-${month}-${day}`; 
  const currentMonthStr = `${year}-${month}`;  

  const matchesFilter = (order) => {
    const orderDate = order.date || order.created_at || order.payment_date || todayStr;
    if (duration === 'monthly') {
      return orderDate.startsWith(currentMonthStr);
    }
    return orderDate.startsWith(todayStr);
  };

  const filteredInStore = inStore.filter(matchesFilter);
  const filteredOnline = online.filter(matchesFilter);
  const filteredCakes = cakes.filter(matchesFilter);

  // Accounts for both standard total and custom cake price keys safely
  const totalRevenue = [...filteredInStore, ...filteredOnline, ...filteredCakes].reduce(
    (sum, order) => sum + Number(order.total || order.price || order.amount || 0), 0
  );

  const productSalesMap = {};
  [...filteredInStore, ...filteredOnline, ...filteredCakes].forEach(order => {
    (order.items || []).forEach(item => {
      const pId = item.product_id || item.id || 'N/A';
      const pName = item.name || 'Unknown Bakery Item';
      const qty = Number(item.qty || item.quantity || 0);

      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { id: pId, name: pName, salesCount: 0 };
      }
      productSalesMap[pId].salesCount += qty;
    });
  });

  return {
    inStoreCount: filteredInStore.length,
    onlineCount: filteredOnline.length,
    cakeCount: filteredCakes.length,
    totalRevenue,
    analytics: Object.values(productSalesMap).sort((a, b) => b.salesCount - a.salesCount)
  };
}

/**
 * Builds the template string framework dynamically matching UI configurations.
 * Separated into clean modular card containers matching native app tables.
 * @param {string} selectedDuration - Defaults to 'daily' for initial router navigation
 */
function renderReportUIContainer(selectedDuration = 'daily') {
  // Ensure we always work with a valid fallback configuration string
  if (!selectedDuration || selectedDuration === '[object MouseEvent]') {
    selectedDuration = 'daily';
  }

  const data = getFilteredSalesSummaryData(selectedDuration);

  let tableRowsHtml = '';
  if (data.analytics.length > 0) {
    tableRowsHtml = data.analytics.map(item => `
      <tr>
        <td><span class="employee-id">#PRD-${item.id}</span></td>
        <td><strong>${item.name}</strong></td>
        <td>${item.salesCount} units</td>
      </tr>
    `).join('');
  } else {
    tableRowsHtml = `<tr><td colspan="3" class="text-muted text-center py-2">No transactions recorded for this duration window.</td></tr>`;
  }

  return `
    <!-- Container 1: Sales Summary & Metrics Data -->
    <div class="card">
        <div class="report-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div class="header-left" style="display: flex; align-items: center; gap: 20px;">
                <select id="sales-duration-filter" class="duration-select" onchange="handleReportDurationChange(this.value)" style="padding: 8px 16px; font-size: 16px; font-weight: 600; border: none; background-color: #f0f0f2; border-radius: 4px; cursor: pointer;">
                    <option value="daily" ${selectedDuration === 'daily' ? 'selected' : ''}>Daily</option>
                    <option value="monthly" ${selectedDuration === 'monthly' ? 'selected' : ''}>Monthly</option>
                </select>
                <h2 class="sales-title" style="font-size: 24px; font-weight: bold; color: var(--text-dark); margin: 0;">Sales Summary Data</h2>
            </div>
            <button id="btn-generate-report" class="btn" onclick="window.print()"><i class="fas fa-print"></i> Print Summary</button>
        </div>

        <div class="grid-3" style="margin-bottom: 24px;">
            <div class="stat-card" style="border-left-color: var(--primary);">
                <h3 style="font-size: 16px; color: var(--text-gray); font-weight: 500; margin-bottom: 8px;">In Store Orders</h3>
                <p class="num" style="font-size: 24px; font-weight: 700; color: var(--text-dark); margin: 0;">${data.inStoreCount} orders</p>
            </div>
            <div class="stat-card" style="border-left-color: var(--primary);">
                <h3 style="font-size: 16px; color: var(--text-gray); font-weight: 500; margin-bottom: 8px;">Custom Cake Orders</h3>
                <p class="num" style="font-size: 24px; font-weight: 700; color: var(--text-dark); margin: 0;">${data.cakeCount} orders</p>
            </div>
            <div class="stat-card" style="border-left-color: var(--primary);">
                <h3 style="font-size: 16px; color: var(--text-gray); font-weight: 500; margin-bottom: 8px;">Online Orders</h3>
                <p class="num" style="font-size: 24px; font-weight: 700; color: var(--text-dark); margin: 0;">${data.onlineCount} orders</p>
            </div>
        </div>

        <div class="order-summary" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
            <span class="lbl-revenue" style="font-weight: 600; color: var(--text-gray); font-size: 1rem;">Total Combined Revenue</span>
            <span class="val-revenue" style="font-size: 1.4rem; font-weight: 700; color: var(--primary-dark);">LKR ${data.totalRevenue.toFixed(2)}</span>
        </div>
    </div>

    <!-- Container 2: Re-designed Sales Analytics Table -->
    <div class="card" style="margin-top: 1.5rem;">
        <div class="card-header">
            <h3><i class="fas fa-chart-bar" style="color: var(--primary); margin-right: 0.5rem;"></i> Product Sales Analytics</h3>
        </div>
        <table>
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>No of Sales</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
    </div>
  `;
}

/**
 * Handles structural updates when shifting filter durations.
 */
function handleReportDurationChange(filterValue) {
  const pageContentContainer = document.getElementById('pageContent');
  if (pageContentContainer) {
    pageContentContainer.innerHTML = renderReportUIContainer(filterValue);
  }
}

function renderSalesReports() {
  return renderReportUIContainer('daily');
}

// ============================================================
//  SALARY PROCESSING FUNCTIONALITIES (UNMODIFIED)
// ============================================================
async function renderCalculateSalary() {
  const salaryResponse = await SalaryAPI.list();
  const salaryHistory = salaryResponse.success ? salaryResponse.data : [];
  let historyRows = salaryHistory.map(s => `
    <tr>
      <td>${s.employee_name || s.employee_id}</td>
      <td>LKR ${Number(s.amount).toFixed(2)}</td>
      <td>${s.payment_date}</td>
    </tr>
  `).join('');

  return `
    <div class="card"><h3>Calculate Employee Salary</h3>
      <div class="form-group"><label>Employee</label>
        <select id="salaryEmpSelect" onchange="onSalaryEmployeeChange()">
          <option value="">Select an employee</option>
          ${employees.map(e => `<option value="${e.id}">${e.id} - ${e.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label>Basic Salary (LKR)</label><input id="baseSalary" placeholder="0.00" value="0.00" readonly /></div>
      <div class="form-group"><label>Additions / Bonus (LKR)</label><input id="bonusAmount" placeholder="0.00" value="0.00" /></div>
      <div class="form-group"><label>Deductions (LKR)</label><input id="deductionAmount" placeholder="0.00" value="0.00" /></div>
      <button class="btn" onclick="calculateSalary()">Calculate Salary</button>
      <div id="salaryResult" class="mt-2 order-summary" style="display:none;">
        <strong>Net Salary: <span id="netSalary"></span></strong>
        <div class="text-muted">Breakdown: Basic <span id="baseDisplay"></span> + Additions <span id="bonusDisplay"></span> - Deductions <span id="deductionDisplay"></span></div>
        <div class="text-muted">Monthly Net: <span id="monthlyNet"></span></div>
        <button class="btn btn-success mt-2" onclick="saveSalary()"><i class="fas fa-save"></i> Save Salary Record</button>
      </div>
    </div>
    <div class="card mt-2">
      <div class="card-header"><h3>Saved Salary Records</h3></div>
      <table>
        <tr><th>Employee</th><th>Net Amount</th><th>Payment Date</th></tr>
        <tbody id="salaryHistoryBody">${historyRows || '<tr><td colspan="3" class="text-muted text-center py-2">No salary records saved yet.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function onSalaryEmployeeChange() {
  const id = document.getElementById('salaryEmpSelect').value;
  const emp = employees.find(e => e.id === id);
  const baseInput = document.getElementById('baseSalary');
  if (emp) {
    baseInput.value = (Number(emp.basic_salary) || 0).toFixed(2);
  } else {
    baseInput.value = '0.00';
  }
  const result = document.getElementById('salaryResult');
  if (result) result.style.display = 'none';
}

let lastCalculatedNet = 0;

function calculateSalary() {
  const base = parseFloat(document.getElementById('baseSalary').value) || 0;
  const bonus = parseFloat(document.getElementById('bonusAmount').value) || 0;
  const deductions = parseFloat(document.getElementById('deductionAmount').value) || 0;
  const net = base + bonus - deductions;
  lastCalculatedNet = net;
  document.getElementById('netSalary').textContent = `LKR ${net.toFixed(2)}`;
  document.getElementById('baseDisplay').textContent = `LKR ${base.toFixed(2)}`;
  document.getElementById('bonusDisplay').textContent = `LKR ${bonus.toFixed(2)}`;
  document.getElementById('deductionDisplay').textContent = `LKR ${deductions.toFixed(2)}`;
  document.getElementById('monthlyNet').textContent = `LKR ${(net / 12).toFixed(2)}`;
  document.getElementById('salaryResult').style.display = 'block';
}

async function saveSalary() {
  const employee_id = document.getElementById('salaryEmpSelect').value;
  if (!employee_id) {
    alert('Please select an employee.');
    return;
  }
  if (!lastCalculatedNet || lastCalculatedNet <= 0) {
    alert('Please calculate a valid salary first.');
    return;
  }
  const response = await SalaryAPI.create({
    employee_id,
    amount: lastCalculatedNet,
    payment_date: new Date().toISOString().split('T')[0],
    status: 'Pending',
  });
  if (!response.success) {
    alert(response.message || 'Failed to save salary record');
    return;
  }
  showToast('Salary record saved successfully.');
  renderTab('calc-salary');
}