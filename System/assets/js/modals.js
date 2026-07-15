// ============================================================
//  MODAL EVENT BINDINGS
// ============================================================

// Order Details Modal
document.getElementById('closeOrderDetailsModal').addEventListener('click', function() {
  document.getElementById('orderDetailsModal').classList.remove('active');
});
document.getElementById('orderDetailsModal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('active');
});

// View Restock Modal
document.getElementById('closeViewRestockModal').addEventListener('click', closeViewRestockModal);
document.getElementById('viewRestockModal').addEventListener('click', function(e) {
  if (e.target === this) closeViewRestockModal();
});

// Edit Restock Modal
document.getElementById('closeEditRestockModal').addEventListener('click', closeEditRestockModal);
document.getElementById('cancelEditRestockBtn').addEventListener('click', closeEditRestockModal);
document.getElementById('editRestockModal').addEventListener('click', function(e) {
  if (e.target === this) closeEditRestockModal();
});
document.getElementById('editRestockForm').addEventListener('submit', handleEditRestock);

// Add Item Modal
document.getElementById('closeAddItemModal').addEventListener('click', closeAddItemModal);
document.getElementById('cancelAddItemBtn').addEventListener('click', closeAddItemModal);
document.getElementById('addItemModal').addEventListener('click', function(e) {
  if (e.target === this) closeAddItemModal();
});
document.getElementById('addItemForm').addEventListener('submit', handleAddItem);

// Edit Item Modal
document.getElementById('closeEditItemModal').addEventListener('click', closeEditItemModal);
document.getElementById('cancelEditItemBtn').addEventListener('click', closeEditItemModal);
document.getElementById('editItemModal').addEventListener('click', function(e) {
  if (e.target === this) closeEditItemModal();
});
document.getElementById('editItemForm').addEventListener('submit', handleEditItem);

// Restock Modal
document.getElementById('closeRestockModalBtn').addEventListener('click', closeRestockModal);
document.getElementById('cancelRestockBtn').addEventListener('click', closeRestockModal);
document.getElementById('restockModal').addEventListener('click', function(e) {
  if (e.target === this) closeRestockModal();
});
document.getElementById('restockForm').addEventListener('submit', saveRestock);

// View Cake Modal
document.getElementById('closeViewCakeModal').addEventListener('click', closeViewCakeModal);
document.getElementById('viewCakeModal').addEventListener('click', function(e) {
  if (e.target === this) closeViewCakeModal();
});

// Add Employee Form
document.addEventListener('submit', function(e) {
  if (e.target.id === 'addEmployeeInlineForm') {
    e.preventDefault();
    handleAddEmployeeInline(e);
  }
});

// Global function to close edit cake modal (used in HTML onclick)
window.closeEditCakeModal = function() {
  const modal = document.getElementById('editCakeModal');
  if (modal) {
    modal.remove();
  }
};

// Global function to close view item modal (used in HTML onclick)
window.closeViewItemModal = function() {
  const modal = document.getElementById('viewItemModal');
  if (modal) {
    modal.remove();
  }
};