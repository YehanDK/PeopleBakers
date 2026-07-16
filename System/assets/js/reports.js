// ============================================================
//  REPORTS & CALCULATIONS
// ============================================================

function getSalesSummaryData() {
  const orders = [...onlineOrders, ...inStoreOrders];
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const orderCount = orders.length;
  const averageOrderValue = orderCount ? totalSales / orderCount : 0;
  const itemCounts = {};

  orders.forEach(order => {
    (order.items || []).forEach(item => {
      const name = item.name || 'Unknown Item';
      itemCounts[name] = (itemCounts[name] || 0) + Number(item.qty || 0);
    });
  });

  const topEntry = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    totalSales,
    orderCount,
    averageOrderValue,
    topItem: topEntry ? `${topEntry[0]} (${topEntry[1]} units)` : 'No sales data yet'
  };
}

function renderViewSalesReports() {
  const summary = getSalesSummaryData();
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-chart-simple" style="color:var(--primary);margin-right:0.5rem;"></i> View Reports</h3>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Report Type</label>
          <select id="companyReportType" onchange="toggleCompanyReportType()">
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Report</option>
          </select>
        </div>
        <div class="form-group"><label>Date</label>
          <input type="date" id="companyReportDate" value="${today}" />
        </div>
      </div>
      <button class="btn btn-sm" onclick="generateCompanyReport()">View Reports</button>
      <div id="companyReportResult" class="mt-2">
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Sales</td><td>LKR ${summary.totalSales.toFixed(2)}</td></tr>
          <tr><td>Orders</td><td>${summary.orderCount}</td></tr>
          <tr><td>Average Order Value</td><td>LKR ${summary.averageOrderValue.toFixed(2)}</td></tr>
          <tr><td>Top Item</td><td>${summary.topItem}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function renderGenerateSalesReports() {
  const summary = getSalesSummaryData();
  const today = new Date().toISOString().split('T')[0];
  return `
    <div class="card">
      <div class="card-header">
        <h3><i class="fas fa-chart-simple" style="color:var(--primary);margin-right:0.5rem;"></i> Generate Reports</h3>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Report Type</label>
          <select id="companyReportType" onchange="toggleCompanyReportType()">
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Report</option>
          </select>
        </div>
        <div class="form-group"><label>Date</label>
          <input type="date" id="companyReportDate" value="${today}" />
        </div>
      </div>
      <button class="btn btn-sm" onclick="generateCompanyReport()">Generate Report</button>
      <div id="companyReportResult" class="mt-2">
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Total Sales</td><td>LKR ${summary.totalSales.toFixed(2)}</td></tr>
          <tr><td>Orders</td><td>${summary.orderCount}</td></tr>
          <tr><td>Average Order Value</td><td>LKR ${summary.averageOrderValue.toFixed(2)}</td></tr>
          <tr><td>Top Item</td><td>${summary.topItem}</td></tr>
        </table>
      </div>
    </div>
  `;
}

function toggleCompanyReportType() {
  const type = document.getElementById('companyReportType').value;
  const dateInput = document.getElementById('companyReportDate');
  if (type === 'monthly') {
    const month = new Date().toISOString().slice(0, 7);
    dateInput.type = 'month';
    dateInput.value = month;
  } else {
    dateInput.type = 'date';
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  generateCompanyReport();
}

function generateCompanyReport() {
  const type = document.getElementById('companyReportType').value;
  const date = document.getElementById('companyReportDate').value;
  const resultDiv = document.getElementById('companyReportResult');
  const summary = getSalesSummaryData();

  if (type === 'daily') {
    resultDiv.innerHTML = `
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Sales</td><td>LKR ${summary.totalSales.toFixed(2)}</td></tr>
        <tr><td>Orders</td><td>${summary.orderCount}</td></tr>
        <tr><td>Average Order Value</td><td>LKR ${summary.averageOrderValue.toFixed(2)}</td></tr>
        <tr><td>Top Item</td><td>${summary.topItem}</td></tr>
        <tr><td>Date</td><td>${date}</td></tr>
      </table>
    `;
  } else {
    resultDiv.innerHTML = `
      <table>
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Sales</td><td>LKR ${summary.totalSales.toFixed(2)}</td></tr>
        <tr><td>Orders</td><td>${summary.orderCount}</td></tr>
        <tr><td>Average Order Value</td><td>LKR ${summary.averageOrderValue.toFixed(2)}</td></tr>
        <tr><td>Top Item</td><td>${summary.topItem}</td></tr>
        <tr><td>Month</td><td>${date}</td></tr>
      </table>
    `;
  }
}

function renderSalesReports() {
  return renderGenerateSalesReports();
}

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
  // Hide any previous calculation result until recalculated
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