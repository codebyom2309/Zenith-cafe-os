/* ==========================================================================
   script.js - Customer Ordering Logic
   ========================================================================== */

// --- MOCK DATA (Will be fetched from DB later) ---
const MENU_DATA = [
  { id: 'd1', name: 'Oat Flat White', desc: 'Smooth espresso with steamed oat milk.', price: 4.50, category: 'Drinks', img: 'https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?auto=format&fit=crop&w=300&q=80' },
  { id: 'd2', name: 'Matcha Latte', desc: 'Ceremonial grade matcha, lightly sweetened.', price: 5.00, category: 'Drinks', img: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=300&q=80' },
  { id: 'm1', name: 'Avocado Toast', desc: 'Sourdough, smashed avocado, chili flakes.', price: 9.50, category: 'Meals', img: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=300&q=80' },
  { id: 's1', name: 'Almond Croissant', desc: 'Flaky pastry filled with almond frangipane.', price: 4.00, category: 'Snacks', img: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcb?auto=format&fit=crop&w=300&q=80' }
];

// --- STATE ---
let cart = [];
let activeCategory = 'Drinks';
let tableNumber = 'Takeaway';

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Parse URL for table number: ?table=5
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('table')) {
    tableNumber = urlParams.get('table');
    document.getElementById('table-display').innerText = `Table ${tableNumber}`;
  }

  /* * DB INTEGRATION POINT: getMenu()
   * Replace the synchronous load below with an async fetch from Supabase.
   * Example: 
   * const { data } = await supabase.from('menu').select('*');
   * MENU_DATA = data;
   */
  
  renderTabs();
  renderMenu();
});

// --- UI RENDERING ---
function renderTabs() {
  const categories = [...new Set(MENU_DATA.map(item => item.category))];
  const tabsContainer = document.getElementById('category-tabs');
  
  tabsContainer.innerHTML = categories.map(cat => `
    <button class="tab ${cat === activeCategory ? 'active' : ''}" 
            onclick="setCategory('${cat}')">
      ${cat}
    </button>
  `).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  renderTabs();
  renderMenu();
}

function renderMenu() {
  const grid = document.getElementById('menu-grid');
  const filtered = MENU_DATA.filter(item => item.category === activeCategory);
  
  grid.innerHTML = filtered.map(item => `
    <div class="menu-card">
      <img src="${item.img}" alt="${item.name}" loading="lazy">
      <div class="card-content">
        <h3>${item.name}</h3>
        <p>${item.desc}</p>
        <div class="card-footer">
          <span class="price">$${item.price.toFixed(2)}</span>
          <button class="btn-icon" onclick="addToCart('${item.id}')" style="background: var(--primary-color); color: white; width: 28px; height: 28px;">+</button>
        </div>
      </div>
    </div>
  `).join('');
}

// --- CART LOGIC ---
function addToCart(id) {
  const item = MENU_DATA.find(i => i.id === id);
  const existing = cart.find(c => c.id === id);
  
  if (existing) { existing.qty += 1; } 
  else { cart.push({ ...item, qty: 1 }); }
  
  updateCartUI();
  
  // Subtle animation on pill
  const pill = document.getElementById('cart-pill');
  pill.style.transform = 'translateX(-50%) scale(1.05)';
  setTimeout(() => pill.style.transform = 'translateX(-50%) scale(1)', 150);
}

function updateQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;
  
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(c => c.id !== id);
  }
  updateCartUI();
}

function updateCartUI() {
  const cartContainer = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const pillCount = document.getElementById('pill-count');
  const pillTotal = document.getElementById('pill-total');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);

  // Update Floating Pill
  pillCount.innerText = count;
  pillTotal.innerText = `$${total.toFixed(2)}`;
  
  if (cart.length === 0) {
    cartContainer.innerHTML = '<p style="text-align: center; margin-top: 40px; color: var(--text-muted);">Your cart is empty.</p>';
    document.getElementById('cart-pill').style.display = 'none';
  } else {
    document.getElementById('cart-pill').style.display = window.innerWidth < 1024 ? 'flex' : 'none';
    cartContainer.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div style="flex:1">
          <div style="font-weight: 500;">${item.name}</div>
          <div style="color: var(--text-muted); font-size: 0.85rem;">$${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="qty-controls">
          <button class="btn-icon" style="width: 24px; height: 24px;" onclick="updateQty('${item.id}', -1)">-</button>
          <span style="min-width: 16px; text-align: center; font-size: 0.9rem;">${item.qty}</span>
          <button class="btn-icon" style="width: 24px; height: 24px;" onclick="updateQty('${item.id}', 1)">+</button>
        </div>
      </div>
    `).join('');
  }
  
  totalEl.innerText = `$${total.toFixed(2)}`;
}

// --- MOBILE CART TOGGLE ---
function toggleCart() {
  if (window.innerWidth >= 1024) return; // Desktop uses fixed sidebar
  const panel = document.getElementById('cart-panel');
  const overlay = document.getElementById('overlay');
  panel.classList.toggle('open');
  overlay.classList.toggle('active');
}

// --- CHECKOUT LOGIC ---
function placeOrder() {
  if (cart.length === 0) return alert('Add items to cart first.');

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const notes = document.getElementById('order-notes').value;
  
  const orderObject = {
    id: 'ORD-' + Math.floor(Math.random() * 10000),
    table: tableNumber,
    items: cart,
    total: total,
    notes: notes,
    status: 'New',
    timestamp: new Date().toISOString()
  };

  /* * DB INTEGRATION POINT: createOrder(orderObject)
   * Replace the localStorage logic with an insert to Supabase.
   * Example:
   * await supabase.from('orders').insert([orderObject]);
   */
  
  // MOCK DB LOGIC via localStorage (so admin page sees it)
  const existingOrders = JSON.parse(localStorage.getItem('zenith_orders') || '[]');
  existingOrders.push(orderObject);
  localStorage.setItem('zenith_orders', JSON.stringify(existingOrders));

  // Switch UI to success state
  if (window.innerWidth < 1024) toggleCart();
  document.getElementById('category-tabs').style.display = 'none';
  document.getElementById('menu-grid').style.display = 'none';
  document.getElementById('cart-pill').style.display = 'none';
  
  const desktopCart = document.getElementById('cart-panel');
  if(window.innerWidth >= 1024) desktopCart.style.display = 'none';
  document.querySelector('.main-content').style.paddingRight = '16px';

  document.getElementById('success-state').style.display = 'block';
}
