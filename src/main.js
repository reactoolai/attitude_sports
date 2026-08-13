import './style.css';
import { DEPTS, BENEFITS, FOOTER_COLS, FITS, TECHS, DISCOUNTS, RATINGS } from './data.js';
import { supabase } from './supabase.js';

const app = document.getElementById('app');
const state = {
  sort: 'featured', q: '', products: [], storeSkus: [], storeImages: [],
  adminProducts: [], adminSkus: [], adminImages: [],
  session: null, loadingProducts: false, campaign: null,
  adminTab: 'overview', adminFilter: { category: '', supplier: '', search: '', stock: '' },
  adminSort: 'name', adminPage: 1, adminPerPage: 20, adminDetailProduct: null,
};

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
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('skus').select('*'),
    supabase.from('product_images').select('*'),
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
  outlet: [],
};

function fmtPrice(n) { return parseFloat(n || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' }); }

function mapProduct(p) {
  const skus = state.storeSkus.filter(s => s.product_id === p.id);
  const firstSku = skus[0] || {};
  const colors = [...new Set(skus.map(s => s.color).filter(Boolean))];
  const sizes = [...new Set(skus.map(s => s.size).filter(Boolean))];
  const imgs = state.storeImages.filter(i => i.numref === p.numref).sort((a, b) => a.image_number - b.image_number);
  const imgUrl = imgs.length > 0 ? imgs[0].filename : '';
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
    <a href="#/outlet" class="outlet">Outlet</a>
  </nav>
  <div class="header-right">
    <div class="search"><span>⌕</span><input id="search-input" value="${state.q}" placeholder="Rechercher"></div>
    ${state.session
      ? `<a href="#/admin" class="icon" aria-label="Admin" title="Administration"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 5h18v14H3z"/><path d="M3 10h18"/><path d="M8 14h2"/><path d="M14 14h2"/></svg></a>
         <a href="#" class="icon" id="logout-btn" aria-label="Déconnexion" title="Déconnexion"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg></a>`
      : `<a href="#/connexion" class="icon" aria-label="Compte" title="Se connecter"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg></a>`}
    <a href="#" class="icon cart" aria-label="Panier" title="Panier">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4.5 7.5h15l-1.3 11h-12.4z"/><path d="M8.8 7.5a3.2 3.2 0 0 1 6.4 0"/></svg>
      <span class="cart-badge">2</span>
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
<a href="#/produit" class="card" data-id="${p.id || ''}">
  <div class="card-img ${big ? '' : 'sm'}">
    ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">` : '<span class="ph-label">[ photo produit ]</span>'}
    ${p.badge ? `<span class="badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : ''}
  </div>
  <div class="card-body">
    <div class="dots">${(p.colorsList || []).slice(0, 5).map(c => `<span style="background:${stringToColor(c)}" title="${c}"></span>`).join('')}<em>${p.colors} couleur${p.colors > 1 ? 's' : ''}</em></div>
    <div class="card-name">${p.name}</div>
    <div class="card-cat">${p.cat}</div>
    <div class="card-price">
      ${p.oldPrice
        ? `<span class="sale">${p.price}</span><span class="old">${p.oldPrice}</span>`
        : `<span>${p.price}</span>`}
    </div>
  </div>
</a>`;

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
    } else if (deptKey === 'outlet') {
      products = state.products.filter(p => {
        const skus = state.storeSkus.filter(s => s.product_id === p.id);
        return skus.some(s => s.suggested_price && parseFloat(s.suggested_price) > parseFloat(s.price || 0));
      }).map(mapProduct);
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
        ${deptKey === 'outlet' ? filterSection('Rabais', DISCOUNTS, 'check', true) : ''}
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

const pagePdp = () => `
<main class="pad">
  <div class="crumbs"><a href="#/">Accueil</a> / <a href="#/hommes">Hommes</a> / <b>T-shirt AS-Dry Performance</b></div>
  <div class="pdp">
    <div class="gallery">
      <div class="thumbs">${[1, 2, 3, 4].map(() => '<div></div>').join('')}</div>
      ${ph('photo produit principale — t-shirt porté', 'gallery-main')}
    </div>
    <div class="buybox">
      <div class="eyebrow">Nouveauté</div>
      <h1>T-shirt AS-Dry Performance</h1>
      <div class="pdp-cat">Entraînement · Homme</div>
      <div class="pdp-price">34,99 $</div>
      <div class="filter-title">Couleur : Noir carbone</div>
      <div class="swatches lg">
        <span class="sel" style="background:#16161A"></span><span style="background:#FF5A1F"></span>
        <span style="background:#9C9CA4"></span><span style="background:#F2F0EB;border:1px solid #9C9CA4"></span>
      </div>
      <div class="size-head"><span class="filter-title">Taille</span><a href="#">Guide des tailles</a></div>
      <div class="sizes-grid">${DEPTS.hommes.sizes.slice(0, 6).map(s => `<span class="size">${s}</span>`).join('')}</div>
      <button class="btn orange full">Ajouter au panier</button>
      <div class="pdp-ship">Livraison gratuite à partir de 150 $ · Retours sous 60 jours</div>
      <div class="acc open"><div class="acc-head">Description <span>+</span></div>
        <p>Tissu AS-Dry qui évacue la transpiration et sèche rapidement. Coupe athlétique, col rond côtelé, coutures plates anti-frottement. 90 % polyester, 10 % élasthanne.</p>
      </div>
      <div class="acc"><div class="acc-head">Livraison et retours <span>+</span></div></div>
      <div class="acc"><div class="acc-head">Entretien <span>+</span></div></div>
    </div>
  </div>
  <section class="related">
    <h2>Vous aimerez aussi</h2>
    <div class="grid g4">${getNewArrivals().map(p => card(p, false)).join('')}</div>
  </section>
</main>`;

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
        <input type="password" id="login-pass" required autocomplete="current-password">
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
      <select id="adm-sort" class="adm-select">
        <option value="name" ${state.adminSort === 'name' ? 'selected' : ''}>Trier : Nom</option>
        <option value="price-asc" ${state.adminSort === 'price-asc' ? 'selected' : ''}>Prix croissant</option>
        <option value="price-desc" ${state.adminSort === 'price-desc' ? 'selected' : ''}>Prix decroissant</option>
        <option value="stock" ${state.adminSort === 'stock' ? 'selected' : ''}>Stock</option>
      </select>
    </div>
    <div class="adm-table-wrap">
      <table class="adm-table">
        <thead>
          <tr>
            <th>Produit</th><th>Ref.</th><th>Categorie</th><th>Dept.</th><th>Fournisseur</th><th>Saison</th><th>Prix</th><th>Stock</th><th>SKUs</th><th>Img</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${pageProducts.map(p => {
            const stock = getProductStock(p);
            const skuCount = state.adminSkus.filter(s => s.product_id === p.id).length;
            const imgCount = state.adminImages.filter(i => i.numref === p.numref).length;
            const stockClass = stock === 0 ? 'out' : stock <= 5 ? 'low' : 'ok';
            return `
            <tr class="adm-row-click" data-id="${p.id}">
              <td><div class="adm-prod-cell"><span class="adm-prod-name">${p.name || '—'}</span></div></td>
              <td><span class="adm-ref">${p.numref || '—'}</span></td>
              <td>${p.category ? `<span class="adm-cat-tag" style="background:${CAT_COLORS[p.category] || '#666'}">${CAT_LABELS[p.category] || p.category}</span>` : '—'}</td>
              <td>${p.department || '—'}</td>
              <td>${p.supplier || '—'}</td>
              <td>${p.season || '—'}</td>
              <td><span class="adm-price">${fmtPrice(getProductPrice(p))}</span></td>
              <td><span class="adm-stock adm-stock-${stockClass}">${stock}</span></td>
              <td>${skuCount}</td>
              <td>${imgCount > 0 ? `<span class="adm-img-badge">${imgCount}</span>` : '<span class="adm-no-img">—</span>'}</td>
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
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('skus').select('*'),
    supabase.from('product_images').select('*'),
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
  '/outlet': () => pagePlp('outlet'),
  '/produit': pagePdp,
  '/recherche': pageSearch,
  '/connexion': pageLogin,
  '/admin': pageAdmin,
};

function render() {
  const path = location.hash.replace('#', '') || '/';
  const page = routes[path] || pageHome;
  app.innerHTML = promoBar() + header() + page() + footer();
  bind();
  startHeroCycle();
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
