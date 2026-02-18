/* ==========================================================================
   admin.js - Kitchen/Admin Dashboard Logic
   ========================================================================== */

let orders = [];
let currentFilter = 'All';

// --- INITIALIZATION & POLLING ---
document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
  
  /* * DB INTEGRATION POINT: Real-time subscriptions
   * Instead of setInterval polling, you would subscribe to Supabase events.
   * Example:
   * supabase.channel('custom-all-channel')
   * .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
   * fetchOrders(); 
   * })
   * .subscribe();
   */
  
  // Polling local storage every 2 seconds to mimic real-time updates for the mock DB
  setInterval(fetchOrders, 2000); 
});

// --- DATA FETCHING ---
function fetchOrders() {
  /* * DB INTEGRATION POINT: getOrders()
   * Replace with await supabase.from('orders').select('*').neq('status', 'Served').order('timestamp');
   */
  const data = JSON.parse(localStorage.getItem('zenith_orders') || '[]');
  
  // Only keep active orders, sort by oldest first
  orders = data.filter(o => o.status !== 'Served').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  renderOrders();
}

// --- UI FILTERING ---
function setFilter(status) {
  currentFilter = status;
  
  // Update UI tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if(btn.innerText.includes(status)) btn.classList.add('active');
  });
  
  renderOrders();
}

// --- RENDERING ---
function renderOrders() {
  const grid = document.getElementById('orders-grid');
  
  const displayOrders = currentFilter === 'All' 
    ? orders 
    : orders.filter(o => o.status === currentFilter);

  if (displayOrders.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">No ${currentFilter.toLowerCase()} orders right now.</div>`;
    return;
  }

  grid.innerHTML = displayOrders.map(order => {
    // Format timestamp nicely
    const time = new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Determine which action buttons to show based on status
    let actionButtons = '';
    if (order.status === 'New') {
      actionButtons = `<button class="btn-status btn-prep" onclick="updateStatus('${order.id}', 'Preparing')">Start Prep</button>`;
    } else if (order.status === 'Preparing') {
      actionButtons = `<button class="btn-status btn-ready" onclick="updateStatus('${order.id}', 'Ready')">Mark Ready</button>`;
    } else if (order.status === 'Ready') {
      actionButtons = `<button class="btn-status btn-serve" onclick="updateStatus('${order.id}', 'Served')">Serve / Clear</button>`;
    }

    // Badge styling
    let badgeStyle = '';
    if(order.status === 'New') badgeStyle = `background: var(--status-new); color: var(--status-new-text);`;
    if(order.status === 'Preparing') badgeStyle = `background: var(--status-prep); color: var(--status-prep-text);`;
    if(order.status === 'Ready') badgeStyle = `background: var(--status-ready); color: var(--status-ready-text);`;

    return `
      <div class="order-card" data-status="${order.status}">
        <div class="card-header">
          <div>
            <div class="table-num">Table ${order.table}</div>
            <div class="order-time">${order.id} • ${time}</div>
          </div>
          <span class="badge" style="${badgeStyle}">${order.status}</span>
        </div>
        
        <ul class="order-items">
          ${order.items.map(item => `
            <li>
              <span><span style="font-weight:600; color:var(--text-main);">${item.qty}x</span> ${item.name}</span>
            </li>
          `).join('')}
        </ul>

        ${order.notes ? `<div class="notes-box">📝 ${order.notes}</div>` : ''}

        <div class="action-row">
          ${actionButtons}
        </div>
      </div>
    `;
  }).join('');
}

// --- UPDATE LOGIC ---
function updateStatus(orderId, newStatus) {
  /* * DB INTEGRATION POINT: updateOrderStatus()
   * Replace with await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
   */

  // Mock DB logic
  const allOrders = JSON.parse(localStorage.getItem('zenith_orders') || '[]');
  const index = allOrders.findIndex(o => o.id === orderId);
  if (index > -1) {
    allOrders[index].status = newStatus;
    localStorage.setItem('zenith_orders', JSON.stringify(allOrders));
  }
  
  // Re-fetch to update UI instantly
  fetchOrders();
}
