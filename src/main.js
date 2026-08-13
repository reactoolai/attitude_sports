import './style.css';
import { DEPTS, BENEFITS, FOOTER_COLS, FITS, TECHS, RATINGS } from './data.js';
import { supabase } from './supabase.js';

const app = document.getElementById('app');
const state = {
  sort: 'featured', q: '', products: [], storeSkus: [], storeImages: [],
  adminProducts: [], adminSkus: [], adminImages: [],
  session: null, loadingProducts: false, campaign: null,
  adminTab: 'overview', adminFilter: { category: '', supplier: '', search: '', stock: '', photo: '' },
  adminSort: 'name', adminPage: 1, adminPerPage: 20, adminDetailProduct: null,
  selectedProductId: null,
  cart: loadCart(),
  selectedColor: null, selectedSize: null,
};

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
  try { return JSON.parse(localStorage.getItem('as_cart') || '[]'); } catch { return []; }
}
function saveCart() {
  try { localStorage.setItem('as_cart', JSON.stringify(state.cart)); } catch {}
}
function cartCount() { return state.cart.reduce((s, i) => s + i.qty, 0); }
function cartTotal() { return state.cart.reduce((s, i) => s + i.qty * i.price, 0); }
function addToCart(item) {
  const existing = state.cart.find(i => i.productId === item.productId && i.color === item.color && i.size === item.size);
  if (existing) existing.qty += 1;
  else state.cart.push({ ...item, qty: 1 });
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
      <img class="cart-item-img" src="${it.image_url || ''}" alt="" referrerpolicy="no-referrer" onerror="this.style.display='none'">
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
  drawer.querySelectorAll('.qty-btn').forEach(b => b.addEventListener('click', () => changeQty(parseInt(b.dataset.idx), parseInt(b.dataset.delta))));
  drawer.querySelectorAll('.qty-remove').forEach(b => b.addEventListener('click', () => removeFromCart(parseInt(b.dataset.idx))));
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
async function loadProducts() {
  state.loadingProducts = true;
  const [{ data: prods, error: pe }, { data: skus, error: se }, { data: imgs, error: ie }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(10000),
    supabase.from('skus').select('*').limit(10000),
    supabase.from('product_images').select('*').limit(10000),
  ]);
  if (pe) console.error('loadProducts error:', pe);
  if (se) console.error('loadSkus error:', se);
  if (ie) console.error('loadImages error:', ie);
  state.products = (prods || []).filter(p => p.numref);
  state.storeSkus = skus || [];
  state.storeImages = imgs || [];
  state.loadingProducts = false;
}

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
  const imgUrl = imgs.length > 0 ? (imgs[0].image_url || '') : '';
  const price = firstSku.price ? fmtPrice(firstSku.price) : '';
  const oldPrice = firstSku.suggested_price && parseFloat(firstSku.suggested_price) > parseFloat(firstSku.price || 0) ? fmtPrice(firstSku.suggested_price) : '';
  const badge = oldPrice ? 'Solde' : (p.season && p.season.includes('2026') ? 'Nouveau' : '');
  return {
    name: p.name || 'Sans nom',
    cat: p.department || '',
    colors: colors.length || 1,
    price,
    n: parseFloat(firstSku.price) || 0,
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
  };
}

// ---------- Composants partagés ----------
const promoBar = () => `<div class="promo">Livraison gratuite à partir de 150 $ &nbsp;·&nbsp; Retours faciles en magasin</div>`;

const header = () => `
<header class="header">
  <a href="#/" class="logo"><img src="/logo.png" alt="Attitude Sports"></a>
  <nav class="nav">
    <a href="#/hommes">Hommes</a>
    <a href="#/femmes">Femmes</a>
    <a href="#/enfants">Enfants</a>
    <a href="#/unisexe">Unisexe</a>
    <a href="#/chaussures">Chaussures</a>
  </nav>
  <div class="header-right">
    <div class="search"><span>⌕</span><input id="search-input" value="${state.q}" placeholder="Rechercher"></div>
    ${state.session
      ? `<a href="#/admin" class="icon" aria-label="Admin" title="Administration"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M14 14h2"/></svg></a>
         <a href="#" class="icon" id="logout-btn" aria-label="Déconnexion" title="Déconnexion"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></a>`
      : `<a href="#/connexion" class="icon" aria-label="Compte" title="Se connecter"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg></a>`}
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

const card = (p, big = true) => `
<div class="card-wrap">
  <a href="#/produit" class="card" data-id="${p.id || ''}">
    <div class="card-img ${big ? '' : 'sm'}">
      ${p.image_url ? `<img class="prod-img" src="${p.image_url}" alt="${p.name}" referrerpolicy="no-referrer" loading="lazy" data-retry="0" onerror="if(this.dataset.retry<2){this.dataset.retry++;this.src=this.src.split('&retry=')[0]+'&retry='+this.dataset.retry;}else{this.style.display='none';this.parentElement.classList.add('no-img');}">` : '<span class="ph-label">[ photo produit ]</span>'}
      ${p.badge ? `<span class="badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : ''}
    </div>
    <div class="card-body">
      <div class="dots">${(p.colorsList || []).slice(0, 5).map(c => `<span style="background:${realColor(c)}" title="${c}"></span>`).join('')}${p.colors > 5 ? '<em>+</em>' : ''}<em>${p.colors} couleur${p.colors > 1 ? 's' : ''}</em></div>
      <div class="card-name-row">
        <div class="card-name">${p.name}</div>
        <button class="card-add-btn" data-id="${p.id || ''}" title="Ajouter au panier" aria-label="Ajouter au panier">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        </button>
      </div>
      <div class="card-cat">${p.cat}</div>
      <div class="card-price">
        ${p.oldPrice
          ? `<span class="sale">${p.price}</span><span class="old">${p.oldPrice}</span>`
          : `<span>${p.price}</span>`}
      </div>
    </div>
  </a>
</div>`;

const cartDrawerHtml = () => `
<div id="cart-overlay" class="cart-overlay"></div>
<aside id="cart-drawer" class="cart-drawer">
  <div class="cart-head">
    <span class="cart-head-title">Panier (<span class="cart-count">0</span>)</span>
    <button id="cart-close" class="cart-close" aria-label="Fermer">&times;</button>
  </div>
  <div class="cart-items"></div>
  <div class="cart-footer">
    <div class="cart-total-row"><span>Sous-total</span><span class="cart-total-val">$0.00</span></div>
    <button class="btn orange full">Passer la commande</button>
    <div class="cart-ship-note">Livraison gratuite à partir de 150 $</div>
  </div>
</aside>`;

const footer = () => `
<footer class="footer">
  <div class="footer-news">
    <div>
      <div class="footer-news-title">Rejoins l'équipe</div>
      <div class="footer-news-sub">Offres exclusives, nouveautés et 10 % sur ta première commande.</div>
    </div>
    <form class="news-form" onsubmit="return false">
      <input type="email" placeholder="Adresse courriel">
      <button>S'abonner</button>
    </form>
  </div>
  <div class="footer-cols">
    ${FOOTER_COLS.map(c => `
      <div>
        <div class="footer-col-title">${c.t}</div>
        ${c.links.map(l => `<a href="#">${l}</a>`).join('')}
      </div>`).join('')}
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
    <div><a href="#">Confidentialité</a><a href="#">Conditions</a><a href="#">Accessibilité</a></div>
    <a class="reactool-credit" href="https://reactool.ai" target="_blank" rel="noopener noreferrer">
      Propulsé par <img src="/images/reactool_(1).png" alt="Reactool AI">
    </a>
  </div>
</footer>`;

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
        <a href="#/hommes" class="btn orange">Magasiner hommes</a>
        <a href="#/femmes" class="btn ghost">Magasiner femmes</a>
      </div>
    </div>
  </section>
  ${state.campaign && state.campaign.enabled !== false ? campaignSection(state.campaign) : ''}
  <section class="cats">
    ${[['hommes', 'Hommes', '/images/V5-6008988-008_BC.png'], ['femmes', 'Femmes', '/woman.png'], ['enfants', 'Enfants', '/enfant.png']].map(([slug, name, img]) => `
      <a href="#/${slug}" class="cat-tile" style="background-image:url('${img}')">
        <span class="cat-name">${name}</span>
      </a>`).join('')}
  </section>
  <section class="pad">
    <div class="section-head">
      <h2>Nouveautés</h2>
      <a href="#/hommes" class="link-more">Tout voir</a>
    </div>
    <div class="grid g4">${getNewArrivals().map(p => card(p)).join('')}</div>
  </section>
  <section class="split">
    <div class="split-ph" style="background-image:url('/tof.png')"></div>
    <div class="split-txt">
      <div class="eyebrow">Technologie AS-Dry</div>
      <h2>Reste au sec.<br>Reste concentré.</h2>
      <p>Un tissu qui évacue la transpiration et sèche en un temps record. Conçu pour l'entraînement, pensé pour tous les jours.</p>
      <a href="#/hommes" class="btn ghost">Découvrir</a>
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
      <a href="${c.men_link || '#/hommes'}" class="btn orange">${c.men_label || 'Magasiner hommes'}</a>
      <a href="${c.women_link || '#/femmes'}" class="btn ghost">${c.women_label || 'Magasiner femmes'}</a>
    </div>
  </div>
</section>`;

function getNewArrivals() {
  if (state.products.length === 0) return [];
  return state.products
    .filter(p => p.season && p.season.includes('2026'))
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

const pagePlp = (deptKey) => {
  const dept = DEPTS[deptKey] || { label: deptKey, sub: '', cats: [], sizes: [] };
  let products = [];
  if (state.products.length > 0) {
    if (deptKey === 'chaussures') {
      products = state.products.filter(p => (p.department || '').toUpperCase() === 'CHAUSSURE').map(mapProduct);
    } else {
      const cats = STORE_DEPT_MAP[deptKey] || [];
      products = state.products.filter(p => cats.includes((p.category || '').toUpperCase())).map(mapProduct);
    }
  }
  if (state.sort === 'price-asc') products = [...products].sort((a, b) => a.n - b.n);
  if (state.sort === 'price-desc') products = [...products].sort((a, b) => b.n - a.n);
  if (state.sort === 'new') products = [...products].sort((a, b) => (b.badge === 'Nouveau' ? 1 : 0) - (a.badge === 'Nouveau' ? 1 : 0));
  return `
<main>
  <section class="plp-band">
    <div class="eyebrow">Collection</div>
    <h1>${dept.label}</h1>
    <p>${dept.sub}</p>
    <div class="chips">${dept.cats.map(c => `<span>${c}</span>`).join('')}</div>
  </section>
  <div class="pad">
    <div class="crumbs"><a href="#/">Accueil</a> / <b>${dept.label}</b></div>
    <div class="plp-head">
      <span class="count">${products.length} articles</span>
      <select id="sort-select">
        <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Trier : En vedette</option>
        <option value="new" ${state.sort === 'new' ? 'selected' : ''}>Nouveautés</option>
        <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Prix croissant</option>
        <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Prix décroissant</option>
      </select>
    </div>
    <div class="plp-layout">
      <aside class="aside">
        <div class="aside-head"><span>Filtres</span><a href="#">Tout effacer</a></div>
        ${filterSection('Type de produit', dept.cats)}
        ${filterSection('Taille', dept.sizes, 'chips')}
        ${filterSection('Prix', ['Moins de 30 $', '30 $ – 60 $', '60 $ et plus'])}
        <div class="filter">
          <div class="filter-title">Couleur</div>
          <div class="swatches">
            <span style="background:#16161A"></span><span style="background:#FF5A1F"></span>
            <span style="background:#9C9CA4"></span><span style="background:#F2F0EB;border:1px solid #9C9CA4"></span>
          </div>
        </div>
        ${filterSection('Coupe', FITS)}
        ${filterSection('Technologie', TECHS)}
        ${filterSection('Évaluation', RATINGS)}
      </aside>
      <div>
        ${products.length > 0
          ? `<div class="grid g3">${products.map(p => card(p)).join('')}</div>
             <div class="pagination"><span class="active">1</span><span>2</span><span>3</span><span>→</span></div>`
          : `<div class="empty">${state.loadingProducts ? 'Chargement des produits...' : 'Aucun article dans cette catégorie pour le moment.'}</div>`}
      </div>
    </div>
  </div>
</main>`;
};

const pageSearch = () => {
  const ql = state.q.trim().toLowerCase();
  const allProducts = state.products.map(mapProduct);
  const results = ql ? allProducts.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(ql)) : [];
  return `
<main class="pad search-page">
  <h1 class="search-title">Résultats pour «${state.q}» <em>(${results.length} article${results.length === 1 ? '' : 's'})</em></h1>
  ${results.length
    ? `<div class="grid g4">${results.map(p => card(p)).join('')}</div>`
    : `<div class="empty">Aucun résultat. Essayez «t-shirt», «legging» ou «chaussure».</div>`}
</main>`;
};

const pagePdp = () => {
  const p = state.products.find(x => x.id === state.selectedProductId);
  if (!p) {
    return `<main class="pad"><div class="empty">Produit introuvable. <a href="#/">Retour à l'accueil</a></div></main>`;
  }
  const skus = state.storeSkus.filter(s => s.product_id === p.id);
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const imgs = state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => a.image_number - b.image_number);
  const firstSku = skus[0] || {};
  const price = firstSku.price ? fmtPrice(firstSku.price) : '';
  const oldPrice = firstSku.suggested_price && parseFloat(firstSku.suggested_price) > parseFloat(firstSku.price || 0) ? fmtPrice(firstSku.suggested_price) : '';
  const badge = oldPrice ? 'Solde' : (p.season && p.season.includes('2026') ? 'Nouveau' : '');
  const catLabel = CAT_LABELS[(p.category || '').toUpperCase()] || p.category || '';
  const deptLabel = p.department || '';
  const desc = p.description_fr || p.description_web || p.description_en || '';
  const related = state.products.filter(x => x.id !== p.id && x.category === p.category).slice(0, 4).map(mapProduct);
  const galleryHtml = imgs.length > 0
    ? `<div class="thumbs">${imgs.map((i, idx) => `<div class="thumb${idx === 0 ? ' active' : ''}" data-idx="${idx}"><img class="prod-thumb" src="${i.image_url}" alt="" referrerpolicy="no-referrer" loading="lazy" data-retry="0" onerror="if(this.dataset.retry<2){this.dataset.retry++;this.src=this.src+'&retry='+this.dataset.retry;}else{this.style.opacity='0.3';}"></div>`).join('')}</div>
       <div class="gallery-main">
         <button class="gal-nav gal-prev" type="button" aria-label="Photo précédente">&#8249;</button>
         <img id="gal-main-img" class="prod-main" src="${imgs[0].image_url}" alt="${p.name}" referrerpolicy="no-referrer" data-retry="0" onerror="if(this.dataset.retry<2){this.dataset.retry++;this.src=this.src+'&retry='+this.dataset.retry;}">
         <button class="gal-nav gal-next" type="button" aria-label="Photo suivante">&#8250;</button>
         <span class="gal-counter" id="gal-counter">1 / ${imgs.length}</span>
       </div>`
    : `${ph('photo produit principale', 'gallery-main')}`;
  return `
<main class="pad">
  <div class="crumbs"><a href="#/">Accueil</a> / <a href="#/${(p.category||'').toLowerCase()}">${catLabel}</a> / <b>${p.name}</b></div>
  <div class="pdp">
    <div class="gallery">
      ${galleryHtml}
    </div>
    <div class="buybox">
      ${badge ? `<div class="eyebrow">${badge}</div>` : ''}
      <h1>${p.name}</h1>
      <div class="pdp-cat">${deptLabel}${catLabel ? ' · ' + catLabel : ''}</div>
      <div class="pdp-price">${oldPrice ? `<span class="sale">${price}</span> <span class="old">${oldPrice}</span>` : price}</div>
      ${colors.length > 0 ? `<div class="filter-title">Couleur : <span id="selected-color-name">${colors[0]}</span></div>
      <div class="swatches lg" id="color-swatches">
        ${colors.map((c, i) => `<span class="color-swatch${i === 0 ? ' sel' : ''}" data-color="${c}" style="background:${realColor(c)}" title="${c}"></span>`).join('')}
      </div>
      <div class="color-count">${colors.length} couleur${colors.length > 1 ? 's' : ''} disponible${colors.length > 1 ? 's' : ''}</div>` : ''}
      ${sizes.length > 0 ? `<div class="size-head"><span class="filter-title">Taille</span><a href="#">Guide des tailles</a></div>
      <div class="sizes-grid" id="sizes-grid">${sizes.map(s => `<span class="size">${s}</span>`).join('')}</div>
      <div class="size-count">${sizes.length} taille${sizes.length > 1 ? 's' : ''} disponible${sizes.length > 1 ? 's' : ''}</div>` : ''}
      <button class="btn orange full" id="pdp-add-cart">Ajouter au panier</button>
      <div class="pdp-ship">Livraison gratuite à partir de 150 $ · Retours sous 60 jours</div>
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
        <a href="#/admin" class="adm-nav-item ${state.adminTab === t.id ? 'active' : ''}" data-tab="${t.id}">
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
              <td><span class="adm-price">${fmtPrice(getProductPrice(p))}</span></td>
              <td><span class="adm-stock adm-stock-${stockClass}">${stock}</span></td>
              <td>${skuCount}</td>
              <td>${imgCount > 0 ? `<div class="adm-thumb-strip" data-id="${p.id}">${state.adminImages.filter(i => i.numref === p.numref).sort((a,b) => a.image_number - b.image_number).slice(0, 3).map(img => `<img src="${img.image_url || ''}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.style.display='none'">`).join('')}<span class="adm-img-count">${imgCount}</span></div>` : '<span class="adm-no-img">Aucune</span>'}</td>
              <td><button class="adm-view-btn" data-id="${p.id}">Details</button></td>
            </tr>`;
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
  const images = state.adminImages.filter(i => i.numref === product.numref).sort((a, b) => a.image_number - b.image_number);
  const totalStock = skus.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalValue = skus.reduce((sum, s) => sum + (s.quantity || 0) * parseFloat(s.price || 0), 0);
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];

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
        <div class="adm-panel-head"><h3>Images (${images.length})</h3></div>
        <div class="adm-img-grid">
          ${images.length > 0
            ? images.slice(0, 8).map((img, i) => `
              <div class="adm-img-thumb" data-filename="${img.filename}">
                <img class="prod-thumb" src="${img.image_url || ''}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.style.display='none'">
                <div class="adm-img-placeholder"><span>${i + 1}</span></div>
                <div class="adm-img-name">${img.image_number === 1 ? 'Front' : img.image_number === 2 ? 'Back' : 'Detail ' + img.image_number}</div>
              </div>`).join('')
            : '<div class="adm-no-images">Aucune image pour ce produit</div>'}
        </div>
      </div>
      <div class="adm-panel">
        <div class="adm-panel-head"><h3>Informations</h3></div>
        <div class="adm-info-grid">
          <div class="adm-info-item"><span class="adm-info-label">Categorie</span><span class="adm-info-val">${CAT_LABELS[product.category] || product.category || '—'}</span></div>
          <div class="adm-info-item"><span class="adm-info-label">Departement</span><span class="adm-info-val">${product.department || '—'}</span></div>
          <div class="adm-info-item"><span class="adm-info-label">Sous-dept.</span><span class="adm-info-val">${product.sub_department || '—'}</span></div>
          <div class="adm-info-item"><span class="adm-info-label">Fournisseur</span><span class="adm-info-val">${product.supplier || '—'}</span></div>
          <div class="adm-info-item"><span class="adm-info-label">Saison</span><span class="adm-info-val">${product.season || '—'}</span></div>
          <div class="adm-info-item"><span class="adm-info-label">TPS / TVQ</span><span class="adm-info-val">${product.tax_tps || 5}% / ${product.tax_tvq || 9.975}%</span></div>
        </div>
      </div>
    </div>
    <div class="adm-row">
      <div class="adm-panel adm-panel-flex">
        <div class="adm-panel-head">
          <h3>Stock par variant (${skus.length} SKUs)</h3>
          <div class="adm-stock-summary">
            <span class="adm-stock-tag">Total: ${totalStock}</span>
            <span class="adm-stock-tag">Valeur: ${fmtPrice(totalValue)}</span>
          </div>
        </div>
        <div class="adm-sku-table-wrap">
          <table class="adm-sku-table">
            <thead><tr><th>Taille</th><th>Couleur</th><th>Code-barres</th><th>Qte</th><th>Prix</th><th>Prix sugg.</th></tr></thead>
            <tbody>
              ${skus.map(s => `
                <tr>
                  <td>${s.size || '—'}</td>
                  <td>${s.color || '—'}</td>
                  <td><span class="adm-barcode">${s.barcode || '—'}</span></td>
                  <td><span class="adm-stock adm-stock-${(s.quantity || 0) === 0 ? 'out' : (s.quantity || 0) <= 5 ? 'low' : 'ok'}">${s.quantity || 0}</span></td>
                  <td>${fmtPrice(s.price)}</td>
                  <td>${s.suggested_price ? fmtPrice(s.suggested_price) : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    ${sizes.length || colors.length ? `
    <div class="adm-row">
      ${sizes.length ? `<div class="adm-panel"><div class="adm-panel-head"><h3>Tailles (${sizes.length})</h3></div><div class="adm-chips">${sizes.map(s => `<span class="adm-chip">${s}</span>`).join('')}</div></div>` : ''}
      ${colors.length ? `<div class="adm-panel"><div class="adm-panel-head"><h3>Couleurs (${colors.length})</h3></div><div class="adm-chips">${colors.map(c => `<span class="adm-chip">${c}</span>`).join('')}</div></div>` : ''}
    </div>` : ''}
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

const pageAdmin = () => {
  if (!state.session) return pageLogin();
  let content;
  if (state.adminDetailProduct) {
    content = adminProductDetail(state.adminDetailProduct);
  } else if (state.adminTab === 'overview') {
    content = adminOverview();
  } else if (state.adminTab === 'inventory') {
    content = adminInventory();
  } else if (state.adminTab === 'campaign') {
    content = adminCampaign();
  } else {
    content = adminOverview();
  }
  return `<main class="adm-layout">${adminSidebar()}${content}</main>`;
};

// ---------- Admin logic ----------
async function loadAdminProducts() {
  const [{ data: prods, error: pe }, { data: skus, error: se }, { data: imgs, error: ie }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }).limit(10000),
    supabase.from('skus').select('*').limit(10000),
    supabase.from('product_images').select('*').limit(10000),
  ]);
  if (pe) console.error('admin products error:', pe);
  if (se) console.error('admin skus error:', se);
  if (ie) console.error('admin images error:', ie);
  state.adminProducts = (prods || []).filter(p => p.numref);
  state.adminSkus = skus || [];
  state.adminImages = imgs || [];
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
  location.hash = '#/admin';
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

async function handleLogout(e) {
  e.preventDefault();
  await supabase.auth.signOut();
  state.session = null;
  location.hash = '#/';
  render();
}

// ---------- Routeur ----------
const routes = {
  '': pageHome, '/': pageHome,
  '/hommes': () => pagePlp('hommes'),
  '/femmes': () => pagePlp('femmes'),
  '/enfants': () => pagePlp('enfants'),
  '/unisexe': () => pagePlp('unisexe'),
  '/chaussures': () => pagePlp('chaussures'),
  '/produit': pagePdp,
  '/recherche': pageSearch,
  '/connexion': pageLogin,
  '/admin': pageAdmin,
};

function render() {
  const path = location.hash.replace('#', '') || '/';
  const page = routes[path] || pageHome;
  app.innerHTML = promoBar() + header() + page() + footer() + cartDrawerHtml();
  bind();
  startHeroCycle();
  updateCartBadge();
  if (path !== '' && path !== '/') window.scrollTo(0, 0);
}

function bind() {
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', (e) => {
      state.q = e.target.value;
      if (state.q.trim()) {
        if (location.hash !== '#/recherche') location.hash = '#/recherche';
        else { const m = app.querySelector('main'); if (m) m.outerHTML = pageSearch(); }
      } else if (location.hash === '#/recherche') {
        location.hash = '#/';
      }
      const el = document.getElementById('search-input');
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  }
  const sort = document.getElementById('sort-select');
  if (sort) sort.addEventListener('change', (e) => { state.sort = e.target.value; render(); });

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
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      state.adminTab = btn.dataset.tab;
      state.adminDetailProduct = null;
      render();
    });
  });

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
  document.querySelectorAll('.card[data-id]').forEach(c => {
    c.addEventListener('click', (e) => {
      e.preventDefault();
      state.selectedProductId = c.dataset.id;
      state.selectedColor = null;
      state.selectedSize = null;
      location.hash = '#/produit';
    });
  });

  // Card add-to-cart buttons
  document.querySelectorAll('.card-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const prod = state.products.find(x => x.id === btn.dataset.id);
      if (!prod) return;
      const mp = mapProduct(prod);
      const skus = state.storeSkus.filter(s => s.product_id === prod.id);
      const firstSku = skus[0] || {};
      addToCart({
        productId: prod.id,
        name: prod.name || 'Sans nom',
        price: parseFloat(firstSku.price) || 0,
        color: firstSku.color || '',
        size: firstSku.size || '',
        image_url: mp.image_url,
      });
    });
  });

  // Cart drawer
  const cartTrigger = document.getElementById('cart-trigger');
  if (cartTrigger) cartTrigger.addEventListener('click', (e) => { e.preventDefault(); openCartDrawer(); });
  const cartClose = document.getElementById('cart-close');
  if (cartClose) cartClose.addEventListener('click', closeCartDrawer);
  const cartOverlay = document.getElementById('cart-overlay');
  if (cartOverlay) cartOverlay.addEventListener('click', closeCartDrawer);

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
      galMain.src = imgs[i].image_url;
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
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('sel'));
      sw.classList.add('sel');
      state.selectedColor = sw.dataset.color;
      const label = document.getElementById('selected-color-name');
      if (label) label.textContent = sw.dataset.color;
    });
  });

  // PDP size selection
  document.querySelectorAll('#sizes-grid .size').forEach(sz => {
    sz.addEventListener('click', () => {
      document.querySelectorAll('#sizes-grid .size').forEach(s => s.classList.remove('selected'));
      sz.classList.add('selected');
      state.selectedSize = sz.textContent.trim();
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
      const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
      const color = state.selectedColor || (colors.length > 0 ? colors[0] : '');
      const size = state.selectedSize || (sizes.length > 0 ? sizes[0] : '');
      const mp = mapProduct(p);
      const firstSku = skus[0] || {};
      addToCart({
        productId: p.id,
        name: p.name || 'Sans nom',
        price: parseFloat(firstSku.price) || 0,
        color, size,
        image_url: mp.image_url,
      });
    });
  }
}

let heroTimer = null;
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

window.addEventListener('hashchange', render);

// ---------- Init ----------
(async () => {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  await loadProducts();
  await loadCampaign();
  render();
})();
