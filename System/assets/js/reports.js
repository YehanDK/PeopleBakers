// ============================================================
//  REPORTS & CALCULATIONS ( Unified & High-Fidelity Printing )
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
 * @param {string} selectedDuration - Defaults to 'daily' for initial router navigation
 */
function renderReportUIContainer(selectedDuration = 'daily') {
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
            <!-- Custom Detailed Report Function Call -->
            <button id="btn-generate-report" class="btn" onclick="printDetailedSalesReport('${selectedDuration}')"><i class="fas fa-file-pdf"></i> Generate Sales Report</button>
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
            <span class="lbl-revenue" style="font-weight: 600; color: var(--text-gray); font-size: 1rem;">Total Revenue</span>
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
 * Compiles an isolated document with clean print typography and layouts.
 * Opens an independent context frame to keep the dashboard state intact.
 * @param {string} duration - 'daily' or 'monthly'
 */
async function printDetailedSalesReport(duration) {
  const now = new Date();
  const data = getFilteredSalesSummaryData(duration);
  const totalOrders = data.inStoreCount + data.cakeCount + data.onlineCount;
  const timeLabel = duration === 'monthly' ? 'Monthly' : 'Daily';
  
  // add the report data into the DB
  try {
    const reportTypePayload = duration === 'monthly' ? 'Monthly' : 'Daily';
    
    // Clean, unified architecture routing integration call
    const response = await ReportsAPI.create({
        report_type: reportTypePayload,
        in_store_orders: data.inStoreCount,
        online_orders: data.onlineCount,
        cake_orders: data.cakeCount,
        total_revenue: data.totalRevenue
    });
    
    if (response.success) {
        showToast('Sales snapshot synchronized to database logs.');
    } else {
        console.error('API Error logging transaction snapshot:', response.message);
    }
  } catch (err) {
    console.error('Failed to communicate with centralized reports endpoint:', err);
  }

  let analyticsRows = '';
  if (data.analytics.length > 0) {
    analyticsRows = data.analytics.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-family: monospace; font-size: 14px; color: #4f2e7a;">#PRD-${item.id}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; color: #2d2d3f;"><strong>${item.name}</strong></td>
        <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; color: #1e1e2a; text-align: right;">${item.salesCount} units</td>
      </tr>
    `).join('');
  } else {
    analyticsRows = `<tr><td colspan="3" style="padding: 24px; text-align: center; color: #5a5a72;">No item data logged for this context period.</td></tr>`;
  }

  // Calculate dynamic title components based on the duration window
const year = now.getFullYear();
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const currentMonth = monthNames[now.getMonth()];
const currentDate = now.toLocaleDateString();

const dynamicTitle = duration === 'monthly' 
  ? `Monthly Sales Report | ${currentMonth} ${year}` 
  : `Daily Sales Report | ${currentDate}`;

// Generate document sandbox viewport
const printWindow = window.open('', '_blank');

printWindow.document.write(`
  <html>
  <head>
      <!-- UPDATED: Title tag now updates dynamically based on scope selection parameters -->
      <title>Peoples Bakers - ${dynamicTitle}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body { padding: 40px; color: #1e1e2a; background: #fff; line-height: 1.5; }
            
            .report-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6b3fa0; padding-bottom: 20px; margin-bottom: 30px; }
            
            /* UPDATED: Flex alignment styling for the company wrapper layout */
            .company-info { display: flex; align-items: center; gap: 15px; }
            .company-logo { height: 60px; width: 60px; border-radius: 50%; object-fit: cover; }
            .company-text { display: flex; flex-direction: column; }
            
            .company-info h1 { font-size: 26px; color: #4f2e7a; font-weight: 700; margin-bottom: 4px; }
            .company-info p { color: #5a5a72; font-size: 13px; }
            .report-title { text-align: right; }
            .report-title h2 { font-size: 20px; color: #2d2d3f; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .metadata-badge { display: inline-block; background: #e5def0; color: #4f2e7a; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 4px; margin-top: 6px; text-transform: capitalize; }
            
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 35px; }
            .summary-card { border: 1px solid #e4dfed; border-radius: 8px; padding: 16px; background: #fcfaff; }
            .summary-card .lbl { font-size: 12px; color: #5a5a72; font-weight: 500; text-transform: uppercase; margin-bottom: 6px; }
            .summary-card .val { font-size: 18px; font-weight: 700; color: #2d2d3f; }
            
            .section-title { font-size: 16px; font-weight: 600; color: #4f2e7a; border-bottom: 2px solid #e4dfed; padding-bottom: 8px; margin-bottom: 16px; margin-top: 30px; display: flex; align-items: center; gap: 8px; }
            
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f4f2f9; color: #5a5a72; font-weight: 600; font-size: 12px; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #e4dfed; }
            
            .revenue-block { background: #f0ebf7; border-radius: 8px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-right: 6px solid #6b3fa0; }
            .revenue-block span { font-size: 15px; font-weight: 600; color: #5a5a72; }
            .revenue-block strong { font-size: 24px; font-weight: 700; color: #4f2e7a; }
            
            .footer-sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 100px; margin-top: 60px; page-break-inside: avoid; }
            .sig-box { border-top: 1px dashed #5a5a72; padding-top: 8px; text-align: center; font-size: 13px; color: #5a5a72; font-weight: 500; }
            
            @media print {
                body { padding: 0; }
                .summary-card { background: #fff !important; }
                .revenue-block { background: #f4f2f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <!-- Report Header Section -->
        <div class="report-header">
            <div class="company-info">
                <!-- UPDATED: Added image placeholder linking to your logo asset path -->
                <img src="assets/images/peoples-bakers-logo.png" class="company-logo" alt="Peoples Bakers Logo">
                <div class="company-text">
                    <h1>PEOPLES BAKERS</h1>
                    <p>Generated: ${now.toLocaleDateString()} @ ${now.toLocaleTimeString()}</p>
                </div>
            </div>
            <div class="report-title">
                <h2>Sales Reports Data</h2>
                <span class="metadata-badge">${timeLabel} Sales Data</span>
            </div>
        </div>

        <!-- Metric Summary Dashboard Row -->
        <div class="summary-grid">
            <div class="summary-card">
                <div class="lbl">In-Store Orders</div>
                <div class="val">${data.inStoreCount} Trans.</div>
            </div>
            <div class="summary-card">
                <div class="lbl">Custom Cake Orders</div>
                <div class="val">${data.cakeCount} Trans.</div>
            </div>
            <div class="summary-card">
                <div class="lbl">Online Store Orders</div>
                <div class="val">${data.onlineCount} Trans.</div>
            </div>
            <div class="summary-card" style="border-left: 3px solid #6b3fa0;">
                <div class="lbl">Combined Sales</div>
                <div class="val">${totalOrders} Orders</div>
            </div>
        </div>

        <!-- Section 2: Detailed Sales Information -->
        <div class="section-title">Order Distribution Breakdown</div>
        <table style="margin-bottom: 20px;">
            <thead>
                <tr>
                    <th>Order Type</th>
                    <th>Description</th>
                    <th style="text-align: right;">Total Sales Recorded</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px;">In Store Orders</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; color: #5a5a72;">Orders from Walk-in & Call-in customers from the store.</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; text-align: right;"><strong>${data.inStoreCount}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px;">Custom Cake Orders</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; color: #5a5a72;">Custom cake requests fom customer. Data combins both Online and physical store custom cake requets.</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; text-align: right;"><strong>${data.cakeCount}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px;">Online Orders</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; color: #5a5a72;">Orders from the online store front.</td>
                    <td style="padding: 12px; border-bottom: 1px solid #e4dfed; font-size: 14px; text-align: right;"><strong>${data.onlineCount}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Section 3: Product Sales Data Table -->
        <div class="section-title"> Product Sales Analytics Data</div>
        <table>
            <thead>
                <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th style="text-align: right;">Items Sold</th>
                </tr>
            </thead>
            <tbody>
                ${analyticsRows}
            </tbody>
        </table>

        <!-- Consolidated Total Financial Value Bar -->
        <div class="revenue-block">
            <span>TOTAL Revenue Generated (LKR)</span>
            <strong>LKR ${data.totalRevenue.toFixed(2)}</strong>
        </div>

        <!-- Corporate Audit Signature Grid -->
        <div class="footer-sig-grid">
            <div class="sig-box" style="margin-top: 40px;">Report Compiler / Controller</div>
            <div class="sig-box" style="margin-top: 40px;">Authorized Financial Manager Approval</div>
        </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  
  // Wait for rendering styles to catch before initializing window print engine
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
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