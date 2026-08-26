import './style.css';
import { DEPTS, BENEFITS, FOOTER_COLS, FITS, TECHS, RATINGS, BOUTIQUE_INFO, THREE_SHOPS } from './data.js';
import { supabase } from './supabase.js';
const app = document.getElementById('app');
const state = {
  sort: 'featured', q: '', searchResults: [], searchLoading: false, searchFilters: { type: [], size: [], price: [], color: [] }, searchSuggestionIdx: -1, searchSuggestions: [],
  products: [], storeSkus: [], storeImages: [],
  plpFilters: { type: [], size: [], price: [], color: [] },
  adminProducts: [], adminSkus: [], adminImages: [],
  session: null, loadingProducts: false, campaign: null,
  adminTab: 'overview', adminFilter: { category: '', supplier: '', search: '', stock: '', photo: '', noprice: '' },
  adminOrderFilter: { status: '', fulfillment: '', search: '' },
  adminOrderDetail: null, adminOrders: [], adminOrderItems: {}, adminOrderHistory: {},
  adminAbandonedCarts: [], adminAbandonedFilter: { emailOnly: false, search: '' },
  adminAbandonedExpanded: {},
  adminNewsletterSubs: [],
  adminSort: 'name', adminPage: 1, adminPerPage: 20, adminDetailProduct: null,
  selectedProductId: null,
  cart: loadCart(),
  selectedColor: null, selectedSize: null, pdpImgFilter: null,
  adminExpandedRows: {},
  cardSelections: {},
};

function getCardSelection(productId) {
  if (!state.cardSelections[productId]) return { color: null, size: null, qty: 1 };
  return state.cardSelections[productId];
}
function setCardSelection(productId, patch) {
  state.cardSelections[productId] = { ...getCardSelection(productId), ...patch };
}

const COLOR_MAP = {
  NOIR: '#16161A', BLANC: '#F2F0EB', BLEU: '#2196F3', GRIS: '#9C9CA4', VERT: '#4CAF50',
  ROUGE: '#F44336', ROSE: '#E91E63', ORANGE: '#FF5A1F', BORDEAUX: '#8B0000', BRUN: '#795548',
  MARINE: '#1A237E', KAKI: '#827717', BEIGE: '#D4B996', CREME: '#FFF8E1', OLIVE: '#558B2F',
  JAUNE: '#FFC107', VIOLET: '#9C27B0', TURQUOISE: '#26A69A', ARGENT: '#B0BEC5', DORE: '#C5A05A',
  MULTI: 'linear-gradient(135deg,#FF5A1F,#2196F3,#4CAF50)',
};

function realColor(name) {
  if (!name) return '#9C9CA4';
  const upper = name.toUpperCase().trim();
  if (COLOR_MAP[upper]) return COLOR_MAP[upper];
  for (const key of Object.keys(COLOR_MAP)) {
    if (upper.includes(key) || key.includes(upper)) return COLOR_MAP[key];
  }
  return stringToColor(name);
}

function loadCart() {
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem('as_cart') || '[]'); } catch { cart = []; }
  // Migrate old cart items that lack numref/sku_id
  let migrated = false;
  for (const item of cart) {
    if (!item.numref || !item.sku_id) {
      const prod = state.products.find(p => p.id === item.productId);
      if (prod) {
        if (!item.numref) { item.numref = prod.numref || ''; migrated = true; }
        if (!item.sku_id) {
          const skus = state.storeSkus.filter(s => s.product_id === item.productId);
          const match = skus.find(s => s.color === item.color && s.size === item.size) || skus.find(s => s.color === item.color) || skus[0];
          if (match) { item.sku_id = match.sku_id || ''; migrated = true; }
        }
      }
    }
  }
  if (migrated) try { localStorage.setItem('as_cart', JSON.stringify(cart)); } catch {}
  return cart;
}
function saveCart() {
  try { localStorage.setItem('as_cart', JSON.stringify(state.cart)); } catch {}
  trackCartDebounced();
}
function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }
function cartTotal() { return state.cart.reduce((s, i) => s + i.qty * i.price, 0); }

// ---- Cart token + track-cart ----
function getCartToken() {
  let token = localStorage.getItem('as_cart_token');
  if (!token) {
    token = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'cart-' + Date.now() + '-' + Math.random().toString(36).slice(2);
    localStorage.setItem('as_cart_token', token);
  }
  return token;
}
let trackCartTimer = null;
function trackCartDebounced(reachedCheckout = false) {
  if (trackCartTimer) clearTimeout(trackCartTimer);
  trackCartTimer = setTimeout(() => trackCart(reachedCheckout), 1500);
}
async function trackCart(reachedCheckout = false) {
  try {
    const token = getCartToken();
    const items = state.cart.map(i => ({ productId: i.productId, numref: i.numref, sku_id: i.sku_id, name: i.name, image: i.image_url, color: i.color, size: i.size, price: i.price, qty: i.qty }));
    const subtotal = cartTotal();
    const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/track-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ cart_token: token, items, subtotal, reached_checkout: reachedCheckout }),
    });
    if (!resp.ok) console.warn('track-cart failed');
  } catch (e) { /* silent */ }
}
function addToCart(item) {
  const qty = item.qty || 1;
  const existing = state.cart.find(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
  if (existing) existing.qty += qty;
  else state.cart.push({ ...item, qty });
  saveCart();
  updateCartBadge();
  openCartDrawer();
}
function removeFromCart(idx) {
  state.cart.splice(idx, 1);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}
function changeQty(idx, delta) {
  const it = state.cart[idx];
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) state.cart.splice(idx, 1);
  saveCart();
  updateCartBadge();
  renderCartDrawer();
}
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
  const n = cartCount();
    badge.textContent = n;
    badge.style.display = n > 0 ? 'flex' : 'none';
  }
}
function openCartDrawer() { document.body.classList.add('cart-open'); renderCartDrawer(); }
function closeCartDrawer() { document.body.classList.remove('cart-open'); }
function renderCartDrawer() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer) return;
  const items = state.cart.map((it, i) => `
    <div class="cart-item">
      <img class="cart-item-img" src="${proxyImg(it.image_url || '')}" alt="">
      <div class="cart-item-info">
        <div class="cart-item-name">${it.name}</div>
        <div class="cart-item-meta">${it.color || ''}${it.size ? ' · ' + it.size : ''}</div>
        <div class="cart-item-price">${fmtPrice(it.price)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-idx="${i}" data-delta="-1">−</button>
          <span>${it.qty}</span>
          <button class="qty-btn" data-idx="${i}" data-delta="1">+</button>
          <button class="qty-remove" data-idx="${i}">✕</button>
        </div>
      </div>
    </div>`).join('');
  drawer.querySelector('.cart-items').innerHTML = items || '<div class="cart-empty">Votre panier est vide.</div>';
  drawer.querySelector('.cart-total-val').textContent = fmtPrice(cartTotal());
  drawer.querySelector('.cart-count').textContent = cartCount();
  const progressEl = drawer.querySelector('#cart-ship-progress');
  if (progressEl) {
    const total = cartTotal();
    const threshold = 200;
    if (total >= threshold) {
      progressEl.innerHTML = '<div class="cart-ship-bar full"></div><div class="cart-ship-msg">Livraison gratuite débloquée!</div>';
    } else if (total > 0) {
      const pct = Math.min(100, (total / threshold) * 100);
      const remaining = (threshold - total).toFixed(0);
      progressEl.innerHTML = `<div class="cart-ship-bar"><div class="cart-ship-bar-fill" style="width:${pct}%"></div></div><div class="cart-ship-msg">Plus que ${remaining} $ pour la livraison gratuite</div>`;
    } else {
      progressEl.innerHTML = '';
    }
  }
  drawer.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', () => changeQty(parseInt(b.dataset.idx), parseInt(b.dataset.delta))));
  drawer.querySelectorAll('.qty-remove').forEach(b => b.addEventListener('click', () => removeFromCart(parseInt(b.dataset.idx))));
  const checkoutBtn = drawer.querySelector('#cart-checkout-btn');
  if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) return;
    closeCartDrawer();
    trackCart(true);
    navigate('/commande');
  });
}

const DEFAULT_CAMPAIGN = {
  eyebrow: 'Rentrée 2026',
  title: 'Bouge avec confiance',
  description: 'La rentrée commence avec une attitude qui te ressemble.',
  image_url: '/images/back_to_school.png',
  men_label: 'Magasiner hommes',
  men_link: '#/hommes',
  women_label: 'Magasiner femmes',
  women_link: '#/femmes',
  enabled: true,
};

async function loadCampaign() {
  const { data, error } = await supabase.from('home_campaigns').select('*').eq('id', 'homepage-main').maybeSingle();
  if (error) { console.error('loadCampaign error:', error); return; }
  state.campaign = data || DEFAULT_CAMPAIGN;
}

// ---------- Supabase product loading ----------
const PAGE_SIZE = 1000;

async function fetchAll(query) {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) { console.error('fetchAll error:', error); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return all;
}

async function loadProducts() {
  state.loadingProducts = true;
  const [prods, skus, dbImgs] = await Promise.all([
    fetchAll(supabase.from('products').select('*').order('created_at', { ascending: false })),
    fetchAll(supabase.from('skus').select('id,product_id,sku_id,barcode,size,color,color_hex,quantity,price,suggested_price,created_at')),
    fetchAll(supabase.from('product_images').select('*').eq('deleted', false).order('numref', { ascending: true })),
  ]);
  state.products = (prods || []).filter(p => p.numref);
  state.storeSkus = skus || [];
  state.storeImages = (dbImgs || []).map(di => ({
    id: di.id, numref: di.numref, image_number: di.image_number || 1, image_url: di.image_url || '', color: di.color || '', product_id: di.product_id,
  }));
  if (state.storeSkus.length === 0) console.warn('No SKUs loaded — prices will show as 0');
  state.loadingProducts = false;
}

function normCat(s) { return (s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function proxyImg(url) { return url || ''; }
function slugify(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80); }
function productUrl(p) { return `/produit/${(p.numref || 'produit').replace(/[^a-zA-Z0-9.-]/g, '')}-${slugify(p.name)}`; }
const STORE_DEPT_MAP = {
  hommes: ['HOMME'],
  femmes: ['FEMME'],
  enfants: ['GARCON', 'FILLE'],
  unisexe: ['UNISEXE'],
  chaussures: [],

};

function fmtPrice(n) { return parseFloat(n || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }); }

function mapProduct(p) {
  const skus = state.storeSkus.filter(s => s.product_id === p.id);
  const firstSku = skus[0] || {};
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const imgs = state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => a.image_number - b.image_number);
  const imgUrl = imgs.length > 0 ? proxyImg(imgs[0].image_url || '') : '';
  const rawPrice = firstSku.price || p.price || '';
  const price = rawPrice ? fmtPrice(rawPrice) : '';
  const oldPrice = firstSku.suggested_price && parseFloat(firstSku.suggested_price) > parseFloat(firstSku.price || 0) ? fmtPrice(firstSku.suggested_price) : '';
  const badge = oldPrice ? 'Solde' : (p.season && p.season.includes('2026') ? 'Nouveau' : '');
  return {
    name: p.name || 'Sans nom',
    cat: p.department || '',
    typeLabel: p.sub_department || p.department || '',
    colors: colors.length || 1,
    price,
    n: parseFloat(firstSku.price || p.price) || 0,
    oldPrice,
    badge,
    d: [p.category].filter(Boolean),
    rating: '4.5',
    reviews: 0,
    dots: [],
    image_url: imgUrl,
    id: p.id,
    numref: p.numref,
    category: p.category,
    department: p.department,
    sizes,
    colorsList: colors,
    colorsHex: colors.map(c => skus.find(s => s.color === c)?.color_hex || realColor(c)),
    colorSizesMap: colors.reduce((map, c) => {
      map[c] = [...new Set(skus.filter(s => s.color === c).map(s => s.size).filter(Boolean))];
      return map;
    }, {}),
  };
}

// ---------- Composants partagés ----------
const promoBar = () => `<div class="promo">Livraison gratuite à partir de 200 $ &nbsp;·&nbsp; Ramassage en boutique à Alma</div>`;

const header = () => `
<header class="header">
  <a href="/" class="logo" data-link><img src="/logo.png" alt="Attitude Sports"></a>
  <nav class="nav">
    <a href="/hommes" data-link>Hommes</a>
    <a href="/femmes" data-link>Femmes</a>
    <a href="/enfants" data-link>Enfants</a>
    <a href="/unisexe" data-link>Unisexe</a>
    <a href="/chaussures" data-link>Chaussures</a>
  </nav>
  <div class="header-right">
    <div class="search" id="search-container">
      <span>⌕</span>
      <input id="search-input" value="${state.q}" placeholder="Rechercher" autocomplete="off">
      <div id="search-suggestions" class="search-suggestions" style="display:none;"></div>
    </div>
    <button class="search-mobile-trigger" id="search-mobile-trigger" aria-label="Rechercher">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
    </button>
    ${state.session
      ? `<a href="/admin" class="icon" data-link aria-label="Admin" title="Administration"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M14 14h2"/></svg></a>
         <a href="#" class="icon" id="logout-btn" aria-label="Déconnexion" title="Déconnexion"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></a>`
      : `<a href="/connexion" class="icon" data-link aria-label="Compte" title="Se connecter"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg></a>`}
    <a href="#" class="icon cart" id="cart-trigger" aria-label="Panier" title="Panier">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4.5 7.5h15l-1.3 11h-12.4z"/><path d="M8.8 7.5a3.2 3.2 0 0 1 6.4 0"/></svg>
      <span class="cart-badge" style="display:none">0</span>
    </a>
  </div>
</header>`;

const ph = (label, cls = '') => `<div class="ph ${cls}"><span>[ ${label} ]</span></div>`;

const HERO_IMAGES = [
  '/images/im1_(1).png',
  '/images/im2_(1).png',
  '/images/im3_(1).png',
  '/images/im4.png',
  '/images/im5.png',
];

const heroGallery = () => {
  const sets = [
    [HERO_IMAGES[0], HERO_IMAGES[1], HERO_IMAGES[2]],
    [HERO_IMAGES[3], HERO_IMAGES[4], HERO_IMAGES[0]],
    [HERO_IMAGES[1], HERO_IMAGES[2], HERO_IMAGES[3]],
    [HERO_IMAGES[4], HERO_IMAGES[0], HERO_IMAGES[1]],
    [HERO_IMAGES[2], HERO_IMAGES[3], HERO_IMAGES[4]],
  ];
  return `
  <div class="hero-gallery" aria-hidden="true">
    ${[0,1,2].map(i => `
      <div class="hero-slot">
        ${sets.map((s, si) => `<img class="hero-img${si === 0 ? ' active' : ''}" src="${s[i]}" alt="" loading="${si < 3 ? 'eager' : 'lazy'}">`).join('')}
      </div>
    `).join('')}
  </div>`;
};

const card = (p, big = true) => {
  const sel = getCardSelection(p.id);
  const colors = p.colorsList || [];
  const selectedColor = sel.color || (colors.length > 0 ? colors[0] : '');
  return `
<div class="card-wrap" data-card-id="${p.id || ''}">
  <div class="card">
    <a href="${productUrl(p)}" class="card-link" data-id="${p.id || ''}" data-link>
      <div class="card-img ${big ? '' : 'sm'}">
        ${p.image_url ? `<img class="prod-img" src="${p.image_url}" alt="${p.name}" loading="lazy" width="300" height="400">` : '<span class="ph-label">[ photo produit ]</span>'}
        ${p.badge ? `<span class="badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : ''}
      </div>
    </a>
    <div class="card-body">
      <div class="card-name-row">
        <a href="${productUrl(p)}" class="card-link" data-id="${p.id || ''}" data-link><div class="card-name">${p.name}</div></a>
      </div>
      <div class="card-cat">${p.cat}</div>
      ${colors.length > 0 ? `<div class="card-colors" data-card-colors="${p.id}">
        ${colors.map((c, i) => `<span class="card-color-swatch${c === selectedColor ? ' sel' : ''}" data-card-color="${(c || '').replace(/"/g, '&quot;')}" data-card-id="${p.id}" style="background:${(p.colorsHex && p.colorsHex[i]) || realColor(c)}" title="${c}"></span>`).join('')}
      </div>` : ''}

      <div class="card-price-row">
        <div class="card-price">
          ${p.oldPrice
            ? `<span class="sale">${p.price}</span><span class="old">${p.oldPrice}</span>`
            : p.price ? `<span>${p.price}</span>` : `<span class="price-na">Prix sur demande</span>`}
        </div>
        <div class="card-qty-add">
          <div class="card-qty">
            <button class="card-qty-btn" data-id="${p.id || ''}" data-delta="-1" aria-label="Diminuer">−</button>
            <span class="card-qty-val" data-id="${p.id || ''}">${sel.qty}</span>
            <button class="card-qty-btn" data-id="${p.id || ''}" data-delta="1" aria-label="Augmenter">+</button>
          </div>
          <button class="card-add-btn" data-id="${p.id || ''}" title="Ajouter au panier" aria-label="Ajouter au panier">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>`;
};

const cartDrawerHtml = () => `
<div id="cart-overlay" class="cart-overlay"></div>
<aside id="cart-drawer" class="cart-drawer">
  <div class="cart-head">
    <span class="cart-head-title">Panier (<span class="cart-count">0</span>)</span>
    <button id="cart-close" class="cart-close" aria-label="Fermer">&times;</button>
  </div>
  <div class="cart-items"></div>
  <div class="cart-footer">
    <div class="cart-ship-progress" id="cart-ship-progress"></div>
    <div class="cart-total-row"><span>Sous-total</span><span class="cart-total-val">$0.00</span></div>
    <button class="btn orange full" id="cart-checkout-btn">Passer la commande</button>
    <div class="cart-ship-note">Livraison 25 $ · gratuite à partir de 200 $</div>
  </div>
</aside>`;

const footer = () => `
<footer class="footer">
  <div class="footer-news">
    <div>
      <div class="footer-news-title">Rejoins l'équipe</div>
      <div class="footer-news-sub">Offres exclusives, nouveautés et 10 % sur ta première commande.</div>
    </div>
    <form class="news-form" id="news-form">
      <input type="email" id="news-email" placeholder="Adresse courriel" required>
      <button type="submit">S'abonner</button>
    </form>
    <div class="news-msg" id="news-msg" style="display:none;"></div>
  </div>
  <div class="footer-cols">
    ${FOOTER_COLS.map(c => `
      <div>
        <div class="footer-col-title">${c.t}</div>
        ${c.links.map(l => l.internal
          ? `<a href="${l.href}" data-link>${l.label}</a>`
          : `<a href="${l.href}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
        ).join('')}
      </div>`).join('')}
    <div>
      <div class="footer-col-title">Nous joindre</div>
      <a href="mailto:${BOUTIQUE_INFO.email}">${BOUTIQUE_INFO.email}</a>
      ${BOUTIQUE_INFO.phone !== 'À CONFIRMER' ? `<a href="tel:${BOUTIQUE_INFO.phone.replace(/\s/g,'')}">${BOUTIQUE_INFO.phone}</a>` : `<span class="footer-pending">${BOUTIQUE_INFO.phone}</span>`}
      ${BOUTIQUE_INFO.address !== 'À CONFIRMER' ? `<span class="footer-addr">${BOUTIQUE_INFO.address}</span>` : `<span class="footer-pending">${BOUTIQUE_INFO.address}</span>`}
    </div>
  </div>
  <div class="footer-boutiques">
    <span class="footer-boutiques-label">Nos boutiques :</span>
    <a href="/" data-link>Attitude Sports</a>
    <span class="sep">·</span>
    <a href="https://lechoixdesophie.com" target="_blank" rel="noopener noreferrer">Le Choix de Sophie</a>
    <span class="sep">·</span>
    <a href="https://lemercieralma.com" target="_blank" rel="noopener noreferrer">Le Mercier Alma</a>
  </div>
  <div class="footer-pay">
    <span class="footer-pay-label">Modes de paiement acceptés</span>
    <div class="pay-icons">
      <span class="pay-icon pay-visa" title="Visa">VISA</span>
      <span class="pay-icon pay-mc" title="Mastercard"><span class="mc-dot mc-red"></span><span class="mc-dot mc-yellow"></span></span>
      <span class="pay-icon pay-amex" title="American Express">AMEX</span>
      <span class="pay-icon pay-apple" title="Apple Pay">&#63743; Pay</span>
      <span class="pay-icon pay-google" title="Google Pay">G<span class="gp-blue">o</span>ogle Pay</span>
    </div>
  </div>
  <div class="footer-bottom">
    <span>© 2026 Attitude Sports. Tous droits réservés.</span>
    <a class="reactool-credit" href="https://reactool.ai" target="_blank" rel="noopener noreferrer">
      Propulsé par <img src="/images/reactool.png" alt="Reactool AI">
    </a>
  </div>
</footer>`;

const threeShops = () => `
<section class="three-shops">
  <div class="three-shops-inner">
    <h2>Découvrez nos deux autres boutiques</h2>
    <p class="three-shops-sub">Deux adresses, une même passion du vêtement bien choisi.</p>
    <div class="three-shops-grid">
      ${THREE_SHOPS.filter(s => !s.current).map((s, index) => `
        <div class="shop-card">
          <div class="shop-logo"><img src="${index === 0 ? '/images/logos/lechoixdesophie-logo copy.jpg' : '/images/logos/lemercier-logo copy.jpg'}" alt="${s.name}"></div>
          <h3>${s.name}</h3>
          <p>${s.desc}</p>
          <a href="${s.href}" target="_blank" rel="noopener noreferrer" class="btn orange">Visiter</a>
        </div>`).join('')}
    </div>
  </div>
</section>`;

// ---------- Pages ----------
const pageHome = () => `
<main>
  <section class="hero">
    ${heroGallery()}
    <div class="hero-shade"></div>
    <div class="hero-inner">
      <div class="eyebrow">Collection automne 2026</div>
      <h1>Dépasse<br>tes limites</h1>
      <div class="hero-ctas">
        <a href="/hommes" class="btn orange" data-link>Magasiner hommes</a>
        <a href="/femmes" class="btn ghost" data-link>Magasiner femmes</a>
      </div>
    </div>
  </section>
  ${state.campaign && state.campaign.enabled !== false ? campaignSection(state.campaign) : ''}
  <section class="cats">
    ${[['hommes', 'Hommes', '/images/V5-6008988-008_BC.png'], ['femmes', 'Femmes', '/woman.png'], ['enfants', 'Enfants', '/enfant.png']].map(([slug, name, img]) => `
      <a href="/${slug}" class="cat-tile" data-link style="background-image:url('${img}')">
        <span class="cat-name">${name}</span>
      </a>`).join('')}
  </section>
  <section class="pad">
    <div class="section-head">
      <h2>Nouveautés</h2>
      <a href="/hommes" class="link-more" data-link>Tout voir</a>
    </div>
    <div class="grid g4">${getNewArrivals().length > 0 ? getNewArrivals().map(p => card(p)).join('') : '<div class="empty">Chargement des nouveautés...</div>'}</div>
  </section>
  <section class="split">
    <div class="split-ph" style="background-image:url('/tof.png')"></div>
    <div class="split-txt">
      <div class="eyebrow">Technologie AS-Dry</div>
      <h2>Reste au sec.<br>Reste concentré.</h2>
      <p>Un tissu qui évacue la transpiration et sèche en un temps record. Conçu pour l'entraînement, pensé pour tous les jours.</p>
      <a href="/hommes" class="btn ghost" data-link>Découvrir</a>
    </div>
  </section>
  <section class="benefits">
    ${BENEFITS.map(b => `<div><strong>${b.t}</strong><span>${b.d}</span></div>`).join('')}
  </section>
</main>`;

const campaignSection = (c) => `
<section class="campaign-band" style="background-image:url('${c.image_url}')">
  <div class="campaign-overlay"></div>
  <div class="campaign-inner">
    <div class="eyebrow">${c.eyebrow || ''}</div>
    <h2>${c.title || ''}</h2>
    <p>${c.description || ''}</p>
    <div class="campaign-ctas">
      <a href="${(c.men_link || '/hommes').replace('#', '')}" class="btn orange" data-link>${c.men_label || 'Magasiner hommes'}</a>
      <a href="${(c.women_link || '/femmes').replace('#', '')}" class="btn ghost" data-link>${c.women_label || 'Magasiner femmes'}</a>
    </div>
  </div>
</section>`;

function getNewArrivals() {
  if (state.products.length === 0) return [];
  return state.products
    .filter(p => p.season && p.season.includes('2026'))
    .filter(p => {
      const imgs = state.storeImages.filter(i => i.numref === p.numref);
      return imgs.length > 0 && imgs[0].image_url;
    })
    .slice(0, 8)
    .map(mapProduct);
}

function stringToColor(str) {
  if (!str) return '#9C9CA4';
  const colors = ['#16161A','#FF5A1F','#2E2E34','#9C9CA4','#F2F0EB','#E91E63','#2196F3','#4CAF50','#FF9800','#9C27B0'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const filterSection = (title, items, type = 'check', accent = false) => `
<div class="filter ${accent ? 'accent' : ''}">
  <div class="filter-title">${title}</div>
  ${type === 'check'
    ? `<div class="filter-list">${items.map(i => `<label><input type="checkbox"> ${i}</label>`).join('')}</div>`
    : `<div class="filter-chips">${items.map(i => `<span class="size">${i}</span>`).join('')}</div>`}
</div>`;

const PRICE_RANGES = [
  { label: 'Moins de 30 $', min: 0, max: 30 },
  { label: '30 $ – 60 $', min: 30, max: 60 },
  { label: '60 $ et plus', min: 60, max: Infinity },
];

function getPlpBaseProducts(deptKey) {
  if (state.products.length === 0) return [];
  if (deptKey === 'chaussures') {
    return state.products.filter(p => normCat(p.department) === 'CHAUSSURE').map(mapProduct);
  }
  const cats = STORE_DEPT_MAP[deptKey] || [];
  return state.products.filter(p => cats.includes(normCat(p.category))).map(mapProduct);
}

function getPlpFilterOptions(deptKey, baseProducts) {
  const types = [...new Set(baseProducts.map(p => p.typeLabel || p.cat).filter(Boolean))].sort();
  const sizes = [...new Set(baseProducts.flatMap(p => p.sizes || []))].sort((a, b) => {
    const na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return String(a).localeCompare(String(b));
  });
  const colors = [...new Set(baseProducts.flatMap(p => p.colorsList || []))].sort();
  return { types, sizes, colors };
}

function applyPlpFilters(baseProducts, filters) {
  let result = baseProducts;
  if (filters.type.length > 0) result = result.filter(p => filters.type.includes(p.typeLabel || p.cat));
  if (filters.size.length > 0) result = result.filter(p => (p.sizes || []).some(s => filters.size.includes(s)));
  if (filters.color.length > 0) result = result.filter(p => (p.colorsList || []).some(c => filters.color.includes(c)));
  if (filters.price.length > 0) {
    const ranges = PRICE_RANGES.filter(r => filters.price.includes(r.label));
    result = result.filter(p => p.n > 0 && ranges.some(r => p.n >= r.min && p.n < r.max));
  }
  return result;
}

function filterCheckSection(title, items, filterKey) {
  const selected = state.plpFilters[filterKey] || [];
  return `<div class="filter">
    <div class="filter-title">${title}</div>
    <div class="filter-list">${items.map(i => `<label><input type="checkbox" class="plp-filter" data-filter="${filterKey}" data-value="${i}" ${selected.includes(i) ? 'checked' : ''}> ${i}</label>`).join('')}</div>
  </div>`;
}

function filterChipsSection(title, items, filterKey) {
  const selected = state.plpFilters[filterKey] || [];
  return `<div class="filter">
    <div class="filter-title">${title}</div>
    <div class="filter-chips">${items.map(i => `<span class="size plp-filter-chip ${selected.includes(i) ? 'sel' : ''}" data-filter="${filterKey}" data-value="${i}">${i}</span>`).join('')}</div>
  </div>`;
}

function filterSwatchSection(title, items, filterKey) {
  const selected = state.plpFilters[filterKey] || [];
  return `<div class="filter">
    <div class="filter-title">${title}</div>
    <div class="swatches">${items.map(c => {
      const hex = realColor(c);
      return `<span class="plp-filter-swatch ${selected.includes(c) ? 'sel' : ''}" data-filter="${filterKey}" data-value="${c}" style="background:${hex}" title="${c}"></span>`;
    }).join('')}</div>
  </div>`;
}

const pagePlp = (deptKey) => {
  const dept = DEPTS[deptKey] || { label: deptKey, sub: '', cats: [], sizes: [] };
  const baseProducts = getPlpBaseProducts(deptKey);
  const opts = getPlpFilterOptions(deptKey, baseProducts);
  const filters = state.plpFilters;
  let products = applyPlpFilters(baseProducts, filters);
  if (state.sort === 'price-asc') products = [...products].sort((a, b) => a.n - b.n);
  if (state.sort === 'price-desc') products = [...products].sort((a, b) => b.n - a.n);
  if (state.sort === 'new') products = [...products].sort((a, b) => (b.badge === 'Nouveau' ? 1 : 0) - (a.badge === 'Nouveau' ? 1 : 0));
  const activeFilterCount = (filters.type.length + filters.size.length + filters.color.length + filters.price.length);
  return `
<main>
  <section class="plp-band">
    <div class="eyebrow">Collection</div>
    <h1>${dept.label}</h1>
    <p>${dept.sub}</p>
    <div class="chips">${opts.types.slice(0, 8).map(c => `<span>${c}</span>`).join('')}</div>
  </section>
  <div class="pad">
    <div class="crumbs"><a href="/" data-link>Accueil</a> / <b>${dept.label}</b></div>
    <div class="plp-head">
      <span class="count">${products.length} article${products.length === 1 ? '' : 's'}${activeFilterCount > 0 ? ` (sur ${baseProducts.length})` : ''}</span>
      <select id="sort-select">
        <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Trier : En vedette</option>
        <option value="new" ${state.sort === 'new' ? 'selected' : ''}>Nouveautés</option>
        <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Prix croissant</option>
        <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Prix décroissant</option>
      </select>
    </div>
    <div class="plp-layout">
      <aside class="aside">
        <div class="aside-head"><span>Filtres</span>${activeFilterCount > 0 ? `<a href="#" id="plp-clear-filters">Tout effacer (${activeFilterCount})</a>` : ''}</div>
        ${opts.types.length > 0 ? filterCheckSection('Type de produit', opts.types, 'type') : ''}
        ${opts.sizes.length > 0 ? filterChipsSection('Taille', opts.sizes, 'size') : ''}
        ${filterCheckSection('Prix', PRICE_RANGES.map(r => r.label), 'price')}
        ${opts.colors.length > 0 ? filterSwatchSection('Couleur', opts.colors, 'color') : ''}
      </aside>
      <div>
        ${products.length > 0
          ? `<div class="grid g3">${products.map(p => card(p)).join('')}</div>`
          : `<div class="empty">${state.loadingProducts ? 'Chargement des produits...' : activeFilterCount > 0 ? 'Aucun article ne correspond à ces filtres. <a href="#" id="plp-clear-filters-empty">Effacer les filtres</a>' : 'Aucun article dans cette catégorie pour le moment.'}</div>`}
      </div>
    </div>
  </div>
</main>`;
};

// ---------- Search helpers ----------
function normSearch(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function stripRef(s) { return (s || '').replace(/[\s\-]/g, '').toLowerCase(); }
function escapePostgrest(s) { return (s || '').replace(/%/g, '\\%').replace(/,/g, '\\,').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\\(?![%,()\\])/g, '\\\\'); }

let searchDebounce = null;
let searchSuggestionDebounce = null;

async function performSearch(query) {
  const q = (query || '').trim();
  if (!q) { state.searchResults = []; state.searchLoading = false; return; }
  state.searchLoading = true;
  const normQ = normSearch(q);
  const strippedQ = stripRef(q);

  // Check exact matches on numref, sku_id, barcode
  const exactProduct = state.products.find(p => stripRef(p.numref) === strippedQ);
  if (exactProduct) {
    state.selectedProductId = exactProduct.id;
    state.selectedColor = null;
    state.selectedSize = null;
    navigate(productUrl(state.products.find(x => x.id === state.selectedProductId) || {numref:'',name:''}));
    state.searchLoading = false;
    render();
    return;
  }
  const exactSku = state.storeSkus.find(s => stripRef(s.sku_id) === strippedQ || stripRef(s.barcode) === strippedQ);
  if (exactSku) {
    state.selectedProductId = exactSku.product_id;
    state.selectedColor = exactSku.color || null;
    state.selectedSize = exactSku.size || null;
    navigate(productUrl(state.products.find(x => x.id === state.selectedProductId) || {numref:'',name:''}));
    state.searchLoading = false;
    render();
    return;
  }

  // Server-side search via Supabase .or() with ilike
  const escapedQ = escapePostgrest(normQ);
  const orParts = [
    `numref.ilike.%${escapedQ}%`,
    `name.ilike.%${escapedQ}%`,
    `description_fr.ilike.%${escapedQ}%`,
    `description_en.ilike.%${escapedQ}%`,
    `description_web.ilike.%${escapedQ}%`,
    `keywords.ilike.%${escapedQ}%`,
    `supplier.ilike.%${escapedQ}%`,
    `category.ilike.%${escapedQ}%`,
    `department.ilike.%${escapedQ}%`,
    `sub_department.ilike.%${escapedQ}%`,
    `season.ilike.%${escapedQ}%`,
  ];
  const orQuery = orParts.join(',');
  const { data: productResults } = await supabase.from('products').select('*').or(orQuery);

  // Also search SKUs for sku_id, barcode, color, size
  const skuOrParts = [
    `sku_id.ilike.%${escapedQ}%`,
    `barcode.ilike.%${escapedQ}%`,
    `color.ilike.%${escapedQ}%`,
    `size.ilike.%${escapedQ}%`,
  ];
  const { data: skuResults } = await supabase.from('skus').select('id,product_id,sku_id,barcode,color,size').or(skuOrParts.join(','));
  const productIdsFromSkus = new Set((skuResults || []).map(s => s.product_id));

  // Merge results
  const seenIds = new Set();
  let merged = [];
  for (const p of (productResults || [])) { if (!seenIds.has(p.id)) { seenIds.add(p.id); merged.push(p); } }
  for (const pid of productIdsFromSkus) {
    if (!seenIds.has(pid)) {
      const p = state.products.find(x => x.id === pid);
      if (p) { seenIds.add(pid); merged.push(p); }
    }
  }

  // Multi-word: all words must match (AND) across the combined text
  const words = normQ.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    merged = merged.filter(p => {
      const text = normSearch([p.numref, p.name, p.description_fr, p.description_en, p.description_web, p.keywords, p.supplier, p.category, p.department, p.sub_department, p.season].join(' '));
      return words.every(w => text.includes(w));
    });
  }

  // Ranking: exact numref > name starts with > name contains > supplier > category/dept > description > color/size
  const rankProduct = (p) => {
    const n = normSearch(p.name || '');
    const nr = normSearch(p.numref || '');
    if (nr === normQ) return 0;
    if (n.startsWith(normQ)) return 1;
    if (n.includes(normQ)) return 2;
    if (normSearch(p.supplier || '').includes(normQ)) return 3;
    if (normSearch((p.category || '') + ' ' + (p.department || '') + ' ' + (p.sub_department || '')).includes(normQ)) return 4;
    if (normSearch((p.description_fr || '') + ' ' + (p.description_web || '') + ' ' + (p.description_en || '')).includes(normQ)) return 5;
    return 6;
  };
  merged.sort((a, b) => rankProduct(a) - rankProduct(b));

  state.searchResults = merged;
  state.searchLoading = false;
}

async function performSuggestions(query) {
  const q = (query || '').trim();
  if (!q || q.length < 2) { state.searchSuggestions = []; renderSuggestions(); return; }
  const normQ = normSearch(q);
  const escapedQ = escapePostgrest(normQ);
  const orParts = [
    `numref.ilike.%${escapedQ}%`,
    `name.ilike.%${escapedQ}%`,
    `supplier.ilike.%${escapedQ}%`,
    `sku_id.ilike.%${escapedQ}%`,
  ];
  // Search products
  const { data: prods } = await supabase.from('products').select('id,numref,name,supplier,category').or(orParts.join(',')).limit(8);
  // Search SKUs for barcode/sku_id matches
  const { data: skus } = await supabase.from('skus').select('product_id,sku_id,barcode').or(`sku_id.ilike.%${escapedQ}%,barcode.ilike.%${escapedQ}%`).limit(4);
  const skuProductIds = new Set((skus || []).map(s => s.product_id));
  const extraProds = [];
  for (const pid of skuProductIds) {
    if (extraProds.length + (prods || []).length >= 8) break;
    const p = state.products.find(x => x.id === pid);
    if (p && !(prods || []).some(pr => pr.id === pid)) extraProds.push(p);
  }
  const allProds = [...(prods || []), ...extraProds].slice(0, 8);
  state.searchSuggestions = allProds.map(p => {
    const mp = mapProduct(p);
    return { id: p.id, name: p.name, numref: p.numref, supplier: p.supplier, image_url: mp.image_url, price: mp.price };
  });
  state.searchSuggestionIdx = -1;
  renderSuggestions();
}

function renderSuggestions() {
  const box = document.getElementById('search-suggestions');
  if (!box) return;
  const suggestions = state.searchSuggestions || [];
  if (suggestions.length === 0) { box.style.display = 'none'; box.innerHTML = ''; return; }
  box.style.display = 'block';
  box.innerHTML = suggestions.map((s, i) => `
    <div class="search-sugg-item${i === state.searchSuggestionIdx ? ' active' : ''}" data-idx="${i}" data-product-id="${s.id}">
      <img class="search-sugg-img" src="${s.image_url || ''}" alt="">
      <div class="search-sugg-info">
        <div class="search-sugg-name">${s.name || 'Sans nom'}</div>
        <div class="search-sugg-meta">${s.supplier || ''} · <span class="search-sugg-sku">${s.numref || ''}</span></div>
      </div>
      <div class="search-sugg-price">${s.price || ''}</div>
    </div>`).join('') +
    `<div class="search-sugg-more" id="search-sugg-more">Voir tous les résultats</div>`;
  box.querySelectorAll('.search-sugg-item').forEach(item => {
    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const pid = item.dataset.productId;
      state.selectedProductId = pid;
      state.selectedColor = null;
      state.selectedSize = null;
      state.searchSuggestions = [];
      navigate(productUrl(state.products.find(x => x.id === state.selectedProductId) || {numref:'',name:''}));
      render();
    });
    item.addEventListener('mouseenter', () => {
      state.searchSuggestionIdx = parseInt(item.dataset.idx);
      box.querySelectorAll('.search-sugg-item').forEach((el, i) => el.classList.toggle('active', i === state.searchSuggestionIdx));
    });
  });
  const moreBtn = document.getElementById('search-sugg-more');
  if (moreBtn) {
    moreBtn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) { state.q = input.value; navigate('/recherche?q=' + encodeURIComponent(state.q)); }
    });
  }
}

const pageSearch = () => {
  const q = state.q || '';
  const allProducts = state.searchResults.map(mapProduct);
  const filters = state.searchFilters;
  let results = allProducts;
  if (filters.type.length > 0) results = results.filter(p => filters.type.includes(p.typeLabel || p.cat));
  if (filters.size.length > 0) results = results.filter(p => (p.sizes || []).some(s => filters.size.includes(s)));
  if (filters.color.length > 0) results = results.filter(p => (p.colorsList || []).some(c => filters.color.includes(c)));
  if (filters.price.length > 0) {
    const ranges = PRICE_RANGES.filter(r => filters.price.includes(r.label));
    results = results.filter(p => p.n > 0 && ranges.some(r => p.n >= r.min && p.n < r.max));
  }
  if (state.sort === 'price-asc') results = [...results].sort((a, b) => a.n - b.n);
  if (state.sort === 'price-desc') results = [...results].sort((a, b) => b.n - a.n);
  if (state.sort === 'new') results = [...results].sort((a, b) => (b.badge === 'Nouveau' ? 1 : 0) - (a.badge === 'Nouveau' ? 1 : 0));

  const opts = getPlpFilterOptions(null, allProducts);
  const activeFilterCount = (filters.type.length + filters.size.length + filters.color.length + filters.price.length);
  return `
<main class="pad search-page">
  <div class="crumbs"><a href="/" data-link>Accueil</a> / <b>Recherche</b></div>
  <h1 class="search-title">Résultats pour «${q}» <em>(${state.searchLoading ? '...' : results.length + ' article' + (results.length === 1 ? '' : 's')})</em></h1>
  ${state.searchLoading ? '<div class="empty">Recherche en cours...</div>' :
    results.length === 0 && q ? '<div class="empty">Aucun résultat. Essayez «t-shirt», «legging» ou «chaussure».</div>' : ''}
  ${results.length > 0 ? `
  <div class="plp-head">
    <span class="count">${results.length} article${results.length === 1 ? '' : 's'}${activeFilterCount > 0 ? ` (sur ${allProducts.length})` : ''}</span>
    <select id="sort-select">
      <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Trier : En vedette</option>
      <option value="new" ${state.sort === 'new' ? 'selected' : ''}>Nouveautés</option>
      <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Prix croissant</option>
      <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Prix décroissant</option>
    </select>
  </div>
  <div class="plp-layout">
    <aside class="aside">
      <div class="aside-head"><span>Filtres</span>${activeFilterCount > 0 ? `<a href="#" id="search-clear-filters">Tout effacer (${activeFilterCount})</a>` : ''}</div>
      ${opts.types.length > 0 ? filterCheckSection('Type de produit', opts.types, 'type') : ''}
      ${opts.sizes.length > 0 ? filterChipsSection('Taille', opts.sizes, 'size') : ''}
      ${filterCheckSection('Prix', PRICE_RANGES.map(r => r.label), 'price')}
      ${opts.colors.length > 0 ? filterSwatchSection('Couleur', opts.colors, 'color') : ''}
    </aside>
    <div>
      <div class="grid g3">${results.map(p => card(p)).join('')}</div>
    </div>
  </div>` : ''}
</main>`;
};

const pagePdp = () => {
  const p = state.products.find(x => x.id === state.selectedProductId);
  if (!p) {
    return `<main class="pad"><div class="empty">Produit introuvable. <a href="/" data-link>Retour à l'accueil</a></div></main>`;
  }
  const skus = state.storeSkus.filter(s => s.product_id === p.id);
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const allImgs = state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => (a.image_number || 1) - (b.image_number || 1));
  const selectedColor = state.selectedColor || (colors.length > 0 ? colors[0] : '');
  const colorSizes = selectedColor
    ? [...new Set(skus.filter(s => s.color === selectedColor).map(s => s.size).filter(Boolean))]
    : sizes;
  const colorImgs = selectedColor ? allImgs.filter(i => i.color === selectedColor) : [];
  const imgs = colorImgs.length > 0 ? colorImgs : allImgs;
  const firstSku = skus[0] || {};
  const rawPrice = firstSku.price || p.price || '';
  const price = rawPrice ? fmtPrice(rawPrice) : '';
  const oldPrice = firstSku.suggested_price && parseFloat(firstSku.suggested_price) > parseFloat(firstSku.price || 0) ? fmtPrice(firstSku.suggested_price) : '';
  const badge = oldPrice ? 'Solde' : (p.season && p.season.includes('2026') ? 'Nouveau' : '');
  const catLabel = CAT_LABELS[(p.category || '').toUpperCase()] || p.category || '';
  const deptLabel = p.department || '';
  const desc = p.description_fr || p.description_web || p.description_en || '';
  const related = state.products.filter(x => x.id !== p.id && x.category === p.category).slice(0, 4).map(mapProduct);
  const isAdmin = !!state.session;

  // Admin image assignment data - use adminImages which has id+color
  const adminImgs = isAdmin ? (state.adminImages || []).filter(i => i.numref === p.numref).sort((a, b) => (a.image_number || 1) - (b.image_number || 1)) : [];

  const galleryHtml = imgs.length > 0
    ? `<div class="thumbs">${imgs.map((i, idx) => `<div class="thumb${idx === 0 ? ' active' : ''}" data-idx="${idx}"><img class="prod-thumb" src="${proxyImg(i.image_url)}" alt="" loading="lazy"></div>`).join('')}</div>
       <div class="gallery-main">
         <button class="gal-nav gal-prev" type="button" aria-label="Photo précédente">&#8249;</button>
         <img id="gal-main-img" class="prod-main" src="${proxyImg(imgs[0].image_url)}" alt="${p.name}" fetchpriority="high">
         <button class="gal-nav gal-next" type="button" aria-label="Photo suivante">&#8250;</button>
         <span class="gal-counter" id="gal-counter">1 / ${imgs.length}</span>
       </div>`
    : `${ph('photo produit principale', 'gallery-main')}`;

  // Admin edit panel (shown only when logged in)
  const adminPanel = isAdmin ? `
  <div class="pdp-admin-bar">
    <span class="pdp-admin-badge">Mode admin</span>
    <button class="btn sm orange" id="pdp-save-product" data-product-id="${p.id}">Enregistrer le produit</button>
    <span id="pdp-admin-status" class="pdp-admin-status"></span>
  </div>
  <div class="pdp-admin-panel">
    <div class="pdp-admin-section">
      <h4>Informations produit</h4>
      <div class="pdp-admin-fields">
        <label>Nom<input type="text" id="pdp-edit-name" value="${(p.name || '').replace(/"/g, '&quot;')}"></label>
        <label>Categorie
          <select id="pdp-edit-category">
            ${['FEMME','HOMME','FILLE','GARCON','UNISEXE'].map(c => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${CAT_LABELS[c] || c}</option>`).join('')}
          </select>
        </label>
        <label>Departement<input type="text" id="pdp-edit-dept" value="${(p.department || '').replace(/"/g, '&quot;')}"></label>
        <label>Sous-dept.<input type="text" id="pdp-edit-subdept" value="${(p.sub_department || '').replace(/"/g, '&quot;')}"></label>
        <label>Fournisseur<input type="text" id="pdp-edit-supplier" value="${(p.supplier || '').replace(/"/g, '&quot;')}"></label>
        <label>Saison<input type="text" id="pdp-edit-season" value="${(p.season || '').replace(/"/g, '&quot;')}"></label>
        <label>TPS %<input type="number" step="0.01" id="pdp-edit-tps" value="${p.tax_tps || 5}"></label>
        <label>TVQ %<input type="number" step="0.001" id="pdp-edit-tvq" value="${p.tax_tvq || 9.975}"></label>
      </div>
      <label class="pdp-admin-desc-label">Description<textarea id="pdp-edit-desc" rows="3">${desc.replace(/</g, '&lt;')}</textarea></label>
    </div>
    <div class="pdp-admin-section">
      <h4>Tailles disponibles</h4>
      <div class="pdp-chips-row" id="pdp-sizes-chips">
        ${sizes.map(s => `<span class="pdp-chip${state.pdpFlashSize === s ? ' new' : ''}" data-size="${(s || '').replace(/"/g, '&quot;')}">${s}<button class="pdp-chip-x" data-size="${(s || '').replace(/"/g, '&quot;')}" title="Retirer">&times;</button></span>`).join('')}
      </div>
      <div class="pdp-chips-add">
        <input type="text" id="pdp-new-size" placeholder="Ex: S, M, L, XL, 42, One Size..." style="width:200px">
        <button class="btn sm orange" id="pdp-add-size-btn">+ Taille</button>
      </div>
    </div>
    <div class="pdp-admin-section">
      <h4>Couleurs disponibles</h4>
      <div class="pdp-colors-row" id="pdp-colors-swatches">
        ${colors.map(c => {
          const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
          return `<span class="pdp-color-swatch" data-color="${(c || '').replace(/"/g, '&quot;')}" data-hex="${hex}" title="${c}"><span class="pdp-color-dot${state.pdpFlashColor === c ? ' new' : ''}" style="background:${hex}"></span><button class="pdp-chip-x" data-color="${(c || '').replace(/"/g, '&quot;')}" title="Retirer">&times;</button></span>`;
        }).join('')}
      </div>
      <div class="pdp-chips-add">
        <input type="color" id="pdp-new-color-hex" value="#000000" style="width:40px;height:36px;border:1px solid #ddd;border-radius:6px;cursor:pointer;background:none;padding:0">
        <input type="text" id="pdp-new-color-name" placeholder="Nom (ex: Noir, Rouge...)" style="width:180px;padding:6px 12px;border:1px solid #E0DDD4;border-radius:6px;font-size:14px;color:var(--noir);background:#fff">
        <button class="btn sm orange" id="pdp-add-color-btn">+ Couleur</button>
      </div>
    </div>
    <div class="pdp-admin-section">
      <h4>Tailles par couleur</h4>
      <p class="pdp-matrix-hint">Clique sur les pastilles pour activer/désactiver une taille pour une couleur.</p>
      <div class="pdp-color-size-matrix" id="pdp-color-size-matrix">
        ${colors.length === 0 ? '<div class="pdp-matrix-empty">Aucune couleur. Ajoute une couleur ci-dessus.</div>' :
          sizes.length === 0 ? '<div class="pdp-matrix-empty">Aucune taille. Ajoute une taille ci-dessus.</div>' :
          colors.map(c => {
            const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
            const colorSkus = skus.filter(s => s.color === c);
            return `<div class="pdp-matrix-row" data-color="${(c || '').replace(/"/g, '&quot;')}">
              <div class="pdp-matrix-color">
                <span class="pdp-matrix-dot" style="background:${hex}"></span>
                <span class="pdp-matrix-name">${c}</span>
              </div>
              <div class="pdp-matrix-sizes">
                ${sizes.map(sz => {
                  const hasSku = colorSkus.some(s => s.size === sz);
                  return `<span class="pdp-matrix-cell${hasSku ? ' active' : ''}" data-color="${(c || '').replace(/"/g, '&quot;')}" data-size="${(sz || '').replace(/"/g, '&quot;')}" data-has="${hasSku ? '1' : '0'}" title="${c} · ${sz}">${sz}</span>`;
                }).join('')}
              </div>
            </div>`;
          }).join('')}
      </div>
    </div>
    <div class="pdp-admin-section">
      <h4>Images du produit (${adminImgs.length})</h4>
      ${colors.length > 0 ? `<div class="pdp-img-filter-bar">
        <span class="pdp-img-filter-label">Filtrer par couleur :</span>
        <button class="pdp-img-filter-all${!state.pdpImgFilter ? ' active' : ''}" data-color="">Toutes</button>
        ${colors.map(c => {
          const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
          const cnt = adminImgs.filter(img => img.color === c).length;
          return `<button class="pdp-img-filter-color${state.pdpImgFilter === c ? ' active' : ''}" data-color="${(c || '').replace(/"/g, '&quot;')}" style="background:${hex}" title="${c} (${cnt})"></button>${state.pdpImgFilter === c ? `<span class="pdp-img-filter-name">${c} (${cnt})</span>` : ''}`;
        }).join('')}
      </div>` : ''}
      <div class="pdp-admin-img-grid" id="pdp-admin-img-grid">
        ${adminImgs.filter(img => !state.pdpImgFilter || img.color === state.pdpImgFilter).map((img, i) => {
          const assignedColor = img.color || '';
          const colorHex = assignedColor ? (skus.find(s => s.color === assignedColor)?.color_hex || realColor(assignedColor)) : '';
          const imgKey = `${img.numref}__${img.image_number || (i + 1)}`;
          const imgUrl = (img.image_url || '').replace(/"/g, '&quot;');
          return `<div class="pdp-admin-img-thumb ${assignedColor ? 'assigned' : ''}" data-img-key="${imgKey}" style="${assignedColor ? `border-color:${colorHex};border-width:3px` : ''}">
            <img src="${proxyImg(img.image_url || '')}" alt="" loading="lazy">
            <span class="pdp-admin-img-num">${i + 1}</span>
            <button class="pdp-img-del" data-img-id="${img.id || ''}" data-img-key="${imgKey}" data-numref="${img.numref}" data-img-num="${img.image_number || (i + 1)}" title="Supprimer">&times;</button>
            ${assignedColor ? `<div class="pdp-img-color-badge" style="background:${colorHex}"><span class="pdp-img-color-dot-white"></span>${assignedColor}</div>` : '<div class="pdp-img-color-badge unassigned">Pas de couleur</div>'}
            <div class="pdp-img-color-buttons">
              ${colors.map(c => {
                const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
                return `<button class="pdp-img-color-btn${assignedColor === c ? ' active' : ''}" data-img-key="${imgKey}" data-numref="${img.numref}" data-img-num="${img.image_number || (i + 1)}" data-product-id="${p.id}" data-img-url="${imgUrl}" data-color="${(c || '').replace(/"/g, '&quot;')}" style="background:${hex}" title="${c}"></button>`;
              }).join('')}
              ${assignedColor ? `<button class="pdp-img-color-btn-clear" data-img-key="${imgKey}" data-numref="${img.numref}" data-img-num="${img.image_number || (i + 1)}" data-product-id="${p.id}" data-img-url="${imgUrl}" title="Retirer couleur">&times;</button>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="pdp-img-actions">
        <label class="btn sm orange pdp-upload-label">
          + Ajouter photos
          <input type="file" id="pdp-img-upload" accept="image/*" multiple style="display:none">
        </label>
      </div>
    </div>
  </div>` : '';

  return `
<main class="pad">
  <div class="crumbs"><a href="/" data-link>Accueil</a> / <a href="/${deptKey}" data-link>${catLabel}</a> / <b>${p.name}</b></div>
  ${adminPanel}
  <div class="pdp">
    <div class="gallery">
      ${galleryHtml}
    </div>
    <div class="buybox">
      ${badge ? `<div class="eyebrow">${badge}</div>` : ''}
      <h1>${p.name}</h1>
      <div class="pdp-ref">Réf. ${p.numref || '—'} <button class="pdp-copy-ref" id="pdp-copy-ref" data-ref="${p.numref || ''}" title="Copier la référence">Copier</button></div>
      ${(() => {
        const selSku = skus.find(s => s.color === selectedColor && s.size === state.selectedSize) || skus.find(s => s.color === selectedColor) || null;
        return selSku && selSku.sku_id ? `<div class="pdp-sku">SKU: ${selSku.sku_id}${selSku.barcode ? ' · Code-barres: ' + selSku.barcode : ''} <button class="pdp-copy-ref" id="pdp-copy-sku" data-ref="${selSku.sku_id}" title="Copier le SKU">Copier</button></div>` : '';
      })()}
      <div class="pdp-cat">${deptLabel}${catLabel ? ' · ' + catLabel : ''}</div>
      <div class="pdp-price">${oldPrice ? `<span class="sale">${price}</span> <span class="old">${oldPrice}</span>` : price}</div>
      ${colors.length > 0 ? `<div class="filter-title">Couleur : <span id="selected-color-name">${selectedColor}</span></div>
      <div class="swatches lg" id="color-swatches">
        ${colors.map((c, i) => {
          const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
          return `<span class="color-swatch${c === selectedColor ? ' sel' : ''}" data-color="${c}" style="background:${hex}" title="${c}"></span>`;
        }).join('')}
      </div>
      <div class="color-count">${colors.length} couleur${colors.length > 1 ? 's' : ''} disponible${colors.length > 1 ? 's' : ''}</div>` : ''}
      ${sizes.length > 0 ? `<div class="size-head"><span class="filter-title">Taille</span></div>
      <div class="sizes-grid" id="sizes-grid">${sizes.map(s => {
        const avail = colorSizes.includes(s);
        return `<span class="size${avail ? '' : ' disabled'}" data-size="${(s || '').replace(/"/g, '&quot;')}" data-avail="${avail ? '1' : '0'}">${s}</span>`;
      }).join('')}</div>
      <div class="size-count">${colorSizes.length} taille${colorSizes.length > 1 ? 's' : ''} disponible${colorSizes.length > 1 ? 's' : ''}${selectedColor ? ' en ' + selectedColor : ''}${colorSizes.length < sizes.length ? ` · ${sizes.length - colorSizes.length} non disponible${sizes.length - colorSizes.length > 1 ? 's' : ''}` : ''}</div>` : '<div class="size-count" style="color:#F44336">Aucune taille disponible</div>'}
      <button class="btn orange full" id="pdp-add-cart">Ajouter au panier</button>
      <div class="pdp-ship">Livraison gratuite à partir de 200 $ · Ramassage en boutique</div>
      <div class="pdp-share">
        <span class="pdp-share-label">Partager :</span>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}" target="_blank" rel="noopener" class="pdp-share-btn" aria-label="Facebook"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/></svg></a>
        <a href="https://www.facebook.com/dialog/send?link=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}&app_id=0&redirect_uri=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}" target="_blank" rel="noopener" class="pdp-share-btn" aria-label="Messenger"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.5 5.5 3.9 7.2V22l3.6-2c.8.2 1.6.3 2.5.3 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1.1 12.4l-2.5-2.7-4.9 2.7 5.3-5.6 2.6 2.7 4.8-2.7-5.3 5.6z"/></svg></a>
        <a href="https://twitter.com/intent/tweet?url=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}&text=${encodeURIComponent(p.name || '')}" target="_blank" rel="noopener" class="pdp-share-btn" aria-label="X"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
        <a href="https://pinterest.com/pin/create/button/?url=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}&description=${encodeURIComponent(p.name || '')}" target="_blank" rel="noopener" class="pdp-share-btn" aria-label="Pinterest"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12c0 5.1 3.2 9.5 7.6 11.2-.1-.9-.2-2.4 0-3.4.2-.9 1.4-5.9 1.4-5.9s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.8-2.3 3.8-5.6 0-2.9-2.1-5-5-5-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3-.1.4-.3 1.2-.3 1.4-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.8-7.3 7.9-7.3 4.2 0 7.4 3 7.4 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.8 2.9c-.3 1.1-1 2.4-1.5 3.2 1.1.4 2.4.5 3.6.5 6.6 0 12-5.4 12-12S18.6 0 12 0z"/></svg></a>
        <a href="https://wa.me/?text=${encodeURIComponent((p.name || '') + ' ' + 'https://attitudesport.ca' + productUrl(p))}" target="_blank" rel="noopener" class="pdp-share-btn" aria-label="WhatsApp"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.001-6.557 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg></a>
        <a href="mailto:?subject=${encodeURIComponent(p.name || '')}&body=${encodeURIComponent('https://attitudesport.ca' + productUrl(p))}" class="pdp-share-btn" aria-label="Courriel"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
        <button class="pdp-share-btn pdp-copy-link" id="pdp-copy-link" data-url="${'https://attitudesport.ca' + productUrl(p)}" aria-label="Copier le lien"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg></button>
      </div>
      ${desc ? `<div class="acc open"><div class="acc-head">Description <span>+</span></div>
        <p>${desc}</p>
      </div>` : ''}
      <div class="acc"><div class="acc-head">Livraison et retours <span>+</span></div></div>
      <div class="acc"><div class="acc-head">Entretien <span>+</span></div></div>
    </div>
  </div>
  ${related.length > 0 ? `<section class="related">
    <h2>Vous aimerez aussi</h2>
    <div class="grid g4">${related.map(rp => card(rp, false)).join('')}</div>
  </section>` : ''}
</main>`;
};

// ---------- Page caisse ----------
let squareCardInstance = null;
let squareCardAttached = false;

function pageCheckout() {
  if (state.cart.length === 0) {
    return `<main class="pad checkout-page"><div class="empty">Votre panier est vide. <a href="/" data-link>Retour à l'accueil</a></div></main>`;
  }
  const subtotal = cartTotal();
  const shippingTotal = subtotal >= 200 ? 0 : 25;
  const taxableBase = subtotal + shippingTotal;
  const tps = Math.round(taxableBase * 0.05 * 100) / 100;
  const tvq = Math.round(taxableBase * 0.09975 * 100) / 100;
  const total = Math.round((subtotal + shippingTotal + tps + tvq) * 100) / 100;

  const itemsHtml = state.cart.map(it => `
    <div class="checkout-item">
      <img class="checkout-item-img" src="${proxyImg(it.image_url || '')}" alt="">
      <div class="checkout-item-info">
        <div class="checkout-item-name">${it.name}</div>
        <div class="checkout-item-meta">${it.color || ''}${it.size ? ' · Taille ' + it.size : ''}</div>
      </div>
      <div class="checkout-item-qty">${it.qty}×</div>
      <div class="checkout-item-price">${fmtPrice(it.price * it.qty)}</div>
    </div>`).join('');

  return `
<main class="pad checkout-page">
  <div class="crumbs"><a href="/" data-link>Accueil</a> / <b>Commande</b></div>
  <h1 class="checkout-title">Finaliser la commande</h1>
  <div class="checkout-layout">
    <div class="checkout-form-col">
      <section class="checkout-section">
        <h2 class="checkout-section-title"><span class="checkout-step-num">1</span> Tes coordonnées</h2>
        <div class="checkout-fields">
          <label>Prénom*<input type="text" id="co-first-name" required></label>
          <label>Nom*<input type="text" id="co-last-name" required></label>
          <label>Courriel*<input type="email" id="co-email" required></label>
          <label>Téléphone<input type="tel" id="co-phone"></label>
        </div>
      </section>

      <section class="checkout-section">
        <h2 class="checkout-section-title"><span class="checkout-step-num">2</span> Mode de réception</h2>
        <div class="checkout-radio-cards">
          <label class="checkout-radio-card" id="fulfillment-pickup">
            <input type="radio" name="fulfillment" value="pickup" checked>
            <div class="checkout-radio-body">
              <div class="checkout-radio-title">Ramassage en boutique</div>
              <div class="checkout-radio-price">Gratuit</div>
              <div class="checkout-radio-detail">Alma, Québec<br>${BOUTIQUE_INFO.hours !== 'À CONFIRMER' ? BOUTIQUE_INFO.hours : 'Heures à confirmer'}</div>
            </div>
          </label>
          <label class="checkout-radio-card" id="fulfillment-delivery">
            <input type="radio" name="fulfillment" value="delivery">
            <div class="checkout-radio-body">
              <div class="checkout-radio-title">Livraison</div>
              <div class="checkout-radio-price">25 $ · gratuite dès 200 $</div>
              <div class="checkout-radio-detail">Livraison partout au Québec</div>
            </div>
          </label>
        </div>
        <div class="checkout-shipping-fields" id="checkout-shipping-fields" style="display:none">
          <label>Adresse*<input type="text" id="co-address1" required></label>
          <label>App.<input type="text" id="co-address2"></label>
          <label>Ville*<input type="text" id="co-city" required></label>
          <label>Province<input type="text" id="co-province" value="Québec" readonly></label>
          <label>Code postal*<input type="text" id="co-postal" required></label>
        </div>
      </section>

      <section class="checkout-section">
        <h2 class="checkout-section-title"><span class="checkout-step-num">3</span> Paiement</h2>
        <div id="card-container" class="checkout-card-container"></div>
        <div id="checkout-error" class="checkout-error" style="display:none"></div>
      </section>

      <button type="button" class="btn orange full checkout-submit" id="checkout-submit">Payer ${fmtPrice(total)}</button>
    </div>

    <aside class="checkout-summary">
      <h3>Récapitulatif</h3>
      <div class="checkout-summary-items">${itemsHtml}</div>
      <div class="checkout-summary-totals">
        <div class="checkout-summary-row"><span>Sous-total</span><span>${fmtPrice(subtotal)}</span></div>
        <div class="checkout-summary-row"><span>Livraison</span><span>${shippingTotal === 0 ? 'Gratuite' : fmtPrice(shippingTotal)}</span></div>
        <div class="checkout-summary-row"><span>TPS (5%)</span><span>${fmtPrice(tps)}</span></div>
        <div class="checkout-summary-row"><span>TVQ (9,975%)</span><span>${fmtPrice(tvq)}</span></div>
        <div class="checkout-summary-row total"><span>Total</span><span>${fmtPrice(total)}</span></div>
      </div>
    </aside>
  </div>
</main>`;
}

function pageConfirmation(orderNumber) {
  return `
<main class="pad checkout-page">
  <div class="checkout-confirmation">
    <div class="checkout-confirm-icon">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF5A1F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
    </div>
    <h1>Merci pour ta commande!</h1>
    <div class="checkout-confirm-num">N° de commande : <strong>${orderNumber}</strong></div>
    <p class="checkout-confirm-msg">Un courriel de confirmation a été envoyé. Nous te contacterons dès que ta commande sera prête.</p>
    <a href="/" class="btn orange" data-link>Retour à l'accueil</a>
  </div>
</main>`;
}

// ---------- Page connexion ----------
const pageLogin = () => `
<main class="admin-auth">
  <div class="auth-card">
    <div class="auth-logo"><img src="/logo.png" alt="Attitude Sports"></div>
    <h1>Connexion admin</h1>
    <p class="auth-sub">Accès réservé à l'administration du magasin.</p>
    <form id="login-form" class="auth-form">
      <label>Courriel
        <input type="email" id="login-email" required autocomplete="email">
      </label>
      <label>Mot de passe
        <div class="pass-wrap">
          <input type="password" id="login-pass" required autocomplete="current-password">
          <button type="button" id="toggle-pass" class="toggle-pass" aria-label="Afficher le mot de passe">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="eye-open"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="eye-closed" style="display:none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          </button>
        </div>
      </label>
      <div id="login-error" class="auth-error" style="display:none;"></div>
      <button type="submit" class="btn orange full">Se connecter</button>
    </form>
  </div>
</main>`;

// ---------- Page admin (dashboard moderne) ----------
const ADMIN_TABS = [
  { id: 'overview', label: "Vue d'ensemble", icon: 'M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z' },
  { id: 'inventory', label: 'Inventaire', icon: 'M20 7L12 3 4 7v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V7z' },
  { id: 'orders', label: 'Commandes', icon: 'M9 11H3v9h6v-9zm0-8H3v6h6V3zm12 8h-6v9h6v-9zm0-8h-6v6h6V3z' },
  { id: 'abandoned', label: 'Paniers non finalisés', icon: 'M3 3h2l2.4 12.4a2 2 0 002 1.6h9.2a2 2 0 002-1.6L23 6H6M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z' },
  { id: 'newsletter', label: 'Infolettre', icon: 'M22 6l-10 7L2 6M2 4h20v16H2V4z' },
  { id: 'campaign', label: 'Campagne', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3' },
];

const CAT_LABELS = { FEMME: 'Femme', HOMME: 'Homme', FILLE: 'Fille', GARCON: 'Garçon', UNISEXE: 'Unisexe' };
const CAT_COLORS = { FEMME: '#E91E63', HOMME: '#2196F3', FILLE: '#FF9800', GARCON: '#4CAF50', UNISEXE: '#9C27B0' };

function adminSidebar() {
  return `
  <aside class="adm-sidebar">
    <div class="adm-logo"><img src="/logo.png" alt="Attitude Sports"></div>
    <nav class="adm-nav">
      ${ADMIN_TABS.map(t => `
        <a href="/admin" class="adm-nav-item ${state.adminTab === t.id ? 'active' : ''}" data-link data-tab="${t.id}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${t.icon}"/></svg>
          <span>${t.label}</span>
        </a>`).join('')}
    </nav>
    <div class="adm-sidebar-footer">
      <div class="adm-user">${(state.session && state.session.user && state.session.user.email) || ''}</div>
      <a href="#" id="logout-btn" class="adm-logout">Déconnexion</a>
    </div>
  </aside>`;
}

function adminOverview() {
  const products = state.adminProducts;
  const skus = state.adminSkus;
  const totalStock = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalValue = skus.reduce((sum, s) => sum + (s.quantity || 0) * parseFloat(s.price || 0), 0);
  const lowStock = products.filter(p => {
    const ps = skus.filter(s => s.product_id === p.id);
    return ps.reduce((sum, s) => sum + (s.quantity || 0), 0) > 0 && ps.reduce((sum, s) => sum + (s.quantity || 0), 0) <= 5;
  }).length;
  const outOfStock = products.filter(p => {
    const ps = skus.filter(s => s.product_id === p.id);
    return ps.length > 0 && ps.reduce((sum, s) => sum + (s.quantity || 0), 0) === 0;
  }).length;
  const withImages = state.adminImages.length > 0 ? new Set(state.adminImages.map(i => i.numref)).size : 0;

  const catCounts = {};
  products.forEach(p => { const c = p.category || 'AUTRE'; catCounts[c] = (catCounts[c] || 0) + 1; });
  const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catEntries.map(e => e[1]), 1);

  const supCounts = {};
  products.forEach(p => { const s = p.supplier || 'Autre'; supCounts[s] = (supCounts[s] || 0) + 1; });
  const supEntries = Object.entries(supCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Vue d'ensemble</h1>
      <div class="adm-date">${new Date().toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    <div class="adm-stats-grid">
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(33,150,243,.1);color:#2196F3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7L12 3 4 7v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V7z"/></svg>
        </div>
        <div class="adm-stat-info"><span class="adm-stat-num">${products.length}</span><span class="adm-stat-label">Produits</span></div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(76,175,80,.1);color:#4CAF50">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <div class="adm-stat-info"><span class="adm-stat-num">${skus.length}</span><span class="adm-stat-label">Variants (SKUs)</span></div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(255,152,0,.1);color:#FF9800">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div class="adm-stat-info"><span class="adm-stat-num">${totalStock}</span><span class="adm-stat-label">Articles en stock</span></div>
      </div>
      <div class="adm-stat-card">
        <div class="adm-stat-icon" style="background:rgba(156,39,176,.1);color:#9C27B0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
        </div>
        <div class="adm-stat-info"><span class="adm-stat-num">${fmtPrice(totalValue)}</span><span class="adm-stat-label">Valeur inventaire</span></div>
      </div>
    </div>
    <div class="adm-stats-grid" style="margin-top:16px;">
      ${(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const orders = state.adminOrders || [];
        const todayOrders = orders.filter(o => o.created_at >= todayStart).length;
        const monthOrders = orders.filter(o => o.created_at >= monthStart && o.status !== 'cancelled');
        const monthRevenue = monthOrders.reduce((s, o) => s + parseFloat(o.total || 0), 0);
        const toPrepare = orders.filter(o => o.status === 'paid' || o.status === 'preparing').length;
        const activeCarts = (state.adminAbandonedCarts || []).length;
        return `
        <div class="adm-stat-card">
          <div class="adm-stat-icon" style="background:rgba(255,90,31,.1);color:#FF5A1F">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11H3v9h6v-9zm0-8H3v6h6V3zm12 8h-6v9h6v-9zm0-8h-6v6h6V3z"/></svg>
          </div>
          <div class="adm-stat-info"><span class="adm-stat-num">${todayOrders}</span><span class="adm-stat-label">Commandes du jour</span></div>
        </div>
        <div class="adm-stat-card">
          <div class="adm-stat-icon" style="background:rgba(76,175,80,.1);color:#4CAF50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          </div>
          <div class="adm-stat-info"><span class="adm-stat-num">${fmtPrice(monthRevenue)}</span><span class="adm-stat-label">CA du mois</span></div>
        </div>
        <div class="adm-stat-card">
          <div class="adm-stat-icon" style="background:rgba(33,150,243,.1);color:#2196F3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div class="adm-stat-info"><span class="adm-stat-num">${toPrepare}</span><span class="adm-stat-label">À préparer</span></div>
        </div>
        <div class="adm-stat-card">
          <div class="adm-stat-icon" style="background:rgba(255,152,0,.1);color:#FF9800">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h9.2a2 2 0 002-1.6L23 6H6"/></svg>
          </div>
          <div class="adm-stat-info"><span class="adm-stat-num">${activeCarts}</span><span class="adm-stat-label">Paniers non finalisés</span></div>
        </div>`;
      })()}
    </div>
    <div class="adm-row">
      <div class="adm-panel adm-panel-flex">
        <div class="adm-panel-head"><h3>Répartition par catégorie</h3></div>
        <div class="adm-bars">
          ${catEntries.map(([cat, count]) => `
            <div class="adm-bar-row">
              <span class="adm-bar-label">${CAT_LABELS[cat] || cat}</span>
              <div class="adm-bar-track"><div class="adm-bar-fill" style="width:${(count / maxCat * 100).toFixed(0)}%;background:${CAT_COLORS[cat] || '#666'}"></div></div>
              <span class="adm-bar-val">${count}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Alertes stock</h3></div>
        <div class="adm-alerts">
          <div class="adm-alert-row"><span class="adm-alert-dot" style="background:#F44336"></span><span class="adm-alert-text">Rupture de stock</span><span class="adm-alert-num">${outOfStock}</span></div>
          <div class="adm-alert-row"><span class="adm-alert-dot" style="background:#FF9800"></span><span class="adm-alert-text">Stock faible (5 ou moins)</span><span class="adm-alert-num">${lowStock}</span></div>
          <div class="adm-alert-row"><span class="adm-alert-dot" style="background:#4CAF50"></span><span class="adm-alert-text">En stock</span><span class="adm-alert-num">${products.length - outOfStock - lowStock}</span></div>
        </div>
      </div>
    </div>
    <div class="adm-row">
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Top fournisseurs</h3></div>
        <div class="adm-bars">
          ${supEntries.map(([sup, count]) => `
            <div class="adm-bar-row">
              <span class="adm-bar-label">${sup}</span>
              <div class="adm-bar-track"><div class="adm-bar-fill" style="width:${(count / products.length * 100).toFixed(0)}%;background:#2E2E34"></div></div>
              <span class="adm-bar-val">${count}</span>
            </div>`).join('')}
        </div>
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Couverture images</h3></div>
        <div class="adm-img-coverage">
          <div class="adm-coverage-ring">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E9E6DE" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#FF5A1F" stroke-width="10" stroke-linecap="round"
                stroke-dasharray="${2 * Math.PI * 50}" stroke-dashoffset="${2 * Math.PI * 50 * (1 - (withImages / Math.max(products.length, 1)))}"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="adm-coverage-num">${Math.round(withImages / Math.max(products.length, 1) * 100)}%</div>
          </div>
          <div class="adm-coverage-text">
            <span><strong>${withImages}</strong> produits avec images</span>
            <span><strong>${products.length - withImages}</strong> sans images</span>
            <span><strong>${state.adminImages.length}</strong> images au total</span>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function getProductPrice(p) {
  const sku = state.adminSkus.find(s => s.product_id === p.id);
  return sku ? sku.price : 0;
}
function getProductStock(p) {
  return state.adminSkus.filter(s => s.product_id === p.id).reduce((sum, s) => sum + (s.quantity || 0), 0);
}

function adminInventory() {
  const f = state.adminFilter;
  let products = [...state.adminProducts];

  if (f.search) {
    const q = f.search.toLowerCase();
    products = products.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.numref || '').toLowerCase().includes(q) ||
      (p.supplier || '').toLowerCase().includes(q)
    );
  }
  if (f.category) products = products.filter(p => p.category === f.category);
  if (f.supplier) products = products.filter(p => p.supplier === f.supplier);
  if (f.stock === 'low') products = products.filter(p => {
    const tot = getProductStock(p);
    return tot > 0 && tot <= 5;
  });
  if (f.stock === 'out') products = products.filter(p => {
    const ps = state.adminSkus.filter(s => s.product_id === p.id);
    return ps.length > 0 && ps.every(s => (s.quantity || 0) === 0);
  });
  if (f.photo === 'with') products = products.filter(p => state.adminImages.some(i => i.numref === p.numref));
  if (f.photo === 'without') products = products.filter(p => !state.adminImages.some(i => i.numref === p.numref));
  if (f.noprice === 'yes') products = products.filter(p => {
    const skus = state.adminSkus.filter(s => s.product_id === p.id);
    return skus.length === 0 || skus.every(s => !s.price || parseFloat(s.price) === 0);
  });

  if (state.adminSort === 'name') products.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (state.adminSort === 'price-asc') products.sort((a, b) => (parseFloat(getProductPrice(a)) || 0) - (parseFloat(getProductPrice(b)) || 0));
  if (state.adminSort === 'price-desc') products.sort((a, b) => (parseFloat(getProductPrice(b)) || 0) - (parseFloat(getProductPrice(a)) || 0));
  if (state.adminSort === 'stock') products.sort((a, b) => getProductStock(b) - getProductStock(a));

  const totalPages = Math.ceil(products.length / state.adminPerPage);
  const page = Math.min(state.adminPage, totalPages || 1);
  const start = (page - 1) * state.adminPerPage;
  const pageProducts = products.slice(start, start + state.adminPerPage);

  const suppliers = [...new Set(state.adminProducts.map(p => p.supplier).filter(Boolean))].sort();
  const categories = [...new Set(state.adminProducts.map(p => p.category).filter(Boolean))].sort();

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Inventaire</h1>
      <div class="adm-count-pill">${products.length} produits</div>
    </div>
    <div class="adm-toolbar">
      <div class="adm-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="adm-search" placeholder="Rechercher par nom, ref. ou fournisseur..." value="${f.search || ''}">
      </div>
      <select id="adm-filter-cat" class="adm-select">
        <option value="">Toutes categories</option>
        ${categories.map(c => `<option value="${c}" ${f.category === c ? 'selected' : ''}>${CAT_LABELS[c] || c}</option>`).join('')}
      </select>
      <select id="adm-filter-sup" class="adm-select">
        <option value="">Tous fournisseurs</option>
        ${suppliers.map(s => `<option value="${s}" ${f.supplier === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select id="adm-filter-stock" class="adm-select">
        <option value="">Tout le stock</option>
        <option value="low" ${f.stock === 'low' ? 'selected' : ''}>Stock faible</option>
        <option value="out" ${f.stock === 'out' ? 'selected' : ''}>Rupture</option>
      </select>
      <select id="adm-filter-price" class="adm-select">
        <option value="">Tous les prix</option>
        <option value="yes" ${f.noprice === 'yes' ? 'selected' : ''}>Sans prix</option>
      </select>
      <select id="adm-filter-photo" class="adm-select">
        <option value="">Toutes photos</option>
        <option value="with" ${f.photo === 'with' ? 'selected' : ''}>Avec photos</option>
        <option value="without" ${f.photo === 'without' ? 'selected' : ''}>Sans photos</option>
      </select>
      <select id="adm-sort" class="adm-select">
        <option value="name" ${state.adminSort === 'name' ? 'selected' : ''}>Trier : Nom</option>
        <option value="price-asc" ${state.adminSort === 'price-asc' ? 'selected' : ''}>Prix croissant</option>
        <option value="price-desc" ${state.adminSort === 'price-desc' ? 'selected' : ''}>Prix decroissant</option>
        <option value="stock" ${state.adminSort === 'stock' ? 'selected' : ''}>Stock</option>
      </select>
      <button id="adm-export-csv" class="btn orange" style="padding:8px 16px;font-size:13px;white-space:nowrap;">Exporter CSV</button>
      <button id="adm-import-csv" class="btn" style="padding:8px 16px;font-size:13px;white-space:nowrap;background:#2E2E34;color:#fff;">Importer CSV</button>
      <input type="file" id="adm-csv-file" accept=".csv" style="display:none;">
      <span id="adm-import-status" style="font-size:13px;color:#666;"></span>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Produit</th><th>Ref.</th><th>Categorie</th><th>Dept.</th><th>Fournisseur</th><th>Saison</th><th>Couleurs</th><th>Tailles</th><th>Prix</th><th>Stock</th><th>SKUs</th><th>Img</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${pageProducts.map(p => {
            const stock = getProductStock(p);
            const skus = state.adminSkus.filter(s => s.product_id === p.id);
            const skuCount = skus.length;
            const imgCount = state.adminImages.filter(i => i.numref === p.numref).length;
            const stockClass = stock === 0 ? 'out' : stock <= 5 ? 'low' : 'ok';
            const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
            const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
            return `
            <tr class="adm-row-click" data-id="${p.id}">
              <td><div class="adm-prod-cell"><span class="adm-prod-name">${p.name || '—'}</span></div></td>
              <td><span class="adm-ref">${p.numref || '—'}</span></td>
              <td>${p.category ? `<span class="adm-cat-tag" style="background:${CAT_COLORS[p.category] || '#666'}">${CAT_LABELS[p.category] || p.category}</span>` : '—'}</td>
              <td>${p.department || '—'}</td>
              <td>${p.supplier || '—'}</td>
              <td>${p.season || '—'}</td>
              <td>${colors.length > 0 ? `<div class="adm-color-cells">${colors.map(c => `<span class="adm-color-cell" title="${c}" style="background:${realColor(c)}"></span>`).join('')}<span class="adm-color-count">${colors.length}</span></div>` : '—'}</td>
              <td>${sizes.length > 0 ? `<div class="adm-size-cells">${sizes.map(s => `<span class="adm-size-cell">${s}</span>`).join('')}</div>` : '—'}</td>
              <td>${(() => {
                const pr = getProductPrice(p);
                const hasPrice = pr && parseFloat(pr) > 0;
                return hasPrice
                  ? `<span class="adm-price">${fmtPrice(pr)}</span>`
                  : `<div class="adm-quick-price"><input type="number" class="adm-quick-price-input" data-product-id="${p.id}" placeholder="0.00" step="0.01" min="0" style="width:70px"><button class="adm-quick-price-btn" data-product-id="${p.id}">OK</button></div>`;
              })()}</td>
              <td><span class="adm-stock adm-stock-${stockClass}">${stock}</span></td>
              <td>${skuCount}</td>
              <td>${imgCount > 0 ? `<div class="adm-thumb-strip" data-id="${p.id}">${state.adminImages.filter(i => i.numref === p.numref).sort((a,b) => a.image_number - b.image_number).slice(0, 3).map(img => `<img src="${proxyImg(img.image_url || '')}" alt="" loading="lazy">`).join('')}<span class="adm-img-count">${imgCount}</span></div>` : '<span class="adm-no-img">Aucune</span>'}</td>
              <td><button class="adm-view-btn" data-id="${p.id}">Details</button></td>
              <td><button class="adm-expand-btn${state.adminExpandedRows[p.id] ? ' expanded' : ''}" data-id="${p.id}" title="Configurer couleurs × tailles">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button></td>
            </tr>
            ${state.adminExpandedRows[p.id] && colors.length > 0 && sizes.length > 0 ? `
            <tr class="adm-matrix-inline-row">
              <td colspan="14">
                <div class="adm-matrix-inline">
                  <table class="adm-matrix">
                    <thead>
                      <tr>
                        <th class="adm-matrix-corner">Couleur \\ Taille</th>
                        ${sizes.map(s => `<th class="adm-matrix-size">${s}</th>`).join('')}
                      </tr>
                    </thead>
                    <tbody>
                      ${colors.map(c => {
                        const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
                        return `<tr>
                          <td class="adm-matrix-color">
                            <span class="adm-color-dot" style="background:${hex}"></span>
                            <span>${c}</span>
                          </td>
                          ${sizes.map(sz => {
                            const exists = skus.some(s => s.color === c && s.size === sz);
                            return `<td class="adm-matrix-cell${exists ? ' active' : ''}" data-color="${(c || '').replace(/"/g, '&quot;')}" data-size="${(sz || '').replace(/"/g, '&quot;')}" data-product-id="${p.id}">
                              <span class="adm-matrix-check">${exists ? '&#10003;' : '&mdash;'}</span>
                            </td>`;
                          }).join('')}
                        </tr>`;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>` : ''}`;
          }).join('')}
        </tbody>
      </table>
    </div>
    ${totalPages > 1 ? `
    <div class="adm-pagination">
      ${page > 1 ? `<button class="adm-page-btn" data-page="${page - 1}">&larr;</button>` : ''}
      <span class="adm-page-info">Page ${page} / ${totalPages}</span>
      ${page < totalPages ? `<button class="adm-page-btn" data-page="${page + 1}">&rarr;</button>` : ''}
    </div>` : ''}
  </div>`;
}

function adminProductDetail(product) {
  const skus = state.adminSkus.filter(s => s.product_id === product.id);
  const images = (state.adminImages || []).filter(i => i.numref === product.numref).sort((a, b) => (a.image_number || 1) - (b.image_number || 1));
  const totalStock = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalValue = skus.reduce((sum, s) => sum + (s.quantity || 0) * parseFloat(s.price || 0), 0);
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
  const desc = product.description_fr || product.description_web || product.description_en || '';

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <div class="adm-back-row">
        <button class="adm-back-btn" id="adm-back">&larr; Retour</button>
        <h1 class="adm-title">${product.name || 'Produit'}</h1>
      </div>
      <span class="adm-ref-tag">Ref. ${product.numref || ''}</span>
    </div>
    <div class="adm-detail-grid">
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Images (${images.length})</h3>
          <span class="adm-sub">Clique une image pour lui assigner une couleur</span>
        </div>
        <div class="adm-img-grid">
          ${images.length > 0
            ? images.map((img, i) => {
                const assignedColor = img.color || '';
                const colorHex = assignedColor ? (skus.find(s => s.color === assignedColor)?.color_hex || realColor(assignedColor)) : '';
                return `
              <div class="adm-img-thumb adm-img-assign" data-img-id="${img.id}" data-numref="${product.numref}">
                <img class="prod-thumb" src="${proxyImg(img.image_url || '')}" alt="" loading="lazy">
                <div class="adm-img-placeholder"><span>${i + 1}</span></div>
                <div class="adm-img-name">${img.image_number === 1 ? 'Front' : img.image_number === 2 ? 'Back' : 'Detail ' + img.image_number}</div>
                ${assignedColor ? `<div class="adm-img-color-tag"><span class="adm-color-dot" style="background:${colorHex}"></span>${assignedColor}</div>` : '<div class="adm-img-color-tag unassigned">Non assignée</div>'}
              </div>`;
              }).join('')
            : '<div class="adm-no-images">Aucune image pour ce produit</div>'}
        </div>
        ${colors.length > 0 ? `
        <div class="adm-img-assign-bar">
          <label>Assigner la couleur:
            <select id="adm-img-color-select" class="adm-select">
              <option value="">— Choisir —</option>
              ${colors.map(c => {
                const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
                return `<option value="${c}" data-hex="${hex}">${c}</option>`;
              }).join('')}
            </select>
          </label>
          <button class="btn sm" id="adm-img-assign-btn" disabled>Assigner aux images sélectionnées</button>
          <button class="btn sm ghost" id="adm-img-unassign-btn" disabled>Retirer couleur</button>
        </div>` : ''}
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Informations</h3>
          <button class="btn sm orange" id="adm-save-product" data-product-id="${product.id}">Enregistrer</button>
        </div>
        <form id="adm-product-form" class="adm-edit-form">
          <div class="adm-info-grid">
            <div class="adm-info-item"><span class="adm-info-label">No. de référence</span><span class="adm-info-val adm-ref-highlight">${product.numref || '—'}</span></div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-name">Nom</label>
              <input type="text" id="ep-name" class="adm-edit-input" value="${(product.name || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-category">Categorie</label>
              <select id="ep-category" class="adm-edit-input">
                ${['FEMME','HOMME','FILLE','GARCON','UNISEXE'].map(c => `<option value="${c}" ${product.category === c ? 'selected' : ''}>${CAT_LABELS[c] || c}</option>`).join('')}
              </select>
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-department">Departement</label>
              <input type="text" id="ep-department" class="adm-edit-input" value="${(product.department || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-subdept">Sous-dept.</label>
              <input type="text" id="ep-subdept" class="adm-edit-input" value="${(product.sub_department || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-supplier">Fournisseur</label>
              <input type="text" id="ep-supplier" class="adm-edit-input" value="${(product.supplier || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-season">Saison</label>
              <input type="text" id="ep-season" class="adm-edit-input" value="${(product.season || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-tps">TPS %</label>
              <input type="number" step="0.01" id="ep-tps" class="adm-edit-input" value="${product.tax_tps || 5}">
            </div>
            <div class="adm-info-item">
              <label class="adm-info-label" for="ep-tvq">TVQ %</label>
              <input type="number" step="0.001" id="ep-tvq" class="adm-edit-input" value="${product.tax_tvq || 9.975}">
            </div>
          </div>
          <div class="adm-info-item adm-desc-item">
            <label class="adm-info-label" for="ep-desc">Description</label>
            <textarea id="ep-desc" class="adm-edit-textarea" rows="3">${desc.replace(/</g, '&lt;')}</textarea>
          </div>
        </form>
      </div>
    </div>
    <div class="adm-row">
      <div class="adm-panel adm-panel-flex">
        <div class="adm-panel-head">
          <h3>Stock par variant (${skus.length} SKUs)</h3>
          <div class="adm-stock-summary">
            <span class="adm-stock-tag">Total: ${totalStock}</span>
            <span class="adm-stock-tag">Valeur: ${fmtPrice(totalValue)}</span>
            <button class="btn sm orange" id="adm-save-skus">Enregistrer les variants</button>
          </div>
        </div>
        <div class="adm-sku-table-wrap">
          <table class="adm-sku-table">
            <thead><tr><th>Taille</th><th>Couleur</th><th>Aperçu couleur</th><th>Code-barres</th><th>Qte</th><th>Prix</th><th>Prix sugg.</th></tr></thead>
            <tbody>
              ${skus.map(s => `
                <tr>
                  <td>${s.size || '—'}</td>
                  <td>${s.color || '—'}</td>
                  <td><div class="adm-color-cell"><span class="adm-color-dot" style="background:${s.color_hex || realColor(s.color)}"></span><input type="color" class="adm-color-picker" data-sku-id="${s.id}" value="${(s.color_hex || realColor(s.color)).includes('#') ? (s.color_hex || realColor(s.color)) : '#9C9CA4'}"></div></td>
                  <td><span class="adm-barcode">${s.barcode || '—'}</span></td>
                  <td><input type="number" class="adm-sku-input adm-sku-qty" data-sku-id="${s.id}" value="${s.quantity || 0}" min="0" style="width:60px"></td>
                  <td><input type="number" class="adm-sku-input adm-sku-price" data-sku-id="${s.id}" value="${s.price || 0}" step="0.01" min="0" style="width:80px"></td>
                  <td><input type="number" class="adm-sku-input adm-sku-suggested" data-sku-id="${s.id}" value="${s.suggested_price || ''}" step="0.01" min="0" style="width:80px"></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ${colors.length > 0 && sizes.length > 0 ? `
    <div class="adm-row">
      <div class="adm-panel adm-panel-flex">
        <div class="adm-panel-head">
          <h3>Disponibilité couleurs × tailles</h3>
          <span class="adm-sub">Cochez les cases pour activer/désactiver une combinaison. Par défaut, toutes les tailles sont disponibles pour chaque couleur.</span>
        </div>
        <div class="adm-matrix-wrap">
          <table class="adm-matrix">
            <thead>
              <tr>
                <th class="adm-matrix-corner">Couleur \\ Taille</th>
                ${sizes.map(s => `<th class="adm-matrix-size">${s}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${colors.map(c => {
                const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
                return `<tr>
                  <td class="adm-matrix-color">
                    <span class="adm-color-dot" style="background:${hex}"></span>
                    <span>${c}</span>
                  </td>
                  ${sizes.map(sz => {
                    const exists = skus.some(s => s.color === c && s.size === sz);
                    return `<td class="adm-matrix-cell${exists ? ' active' : ''}" data-color="${(c || '').replace(/"/g, '&quot;')}" data-size="${(sz || '').replace(/"/g, '&quot;')}">
                      <span class="adm-matrix-check">${exists ? '&#10003;' : '&mdash;'}</span>
                    </td>`;
                  }).join('')}
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>` : (colors.length > 0 ? `
    <div class="adm-row">
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Couleurs configurées (${colors.length})</h3>
          <span class="adm-sub">Le cercle de couleur est défini par le sélecteur de pixels dans le tableau ci-dessus.</span>
        </div>
        <div class="adm-color-circles">
          ${colors.map(c => {
            const hex = skus.find(s => s.color === c)?.color_hex || realColor(c);
            return `<div class="adm-color-circle-item">
              <span class="adm-color-circle" style="background:${hex}"></span>
              <span class="adm-color-circle-label">${c}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${sizes.length ? `<div class="adm-panel"><div class="adm-panel-head"><h3>Tailles (${sizes.length})</h3></div><div class="adm-chips">${sizes.map(s => `<span class="adm-chip">${s}</span>`).join('')}</div></div>` : ''}
    </div>` : '')}
    <div class="adm-row">
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Ajouter une variante</h3>
          <span class="adm-sub">Cree une nouvelle variante (taille/couleur) pour ce produit.</span>
        </div>
        <div class="adm-add-sku-form">
          <div class="adm-add-sku-row">
            <label>Taille<input type="text" id="adm-new-sku-size" placeholder="ex: S, M, L, 42" style="width:100px"></label>
            <label>Couleur<input type="text" id="adm-new-sku-color" placeholder="ex: Noir" style="width:120px"></label>
            <label>Couleur (hex)<input type="color" id="adm-new-sku-hex" value="#9C9CA4" style="width:48px;height:36px;padding:0;border:none"></label>
            <label>Prix<input type="number" id="adm-new-sku-price" placeholder="0.00" step="0.01" min="0" style="width:90px"></label>
            <label>Qte<input type="number" id="adm-new-sku-qty" value="0" min="0" style="width:70px"></label>
            <button class="btn sm orange" id="adm-add-sku-btn">+ Ajouter</button>
          </div>
        </div>
      </div>
    </div>
    <div id="adm-detail-status" class="adm-detail-status"></div>
  </div>`;
}

function adminCampaign() {
  return `
  <div class="adm-content">
    <div class="adm-topbar"><h1 class="adm-title">Campagne d'accueil</h1></div>
    <div class="adm-panel adm-campaign-panel">
      <div class="adm-campaign-head">
        <h3>Section campagne (accueil)</h3>
        <p class="adm-sub">Modifie la banniere promotionnelle affichee sous le hero de la page d'accueil.</p>
      </div>
      <form id="campaign-form" class="campaign-form">
        <div class="form-row">
          <label>Petit titre (eyebrow)<input type="text" id="cf-eyebrow" value="${(state.campaign && state.campaign.eyebrow) || ''}"></label>
          <label>Titre principal<input type="text" id="cf-title" value="${(state.campaign && state.campaign.title) || ''}"></label>
        </div>
        <label>Description<textarea id="cf-description" rows="2">${(state.campaign && state.campaign.description) || ''}</textarea></label>
        <label>URL de l'image<input type="text" id="cf-image" value="${(state.campaign && state.campaign.image_url) || ''}"></label>
        <div class="form-row">
          <label>Texte bouton hommes<input type="text" id="cf-men-label" value="${(state.campaign && state.campaign.men_label) || ''}"></label>
          <label>Lien bouton hommes<input type="text" id="cf-men-link" value="${(state.campaign && state.campaign.men_link) || ''}"></label>
        </div>
        <div class="form-row">
          <label>Texte bouton femmes<input type="text" id="cf-women-label" value="${(state.campaign && state.campaign.women_label) || ''}"></label>
          <label>Lien bouton femmes<input type="text" id="cf-women-link" value="${(state.campaign && state.campaign.women_link) || ''}"></label>
        </div>
        <label class="checkbox-label"><input type="checkbox" id="cf-enabled" ${(!state.campaign || state.campaign.enabled !== false) ? 'checked' : ''}> Afficher la section sur la page d'accueil</label>
        <div id="campaign-error" class="auth-error" style="display:none;"></div>
        <button type="submit" class="btn orange">Enregistrer la campagne</button>
      </form>
    </div>
  </div>`;
}

// ---------- Admin: Orders ----------
const ORDER_STATUS_LABELS = {
  pending_payment: 'Paiement en attente', paid: 'Payé', preparing: 'En préparation',
  ready_for_pickup: 'Prêt pour ramassage', shipping: 'En livraison', delivered: 'Livré', cancelled: 'Annulé',
};
const ORDER_STATUS_COLORS = {
  pending_payment: '#FF9800', paid: '#4CAF50', preparing: '#2196F3',
  ready_for_pickup: '#9C27B0', shipping: '#FF5A1F', delivered: '#4CAF50', cancelled: '#F44336',
};

async function loadAdminOrders() {
  const [orders, items, history] = await Promise.all([
    fetchAll(supabase.from('orders').select('*').order('created_at', { ascending: false })),
    fetchAll(supabase.from('order_items').select('*')),
    fetchAll(supabase.from('order_status_history').select('*').order('created_at', { ascending: true })),
  ]);
  state.adminOrders = orders || [];
  state.adminOrderItems = {};
  (items || []).forEach(it => {
    if (!state.adminOrderItems[it.order_id]) state.adminOrderItems[it.order_id] = [];
    state.adminOrderItems[it.order_id].push(it);
  });
  state.adminOrderHistory = {};
  (history || []).forEach(h => {
    if (!state.adminOrderHistory[h.order_id]) state.adminOrderHistory[h.order_id] = [];
    state.adminOrderHistory[h.order_id].push(h);
  });
}

async function loadAdminAbandonedCarts() {
  const { data } = await supabase.from('abandoned_carts').select('*').eq('status', 'active').order('last_seen_at', { ascending: false });
  state.adminAbandonedCarts = data || [];
}

async function loadAdminNewsletter() {
  const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
  state.adminNewsletterSubs = data || [];
}

function adminOrders() {
  const f = state.adminOrderFilter;
  let orders = [...state.adminOrders];
  if (f.status) orders = orders.filter(o => o.status === f.status);
  if (f.fulfillment) orders = orders.filter(o => o.fulfillment_type === f.fulfillment);
  if (f.search) {
    const q = f.search.toLowerCase();
    orders = orders.filter(o =>
      (o.order_number || '').toLowerCase().includes(q) ||
      (o.customer_first_name || '').toLowerCase().includes(q) ||
      (o.customer_last_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      (o.customer_phone || '').toLowerCase().includes(q)
    );
  }

  if (state.adminOrderDetail) {
    const o = state.adminOrders.find(x => x.id === state.adminOrderDetail);
    if (o) return adminOrderDetail(o);
  }

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Commandes</h1>
      <div class="adm-count-pill">${orders.length} commandes</div>
    </div>
    <div class="adm-toolbar">
      <div class="adm-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="adm-order-search" placeholder="Rechercher n°, nom, courriel, téléphone..." value="${f.search || ''}">
      </div>
      <select id="adm-order-status" class="adm-select">
        <option value="">Tous les statuts</option>
        ${Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => `<option value="${v}" ${f.status === v ? 'selected' : ''}>${l}</option>`).join('')}
      </select>
      <select id="adm-order-fulfillment" class="adm-select">
        <option value="">Tous les modes</option>
        <option value="pickup" ${f.fulfillment === 'pickup' ? 'selected' : ''}>Ramassage</option>
        <option value="delivery" ${f.fulfillment === 'delivery' ? 'selected' : ''}>Livraison</option>
      </select>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>N°</th><th>Date</th><th>Client</th><th>Courriel</th><th>Mode</th><th>Total</th><th>Statut</th><th></th></tr>
        </thead>
        <tbody>
          ${orders.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:24px;color:#999;">Aucune commande</td></tr>' : orders.map(o => `
            <tr class="adm-row-click" data-order-id="${o.id}">
              <td><strong>${o.order_number}</strong></td>
              <td>${new Date(o.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
              <td>${o.customer_first_name || ''} ${o.customer_last_name || ''}</td>
              <td>${o.customer_email || '—'}</td>
              <td>${o.fulfillment_type === 'pickup' ? 'Ramassage' : 'Livraison'}</td>
              <td>${fmtPrice(o.total)}</td>
              <td><span class="adm-status-badge" style="background:${ORDER_STATUS_COLORS[o.status] || '#666'}">${ORDER_STATUS_LABELS[o.status] || o.status}</span></td>
              <td><button class="adm-view-btn" data-order-id="${o.id}">Détails</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function adminOrderDetail(o) {
  const items = state.adminOrderItems[o.id] || [];
  const history = state.adminOrderHistory[o.id] || [];
  const itemsHtml = items.map(it => `
    <div class="adm-order-item">
      <img class="adm-order-item-img" src="${proxyImg(it.image_url || '')}" alt="">
      <div class="adm-order-item-info">
        <div class="adm-order-item-name">${it.name}</div>
        <div class="adm-order-item-meta">${it.color || ''}${it.size ? ' · Taille ' + it.size : ''}</div>
      </div>
      <div class="adm-order-item-qty">${it.quantity}×</div>
      <div class="adm-order-item-price">${fmtPrice(it.unit_price)}</div>
      <div class="adm-order-item-total">${fmtPrice(it.line_total)}</div>
    </div>`).join('');

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Commande ${o.order_number}</h1>
      <button id="adm-order-back" class="btn" style="padding:8px 16px;font-size:13px;background:#2E2E34;color:#fff;">← Retour</button>
    </div>
    <div id="adm-order-status-msg" class="adm-order-status-msg" style="display:none;"></div>
    <div class="adm-order-detail-layout">
      <div class="adm-order-detail-main">
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Articles</h3></div>
          <div class="adm-order-items">${itemsHtml}</div>
          <div class="adm-order-totals">
            <div class="adm-order-total-row"><span>Sous-total</span><span>${fmtPrice(o.subtotal)}</span></div>
            <div class="adm-order-total-row"><span>Livraison</span><span>${parseFloat(o.shipping_total) === 0 ? 'Gratuite' : fmtPrice(o.shipping_total)}</span></div>
            <div class="adm-order-total-row"><span>TPS</span><span>${fmtPrice(o.tps)}</span></div>
            <div class="adm-order-total-row"><span>TVQ</span><span>${fmtPrice(o.tvq)}</span></div>
            <div class="adm-order-total-row total"><span>Total</span><span>${fmtPrice(o.total)}</span></div>
          </div>
        </section>
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Historique des statuts</h3></div>
          <div class="adm-order-history">
            ${history.map(h => `
              <div class="adm-order-history-item">
                <span class="adm-order-history-dot" style="background:${ORDER_STATUS_COLORS[h.status] || '#666'}"></span>
                <span class="adm-order-history-status">${ORDER_STATUS_LABELS[h.status] || h.status}</span>
                <span class="adm-order-history-date">${new Date(h.created_at).toLocaleString('fr-CA')}</span>
                ${h.email_sent ? '<span class="adm-order-history-email">✉ Courriel envoyé</span>' : ''}
              </div>`).join('') || '<div style="padding:12px;color:#999;">Aucun historique</div>'}
          </div>
        </section>
      </div>
      <aside class="adm-order-detail-side">
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Statut</h3></div>
          <select id="adm-order-status-select" class="adm-select" style="width:100%;margin-bottom:8px;">
            ${Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => `<option value="${v}" ${o.status === v ? 'selected' : ''}>${l}</option>`).join('')}
          </select>
          <button id="adm-order-status-btn" class="btn orange" style="width:100%;" data-order-id="${o.id}" data-email="${o.customer_email}">Mettre à jour le statut</button>
        </section>
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Client</h3></div>
          <div class="adm-order-customer">
            <div><strong>${o.customer_first_name || ''} ${o.customer_last_name || ''}</strong></div>
            <div>${o.customer_email || '—'}</div>
            <div>${o.customer_phone || '—'}</div>
          </div>
        </section>
        ${o.fulfillment_type === 'delivery' ? `
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Adresse de livraison</h3></div>
          <div class="adm-order-customer">
            <div>${o.ship_address1 || ''}</div>
            ${o.ship_address2 ? `<div>${o.ship_address2}</div>` : ''}
            <div>${o.ship_city || ''} ${o.ship_province || ''} ${o.ship_postal_code || ''}</div>
          </div>
        </section>` : `
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Ramassage en boutique</h3></div>
          <div class="adm-order-customer">
            <div>1234 rue Sainte-Catherine O, Montréal, QC</div>
            <div>Lun–Ven 10h–19h · Sam 10h–17h · Dim 12h–17h</div>
          </div>
        </section>`}
        ${o.square_payment_id ? `
        <section class="adm-panel">
          <div class="adm-panel-head"><h3>Paiement</h3></div>
          <div class="adm-order-customer">
            <div>Square ID: <code>${o.square_payment_id}</code></div>
            <div>Statut paiement: ${o.payment_status || '—'}</div>
          </div>
        </section>` : ''}
      </aside>
    </div>
  </div>`;
}

function adminAbandonedCarts() {
  const f = state.adminAbandonedFilter;
  let carts = [...state.adminAbandonedCarts];
  if (f.emailOnly) carts = carts.filter(c => c.email);
  if (f.search) {
    const q = f.search.toLowerCase();
    carts = carts.filter(c => (c.email || '').toLowerCase().includes(q) || (c.first_name || '').toLowerCase().includes(q) || (c.last_name || '').toLowerCase().includes(q));
  }

  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Paniers non finalisés</h1>
      <div class="adm-count-pill">${carts.length} paniers actifs</div>
    </div>
    <div class="adm-toolbar">
      <div class="adm-search-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="adm-abandoned-search" placeholder="Rechercher par courriel ou nom..." value="${f.search || ''}">
      </div>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="checkbox" id="adm-abandoned-email-only" ${f.emailOnly ? 'checked' : ''}> Avec courriel seulement
      </label>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>Dernière activité</th><th>Courriel</th><th>Nom</th><th>Articles</th><th>Sous-total</th><th>Statut caisse</th><th></th></tr>
        </thead>
        <tbody>
          ${carts.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:24px;color:#999;">Aucun panier</td></tr>' : carts.map(c => {
            const expanded = state.adminAbandonedExpanded[c.id];
            const items = Array.isArray(c.items) ? c.items : [];
            const itemsHtml = items.map(it => `
              <div class="adm-abandoned-item">
                <img class="adm-abandoned-item-img" src="${proxyImg(it.image || '')}" alt="">
                <div class="adm-abandoned-item-info">
                  <div>${it.name || '—'}</div>
                  <div class="adm-abandoned-item-meta">${it.color || ''}${it.size ? ' · ' + it.size : ''} · ×${it.qty || 1}</div>
                </div>
                <div>${fmtPrice((it.price || 0) * (it.qty || 1))}</div>
              </div>`).join('');
            const recoverySubject = `Votre panier vous attend chez Attitude Sports`;
            const recoveryBody = `Bonjour ${c.first_name || ''},\n\nVous avez laissé des articles dans votre panier sur notre site. Il n'est pas trop pour finaliser votre commande!\n\nArticles:\n${items.map(it => `- ${it.name || 'Article'} (${it.color || ''} ${it.size || ''}) ×${it.qty || 1} — ${fmtPrice((it.price || 0) * (it.qty || 1))}`).join('\n')}\n\nSous-total: ${fmtPrice(c.subtotal || 0)}\n\nMerci,\nL'équipe Attitude Sports`;
            return `
            <tr class="adm-row-click" data-cart-id="${c.id}">
              <td>${new Date(c.last_seen_at).toLocaleString('fr-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              <td>${c.email || '<span style="color:#999;">inconnu</span>'}</td>
              <td>${c.first_name || ''} ${c.last_name || ''}</td>
              <td>${c.items_count || items.length || 0}</td>
              <td>${fmtPrice(c.subtotal || 0)}</td>
              <td>${c.reached_checkout ? '<span class="adm-status-badge" style="background:#FF9800">A atteint la caisse</span>' : '<span class="adm-status-badge" style="background:#9E9E9E">Panier abandonné</span>'}</td>
              <td><button class="adm-expand-btn${expanded ? ' expanded' : ''}" data-cart-id="${c.id}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg></button></td>
            </tr>
            ${expanded ? `
            <tr class="adm-matrix-inline-row">
              <td colspan="7">
                <div class="adm-abandoned-detail">
                  <div class="adm-abandoned-items">${itemsHtml || '<div style="padding:8px;color:#999;">Aucun article</div>'}</div>
                  ${c.email ? `<a href="mailto:${c.email}?subject=${encodeURIComponent(recoverySubject)}&body=${encodeURIComponent(recoveryBody)}" class="btn orange" style="font-size:13px;padding:8px 16px;">Relancer par courriel</a>` : ''}
                </div>
              </td>
            </tr>` : ''}`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function adminNewsletter() {
  const subs = state.adminNewsletterSubs;
  return `
  <div class="adm-content">
    <div class="adm-topbar">
      <h1 class="adm-title">Infolettre</h1>
      <div class="adm-count-pill">${subs.length} abonnés</div>
    </div>
    <div class="adm-toolbar">
      <button id="adm-newsletter-export" class="btn orange" style="padding:8px 16px;font-size:13px;">Exporter CSV</button>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr><th>Courriel</th><th>Source</th><th>Date d'inscription</th></tr>
        </thead>
        <tbody>
          ${subs.length === 0 ? '<tr><td colspan="3" style="text-align:center;padding:24px;color:#999;">Aucun abonné</td></tr>' : subs.map(s => `
            <tr>
              <td><strong>${s.email}</strong></td>
              <td>${s.source || 'footer'}</td>
              <td>${new Date(s.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function exportNewsletterCSV() {
  const subs = state.adminNewsletterSubs;
  const headers = ['Courriel', 'Source', 'Date inscription'];
  const rows = subs.map(s => [s.email || '', s.source || '', new Date(s.created_at).toLocaleString('fr-CA')]);
  const csv = [headers, ...rows].map(r => r.map(c => {
    const s = String(c == null ? '' : c);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'infolettre_abonnes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const pageAdmin = () => {
  if (!state.session) return pageLogin();
  let content;
  if (state.adminDetailProduct) {
    content = adminProductDetail(state.adminDetailProduct);
  } else if (state.adminTab === 'overview') {
    content = adminOverview();
  } else if (state.adminTab === 'inventory') {
    content = adminInventory();
  } else if (state.adminTab === 'orders') {
    content = adminOrders();
  } else if (state.adminTab === 'abandoned') {
    content = adminAbandonedCarts();
  } else if (state.adminTab === 'newsletter') {
    content = adminNewsletter();
  } else if (state.adminTab === 'campaign') {
    content = adminCampaign();
  } else {
    content = adminOverview();
  }
  return `<main class="adm-layout">${adminSidebar()}${content}</main>`;
};

// ---------- Admin logic ----------
async function loadAdminProducts() {
  const [prods, skus, adminImgs] = await Promise.all([
    fetchAll(supabase.from('products').select('*').order('created_at', { ascending: false })),
    fetchAll(supabase.from('skus').select('id,product_id,sku_id,barcode,size,color,color_hex,quantity,price,suggested_price,created_at')),
    fetchAll(supabase.from('product_images').select('id,numref,image_number,image_url,color,product_id').eq('deleted', false)),
  ]);
  state.adminProducts = (prods || []).filter(p => p.numref);
  state.adminSkus = skus || [];
  state.adminImages = (adminImgs || []).map(img => ({ id: img.id, numref: img.numref, image_number: img.image_number, image_url: img.image_url, color: img.color || '', product_id: img.product_id }));
  // Load orders + abandoned carts for overview stat cards
  await Promise.all([loadAdminOrders(), loadAdminAbandonedCarts()]);
  render();
}

async function saveCampaign(e) {
  e.preventDefault();
  const errEl = document.getElementById('campaign-error');
  errEl.style.display = 'none';
  const payload = {
    id: 'homepage-main',
    eyebrow: document.getElementById('cf-eyebrow').value.trim(),
    title: document.getElementById('cf-title').value.trim(),
    description: document.getElementById('cf-description').value.trim(),
    image_url: document.getElementById('cf-image').value.trim(),
    men_label: document.getElementById('cf-men-label').value.trim(),
    men_link: document.getElementById('cf-men-link').value.trim(),
    women_label: document.getElementById('cf-women-label').value.trim(),
    women_link: document.getElementById('cf-women-link').value.trim(),
    enabled: document.getElementById('cf-enabled').checked,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from('home_campaigns').upsert(payload, { onConflict: 'id' });
  if (error) {
    errEl.textContent = 'Erreur lors de l\'enregistrement: ' + error.message;
    errEl.style.display = 'block';
    return;
  }
  await loadCampaign();
  alert('Campagne enregistrée avec succès.');
  render();
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    errEl.textContent = error.message || 'Courriel ou mot de passe incorrect.';
    errEl.style.display = 'block';
    return;
  }
  state.session = data.session;
  navigate('/admin');
  await loadAdminProducts();
  render();
}

function exportInventoryCSV() {
  const products = state.adminProducts;
  const skus = state.adminSkus;
  const images = state.adminImages;
  const headers = ['Reference', 'Nom', 'Categorie', 'Departement', 'Marque', 'Saison', 'Tailles', 'Couleurs', 'Prix', 'Prix suggere', 'Stock total', 'Nb SKUs', 'Image (Oui/Non)', 'Nb images', 'Image URL'];
  const rows = products.map(p => {
    const pskus = skus.filter(s => s.product_id === p.id);
    const sizes = [...new Set(pskus.map(s => s.size).filter(Boolean))].join('; ');
    const colors = [...new Set(pskus.map(s => s.color).filter(Boolean))].join('; ');
    const price = pskus[0] ? pskus[0].price : '';
    const suggested = pskus[0] && pskus[0].suggested_price ? pskus[0].suggested_price : '';
    const stock = pskus.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const prodImgs = images.filter(i => i.numref === p.numref).sort((a, b) => a.image_number - b.image_number);
    const imgCount = prodImgs.length;
    const hasImg = imgCount > 0 ? 'Oui' : 'Non';
    const imgUrl = prodImgs[0] ? (prodImgs[0].image_url || '') : '';
    return [
      p.numref || '',
      p.name || '',
      CAT_LABELS[p.category] || p.category || '',
      p.department || '',
      p.supplier || '',
      p.season || '',
      sizes,
      colors,
      price,
      suggested,
      stock,
      pskus.length,
      hasImg,
      imgCount,
      imgUrl,
    ];
  });
  const csv = [headers, ...rows].map(r => r.map(c => {
    const s = String(c == null ? '' : c);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }).join(',')).join('\n');
  const bom = '\uFEFF';
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'inventaire_attitude_sports.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, '').trim();
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && clean[i + 1] === '\n') i++;
        row.push(field); rows.push(row); row = []; field = '';
      } else field += ch;
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function csvHeaderMap(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const key = h.trim().toLowerCase();
    if (key === 'reference' || key === 'ref.' || key === 'ref' || key === 'numref') map.numref = i;
    else if (key === 'nom' || key === 'name' || key === 'produit') map.name = i;
    else if (key === 'categorie' || key === 'category') map.category = i;
    else if (key === 'departement' || key === 'department' || key === 'dept.') map.department = i;
    else if (key === 'marque' || key === 'fournisseur' || key === 'supplier' || key === 'brand') map.supplier = i;
    else if (key === 'saison' || key === 'season') map.season = i;
    else if (key === 'tailles' || key === 'sizes') map.sizes = i;
    else if (key === 'couleurs' || key === 'colors') map.colors = i;
    else if (key === 'prix' || key === 'price') map.price = i;
    else if (key === 'prix suggere' || key === 'suggested_price' || key === 'prix sugg.') map.suggested = i;
    else if (key === 'stock total' || key === 'stock') map.stock = i;
    else if (key === 'image url' || key === 'image_url' || key === 'url image' || key === 'url') map.imageUrl = i;
  });
  return map;
}

const CAT_REVERSE = { 'Femme': 'FEMME', 'Homme': 'HOMME', 'Fille': 'FILLE', 'Garcon': 'GARCON', 'Unisexe': 'UNISEXE' };

async function importInventoryCSV(file) {
  const statusEl = document.getElementById('adm-import-status');
  if (statusEl) { statusEl.textContent = 'Lecture du fichier...'; statusEl.style.color = '#666'; }
  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    if (statusEl) { statusEl.textContent = 'Fichier vide ou invalide.'; statusEl.style.color = '#F44336'; }
    return;
  }
  const headers = rows[0].map(h => h.trim());
  const col = csvHeaderMap(headers);
  if (col.numref === undefined) {
    if (statusEl) { statusEl.textContent = 'Colonne Reference manquante.'; statusEl.style.color = '#F44336'; }
    return;
  }
  const dataRows = rows.slice(1).filter(r => r[col.numref] && r[col.numref].trim());
  let updated = 0, created = 0, imgUpdated = 0, errors = 0;

  for (let idx = 0; idx < dataRows.length; idx++) {
    const r = dataRows[idx];
    const numref = (r[col.numref] || '').trim();
    if (statusEl) statusEl.textContent = `Importation... ${idx + 1}/${dataRows.length} (${numref})`;

    const catRaw = col.category !== undefined ? (r[col.category] || '').trim() : '';
    const category = CAT_REVERSE[catRaw] || catRaw || '';

    const productPayload = {
      numref,
      name: col.name !== undefined ? (r[col.name] || '').trim() : '',
      category,
      department: col.department !== undefined ? (r[col.department] || '').trim() : '',
      supplier: col.supplier !== undefined ? (r[col.supplier] || '').trim() : '',
      season: col.season !== undefined ? (r[col.season] || '').trim() : '',
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase.from('products').select('id').eq('numref', numref).maybeSingle();
    let productId = existing && existing.id;

    if (productId) {
      const { error } = await supabase.from('products').update(productPayload).eq('id', productId);
      if (error) { console.error('update product error', numref, error); errors++; }
      else updated++;
    } else {
      const { data: inserted, error } = await supabase.from('products').insert(productPayload).select('id').single();
      if (error) { console.error('insert product error', numref, error); errors++; }
      else { productId = inserted.id; created++; }
    }

    if (productId && col.imageUrl !== undefined) {
      const url = (r[col.imageUrl] || '').trim();
      if (url) {
        const { data: existingImg } = await supabase.from('product_images').select('id').eq('numref', numref).eq('image_number', 1).maybeSingle();
        if (existingImg) {
          await supabase.from('product_images').update({ image_url: url, product_id: productId }).eq('id', existingImg.id);
        } else {
          await supabase.from('product_images').insert({ numref, product_id: productId, image_number: 1, image_url: url });
        }
        imgUpdated++;
      }
    }
  }

  const msg = `Termine: ${created} crees, ${updated} mis a jour, ${imgUpdated} images, ${errors} erreurs`;
  if (statusEl) { statusEl.textContent = msg; statusEl.style.color = errors > 0 ? '#FF9800' : '#4CAF50'; }
  await loadAdminProducts();
}

function bindAdminInventory() {
  const admSearch = document.getElementById('adm-search');
  if (admSearch) {
    admSearch.addEventListener('input', (e) => {
      state.adminFilter.search = e.target.value;
      state.adminPage = 1;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminInventory();
      bindAdminInventory();
    });
  }
  document.querySelectorAll('.adm-view-btn, .adm-row-click').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = state.adminProducts.find(x => x.id === btn.dataset.id);
      if (p) { state.adminDetailProduct = p; render(); }
    });
  });
  const exportBtn = document.getElementById('adm-export-csv');
  if (exportBtn) exportBtn.addEventListener('click', exportInventoryCSV);
  const importBtn = document.getElementById('adm-import-csv');
  const csvFileInput = document.getElementById('adm-csv-file');
  if (importBtn && csvFileInput) {
    importBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importInventoryCSV(file);
      csvFileInput.value = '';
    });
  }
}

function bindAdminOrders() {
  const admOrderSearch = document.getElementById('adm-order-search');
  if (admOrderSearch) {
    admOrderSearch.addEventListener('input', (e) => {
      state.adminOrderFilter.search = e.target.value;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminOrders();
      bindAdminOrders();
    });
  }
  const admOrderStatus = document.getElementById('adm-order-status');
  if (admOrderStatus) admOrderStatus.addEventListener('change', (e) => { state.adminOrderFilter.status = e.target.value; render(); });
  const admOrderFulfillment = document.getElementById('adm-order-fulfillment');
  if (admOrderFulfillment) admOrderFulfillment.addEventListener('change', (e) => { state.adminOrderFilter.fulfillment = e.target.value; render(); });
  document.querySelectorAll('[data-order-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.classList.contains('adm-order-status-btn')) return;
      e.stopPropagation();
      state.adminOrderDetail = btn.dataset.orderId;
      render();
    });
  });
}

function bindAdminAbandoned() {
  const admAbandonedSearch = document.getElementById('adm-abandoned-search');
  if (admAbandonedSearch) {
    admAbandonedSearch.addEventListener('input', (e) => {
      state.adminAbandonedFilter.search = e.target.value;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminAbandonedCarts();
      bindAdminAbandoned();
    });
  }
  document.querySelectorAll('[data-cart-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.cartId;
      state.adminAbandonedExpanded[id] = !state.adminAbandonedExpanded[id];
      render();
    });
  });
}

async function handleLogout(e) {
  e.preventDefault();
  await supabase.auth.signOut();
  state.session = null;
  navigate('/');
}

// ---------- Routeur ----------
const routes = {
  '/': pageHome,
  '/hommes': () => pagePlp('hommes'),
  '/femmes': () => pagePlp('femmes'),
  '/enfants': () => pagePlp('enfants'),
  '/unisexe': () => pagePlp('unisexe'),
  '/chaussures': () => pagePlp('chaussures'),
  '/recherche': pageSearch,
  '/connexion': pageLogin,
  '/admin': pageAdmin,
  '/commande': pageCheckout,
  '/a-propos': () => pageAbout,
  '/nous-joindre': () => pageContact,
};

function getCurrentPath() {
  return location.pathname + location.search;
}

function parseRoute() {
  const path = location.pathname;
  const search = location.search;

  if (path.startsWith('/produit/')) {
    return { route: 'product', path, search };
  }
  if (path.startsWith('/commande/confirmation/')) {
    const orderNum = path.replace('/commande/confirmation/', '');
    return { route: 'confirmation', orderNum, path, search };
  }
  if (path === '/recherche') {
    const params = new URLSearchParams(search);
    return { route: 'search', q: params.get('q') || '', path, search };
  }
  if (routes[path]) {
    return { route: 'static', path, search };
  }
  return { route: 'notfound', path, search };
}

function mobileSearchHtml() {
  return `
  <div class="mobile-search-overlay" id="mobile-search-overlay">
    <div class="mobile-search-bar">
      <button id="mobile-search-close" aria-label="Fermer">&times;</button>
      <input type="text" id="mobile-search-input" placeholder="Rechercher un produit, une référence..." value="${state.q || ''}" autocomplete="off">
    </div>
  </div>`;
}

async function pagePdpByNumref(numref) {
  let p = state.products.find(x => x.numref === numref);
  if (!p) {
    const { data } = await supabase.from('products').select('*').eq('numref', numref).maybeSingle();
    if (data) {
      if (!state.products.find(x => x.id === data.id)) state.products.push(data);
      p = data;
    }
  }
  if (!p) return `<main class="pad"><div class="empty">Produit introuvable. <a href="/" data-link>Retour à l'accueil</a></div></main>`;
  state.selectedProductId = p.id;
  return pagePdp();
}

function updateProductMeta() {
  const p = state.products.find(x => x.id === state.selectedProductId);
  if (!p) return;
  const skus = state.storeSkus.filter(s => s.product_id === p.id);
  const firstSku = skus[0] || {};
  const rawPrice = firstSku.price || p.price || '';
  const price = rawPrice ? fmtPrice(rawPrice) : '';
  const desc = (p.description_fr || p.description_web || p.description_en || '').slice(0, 155);
  const imgs = state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => (a.image_number || 1) - (b.image_number || 1));
  const imgUrl = imgs.length > 0 && imgs[0].image_url ? imgs[0].image_url : '';
  const absImgUrl = imgUrl.startsWith('http') ? imgUrl : `https://attitudesport.ca${imgUrl}`;
  const totalStock = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const availability = totalStock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const slug = productUrl(p);
  const canonicalUrl = `https://attitudesport.ca${slug}`;
  document.title = `${p.name || 'Produit'} — ${p.supplier || 'Attitude Sports'} | Attitude Sports`;
  setMeta('name', 'description', `${desc}${price ? ' — ' + price + ' $ CAD' : ''}. Réf. ${p.numref || ''}.`);
  setMeta('property', 'og:type', 'product');
  setMeta('property', 'og:title', `${p.name || 'Produit'} — ${p.supplier || 'Attitude Sports'}`);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', canonicalUrl);
  setMeta('property', 'og:image', absImgUrl);
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '1200');
  setMeta('property', 'product:price:amount', rawPrice ? String(rawPrice) : '');
  setMeta('property', 'product:price:currency', 'CAD');
  setLink('canonical', canonicalUrl);
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', `${p.name || 'Produit'} — ${p.supplier || 'Attitude Sports'}`);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', absImgUrl);
  // JSON-LD Product
  const productLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: p.name || '', sku: p.numref || '', brand: { '@type': 'Brand', name: p.supplier || 'Attitude Sports' },
    description: desc, image: absImgUrl, url: canonicalUrl,
    offers: { '@type': 'Offer', price: rawPrice ? String(rawPrice) : '0', priceCurrency: 'CAD', availability, url: canonicalUrl },
  };
  // BreadcrumbList
  const catLabel = CAT_LABELS[(p.category || '').toUpperCase()] || p.category || '';
  const deptKey = (p.category || '').toLowerCase();
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://attitudesport.ca/' },
      { '@type': 'ListItem', position: 2, name: catLabel || 'Produits', item: `https://attitudesport.ca/${deptKey}` },
      { '@type': 'ListItem', position: 3, name: p.name || '', item: canonicalUrl },
    ],
  };
  setJsonLd('product-jsonld', productLd);
  setJsonLd('breadcrumb-jsonld', breadcrumbLd);
}

function resetMeta() {
  document.title = 'Attitude Sports — Vêtements et chaussures de sport à Alma';
  setMeta('name', 'description', 'Attitude Sports : vêtements et chaussures de sport pour toute la famille. Under Armour, PUMA, SAXX, BOGS et plus. Livraison 25 $, gratuite dès 200 $.');
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:title', 'Attitude Sports — Vêtements et chaussures de sport à Alma');
  setMeta('property', 'og:description', 'Vêtements et chaussures de sport pour toute la famille. Under Armour, PUMA, SAXX, BOGS et plus. Livraison 25 $, gratuite dès 200 $.');
  setMeta('property', 'og:url', 'https://attitudesport.ca/');
  setMeta('property', 'og:image', 'https://attitudesport.ca/images/logo-lockup.png');
  setMeta('property', 'og:image:width', '');
  setMeta('property', 'og:image:height', '');
  setMeta('property', 'product:price:amount', '');
  setMeta('property', 'product:price:currency', '');
  setLink('canonical', 'https://attitudesport.ca/');
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', 'Attitude Sports — Vêtements et chaussures de sport à Alma');
  setMeta('name', 'twitter:description', 'Vêtements et chaussures de sport pour toute la famille.');
  setMeta('name', 'twitter:image', 'https://attitudesport.ca/images/logo-lockup.png');
  removeJsonLd('product-jsonld');
  removeJsonLd('breadcrumb-jsonld');
}

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  if (value) el.setAttribute('content', value); else el.remove();
}
function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', rel); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
function setJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = id; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}
function removeJsonLd(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

const pageAbout = () => `
<main>
  <section class="about-hero">
    <div class="about-hero-overlay"></div>
    <div class="about-hero-inner">
      <div class="eyebrow">Notre histoire</div>
      <h1>Attitude Sports</h1>
      <p>Vêtements et chaussures de sport pour toute la famille, à Alma.</p>
    </div>
  </section>
  <section class="pad about-sections">
    <div class="about-section">
      <div class="about-text">
        <h2>La boutique</h2>
        <p>Attitude Sports est votre destination de choix pour les vêtements et chaussures de sport à Alma. Depuis notre ouverture, nous nous engageons à offrir les meilleures marques et le meilleur service à toute la famille.</p>
        <p>Notre équipe passionnée pratique ce qu'elle vend — nous testons les produits, nous connaissons les tissus, et nous sommes là pour vous conseiller.</p>
      </div>
      <div class="about-img"><img src="/images/V5-6008988-008_BC.png" alt="Attitude Sports" loading="lazy"></div>
    </div>
    <div class="about-section reverse">
      <div class="about-text">
        <h2>Une sélection de marques</h2>
        <p>Nous portons des marques de qualité comme Under Armour, PUMA, SAXX, BOGS et bien d'autres. Que vous soyez un athlète professionnel ou que vous cherchiez simplement des vêtements confortables pour le quotidien, nous avons ce qu'il vous faut.</p>
      </div>
      <div class="about-img"><img src="/images/im4.png" alt="Nos marques" loading="lazy"></div>
    </div>
    <div class="about-section">
      <div class="about-text">
        <h2>Service et conseils d'experts</h2>
        <p>Notre mission : offrir à notre communauté l'accès aux meilleurs équipements sportifs, avec un service personnalisé et des conseils d'experts, pour vous aider à dépasser vos limites.</p>
        <p>Besoin d'aide pour choisir? Venez nous rencontrer en boutique — nous prendrons le temps qu'il faut.</p>
      </div>
      <div class="about-img"><img src="/images/im5.png" alt="Service personnalisé" loading="lazy"></div>
    </div>
    <div class="about-section reverse">
      <div class="about-text">
        <h2>Pour toute la famille</h2>
        <p>Hommes, femmes, enfants, unisexe et chaussures — nous avons l'équipement pour tous les sports et tous les niveaux. Du débutant au pro, du terrain de jeu au gymnase.</p>
      </div>
      <div class="about-img"><img src="/images/im1_(1).png" alt="Pour toute la famille" loading="lazy"></div>
    </div>
  </section>
  <section class="pad about-bloc">
    <h2>La boutique</h2>
    <div class="about-bloc-grid">
      <div class="about-bloc-info">
        <div><strong>Adresse</strong> <span class="about-pending">${BOUTIQUE_INFO.address}</span></div>
        <div><strong>Téléphone</strong> <span class="about-pending">${BOUTIQUE_INFO.phone}</span></div>
        <div><strong>Courriel</strong> <a href="mailto:${BOUTIQUE_INFO.email}">${BOUTIQUE_INFO.email}</a></div>
        <div><strong>Heures</strong> <span class="about-pending">${BOUTIQUE_INFO.hours}</span></div>
        <a href="${BOUTIQUE_INFO.facebook}" target="_blank" rel="noopener noreferrer" class="about-fb">Suivez-nous sur Facebook</a>
      </div>
      <div class="about-bloc-map">
        <iframe src="https://www.google.com/maps?q=Alma,Quebec,Canada&output=embed" width="100%" height="350" style="border:0;border-radius:12px;" loading="lazy" title="Carte"></iframe>
      </div>
    </div>
  </section>
  <section class="pad about-cta">
    <h2>Magasiner maintenant</h2>
    <div class="about-cta-btns">
      <a href="/hommes" class="btn orange" data-link>Hommes</a>
      <a href="/femmes" class="btn ghost" data-link>Femmes</a>
      <a href="/chaussures" class="btn ghost" data-link>Chaussures</a>
    </div>
  </section>
</main>`;

const pageContact = () => `
<main class="pad">
  <div class="crumbs"><a href="/" data-link>Accueil</a> / <b>Nous joindre</b></div>
  <h1>Nous joindre</h1>
  <div class="contact-content">
    <div class="contact-info">
      <h2>Adresse</h2>
      <p class="about-pending">${BOUTIQUE_INFO.address}</p>
      <h2>Téléphone</h2>
      <p class="about-pending">${BOUTIQUE_INFO.phone}</p>
      <h2>Courriel</h2>
      <p><a href="mailto:${BOUTIQUE_INFO.email}">${BOUTIQUE_INFO.email}</a></p>
      <h2>Heures d'ouverture</h2>
      <p class="about-pending">${BOUTIQUE_INFO.hours}</p>
      <h2>Facebook</h2>
      <p><a href="${BOUTIQUE_INFO.facebook}" target="_blank" rel="noopener noreferrer">Attitude Sports sur Facebook</a></p>
    </div>
    <div class="contact-form-wrap">
      <h2>Écrivez-nous</h2>
      <form class="contact-form" id="contact-form">
        <label>Nom<input type="text" id="contact-name" required></label>
        <label>Courriel<input type="email" id="contact-email" required></label>
        <label>Sujet<input type="text" id="contact-subject" required></label>
        <label>Message<textarea id="contact-message" rows="5" required></textarea></label>
        <button class="btn orange" type="submit" id="contact-submit">Envoyer</button>
        <div class="contact-msg" id="contact-msg" style="display:none;"></div>
      </form>
    </div>
  </div>
  <div class="contact-map">
    <iframe src="https://www.google.com/maps?q=Alma,Quebec,Canada&output=embed" width="100%" height="350" style="border:0;border-radius:12px;" loading="lazy" title="Carte"></iframe>
  </div>
</main>`;

function render(preserveScroll = false) {
  const routeInfo = parseRoute();
  const path = routeInfo.path;
  let page;

  if (routeInfo.route === 'product') {
    const slug = routeInfo.path.replace('/produit/', '');
    const numref = slug.split('-')[0];
    page = () => pagePdpByNumref(numref);
  } else if (routeInfo.route === 'confirmation') {
    page = () => pageConfirmation(routeInfo.orderNum);
  } else if (routeInfo.route === 'search') {
    state.q = routeInfo.q;
    page = pageSearch;
  } else if (routeInfo.route === 'static') {
    page = routes[routeInfo.path];
  } else {
    page = pageHome;
  }

  // Reset Square card when leaving checkout
  if (path !== '/commande') {
    if (squareCardInstance) { try { squareCardInstance.destroy(); } catch {} squareCardInstance = null; }
    squareCardAttached = false;
  }
  app.innerHTML = promoBar() + header() + page() + threeShops() + footer() + cartDrawerHtml() + mobileSearchHtml();
  bind();
  startHeroCycle();
  updateCartBadge();
  // Trigger server-side search when on search page
  if (routeInfo.route === 'search' && state.q && state.q.trim()) {
    const prevQ = state._lastSearchQ;
    if (prevQ !== state.q) {
      state._lastSearchQ = state.q;
      state.searchLoading = true;
      performSearch(state.q).then(() => { render(); });
    }
  }
  // Update document title and meta for product pages
  if (routeInfo.route === 'product') {
    updateProductMeta();
  } else {
    resetMeta();
  }
  if (!preserveScroll && path !== '/' && path !== '') window.scrollTo(0, 0);
}

function bind() {
  const input = document.getElementById('search-input');
  if (input) {
    let isComposing = false;
    input.addEventListener('compositionstart', () => { isComposing = true; });
    input.addEventListener('compositionend', () => { isComposing = false; input.dispatchEvent(new Event('input')); });
    input.addEventListener('input', (e) => {
      state.q = e.target.value;
      if (searchSuggestionDebounce) clearTimeout(searchSuggestionDebounce);
      if (searchDebounce) clearTimeout(searchDebounce);
      if (!state.q.trim()) {
        state.searchSuggestions = [];
        renderSuggestions();
        if (location.pathname.startsWith('/recherche')) navigate('/');
        return;
      }
      // Debounced suggestions (250ms)
      searchSuggestionDebounce = setTimeout(() => performSuggestions(state.q), 250);
    });
    input.addEventListener('keydown', (e) => {
      const suggestions = state.searchSuggestions || [];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (suggestions.length > 0) { state.searchSuggestionIdx = Math.min(state.searchSuggestionIdx + 1, suggestions.length - 1); renderSuggestions(); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (suggestions.length > 0) { state.searchSuggestionIdx = Math.max(state.searchSuggestionIdx - 1, -1); renderSuggestions(); }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (state.searchSuggestionIdx >= 0 && suggestions[state.searchSuggestionIdx]) {
          const s = suggestions[state.searchSuggestionIdx];
          state.selectedProductId = s.id;
          state.selectedColor = null;
          state.selectedSize = null;
          state.searchSuggestions = [];
          navigate(productUrl(state.products.find(x => x.id === s.id) || { numref: '', name: '' }));
          render();
        } else {
          state.searchSuggestions = [];
          navigate('/recherche?q=' + encodeURIComponent(state.q));
        }
      } else if (e.key === 'Escape') {
        state.searchSuggestions = [];
        renderSuggestions();
        input.blur();
      }
    });
    input.addEventListener('blur', () => {
      setTimeout(() => { state.searchSuggestions = []; renderSuggestions(); }, 150);
    });
    input.addEventListener('focus', () => {
      if (state.searchSuggestions.length > 0) renderSuggestions();
    });
  }
  // Mobile search trigger
  const mobileSearchBtn = document.getElementById('search-mobile-trigger');
  if (mobileSearchBtn) {
    mobileSearchBtn.addEventListener('click', () => {
      document.body.classList.add('mobile-search-open');
      const msInput = document.getElementById('mobile-search-input');
      if (msInput) msInput.focus();
    });
  }
  const mobileSearchClose = document.getElementById('mobile-search-close');
  if (mobileSearchClose) {
    mobileSearchClose.addEventListener('click', () => {
      document.body.classList.remove('mobile-search-open');
    });
  }
  const mobileSearchInput = document.getElementById('mobile-search-input');
  if (mobileSearchInput) {
    mobileSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        state.q = mobileSearchInput.value;
        document.body.classList.remove('mobile-search-open');
        navigate('/recherche?q=' + encodeURIComponent(state.q));
      }
    });
  }
  // Copy reference buttons on PDP
  document.querySelectorAll('.pdp-copy-ref').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const ref = btn.dataset.ref || '';
      if (ref) { navigator.clipboard.writeText(ref); btn.textContent = 'Copié!'; setTimeout(() => { btn.textContent = 'Copier'; }, 2000); }
    });
  });
  // Copy product link
  const pdpCopyLink = document.getElementById('pdp-copy-link');
  if (pdpCopyLink) {
    pdpCopyLink.addEventListener('click', (e) => {
      e.preventDefault();
      const url = pdpCopyLink.dataset.url || '';
      if (url) { navigator.clipboard.writeText(url); pdpCopyLink.classList.add('copied'); setTimeout(() => pdpCopyLink.classList.remove('copied'), 2000); }
    });
  }
  // Newsletter form
  const newsForm = document.getElementById('news-form');
  if (newsForm) {
    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('news-email').value.trim();
      const msg = document.getElementById('news-msg');
      if (!email) return;
      try {
        const { error } = await supabase.from('newsletter_subscribers').insert({ email });
        if (error && error.code !== '23505') throw error;
        msg.textContent = 'Merci! Vous êtes inscrit.';
        msg.style.display = 'block';
        msg.style.color = '#4CAF50';
        document.getElementById('news-email').value = '';
      } catch {
        msg.textContent = 'Une erreur est survenue. Réessayez.';
        msg.style.display = 'block';
        msg.style.color = '#F44336';
      }
    });
  }
  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name').value.trim();
      const email = document.getElementById('contact-email').value.trim();
      const subject = document.getElementById('contact-subject').value.trim();
      const message = document.getElementById('contact-message').value.trim();
      const msg = document.getElementById('contact-msg');
      const btn = document.getElementById('contact-submit');
      if (!name || !email || !message) return;
      btn.disabled = true; btn.textContent = '...';
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ name, email, subject, message }),
        });
        const data = await resp.json();
        if (data.ok) {
          msg.textContent = 'Message envoyé! Nous vous répondrons sous peu.';
          msg.style.display = 'block'; msg.style.color = '#4CAF50';
          contactForm.reset();
        } else {
          msg.textContent = data.error || 'Erreur lors de l\'envoi.';
          msg.style.display = 'block'; msg.style.color = '#F44336';
        }
      } catch {
        msg.textContent = 'Erreur de communication. Réessayez.';
        msg.style.display = 'block'; msg.style.color = '#F44336';
      }
      btn.disabled = false; btn.textContent = 'Envoyer';
    });
  }
  const sort = document.getElementById('sort-select');
  if (sort) sort.addEventListener('change', (e) => { state.sort = e.target.value; render(); });

  // PLP filter bindings
  document.querySelectorAll('.plp-filter').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const key = e.target.dataset.filter;
      const val = e.target.dataset.value;
      const isSearch = location.pathname.startsWith('/recherche');
      const filters = isSearch ? state.searchFilters : state.plpFilters;
      if (e.target.checked) { if (!filters[key].includes(val)) filters[key].push(val); }
      else { filters[key] = filters[key].filter(v => v !== val); }
      render();
    });
  });
  document.querySelectorAll('.plp-filter-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      const key = chip.dataset.filter, val = chip.dataset.value;
      const isSearch = location.pathname.startsWith('/recherche');
      const filters = isSearch ? state.searchFilters : state.plpFilters;
      if (filters[key].includes(val)) filters[key] = filters[key].filter(v => v !== val);
      else filters[key].push(val);
      render();
    });
  });
  document.querySelectorAll('.plp-filter-swatch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      e.preventDefault();
      const key = sw.dataset.filter, val = sw.dataset.value;
      const isSearch = location.pathname.startsWith('/recherche');
      const filters = isSearch ? state.searchFilters : state.plpFilters;
      if (filters[key].includes(val)) filters[key] = filters[key].filter(v => v !== val);
      else filters[key].push(val);
      render();
    });
  });
  const clearFilters = document.getElementById('plp-clear-filters');
  if (clearFilters) clearFilters.addEventListener('click', (e) => { e.preventDefault(); state.plpFilters = { type: [], size: [], price: [], color: [] }; render(); });
  const clearFiltersEmpty = document.getElementById('plp-clear-filters-empty');
  if (clearFiltersEmpty) clearFiltersEmpty.addEventListener('click', (e) => { e.preventDefault(); state.plpFilters = { type: [], size: [], price: [], color: [] }; render(); });

  // Search filter bindings (reuse same plp-filter class but operate on searchFilters)
  const searchClearFilters = document.getElementById('search-clear-filters');
  if (searchClearFilters) searchClearFilters.addEventListener('click', (e) => { e.preventDefault(); state.searchFilters = { type: [], size: [], price: [], color: [] }; render(); });

  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const togglePass = document.getElementById('toggle-pass');
  if (togglePass) {
    togglePass.addEventListener('click', () => {
      const inp = document.getElementById('login-pass');
      const open = inp.type === 'password';
      inp.type = open ? 'text' : 'password';
      togglePass.querySelector('.eye-open').style.display = open ? 'none' : '';
      togglePass.querySelector('.eye-closed').style.display = open ? '' : 'none';
    });
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // Admin tab navigation
  document.querySelectorAll('.adm-nav-item').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      state.adminTab = btn.dataset.tab;
      state.adminDetailProduct = null;
      state.adminOrderDetail = null;
      if (state.adminTab === 'orders' && state.adminOrders.length === 0) await loadAdminOrders();
      if (state.adminTab === 'abandoned' && state.adminAbandonedCarts.length === 0) await loadAdminAbandonedCarts();
      if (state.adminTab === 'newsletter' && state.adminNewsletterSubs.length === 0) await loadAdminNewsletter();
      render();
    });
  });

  // Admin orders filters
  const admOrderSearch = document.getElementById('adm-order-search');
  if (admOrderSearch) {
    admOrderSearch.addEventListener('input', (e) => {
      state.adminOrderFilter.search = e.target.value;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminOrders();
      bindAdminOrders();
    });
  }
  const admOrderStatus = document.getElementById('adm-order-status');
  if (admOrderStatus) admOrderStatus.addEventListener('change', (e) => { state.adminOrderFilter.status = e.target.value; render(); });
  const admOrderFulfillment = document.getElementById('adm-order-fulfillment');
  if (admOrderFulfillment) admOrderFulfillment.addEventListener('change', (e) => { state.adminOrderFilter.fulfillment = e.target.value; render(); });

  // Admin order detail
  document.querySelectorAll('[data-order-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (btn.classList.contains('adm-order-status-btn')) return;
      e.stopPropagation();
      state.adminOrderDetail = btn.dataset.orderId;
      render();
    });
  });
  const admOrderBack = document.getElementById('adm-order-back');
  if (admOrderBack) admOrderBack.addEventListener('click', () => { state.adminOrderDetail = null; render(); });

  const admOrderStatusBtn = document.getElementById('adm-order-status-btn');
  if (admOrderStatusBtn) {
    admOrderStatusBtn.addEventListener('click', async () => {
      const orderId = admOrderStatusBtn.dataset.orderId;
      const email = admOrderStatusBtn.dataset.email;
      const newStatus = document.getElementById('adm-order-status-select').value;
      const msgEl = document.getElementById('adm-order-status-msg');
      admOrderStatusBtn.disabled = true;
      admOrderStatusBtn.textContent = '...';
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-order-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.session.access_token}` },
          body: JSON.stringify({ order_id: orderId, status: newStatus }),
        });
        const data = await resp.json();
        if (data.ok) {
          await loadAdminOrders();
          if (msgEl) { msgEl.textContent = `Statut mis à jour — courriel envoyé à ${email}`; msgEl.style.display = 'block'; msgEl.style.color = '#4CAF50'; }
          render();
        } else {
          if (msgEl) { msgEl.textContent = data.error || 'Erreur'; msgEl.style.display = 'block'; msgEl.style.color = '#F44336'; }
          admOrderStatusBtn.disabled = false;
          admOrderStatusBtn.textContent = 'Mettre à jour le statut';
        }
      } catch (err) {
        if (msgEl) { msgEl.textContent = 'Erreur de communication'; msgEl.style.display = 'block'; msgEl.style.color = '#F44336'; }
        admOrderStatusBtn.disabled = false;
        admOrderStatusBtn.textContent = 'Mettre à jour le statut';
      }
    });
  }

  // Admin abandoned carts
  const admAbandonedSearch = document.getElementById('adm-abandoned-search');
  if (admAbandonedSearch) {
    admAbandonedSearch.addEventListener('input', (e) => {
      state.adminAbandonedFilter.search = e.target.value;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminAbandonedCarts();
      bindAdminAbandoned();
    });
  }
  const admAbandonedEmailOnly = document.getElementById('adm-abandoned-email-only');
  if (admAbandonedEmailOnly) {
    admAbandonedEmailOnly.addEventListener('change', (e) => {
      state.adminAbandonedFilter.emailOnly = e.target.checked;
      render();
    });
  }
  document.querySelectorAll('[data-cart-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.cartId;
      state.adminAbandonedExpanded[id] = !state.adminAbandonedExpanded[id];
      render();
    });
  });

  // Admin newsletter
  const admNewsletterExport = document.getElementById('adm-newsletter-export');
  if (admNewsletterExport) admNewsletterExport.addEventListener('click', exportNewsletterCSV);

  // Admin inventory filters
  const admSearch = document.getElementById('adm-search');
  if (admSearch) {
    admSearch.addEventListener('input', (e) => {
      state.adminFilter.search = e.target.value;
      state.adminPage = 1;
      const content = document.querySelector('.adm-content');
      if (content) content.outerHTML = adminInventory();
      bindAdminInventory();
    });
  }
  const admFilterCat = document.getElementById('adm-filter-cat');
  if (admFilterCat) admFilterCat.addEventListener('change', (e) => { state.adminFilter.category = e.target.value; state.adminPage = 1; render(); });
  const admFilterSup = document.getElementById('adm-filter-sup');
  if (admFilterSup) admFilterSup.addEventListener('change', (e) => { state.adminFilter.supplier = e.target.value; state.adminPage = 1; render(); });
  const admFilterStock = document.getElementById('adm-filter-stock');
  if (admFilterStock) admFilterStock.addEventListener('change', (e) => { state.adminFilter.stock = e.target.value; state.adminPage = 1; render(); });
  const admFilterPhoto = document.getElementById('adm-filter-photo');
  if (admFilterPhoto) admFilterPhoto.addEventListener('change', (e) => { state.adminFilter.photo = e.target.value; state.adminPage = 1; render(); });
  const admFilterPrice = document.getElementById('adm-filter-price');
  if (admFilterPrice) admFilterPrice.addEventListener('change', (e) => { state.adminFilter.noprice = e.target.value; state.adminPage = 1; render(); });

  document.querySelectorAll('.adm-quick-price-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const productId = btn.dataset.productId;
      const input = document.querySelector(`.adm-quick-price-input[data-product-id="${productId}"]`);
      const price = parseFloat(input?.value) || 0;
      if (price <= 0) return;
      const product = state.adminProducts.find(p => p.id === productId);
      let skus = state.adminSkus.filter(s => s.product_id === productId);
      btn.disabled = true; btn.textContent = '...';
      if (skus.length === 0 && product) {
        const { data, error } = await supabase.from('skus').insert({
          product_id: productId, numref: product.numref, size: 'OS', color: 'Default', color_hex: '#9C9CA4', quantity: 0, price
        }).select();
        if (error) { btn.textContent = 'OK'; btn.disabled = false; return; }
        if (data?.[0]) { state.adminSkus.push(data[0]); state.storeSkus.push(data[0]); skus = [data[0]]; }
      }
      for (const sku of skus) {
        await supabase.from('skus').update({ price }).eq('id', sku.id);
        sku.price = price;
      }
      btn.textContent = 'OK'; btn.disabled = false;
      render();
    });
  });
  document.querySelectorAll('.adm-quick-price-input').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); inp.nextElementSibling?.click(); }
    });
    inp.addEventListener('click', (e) => e.stopPropagation());
  });
  const admSort = document.getElementById('adm-sort');
  if (admSort) admSort.addEventListener('change', (e) => { state.adminSort = e.target.value; render(); });

  // Admin product detail view
  document.querySelectorAll('.adm-view-btn, .adm-row-click').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = state.adminProducts.find(x => x.id === btn.dataset.id);
      if (p) { state.adminDetailProduct = p; render(); }
    });
  });
  const admBack = document.getElementById('adm-back');
  if (admBack) admBack.addEventListener('click', () => { state.adminDetailProduct = null; render(); });

  // Admin color picker (pixel color for SKU)
  document.querySelectorAll('.adm-color-picker').forEach(picker => {
    picker.addEventListener('change', async (e) => {
      const skuId = picker.dataset.skuId;
      const hex = e.target.value;
      const { error } = await supabase.from('skus').update({ color_hex: hex }).eq('id', skuId);
      const statusEl = document.getElementById('adm-detail-status');
      if (error) {
        if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; }
        return;
      }
      const sku = state.adminSkus.find(s => s.id === skuId);
      if (sku) sku.color_hex = hex;
      if (statusEl) { statusEl.textContent = 'Couleur mise à jour: ' + hex; statusEl.style.color = '#4CAF50'; }
      const dot = picker.parentElement.querySelector('.adm-color-dot');
      if (dot) dot.style.background = hex;
    });
  });

  // Admin image selection for color assignment
  let selectedImgIds = new Set();
  document.querySelectorAll('.adm-img-assign').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const imgId = thumb.dataset.imgId;
      if (selectedImgIds.has(imgId)) { selectedImgIds.delete(imgId); thumb.classList.remove('selected'); }
      else { selectedImgIds.add(imgId); thumb.classList.add('selected'); }
      const hasSel = selectedImgIds.size > 0;
      const assignBtn = document.getElementById('adm-img-assign-btn');
      const unassignBtn = document.getElementById('adm-img-unassign-btn');
      if (assignBtn) assignBtn.disabled = !hasSel;
      if (unassignBtn) unassignBtn.disabled = !hasSel;
    });
  });

  const assignBtn = document.getElementById('adm-img-assign-btn');
  if (assignBtn) {
    assignBtn.addEventListener('click', async () => {
      const colorSelect = document.getElementById('adm-img-color-select');
      const color = colorSelect ? colorSelect.value : '';
      if (!color || selectedImgIds.size === 0) return;
      const statusEl = document.getElementById('adm-detail-status');
      if (statusEl) { statusEl.textContent = 'Assignation en cours...'; statusEl.style.color = '#666'; }
      let errors = 0;
      for (const imgId of selectedImgIds) {
        const { error } = await supabase.from('product_images').update({ color }).eq('id', imgId);
        if (error) errors++;
      }
      const imgs = state.adminImages || [];
      for (const img of imgs) {
        if (selectedImgIds.has(img.id)) img.color = color;
      }
      if (statusEl) {
        statusEl.textContent = errors > 0 ? `${errors} erreur(s)` : `${selectedImgIds.size} image(s) assignées à "${color}"`;
        statusEl.style.color = errors > 0 ? '#F44336' : '#4CAF50';
      }
      selectedImgIds.clear();
      render();
    });
  }

  const unassignBtn = document.getElementById('adm-img-unassign-btn');
  if (unassignBtn) {
    unassignBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('adm-detail-status');
      if (statusEl) { statusEl.textContent = 'Retrait en cours...'; statusEl.style.color = '#666'; }
      let errors = 0;
      for (const imgId of selectedImgIds) {
        const { error } = await supabase.from('product_images').update({ color: '' }).eq('id', imgId);
        if (error) errors++;
      }
      const imgs = state.adminImages || [];
      for (const img of imgs) {
        if (selectedImgIds.has(img.id)) img.color = '';
      }
      if (statusEl) {
        statusEl.textContent = errors > 0 ? `${errors} erreur(s)` : `Couleur retirée de ${selectedImgIds.size} image(s)`;
        statusEl.style.color = errors > 0 ? '#F44336' : '#4CAF50';
      }
      selectedImgIds.clear();
      render();
    });
  }

  // Admin save product info
  const saveProductBtn = document.getElementById('adm-save-product');
  if (saveProductBtn) {
    saveProductBtn.addEventListener('click', async () => {
      const productId = saveProductBtn.dataset.productId;
      const statusEl = document.getElementById('adm-detail-status');
      const payload = {
        name: document.getElementById('ep-name').value.trim(),
        category: document.getElementById('ep-category').value,
        department: document.getElementById('ep-department').value.trim(),
        sub_department: document.getElementById('ep-subdept').value.trim(),
        supplier: document.getElementById('ep-supplier').value.trim(),
        season: document.getElementById('ep-season').value.trim(),
        tax_tps: parseFloat(document.getElementById('ep-tps').value) || 5,
        tax_tvq: parseFloat(document.getElementById('ep-tvq').value) || 9.975,
        description_fr: document.getElementById('ep-desc').value.trim(),
        updated_at: new Date().toISOString(),
      };
      if (statusEl) { statusEl.textContent = 'Enregistrement...'; statusEl.style.color = '#666'; }
      const { error } = await supabase.from('products').update(payload).eq('id', productId);
      if (error) {
        if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; }
        return;
      }
      const prod = state.adminProducts.find(p => p.id === productId);
      if (prod) Object.assign(prod, payload);
      const storeProd = state.products.find(p => p.id === productId);
      if (storeProd) Object.assign(storeProd, payload);
      if (statusEl) { statusEl.textContent = 'Produit enregistré avec succès.'; statusEl.style.color = '#4CAF50'; }
    });
  }

  // Admin save SKUs (qty, price, suggested price)
  const saveSkusBtn = document.getElementById('adm-save-skus');
  if (saveSkusBtn) {
    saveSkusBtn.addEventListener('click', async () => {
      const statusEl = document.getElementById('adm-detail-status');
      if (statusEl) { statusEl.textContent = 'Enregistrement des variants...'; statusEl.style.color = '#666'; }
      let errors = 0, saved = 0;
      const qtyInputs = document.querySelectorAll('.adm-sku-qty');
      const priceInputs = document.querySelectorAll('.adm-sku-price');
      const suggestedInputs = document.querySelectorAll('.adm-sku-suggested');
      const allSkus = state.adminDetailProduct ? state.adminSkus.filter(s => s.product_id === state.adminDetailProduct.id) : [];
      for (const sku of allSkus) {
        const qtyEl = document.querySelector(`.adm-sku-qty[data-sku-id="${sku.id}"]`);
        const priceEl = document.querySelector(`.adm-sku-price[data-sku-id="${sku.id}"]`);
        const suggestedEl = document.querySelector(`.adm-sku-suggested[data-sku-id="${sku.id}"]`);
        if (!qtyEl && !priceEl && !suggestedEl) continue;
        const payload = {};
        if (qtyEl) payload.quantity = parseInt(qtyEl.value) || 0;
        if (priceEl) payload.price = parseFloat(priceEl.value) || 0;
        if (suggestedEl) payload.suggested_price = suggestedEl.value ? parseFloat(suggestedEl.value) : null;
        const { error } = await supabase.from('skus').update(payload).eq('id', sku.id);
        if (error) errors++;
        else { Object.assign(sku, payload); saved++; }
      }
      const storeSkus = state.storeSkus.filter(s => s.product_id === state.adminDetailProduct?.id);
      for (const ss of storeSkus) {
        const sku = allSkus.find(s => s.id === ss.id);
        if (sku) Object.assign(ss, { quantity: sku.quantity, price: sku.price, suggested_price: sku.suggested_price });
      }
      if (statusEl) {
        statusEl.textContent = errors > 0 ? `${errors} erreur(s)` : `${saved} variant(s) enregistré(s).`;
        statusEl.style.color = errors > 0 ? '#F44336' : '#4CAF50';
      }
    });
  }

  // Admin add new SKU variant
  const addSkuBtn = document.getElementById('adm-add-sku-btn');
  if (addSkuBtn) {
    addSkuBtn.addEventListener('click', async () => {
      const product = state.adminDetailProduct;
      if (!product) return;
      const sizeEl = document.getElementById('adm-new-sku-size');
      const colorEl = document.getElementById('adm-new-sku-color');
      const hexEl = document.getElementById('adm-new-sku-hex');
      const priceEl = document.getElementById('adm-new-sku-price');
      const qtyEl = document.getElementById('adm-new-sku-qty');
      const size = sizeEl?.value.trim() || null;
      const color = colorEl?.value.trim() || null;
      const hex = hexEl?.value || '#9C9CA4';
      const price = parseFloat(priceEl?.value) || 0;
      const qty = parseInt(qtyEl?.value) || 0;
      const statusEl = document.getElementById('adm-detail-status');
      if (statusEl) { statusEl.textContent = 'Creation de la variante...'; statusEl.style.color = '#666'; }
      const { data, error } = await supabase.from('skus').insert({
        product_id: product.id, numref: product.numref, size, color, color_hex: hex, quantity: qty, price
      }).select();
      if (error) {
        if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; }
        return;
      }
      if (data?.[0]) {
        state.adminSkus.push(data[0]);
        state.storeSkus.push(data[0]);
      }
      if (sizeEl) sizeEl.value = '';
      if (colorEl) colorEl.value = '';
      if (priceEl) priceEl.value = '';
      if (qtyEl) qtyEl.value = '0';
      if (statusEl) { statusEl.textContent = 'Variante ajoutee avec succes.'; statusEl.style.color = '#4CAF50'; }
      render();
    });
  }

  // Admin expand/collapse inline matrix on inventory rows
  document.querySelectorAll('.adm-expand-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      state.adminExpandedRows[id] = !state.adminExpandedRows[id];
      render();
    });
  });

  // Admin color×size matrix toggle (works for both detail page and inline inventory)
  document.querySelectorAll('.adm-matrix-cell').forEach(cell => {
    cell.addEventListener('click', async (e) => {
      e.stopPropagation();
      const color = cell.dataset.color;
      const size = cell.dataset.size;
      const productId = cell.dataset.productId;
      const product = state.adminDetailProduct || state.adminProducts.find(p => p.id === productId);
      if (!product || !color || !size) return;
      const statusEl = document.getElementById('adm-detail-status');
      const existing = state.adminSkus.find(s => s.product_id === product.id && s.color === color && s.size === size);
      if (existing) {
        const { error } = await supabase.from('skus').delete().eq('id', existing.id);
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        state.adminSkus = state.adminSkus.filter(s => s.id !== existing.id);
        state.storeSkus = state.storeSkus.filter(s => s.id !== existing.id);
        if (statusEl) { statusEl.textContent = `${color} ${size} retiré.`; statusEl.style.color = '#4CAF50'; }
      } else {
        const refSku = state.adminSkus.find(s => s.product_id === product.id && s.color === color);
        const hex = refSku?.color_hex || '#9C9CA4';
        const price = refSku?.price || 0;
        const { data, error } = await supabase.from('skus').insert({
          product_id: product.id, numref: product.numref, size, color, color_hex: hex, quantity: 0, price
        }).select();
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        if (data?.[0]) { state.adminSkus.push(data[0]); state.storeSkus.push(data[0]); }
        if (statusEl) { statusEl.textContent = `${color} ${size} ajouté.`; statusEl.style.color = '#4CAF50'; }
      }
      render();
    });
  });

  // Admin pagination
  document.querySelectorAll('.adm-page-btn').forEach(btn => {
    btn.addEventListener('click', () => { state.adminPage = parseInt(btn.dataset.page); render(); });
  });

  const campaignForm = document.getElementById('campaign-form');
  if (campaignForm) campaignForm.addEventListener('submit', saveCampaign);

  const exportCsvBtn = document.getElementById('adm-export-csv');
  if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportInventoryCSV);
  const importCsvBtn = document.getElementById('adm-import-csv');
  const csvFile = document.getElementById('adm-csv-file');
  if (importCsvBtn && csvFile) {
    importCsvBtn.addEventListener('click', () => csvFile.click());
    csvFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importInventoryCSV(file);
      csvFile.value = '';
    });
  }

  // Storefront card click → PDP
  document.querySelectorAll('.card-link[data-id]').forEach(c => {
    c.addEventListener('click', (e) => {
      e.preventDefault();
      state.selectedProductId = c.dataset.id;
      state.selectedColor = null;
      state.pdpImgFilter = null;
      state.selectedSize = null;
      if (location.pathname.startsWith('/produit')) {
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const p = state.products.find(x => x.id === c.dataset.id);
        if (p) navigate(productUrl(p));
      }
    });
  });

  // Card quantity +/− buttons
  document.querySelectorAll('.card-qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      const delta = parseInt(btn.dataset.delta);
      const valEl = document.querySelector(`.card-qty-val[data-id="${id}"]`);
      if (!valEl) return;
      let q = parseInt(valEl.textContent) || 1;
      q = Math.max(1, Math.min(99, q + delta));
      valEl.textContent = q;
      setCardSelection(id, { qty: q });
    });
  });

  // Card color swatch selection (inline)
  document.querySelectorAll('.card-color-swatch').forEach(sw => {
    sw.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = sw.dataset.cardId;
      const color = sw.dataset.cardColor;
      setCardSelection(id, { color, size: null });
      render(true);
    });
  });

  // Card add-to-cart buttons
  document.querySelectorAll('.card-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const prod = state.products.find(x => x.id === btn.dataset.id);
      if (!prod) return;
      const sel = getCardSelection(prod.id);
      const valEl = document.querySelector(`.card-qty-val[data-id="${btn.dataset.id}"]`);
      const qty = valEl ? Math.max(1, parseInt(valEl.textContent) || 1) : 1;
      const mp = mapProduct(prod);
      const skus = state.storeSkus.filter(s => s.product_id === prod.id);
      const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
      const color = sel.color || (colors.length > 0 ? colors[0] : '');
      const colorSkus = color ? skus.filter(s => s.color === color) : skus;
      const availSizes = [...new Set(colorSkus.map(s => s.size).filter(Boolean))];
      const size = (sel.size && availSizes.includes(sel.size)) ? sel.size : (availSizes.length > 0 ? availSizes[0] : '');
      const matchedSku = colorSkus.find(s => s.size === size) || colorSkus[0] || skus[0] || {};
      addToCart({
        productId: prod.id,
        numref: prod.numref || '',
        sku_id: matchedSku.sku_id || '',
        name: prod.name || 'Sans nom',
        price: parseFloat(matchedSku.price || prod.price) || 0,
        color, size,
        image_url: mp.image_url,
        qty,
      });
      if (valEl) { valEl.textContent = '1'; setCardSelection(prod.id, { qty: 1 }); }
    });
  });

  // Cart drawer
  const cartTrigger = document.getElementById('cart-trigger');
  if (cartTrigger) cartTrigger.addEventListener('click', (e) => { e.preventDefault(); openCartDrawer(); });
  const cartClose = document.getElementById('cart-close');
  if (cartClose) cartClose.addEventListener('click', closeCartDrawer);
  const cartOverlay = document.getElementById('cart-overlay');
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

  // Checkout page
  const fulfillmentRadios = document.querySelectorAll('input[name="fulfillment"]');
  fulfillmentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const shippingFields = document.getElementById('checkout-shipping-fields');
      if (shippingFields) shippingFields.style.display = radio.value === 'delivery' && radio.checked ? 'grid' : 'none';
      document.querySelectorAll('.checkout-radio-card').forEach(c => c.classList.remove('selected'));
      if (radio.checked) radio.closest('.checkout-radio-card').classList.add('selected');
    });
  });
  // Set initial selected state
  const checkedFulfillment = document.querySelector('input[name="fulfillment"]:checked');
  if (checkedFulfillment) checkedFulfillment.closest('.checkout-radio-card').classList.add('selected');

  // Square card — attach only once
  const cardContainer = document.getElementById('card-container');
  if (cardContainer && !squareCardAttached) {
    squareCardAttached = true;
    (async () => {
      try {
        if (!window.Square) { console.warn('Square SDK not loaded'); return; }
        const payments = window.Square.payments(import.meta.env.VITE_SQUARE_APP_ID, import.meta.env.VITE_SQUARE_LOCATION_ID);
        squareCardInstance = await payments.card();
        await squareCardInstance.attach('#card-container');
      } catch (e) {
        console.error('Square init error:', e);
        const errEl = document.getElementById('checkout-error');
        if (errEl) { errEl.textContent = 'Impossible de charger le module de paiement. Veuillez réessayer.'; errEl.style.display = 'block'; }
      }
    })();
  }

  // Checkout submit
  const checkoutSubmit = document.getElementById('checkout-submit');
  if (checkoutSubmit) {
    checkoutSubmit.addEventListener('click', async () => {
      const firstName = document.getElementById('co-first-name')?.value.trim();
      const lastName = document.getElementById('co-last-name')?.value.trim();
      const email = document.getElementById('co-email')?.value.trim();
      const phone = document.getElementById('co-phone')?.value.trim();
      const fulfillmentType = document.querySelector('input[name="fulfillment"]:checked')?.value || 'pickup';
      const address1 = document.getElementById('co-address1')?.value.trim() || '';
      const address2 = document.getElementById('co-address2')?.value.trim() || '';
      const city = document.getElementById('co-city')?.value.trim() || '';
      const province = document.getElementById('co-province')?.value.trim() || 'Québec';
      const postalCode = document.getElementById('co-postal')?.value.trim() || '';
      const errEl = document.getElementById('checkout-error');

      // Validation
      if (!firstName || !lastName || !email) {
        if (errEl) { errEl.textContent = 'Veuillez remplir votre prénom, nom et courriel.'; errEl.style.display = 'block'; }
        return;
      }
      if (fulfillmentType === 'delivery' && (!address1 || !city || !postalCode)) {
        if (errEl) { errEl.textContent = 'Veuillez remplir votre adresse de livraison complète.'; errEl.style.display = 'block'; }
        return;
      }

      // Tokenize card
      let paymentToken;
      try {
        if (!squareCardInstance) {
          if (errEl) { errEl.textContent = 'Le module de paiement n\'est pas encore chargé. Veuillez patienter un instant.'; errEl.style.display = 'block'; }
          return;
        }
        const result = await squareCardInstance.tokenize();
        if (result.status !== 'OK') {
          if (errEl) { errEl.textContent = 'Carte invalide. Vérifiez les informations de votre carte.'; errEl.style.display = 'block'; }
          return;
        }
        paymentToken = result.token;
      } catch (e) {
        if (errEl) { errEl.textContent = 'Erreur lors de la lecture de la carte. Veuillez réessayer.'; errEl.style.display = 'block'; }
        return;
      }

      // Disable button
      checkoutSubmit.disabled = true;
      checkoutSubmit.textContent = 'Traitement du paiement…';
      if (errEl) errEl.style.display = 'none';

      const cartToken = getCartToken();
      const items = state.cart.map(i => ({
        product_id: i.productId,
        numref: i.numref,
        sku_id: i.sku_id,
        name: i.name,
        color: i.color,
        size: i.size,
        quantity: i.qty,
      }));

      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            cart_token: cartToken,
            customer: { first_name: firstName, last_name: lastName, email, phone },
            fulfillment_type: fulfillmentType,
            shipping: { address1, address2, city, province, postal_code: postalCode },
            items,
            payment_token: paymentToken,
          }),
        });
        const data = await resp.json();
        if (data.ok) {
          state.cart = [];
          saveCart();
          updateCartBadge();
          navigate(`/commande/confirmation/${data.order_number}`);
        } else {
          if (errEl) { errEl.textContent = data.error || 'Une erreur est survenue lors du paiement.'; errEl.style.display = 'block'; }
          checkoutSubmit.disabled = false;
          checkoutSubmit.textContent = 'Payer';
        }
      } catch (e) {
        if (errEl) { errEl.textContent = 'Erreur de communication avec le serveur. Veuillez réessayer.'; errEl.style.display = 'block'; }
        checkoutSubmit.disabled = false;
        checkoutSubmit.textContent = 'Payer';
      }
    });
  }

  // PDP gallery navigation
  const galMain = document.getElementById('gal-main-img');
  if (galMain) {
    const p = state.products.find(x => x.id === state.selectedProductId);
    const imgs = p ? state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => a.image_number - b.image_number) : [];
    let galIdx = 0;
    const counter = document.getElementById('gal-counter');
    const thumbs = document.querySelectorAll('.thumb');
    function showGal(i) {
      if (i < 0) i = imgs.length - 1;
      if (i >= imgs.length) i = 0;
      galIdx = i;
      galMain.src = proxyImg(imgs[i].image_url);
      if (counter) counter.textContent = `${i + 1} / ${imgs.length}`;
      thumbs.forEach((t, ti) => t.classList.toggle('active', ti === i));
    }
    thumbs.forEach(t => t.addEventListener('click', () => showGal(parseInt(t.dataset.idx))));
    const prevBtn = document.querySelector('.gal-prev');
    const nextBtn = document.querySelector('.gal-next');
    if (prevBtn) prevBtn.addEventListener('click', () => showGal(galIdx - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => showGal(galIdx + 1));
  }

  // PDP color swatch selection
  document.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => {
      state.selectedColor = sw.dataset.color;
      state.selectedSize = null;
      render();
    });
  });

  // PDP size selection
  document.querySelectorAll('#sizes-grid .size').forEach(sz => {
    sz.addEventListener('click', () => {
      if (sz.classList.contains('disabled')) return;
      document.querySelectorAll('#sizes-grid .size').forEach(s => s.classList.remove('selected'));
      sz.classList.add('selected');
      state.selectedSize = sz.dataset.size || sz.textContent.trim();
    });
  });

  // PDP add to cart
  const pdpAddBtn = document.getElementById('pdp-add-cart');
  if (pdpAddBtn) {
    pdpAddBtn.addEventListener('click', () => {
      const p = state.products.find(x => x.id === state.selectedProductId);
      if (!p) return;
      const skus = state.storeSkus.filter(s => s.product_id === p.id);
      const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
      const color = state.selectedColor || (colors.length > 0 ? colors[0] : '');
      const colorSkus = color ? skus.filter(s => s.color === color) : skus;
      const availSizes = [...new Set(colorSkus.map(s => s.size).filter(Boolean))];
      const size = state.selectedSize || (availSizes.length > 0 ? availSizes[0] : '');
      const matchedSku = colorSkus.find(s => s.size === size) || colorSkus[0] || skus[0] || {};
      const mp = mapProduct(p);
      addToCart({
        productId: p.id,
        numref: p.numref || '',
        sku_id: matchedSku.sku_id || '',
        name: p.name || 'Sans nom',
        price: parseFloat(matchedSku.price || p.price) || 0,
        color, size,
        image_url: mp.image_url,
        qty: 1,
      });
    });
  }

  // --- PDP Admin edit panel ---
  const pdpSaveProduct = document.getElementById('pdp-save-product');
  if (pdpSaveProduct) {
    pdpSaveProduct.addEventListener('click', async () => {
      const productId = pdpSaveProduct.dataset.productId;
      const statusEl = document.getElementById('pdp-admin-status');
      const payload = {
        name: document.getElementById('pdp-edit-name').value.trim(),
        category: document.getElementById('pdp-edit-category').value,
        department: document.getElementById('pdp-edit-dept').value.trim(),
        sub_department: document.getElementById('pdp-edit-subdept').value.trim(),
        supplier: document.getElementById('pdp-edit-supplier').value.trim(),
        season: document.getElementById('pdp-edit-season').value.trim(),
        tax_tps: parseFloat(document.getElementById('pdp-edit-tps').value) || 5,
        tax_tvq: parseFloat(document.getElementById('pdp-edit-tvq').value) || 9.975,
        description_fr: document.getElementById('pdp-edit-desc').value.trim(),
        updated_at: new Date().toISOString(),
      };
      if (statusEl) { statusEl.textContent = 'Enregistrement...'; statusEl.style.color = '#666'; }
      const { error } = await supabase.from('products').update(payload).eq('id', productId);
      if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      const prod = state.products.find(x => x.id === productId);
      if (prod) Object.assign(prod, payload);
      const adminProd = state.adminProducts.find(x => x.id === productId);
      if (adminProd) Object.assign(adminProd, payload);
      if (statusEl) { statusEl.textContent = 'Produit enregistré.'; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
    });
  }

  const pdpStatus = () => document.getElementById('pdp-admin-status');
  const pdpProduct = () => state.products.find(x => x.id === state.selectedProductId);
  const pdpSkus = () => state.storeSkus.filter(s => s.product_id === pdpProduct()?.id);

  async function reloadPdpData() {
    const p = pdpProduct(); if (!p) return;
    const [{ data: dbImgs }, { data: dbSkus }] = await Promise.all([
      supabase.from('product_images').select('id,numref,image_number,image_url,color,product_id').eq('numref', p.numref).eq('deleted', false),
      supabase.from('skus').select('id,product_id,sku_id,barcode,size,color,color_hex,quantity,price,suggested_price,created_at').eq('product_id', p.id),
    ]);
    const newImgs = (dbImgs || []).map(img => ({ id: img.id, numref: img.numref, image_number: img.image_number, image_url: img.image_url, color: img.color || '', product_id: img.product_id }));
    state.adminImages = (state.adminImages || []).filter(i => i.numref !== p.numref).concat(newImgs);
    state.storeImages = (state.storeImages || []).filter(i => i.numref !== p.numref).concat(newImgs);
    state.storeSkus = state.storeSkus.filter(s => s.product_id !== p.id).concat(dbSkus || []);
    state.adminSkus = state.adminSkus.filter(s => s.product_id !== p.id).concat(dbSkus || []);
  }

  // Add size: creates a SKU with that size + first existing color (or no color)
  const pdpAddSizeBtn = document.getElementById('pdp-add-size-btn');
  if (pdpAddSizeBtn) {
    pdpAddSizeBtn.addEventListener('click', async () => {
      const p = pdpProduct(); if (!p) return;
      const sizeInput = document.getElementById('pdp-new-size');
      const size = sizeInput.value.trim();
      if (!size) return;
      const existingSkus = pdpSkus();
      const colors = [...new Set(existingSkus.map(s => s.color).filter(Boolean))];
      const firstPrice = existingSkus[0]?.price || 0;
      const statusEl = pdpStatus();
      if (colors.length > 0) {
        for (const c of colors) {
          const hex = existingSkus.find(s => s.color === c)?.color_hex || '#000000';
          const { data, error } = await supabase.from('skus').insert({ product_id: p.id, numref: p.numref, size, color: c, color_hex: hex, quantity: 0, price: firstPrice }).select();
          if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
          if (data?.[0]) { state.storeSkus.push(data[0]); state.adminSkus.push(data[0]); }
        }
      } else {
        const { data, error } = await supabase.from('skus').insert({ product_id: p.id, numref: p.numref, size, color: null, color_hex: '#000000', quantity: 0, price: firstPrice }).select();
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        if (data?.[0]) { state.storeSkus.push(data[0]); state.adminSkus.push(data[0]); }
      }
      sizeInput.value = '';
      state.pdpFlashSize = size;
      if (statusEl) { statusEl.textContent = `Taille "${size}" ajoutée.`; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
      state.pdpFlashSize = null;
    });
  }

  // Remove size: deletes all SKUs with that size
  document.querySelectorAll('.pdp-chip-x[data-size]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const size = btn.dataset.size;
      const p = pdpProduct(); if (!p) return;
      const statusEl = pdpStatus();
      const toDelete = pdpSkus().filter(s => s.size === size);
      for (const sku of toDelete) {
        const { error } = await supabase.from('skus').delete().eq('id', sku.id);
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      }
      if (statusEl) { statusEl.textContent = `Taille "${size}" retirée.`; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
    });
  });

  // Add color: creates a SKU with that color hex + all existing sizes (or no size)
  const pdpAddColorBtn = document.getElementById('pdp-add-color-btn');
  if (pdpAddColorBtn) {
    pdpAddColorBtn.addEventListener('click', async () => {
      const p = pdpProduct(); if (!p) return;
      const hexInput = document.getElementById('pdp-new-color-hex');
      const nameInput = document.getElementById('pdp-new-color-name');
      const hex = hexInput.value;
      const colorName = (nameInput.value.trim() || hex).toUpperCase();
      const existingSkus = pdpSkus();
      if (existingSkus.some(s => s.color === colorName)) { if (statusEl) { statusEl.textContent = 'Cette couleur existe déjà.'; statusEl.style.color = '#F44336'; } return; }
      const sizes = [...new Set(existingSkus.map(s => s.size).filter(Boolean))];
      const firstPrice = existingSkus[0]?.price || 0;
      const statusEl = pdpStatus();
      if (sizes.length > 0) {
        for (const sz of sizes) {
          const { data, error } = await supabase.from('skus').insert({ product_id: p.id, numref: p.numref, size: sz, color: colorName, color_hex: hex, quantity: 0, price: firstPrice }).select();
          if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
          if (data?.[0]) { state.storeSkus.push(data[0]); state.adminSkus.push(data[0]); }
        }
      } else {
        const { data, error } = await supabase.from('skus').insert({ product_id: p.id, numref: p.numref, size: null, color: colorName, color_hex: hex, quantity: 0, price: firstPrice }).select();
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        if (data?.[0]) { state.storeSkus.push(data[0]); state.adminSkus.push(data[0]); }
      }
      hexInput.value = '#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0').toUpperCase();
      nameInput.value = '';
      state.pdpFlashColor = colorName;
      if (statusEl) { statusEl.textContent = `Couleur ajoutée.`; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
      state.pdpFlashColor = null;
    });
  }

  // Remove color: deletes all SKUs with that color + unassigns images
  document.querySelectorAll('.pdp-chip-x[data-color]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const color = btn.dataset.color;
      const p = pdpProduct(); if (!p) return;
      const statusEl = pdpStatus();
      const toDelete = pdpSkus().filter(s => s.color === color);
      for (const sku of toDelete) {
        const { error } = await supabase.from('skus').delete().eq('id', sku.id);
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      }
      if (statusEl) { statusEl.textContent = `Couleur retirée.`; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
    });
  });

  // PDP color-size matrix toggle
  document.querySelectorAll('.pdp-matrix-cell').forEach(cell => {
    cell.addEventListener('click', async () => {
      const p = pdpProduct(); if (!p) return;
      const color = cell.dataset.color;
      const size = cell.dataset.size;
      const has = cell.dataset.has === '1';
      const statusEl = pdpStatus();
      const existingSkus = pdpSkus();
      const firstPrice = existingSkus[0]?.price || 0;
      const hex = existingSkus.find(s => s.color === color)?.color_hex || '#000000';
      if (has) {
        const toDelete = existingSkus.filter(s => s.color === color && s.size === size);
        for (const sku of toDelete) {
          const { error } = await supabase.from('skus').delete().eq('id', sku.id);
          if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        }
        if (statusEl) { statusEl.textContent = `Taille "${size}" retirée de "${color}".`; statusEl.style.color = '#4CAF50'; }
      } else {
        const { data, error } = await supabase.from('skus').insert({ product_id: p.id, numref: p.numref, size, color, color_hex: hex, quantity: 0, price: firstPrice }).select();
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
        if (data?.[0]) { state.storeSkus.push(data[0]); state.adminSkus.push(data[0]); }
        if (statusEl) { statusEl.textContent = `Taille "${size}" ajoutée à "${color}".`; statusEl.style.color = '#4CAF50'; }
      }
      await reloadPdpData();
      render(true);
    });
  });

  // PDP admin image color filter
  document.querySelectorAll('.pdp-img-filter-all, .pdp-img-filter-color').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.pdpImgFilter = btn.dataset.color || null;
      render(true);
    });
  });

  // PDP admin image color assignment via color buttons
  document.querySelectorAll('.pdp-img-color-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const imgKey = btn.dataset.imgKey;
      const numref = btn.dataset.numref;
      const imgNum = parseInt(btn.dataset.imgNum);
      const productId = btn.dataset.productId;
      const imageUrl = btn.dataset.imgUrl;
      const color = btn.dataset.color;
      if (!numref) return;
      const statusEl = pdpStatus();
      const { error } = await supabase.from('product_images').upsert(
        { numref, image_number: imgNum, color, product_id: productId, image_url: imageUrl },
        { onConflict: 'numref,image_number' }
      );
      if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      if (statusEl) { statusEl.textContent = `Photo assignée à "${color}"`; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
    });
  });

  document.querySelectorAll('.pdp-img-color-btn-clear').forEach(btn => {
    btn.addEventListener('click', async () => {
      const imgKey = btn.dataset.imgKey;
      const numref = btn.dataset.numref;
      const imgNum = parseInt(btn.dataset.imgNum);
      const productId = btn.dataset.productId;
      const imageUrl = btn.dataset.imgUrl;
      if (!numref) return;
      const statusEl = pdpStatus();
      const { error } = await supabase.from('product_images').upsert(
        { numref, image_number: imgNum, color: '', product_id: productId, image_url: imageUrl },
        { onConflict: 'numref,image_number' }
      );
      if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      if (statusEl) { statusEl.textContent = 'Couleur retirée'; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
    });
  });

  // Delete individual image
  document.querySelectorAll('.pdp-img-del').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const imgId = btn.dataset.imgId;
      const imgKey = btn.dataset.imgKey;
      const numref = btn.dataset.numref;
      const imgNum = parseInt(btn.dataset.imgNum);
      const p = pdpProduct(); if (!p) return;
      const statusEl = pdpStatus();
      const img = (state.adminImages || []).find(i => `${i.numref}__${i.image_number}` === imgKey);
      if (!img) return;
      if (imgId && imgId !== 'undefined') {
        const { error } = await supabase.from('product_images').delete().eq('id', imgId);
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      } else if (numref && imgNum) {
        const { error } = await supabase.from('product_images').delete().eq('numref', numref).eq('image_number', imgNum);
        if (error) { if (statusEl) { statusEl.textContent = 'Erreur: ' + error.message; statusEl.style.color = '#F44336'; } return; }
      }
      if (img.image_url && img.image_url.includes('product-images')) {
        const path = img.image_url.split('/product-images/')[1];
        if (path) await supabase.storage.from('product-images').remove([path]);
      }
      if (statusEl) { statusEl.textContent = 'Image supprimée.'; statusEl.style.color = '#4CAF50'; }
      await reloadPdpData();
      render(true);
    });
  });

  // Upload new images
  const pdpImgUpload = document.getElementById('pdp-img-upload');
  if (pdpImgUpload) {
    pdpImgUpload.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      const p = pdpProduct(); if (!p) return;
      const statusEl = pdpStatus();
      if (statusEl) { statusEl.textContent = `Upload en cours... (0/${files.length})`; statusEl.style.color = '#666'; }
      const existingImgs = (state.adminImages || []).filter(i => i.numref === p.numref);
      const { data: dbImgs } = await supabase.from('product_images').select('image_number').eq('numref', p.numref).eq('deleted', false);
      const dbMaxNum = dbImgs && dbImgs.length > 0 ? Math.max(...dbImgs.map(i => i.image_number || 0)) : 0;
      const stateMaxNum = existingImgs.length > 0 ? Math.max(...existingImgs.map(i => i.image_number || 0)) : 0;
      let nextNum = Math.max(dbMaxNum, stateMaxNum) + 1;
      let uploaded = 0, errors = 0;
      for (const file of files) {
        const ext = file.name.split('.').pop().toLowerCase();
        const filePath = `${p.numref}/${Date.now()}_${nextNum}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(filePath, file, { upsert: false });
        if (upErr) { console.error('upload error', upErr); errors++; nextNum++; continue; }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        const imageUrl = urlData.publicUrl;
        const { data: insData, error: insErr } = await supabase.from('product_images').upsert({
          numref: p.numref, product_id: p.id, image_number: nextNum, image_url: imageUrl, color: '', filename: file.name
        }, { onConflict: 'numref,image_number' }).select();
        if (insErr) { console.error('upsert error', insErr); errors++; nextNum++; continue; }
        if (insData?.[0]) {
          state.adminImages.push(insData[0]);
          state.storeImages.push({ ...insData[0], color: '' });
        }
        uploaded++; nextNum++;
        if (statusEl) statusEl.textContent = `Upload en cours... (${uploaded}/${files.length})`;
      }
      if (statusEl) { statusEl.textContent = errors > 0 ? `${uploaded} image(s) ajoutée(s), ${errors} erreur(s)` : `${uploaded} image(s) ajoutée(s)`; statusEl.style.color = errors > 0 ? '#FF9800' : '#4CAF50'; }
      pdpImgUpload.value = '';
      await reloadPdpData();
      render(true);
    });
  }
}
let heroTimer;
function startHeroCycle() {
  if (heroTimer) clearInterval(heroTimer);
  let idx = 0;
  heroTimer = setInterval(() => {
    const slots = document.querySelectorAll('.hero-slot');
    if (!slots.length) return;
    idx = (idx + 1) % 5;
    slots.forEach(slot => {
      slot.querySelectorAll('.hero-img').forEach((img, i) => {
        img.classList.toggle('active', i === idx);
      });
    });
  }, 3500);
}

window.addEventListener('popstate', render);

// Intercept internal link clicks
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-link]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  e.preventDefault();
  navigate(href);
});

function navigate(path) {
  history.pushState(null, '', path);
  render();
}

// Redirect old hash URLs to new clean URLs
function redirectOldHashUrls() {
  if (location.hash && location.hash.startsWith('#/')) {
    const oldPath = location.hash.replace('#', '');
    if (oldPath === '/produit') {
      // Can't redirect without knowing the product — go home
      history.replaceState(null, '', '/');
    } else {
      history.replaceState(null, '', oldPath);
    }
  }
}

// ---------- Init ----------
(async () => {
  redirectOldHashUrls();
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  await loadProducts();
  await loadCampaign();
  if (state.session) await loadAdminProducts();
  render();
})();
