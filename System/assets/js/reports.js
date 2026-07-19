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
            <button id="btn-generate-report" class="btn" onclick="generateAndSaveReport('${selectedDuration}')"><i class="fas fa-file-pdf"></i> Generate Detailed Report</button>
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
 * Builds a real PDF document (jsPDF) from a report summary object and returns
 * the jsPDF instance. Used both when Finance generates+saves a report and when
 * regenerating for preview.
 * @param {object} data - summary object from getFilteredSalesSummaryData()
 * @param {string} duration - 'daily' or 'monthly'
 * @param {string} [generatedAt] - optional timestamp for the header
 * @returns {jsPDF}
 */
function buildReportPDF(data, duration, generatedAt) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const now = generatedAt ? new Date(String(generatedAt).replace(' ', 'T')) : new Date();
  const totalOrders = (data.inStoreCount || 0) + (data.cakeCount || 0) + (data.onlineCount || 0);
  const timeLabel = duration === 'monthly' ? 'Monthly Scope' : 'Daily Scope';

  const PRIMARY = [107, 63, 160];
  const DARK = [45, 45, 63];
  const GRAY = [90, 90, 114];
  const marginX = 40;

  // ----- Header -----
  doc.setFontSize(22);
  doc.setTextColor.apply(doc, PRIMARY);
  doc.setFont('helvetica', 'bold');
  doc.text('PEOPLES BAKERS', marginX, 50);

  doc.setFontSize(10);
  doc.setTextColor.apply(doc, GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Commercial Operations & Financial Ledger Division', marginX, 66);
  doc.text(`Generated: ${now.toLocaleDateString()} @ ${now.toLocaleTimeString()}`, marginX, 80);

  doc.setFontSize(14);
  doc.setTextColor.apply(doc, DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Sales Statement', 555, 50, { align: 'right' });
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, PRIMARY);
  doc.text(`${timeLabel} Target Index`, 555, 66, { align: 'right' });

  doc.setDrawColor.apply(doc, PRIMARY);
  doc.setLineWidth(2);
  doc.line(marginX, 92, 555, 92);

  // ----- Channel distribution table -----
  doc.autoTable({
    startY: 110,
    head: [['Fulfillment Channel', 'Target Context', 'Transactions']],
    body: [
      ['Physical POS Registers (In-Store)', 'Direct Walk-in Retail Inflows', String(data.inStoreCount || 0)],
      ['Baking Custom Workshops', 'Decorated & Custom Cake Submissions', String(data.cakeCount || 0)],
      ['Online Storefront Engine', 'Digital Logistics Fulfillment Deliveries', String(data.onlineCount || 0)],
      ['Total Order Outflow', 'All Channels Combined', String(totalOrders)],
    ],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: marginX, right: marginX },
  });

  // ----- Product sales analytics table -----
  const analyticsBody = (data.analytics && data.analytics.length > 0)
    ? data.analytics.map(item => [`#PRD-${item.id}`, item.name, `${item.salesCount} units`])
    : [['-', 'No item data logged for this context period.', '-']];

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 24,
    head: [['Product ID', 'Product Name', 'Volume Moved']],
    body: analyticsBody,
    theme: 'grid',
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 8 },
    columnStyles: { 2: { halign: 'right' } },
    margin: { left: marginX, right: marginX },
  });

  // ----- Total revenue block -----
  const revY = doc.lastAutoTable.finalY + 30;
  doc.setFillColor(240, 235, 247);
  doc.rect(marginX, revY, 515, 40, 'F');
  doc.setFontSize(11);
  doc.setTextColor.apply(doc, GRAY);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL REALIZED INFLOW VALUE (LKR)', marginX + 12, revY + 25);
  doc.setFontSize(15);
  doc.setTextColor.apply(doc, PRIMARY);
  doc.text(`LKR ${Number(data.totalRevenue || 0).toFixed(2)}`, 555 - 12, revY + 26, { align: 'right' });

  // ----- Signature line -----
  doc.setFontSize(10);
  doc.setTextColor.apply(doc, GRAY);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorized Financial Manager Approval', 555, revY + 90, { align: 'right' });

  return doc;
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

// Finance Manager: shows the summary/analytics screen whose button saves the report
function renderFinanceReports() {
  return renderReportUIContainer('daily');
}

// Finance Manager: compute, build a real PDF, upload it, then open it
async function generateAndSaveReport(duration) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert('PDF library failed to load. Please check your internet connection and reload.');
    return;
  }

  const data = getFilteredSalesSummaryData(duration);

  // Build the PDF file in the browser
  const doc = buildReportPDF(data, duration);
  // base64 (strip the "data:application/pdf;base64," prefix for transport)
  const pdfBase64 = doc.output('datauristring').split(',')[1];

  const response = await ReportsAPI.create({
    duration,
    report_data: data,
    pdf_base64: pdfBase64,
    generated_by: currentUser.employee_id,
    generated_by_name: currentUser.name
  });

  if (!response.success) {
    alert(response.message || 'Failed to save report');
    return;
  }

  // Open the freshly created file for the finance manager to review/download
  doc.save(`sales-report-${duration}-${response.data.report_id || ''}.pdf`);
  showToast('Sales report generated and saved.');
}

// Company Manager: list of saved reports (read-only, no generate capability)
let savedReportsCache = [];

async function renderCompanyReports() {
  let reports = [];
  try {
    const res = await ReportsAPI.list();
    if (res.success) reports = res.data || [];
  } catch (e) {
    reports = [];
  }
  savedReportsCache = reports;

  const rows = reports.map((r, i) => `
    <tr>
      <td><span class="employee-id">#RPT-${r.report_id}</span></td>
      <td><span class="badge ${r.duration === 'monthly' ? 'badge-purple' : 'badge-green'}">${r.duration === 'monthly' ? 'Monthly' : 'Daily'}</span></td>
      <td>${r.generated_by_name || 'Unknown'}</td>
      <td>${r.generated_at ? new Date(String(r.generated_at).replace(' ', 'T')).toLocaleString() : (r.created_date || 'N/A')}</td>
      <td>
        <button class="btn btn-sm btn-info" onclick="viewReportPDF(${i})"><i class="fas fa-file-pdf"></i> View PDF</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-chart-bar" style="color:var(--primary); margin-right:0.5rem;"></i> Sales Reports</h3>
      </div>
      <table>
        <tr><th>Report ID</th><th>Duration</th><th>Generated By</th><th>Date</th><th>Actions</th></tr>
        <tbody id="reportsListBody">${rows || '<tr><td colspan="5" class="text-muted text-center py-2">No sales reports have been generated yet.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

// Company Manager: open the stored PDF file (by path) that Finance created
function viewReportPDF(index) {
  const report = savedReportsCache[index];
  if (!report) return;

  if (report.report_path) {
    // Open the actual saved PDF file in a new tab
    window.open(report.report_path, '_blank');
    return;
  }

  // Fallback: older records saved before file storage — rebuild from the snapshot
  let data;
  try {
    data = typeof report.report_data === 'string' ? JSON.parse(report.report_data) : (report.report_data || {});
  } catch (e) {
    data = {};
  }
  if (window.jspdf && window.jspdf.jsPDF) {
    const doc = buildReportPDF(data, report.duration, report.generated_at);
    window.open(doc.output('bloburl'), '_blank');
  } else {
    alert('No stored PDF file is available for this report.');
  }
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
      <div class="form-group"><label>Basic Salary (LKR)</label><input id="baseSalary"  value="0.00" readonly /></div>
      <div class="form-group"><label>Additions / Bonus (LKR)</label><input id="bonusAmount"  value="0.00" /></div>
      <div class="form-group"><label>Deductions (LKR)</label><input id="deductionAmount"  value="0.00" /></div>
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