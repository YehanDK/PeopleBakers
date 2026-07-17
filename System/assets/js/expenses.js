// ============================================================
//  EXPENSE RECORD WORKSPACE PORTAL ( Finance Manager Sub-tab Engine )
// ============================================================
let activeExpenseFilterTab = 'daily'; 

/**
 * Main dashboard template generation orchestration block
 */
async function renderExpenseRecords() {
  return `
    <!-- Top Area: Data Logging Capture View -->
    <div class="card">
        <h3><i class="fas fa-receipt" style="color: var(--primary); margin-right: 0.5rem;"></i> Log New Expenditure Record</h3>
        <p class="text-muted">Register operational outflows directly into corporate ledger parameters.</p>
        <form id="addExpenseInlineForm" onsubmit="handleLogExpenseForm(event)" style="margin-top: 1.2rem;">
            <div class="form-row">
                <div class="form-group">
                    <label>Bill Reference Number <span style="color: var(--danger);">*</span></label>
                    <input type="text" id="expBillNum" placeholder="e.g. BL-99812" required />
                </div>
                <div class="form-group">
                    <label>Amount (LKR) <span style="color: var(--danger);">*</span></label>
                    <input type="number" id="expAmount" step="0.01" min="0.01" placeholder="0.00" required />
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Transaction Date <span style="color: var(--danger);">*</span></label>
                    <input type="date" id="expDate" required />
                </div>
                <div class="form-group">
                    <label>Operational Description</label>
                    <input type="text" id="expDesc" placeholder="e.g. Raw butter procurement logistics supply line" />
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
            <button class="btn" onclick="window.print()"><i class="fas fa-print"></i> Generate Report</button>
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