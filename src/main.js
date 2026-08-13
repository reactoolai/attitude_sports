import './style.css';
import { DEPTS, NEW_ARRIVALS, BENEFITS, FOOTER_COLS, FITS, TECHS, DISCOUNTS, RATINGS } from './data.js';
import { supabase } from './supabase.js';

const app = document.getElementById('app');
const state = { sort: 'featured', q: '', products: [], adminProducts: [], session: null, loadingProducts: false, campaign: null };

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
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('loadProducts error:', error); state.loadingProducts = false; return; }
  state.products = data || [];
  state.loadingProducts = false;
}

function mapProduct(p) {
  return {
    name: p.name,
    cat: p.cat,
    colors: p.colors,
    price: p.price,
    n: parseFloat(p.n) || 0,
    oldPrice: p.old_price || '',
    badge: p.badge || '',
    d: Array.isArray(p.d) ? p.d : [],
    rating: p.rating || '0',
    reviews: p.reviews || 0,
    dots: Array.isArray(p.dots) ? p.dots : [],
    image_url: p.image_url || '',
    id: p.id,
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
<a href="#/produit" class="card">
  <div class="card-img ${big ? '' : 'sm'}">
    ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;">` : '<span class="ph-label">[ photo produit ]</span>'}
    ${p.badge ? `<span class="badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : ''}
  </div>
  <div class="card-body">
    <div class="dots">${(p.dots || []).map(c => `<span style="background:${c}"></span>`).join('')}<em>${p.colors} couleurs</em></div>
    <div class="card-name">${p.name}</div>
    <div class="card-cat">${p.cat}</div>
    <div class="card-price">
      ${p.oldPrice
        ? `<span class="sale">${p.price}</span><span class="old">${p.oldPrice}</span>`
        : `<span>${p.price}</span>`}
    </div>
    <div class="card-rating"><span>★</span> ${p.rating} (${p.reviews} avis)</div>
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
  if (state.products.length === 0) return NEW_ARRIVALS;
  const names = ['T-shirt AS-Dry Performance', 'Legging Momentum 7/8', 'Chandail à capuchon Fortitude', 'Chaussure Vitesse 3'];
  return state.products.filter(p => names.includes(p.name)).map(mapProduct);
}

const filterSection = (title, items, type = 'check', accent = false) => `
<div class="filter ${accent ? 'accent' : ''}">
  <div class="filter-title">${title}</div>
  ${type === 'check'
    ? `<div class="filter-list">${items.map(i => `<label><input type="checkbox"> ${i}</label>`).join('')}</div>`
    : `<div class="filter-chips">${items.map(i => `<span class="size">${i}</span>`).join('')}</div>`}
</div>`;

const pagePlp = (deptKey) => {
  const dept = DEPTS[deptKey];
  let products = state.products.length > 0
    ? state.products.filter(p => { const d = Array.isArray(p.d) ? p.d : []; return d.includes(deptKey); }).map(mapProduct)
    : [];
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

// ---------- Page admin ----------
const pageAdmin = () => {
  if (!state.session) return pageLogin();
  const products = state.adminProducts;
  return `
<main class="admin">
  <div class="admin-head">
    <div>
      <h1>Tableau de bord</h1>
      <p class="admin-sub">${state.session.user.email}</p>
    </div>
    <button class="btn orange" id="new-product-btn">+ Nouveau produit</button>
  </div>
  <div class="admin-stats">
    <div class="stat-card"><span class="stat-num">${products.length}</span><span class="stat-label">Produits</span></div>
    <div class="stat-card"><span class="stat-num">${products.filter(p => p.badge === 'Nouveau').length}</span><span class="stat-label">Nouveautés</span></div>
    <div class="stat-card"><span class="stat-num">${products.filter(p => p.badge === 'Solde').length}</span><span class="stat-label">En solde</span></div>
  </div>
  <div class="admin-campaign">
    <div class="admin-campaign-head">
      <h2>Section campagne (accueil)</h2>
      <p class="admin-sub">Modifie la bannière promotionnelle affichée sous le hero de la page d'accueil.</p>
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
  <div class="admin-table-wrap">
    <table class="admin-table">
      <thead>
        <tr><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Ancien prix</th><th>Badge</th><th>Départements</th><th>Évaluation</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${products.map(p => `
          <tr data-id="${p.id}">
            <td>${p.name}</td>
            <td>${p.cat}</td>
            <td>${p.price}</td>
            <td>${p.old_price || '—'}</td>
            <td>${p.badge ? `<span class="admin-badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : '—'}</td>
            <td>${(Array.isArray(p.d) ? p.d : []).join(', ')}</td>
            <td>${p.rating} (${p.reviews})</td>
            <td class="admin-actions">
              <button class="admin-edit" data-id="${p.id}">Modifier</button>
              <button class="admin-delete" data-id="${p.id}">Supprimer</button>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>
  <div id="product-modal" class="modal" style="display:none;">
    <div class="modal-card">
      <div class="modal-head">
        <h2 id="modal-title">Nouveau produit</h2>
        <button id="modal-close" class="modal-close">&times;</button>
      </div>
      <form id="product-form" class="modal-form">
        <input type="hidden" id="pf-id">
        <label>Nom <input type="text" id="pf-name" required></label>
        <label>Catégorie <input type="text" id="pf-cat"></label>
        <div class="form-row">
          <label>Prix <input type="text" id="pf-price" placeholder="34,99 $"></label>
          <label>Ancien prix <input type="text" id="pf-old-price" placeholder="44,99 $"></label>
        </div>
        <div class="form-row">
          <label>Badge <select id="pf-badge"><option value="">Aucun</option><option value="Nouveau">Nouveau</option><option value="Solde">Solde</option></select></label>
          <label>Couleurs (nombre) <input type="number" id="pf-colors" min="1" value="1"></label>
        </div>
        <label>Départements (séparés par virgules) <input type="text" id="pf-depts" placeholder="hommes, femmes"></label>
        <label>Couleurs (hex séparés par virgules) <input type="text" id="pf-dots" placeholder="#16161A, #FF5A1F"></label>
        <div class="form-row">
          <label>Évaluation <input type="text" id="pf-rating" placeholder="4.7"></label>
          <label>Avis (nombre) <input type="number" id="pf-reviews" min="0" value="0"></label>
        </div>
        <label>URL d'image (optionnel) <input type="text" id="pf-image" placeholder="/images/..."></label>
        <div class="modal-actions">
          <button type="button" class="btn ghost" id="modal-cancel">Annuler</button>
          <button type="submit" class="btn orange">Enregistrer</button>
        </div>
      </form>
    </div>
  </div>
</main>`;
};

// ---------- Admin logic ----------
async function loadAdminProducts() {
  const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  if (error) { console.error('admin load error:', error); return; }
  state.adminProducts = data || [];
  render();
}

function openProductModal(product) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-title');
  title.textContent = product ? 'Modifier le produit' : 'Nouveau produit';
  document.getElementById('pf-id').value = product ? product.id : '';
  document.getElementById('pf-name').value = product ? product.name : '';
  document.getElementById('pf-cat').value = product ? product.cat : '';
  document.getElementById('pf-price').value = product ? product.price : '';
  document.getElementById('pf-old-price').value = product ? (product.old_price || '') : '';
  document.getElementById('pf-badge').value = product ? (product.badge || '') : '';
  document.getElementById('pf-colors').value = product ? product.colors : 1;
  document.getElementById('pf-depts').value = product ? (Array.isArray(product.d) ? product.d.join(', ') : '') : '';
  document.getElementById('pf-dots').value = product ? (Array.isArray(product.dots) ? product.dots.join(', ') : '') : '';
  document.getElementById('pf-rating').value = product ? product.rating : '';
  document.getElementById('pf-reviews').value = product ? product.reviews : 0;
  document.getElementById('pf-image').value = product ? (product.image_url || '') : '';
  modal.style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('product-modal').style.display = 'none';
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('pf-id').value;
  const name = document.getElementById('pf-name').value.trim();
  const cat = document.getElementById('pf-cat').value.trim();
  const price = document.getElementById('pf-price').value.trim();
  const n = parseFloat(price.replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
  const old_price = document.getElementById('pf-old-price').value.trim();
  const badge = document.getElementById('pf-badge').value;
  const colors = parseInt(document.getElementById('pf-colors').value) || 1;
  const d = document.getElementById('pf-depts').value.split(',').map(s => s.trim()).filter(Boolean);
  const dots = document.getElementById('pf-dots').value.split(',').map(s => s.trim()).filter(Boolean);
  const rating = document.getElementById('pf-rating').value.trim() || '0';
  const reviews = parseInt(document.getElementById('pf-reviews').value) || 0;
  const image_url = document.getElementById('pf-image').value.trim();

  const payload = { name, cat, price, n, old_price, badge, colors, d, dots, rating, reviews, image_url };

  if (id) {
    const { error } = await supabase.from('products').update(payload).eq('id', id);
    if (error) { alert('Erreur lors de la modification: ' + error.message); return; }
  } else {
    const { error } = await supabase.from('products').insert(payload);
    if (error) { alert('Erreur lors de l\'ajout: ' + error.message); return; }
  }
  closeProductModal();
  await loadAdminProducts();
  await loadProducts();
}

async function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { alert('Erreur: ' + error.message); return; }
  await loadAdminProducts();
  await loadProducts();
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
    errEl.textContent = 'Courriel ou mot de passe incorrect.';
    errEl.style.display = 'block';
    return;
  }
  state.session = data.session;
  location.hash = '#/admin';
  await loadAdminProducts();
  render();
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

  const newBtn = document.getElementById('new-product-btn');
  if (newBtn) newBtn.addEventListener('click', () => openProductModal(null));

  document.querySelectorAll('.admin-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = state.adminProducts.find(x => x.id === btn.dataset.id);
      if (p) openProductModal(p);
    });
  });
  document.querySelectorAll('.admin-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });

  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', closeProductModal);
  const modalCancel = document.getElementById('modal-cancel');
  if (modalCancel) modalCancel.addEventListener('click', closeProductModal);
  const productForm = document.getElementById('product-form');
  if (productForm) productForm.addEventListener('submit', saveProduct);

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
