// ============================================================
//  EXPENSE RECORD WORKSPACE PORTAL ( Finance Manager Sub-tab Engine )
// ============================================================
let activeExpenseFilterTab = 'daily'; 

/**
 * Main dashboard template generation orchestration block
 */
async function renderExpenseRecords() {
    await loadAppData(); // waiting till the data is fetched

    return `
    <!-- Top Area: Data Logging Capture View -->
    <div class="card">
        <h3><i class="fas fa-receipt" style="color: var(--primary); margin-right: 0.5rem;"></i> Log New Expenditure Record</h3>
        <p class="text-muted">Register operational outflows directly into corporate ledger parameters.</p>
        <form id="addExpenseInlineForm" onsubmit="handleLogExpenseForm(event)" style="margin-top: 1.2rem;">
            <div class="form-row">
                <div class="form-group">
                    <label>Bill Reference Number <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="expBillNum"  required />
                </div>
                <div class="form-group">
                    <label>Amount (LKR) <span style="color: var(--danger);">*</span></label>
                    <input type="number" id="expAmount" step="0.01" min="0.01"  required />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Transaction Date <span style="color: var(--danger);">*</span></label>
                    <input type="date" id="expDate" required />
                </div>
                <div class="form-group">
                    <label>Operational Description</label>
                    <input type="text" id="expDesc"  />
                </div>
            </div>
            <button type="submit" class="btn btn-success"><i class="fas fa-save"></i> Save Ledger Entry</button>
        </form>
    </div>

    <!-- Interactive Sub-Tab Navigation Header Elements -->
    <div class="login-tabs" style="display: flex; margin-bottom: 1.5rem; background: var(--white); border-radius: var(--radius-sm); padding: 0.2rem; box-shadow: var(--shadow);">
        <button id="expTabDaily" onclick="switchExpenseSubTab('daily')" style="flex: 1; padding: 0.8rem; background: ${activeExpenseFilterTab === 'daily' ? 'var(--primary)' : 'none'}; border: none; font-weight: 600; color: ${activeExpenseFilterTab === 'daily' ? 'var(--white)' : 'var(--text-gray)'}; border-radius: var(--radius-sm); cursor: pointer; transition: 0.2s;">Daily Expenses</button>
        <button id="expTabMonthly" onclick="switchExpenseSubTab('monthly')" style="flex: 1; padding: 0.8rem; background: ${activeExpenseFilterTab === 'monthly' ? 'var(--primary)' : 'none'}; border: none; font-weight: 600; color: ${activeExpenseFilterTab === 'monthly' ? 'var(--white)' : 'var(--text-gray)'}; border-radius: var(--radius-sm); cursor: pointer; transition: 0.2s;">Monthly Expenses</button>
        <button id="expTabAllTime" onclick="switchExpenseSubTab('alltime')" style="flex: 1; padding: 0.8rem; background: ${activeExpenseFilterTab === 'alltime' ? 'var(--primary)' : 'none'}; border: none; font-weight: 600; color: ${activeExpenseFilterTab === 'alltime' ? 'var(--white)' : 'var(--text-gray)'}; border-radius: var(--radius-sm); cursor: pointer; transition: 0.2s;">All Time Records</button>
    </div>

    <!-- Data Display Table Module -->
    <div id="expenseDataListContainer">
        ${renderExpenseListTableHTML()}
    </div>
  `;
}

/**
 * Filters rows dynamically and prints a clean, borderless list view
 */
function renderExpenseListTableHTML() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const currentMonthStr = `${year}-${month}`;

  // Applies temporal boundaries to array calculations
  const filteredRecords = expenseRecords.filter(r => {
    if (activeExpenseFilterTab === 'daily') return r.date === todayStr;
    if (activeExpenseFilterTab === 'monthly') return r.date.startsWith(currentMonthStr);
    return true; 
  });

  const aggregateOutflow = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  let rowsHtml = '';
  if (filteredRecords.length > 0) {
    rowsHtml = filteredRecords.map(r => `
      <tr>
        <td><span class="employee-id">#EXP-${r.id}</span></td>
        <td><strong>${r.bill_number}</strong></td>
        <td>${r.description}</td>
        <td>${r.date}</td>
        <td><span style="font-weight:600; color: var(--red);">LKR ${r.amount.toFixed(2)}</span></td>
        <td>
            <button class="btn btn-sm btn-danger" onclick="deleteExpense(${r.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  } else {
    rowsHtml = `<tr><td colspan="6" class="text-muted text-center py-2">No expenditure tracks discovered matching parameters.</td></tr>`;
  }

  setTimeout(() => {
    const inputDate = document.getElementById('expDate');
    if (inputDate && !inputDate.value) inputDate.value = todayStr;
  }, 10);

  return `
    <div class="card">
        <div class="report-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
      <div>
          <h3 style="margin: 0; font-size: 1.1rem; text-transform: capitalize;">Ledger Index: ${activeExpenseFilterTab.replace('time', ' time')}</h3>
      </div>
      <button class="btn" onclick="printDetailedExpenseReport()"><i class="fas fa-print"></i> Generate Report</button>
  </div>
          
        <table>
            <thead>
                <tr>
                    <th>Record ID</th>
                    <th>Bill Number</th>
                    <th>Description</th>
                    <th>Transaction Date</th>
                    <th>Total Outflow</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
        </table>

        <div class="order-summary" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; margin-top: 1.5rem; background: #fdf6f6; border-left: 4px solid var(--red);">
            <span style="font-weight: 600; color: var(--text-gray); font-size: 1rem;">Total Tab-Segment Expenditure</span>
            <span style="font-size: 1.4rem; font-weight: 700; color: var(--red);">LKR ${aggregateOutflow.toFixed(2)}</span>
        </div>
    </div>
  `;
}

/**
 * Sends a removal tracking command to the database engine and cleans the local memory stack
 * @param {number} id - Target expense record ID
 */
async function deleteExpense(id) {
  if (!confirm(`Are you sure you want to permanently delete expense record #EXP-${id}?`)) return;

  try {
    const response = await ExpensesAPI.delete(id);
    if (response.success) {
      showToast('Expense record removed from registry ledger.');
      
      await loadAppData(); 
      // Clear and completely rebuild the UI view via the application router
      renderTab('expense-records');

      // Re-trigger rendering context block
      const container = document.getElementById('expenseDataListContainer');
      if (container) {
        container.innerHTML = renderExpenseListTableHTML();
      }
    } else {
      alert(response.message || 'Database engine rejected deletion request.');
    }
  } catch (error) {
    alert('Terminal loop processing error: ' + error.message);
  }
}

/**
 * Handles sub-navigation click events and updates visibility states
 */
function switchExpenseSubTab(targetTab) {
  activeExpenseFilterTab = targetTab;
  const container = document.getElementById('expenseDataListContainer');
  
  // Re-evaluates color states instantly on layout tab arrays
  ['daily', 'monthly', 'alltime'].forEach(t => {
    const btn = document.getElementById('expTab' + (t === 'alltime' ? 'AllTime' : t.charAt(0).toUpperCase() + t.slice(1)));
    if (btn) {
      btn.style.background = targetTab === t ? 'var(--primary)' : 'none';
      btn.style.color = targetTab === t ? 'var(--white)' : 'var(--text-gray)';
    }
  });

  if (container) {
    container.innerHTML = renderExpenseListTableHTML();
  }
}

/**
 * Processes form data submissions and transmits data to the backend module
 */
async function handleLogExpenseForm(event) {
  event.preventDefault();
  
  const amount = parseFloat(document.getElementById('expAmount').value);
  const description = document.getElementById('expDesc').value.trim();
  const bill_number = document.getElementById('expBillNum').value.trim();
  const date = document.getElementById('expDate').value;

  const payload = {
    amount,
    description: description || 'Operational Expense',
    bill_number,
    date
  };

  try {
    const response = await ExpensesAPI.create(payload);
    if (response.success) {
        showToast('Expense logged inside ledger database successfully.');
        
        // Push a fresh state tracker line item into local storage array arrays instantly
        expenseRecords.unshift({
            id: response.data.expense_record_id,
            bill_number,
            description: payload.description,
            date,
            amount
        });
        
        // Force workspace layout structures to draw fresh elements
        const container = document.getElementById('expenseDataListContainer');
        if (container) {
            container.innerHTML = renderExpenseListTableHTML();
        }
        document.getElementById('addExpenseInlineForm').reset();
    } else {
        alert(response.message || 'Database rejected ledger payload serialization parameters.');
    }
  } catch (error) {
    alert('Logistics transmission terminal loop breakdown: ' + error.message);
  }
}


// creates the expense record report
window.printDetailedExpenseReport = function() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  const currentMonthStr = `${year}-${month}`;

  // Filter records to align with the active workspace sub-tab
  const filteredRecords = expenseRecords.filter(r => {
    if (activeExpenseFilterTab === 'daily') return r.date === todayStr;
    if (activeExpenseFilterTab === 'monthly') return r.date.startsWith(currentMonthStr);
    return true; 
  });

  // Calculate totals
  const totalOutflow = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
  const restockTotal = filteredRecords.filter(r => r.description.toLowerCase().includes('restock') || r.description.toLowerCase().includes('supplier')).reduce((sum, r) => sum + r.amount, 0);
  const salaryTotal = filteredRecords.filter(r => r.description.toLowerCase().includes('salary') || r.description.toLowerCase().includes('payroll') || r.description.toLowerCase().includes('employee')).reduce((sum, r) => sum + r.amount, 0);
  const otherTotal = totalOutflow - restockTotal - salaryTotal;

  // Build the context-aware dynamic title parameters
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[now.getMonth()];
  const currentDateStr = now.toLocaleDateString();
  
  let dynamicTitle = "";
  let headerLabel = "";
  
  if (activeExpenseFilterTab === 'daily') {
    dynamicTitle = `Daily Expense Statement | ${currentDateStr}`;
    headerLabel = "Daily Expense Statement";
  } else if (activeExpenseFilterTab === 'monthly') {
    dynamicTitle = `Monthly Expense Statement | ${currentMonthName} ${year}`;
    headerLabel = "Monthly Expense Statement";
  } else {
    dynamicTitle = `All Time Expense Statement | As of ${currentDateStr}`;
    headerLabel = "All Time Expense Statement";
  }

  let tableRowsHtml = filteredRecords.map(r => `
    <tr>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; font-family: monospace; font-size: 13px; color: #4b5563;">#EXP-${r.id}</td>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; font-weight: 500;">${r.bill_number}</td>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #4b5563;">${r.description}</td>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">${r.date}</td>
      <td style="padding: 14px 10px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #111827; text-align: right; font-weight: 600;">LKR ${r.amount.toFixed(2)}</td>
    </tr>
  `).join('');

  if (filteredRecords.length === 0) {
    tableRowsHtml = `<tr><td colspan="5" style="padding: 32px; text-align: center; color: #9ca3af; font-size: 14px;">No transactions recorded for this context period.</td></tr>`;
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
    <head>
        <title>Peoples Bakers - ${dynamicTitle}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
            body { padding: 50px; color: #374151; background: #fff; line-height: 1.5; }
            
            /* Asymmetrical Minimalist Header */
            .statement-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 1px solid #111827; }
            .meta-left h1 { font-size: 24px; color: #111827; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 2px; }
            .meta-left p { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 500; }
            .meta-right { text-align: right; }
            .meta-right h2 { font-size: 18px; color: #991b1b; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 4px; }
            .meta-right p { color: #4b5563; font-size: 13px; }
            
            /* Context Description Box */
            .context-summary { font-size: 14px; color: #4b5563; margin-bottom: 40px; max-width: 650px; }
            
            /* Minimalist Linear Metrics Matrix */
            .summary-row { display: flex; margin-bottom: 50px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px 0; background-color: #fafafa; }
            .summary-item { flex: 1; padding: 0 25px; border-right: 1px solid #e5e7eb; }
            .summary-item:last-child { border-right: none; }
            .summary-item .lbl { font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
            .summary-item .val { font-size: 16px; font-weight: 600; color: #111827; }
            .summary-item.total-focus .val { color: #991b1b; font-weight: 700; }
            
            /* Data Table Reset */
            .section-title { font-size: 14px; font-weight: 600; color: #111827; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px 10px; font-size: 11px; font-weight: 600; color: #4b5563; background-color: #f3f4f6; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #d1d5db; }
            
            /* Stacked Balance Breakdown Receipt Block */
            .balance-container { display: flex; justify-content: flex-end; margin-top: 20px; margin-bottom: 50px; }
            .balance-table { width: 320px; margin-bottom: 0; }
            .balance-table td { padding: 8px 10px; font-size: 14px; border-bottom: none; }
            .balance-table tr.grand-row td { border-top: 1px solid #111827; border-bottom: 3px double #111827; padding-top: 12px; margin-top: 4px; }
            
            /* Compliance Signature Path */
            .footer-signatures { display: flex; justify-content: space-between; margin-top: 70px; page-break-inside: avoid; }
            .sig-line-box { width: 42%; text-align: left; }
            .line { border-bottom: 1px solid #9ca3af; margin-bottom: 8px; height: 40px; }
            .label { font-size: 12px; color: #6b7280; font-weight: 500; }
            
            @media print {
                body { padding: 0; }
                .summary-row { background-color: #fafafa !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <!-- Minimalist Header Banner -->
        <div class="statement-header">
            <div class="meta-left">
                <h1>PEOPLES BAKERS</h1>
                <p>Finance Reporting</p>
            </div>
            <div class="meta-right">
                <h2>${headerLabel}</h2>
                <p>Generated: ${currentDateStr} @ ${now.toLocaleTimeString()}</p>
            </div>
        </div>
        
        <div class="context-summary">
            This document lists the local expenses tracked within company database. It breaks down how much we spent on raw inventory, employee wages, and any other costs.
        </div>
        
        <!-- Linear Metrics Section -->
        <div class="summary-row">
            <div class="summary-item">
                <div class="lbl">Restock Expenses</div>
                <div class="val">LKR ${restockTotal.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="lbl">Salary Expenses</div>
                <div class="val">LKR ${salaryTotal.toFixed(2)}</div>
            </div>
            <div class="summary-item">
                <div class="lbl">Other</div>
                <div class="val">LKR ${otherTotal.toFixed(2)}</div>
            </div>
            <div class="summary-item total-focus">
                <div class="lbl">Total Expense</div>
                <div class="val">LKR ${totalOutflow.toFixed(2)}</div>
            </div>
        </div>
        
        <div class="section-title">Expense Records Within the Duration</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 15%;">Record ID</th>
                    <th style="width: 20%;">Bill Number</th>
                    <th style="width: 35%;">Expense Description</th>
                    <th style="width: 15%;">Recorded Date</th>
                    <th style="width: 15%; text-align: right;">Ammount</th>
                </tr>
            </thead>
            <tbody>
                ${tableRowsHtml}
            </tbody>
        </table>
        
        <!-- Right-Aligned Balanced Breakdown Box -->
        <div class="balance-container">
            <table class="balance-table">
                <tr class="grand-row">
                    <td style="font-weight: 600; color: #111827;">Final Total Expenditure:</td>
                    <td style="text-align: right; font-weight: 700; color: #991b1b; font-size: 16px;">LKR ${totalOutflow.toFixed(2)}</td>
                </tr>
            </table>
        </div>
        
        <!-- Compliance Footer -->
        <div class="footer-signatures">
            <div class="sig-line-box">
                <div class="line"></div>
                <div class="label">Report Compiler Signature</div>
            </div>
            <div class="sig-line-box">
                <div class="line"></div>
                <div class="label">Authorized Financial Manager Sign-off</div>
            </div>
        </div>
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