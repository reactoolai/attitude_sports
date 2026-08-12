import './style.css';
import { DEPTS, PRODUCTS, NEW_ARRIVALS, BENEFITS, FOOTER_COLS, FITS, TECHS, DISCOUNTS, RATINGS } from './data.js';

const app = document.getElementById('app');
const state = { sort: 'featured', q: '' };

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
    <a href="#" class="icon" aria-label="Compte" title="Se connecter">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5"/></svg>
    </a>
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
    <span class="ph-label">[ photo produit ]</span>
    ${p.badge ? `<span class="badge ${p.badge === 'Nouveau' ? 'orange' : ''}">${p.badge}</span>` : ''}
  </div>
  <div class="card-body">
    <div class="dots">${p.dots.map(c => `<span style="background:${c}"></span>`).join('')}<em>${p.colors} couleurs</em></div>
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
  <div class="footer-bottom">
    <span>© 2026 Attitude Sports. Tous droits réservés.</span>
    <div><a href="#">Confidentialité</a><a href="#">Conditions</a><a href="#">Accessibilité</a></div>
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
    <div class="grid g4">${NEW_ARRIVALS.map(p => card(p)).join('')}</div>
  </section>
  <section class="split">
    ${ph('visuel — textile technique en gros plan', 'split-ph')}
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

const filterSection = (title, items, type = 'check', accent = false) => `
<div class="filter ${accent ? 'accent' : ''}">
  <div class="filter-title">${title}</div>
  ${type === 'check'
    ? `<div class="filter-list">${items.map(i => `<label><input type="checkbox"> ${i}</label>`).join('')}</div>`
    : `<div class="filter-chips">${items.map(i => `<span class="size">${i}</span>`).join('')}</div>`}
</div>`;

const pagePlp = (deptKey) => {
  const dept = DEPTS[deptKey];
  let products = PRODUCTS.filter(p => p.d.includes(deptKey));
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
        <div class="grid g3">${products.map(p => card(p)).join('')}</div>
        <div class="pagination"><span class="active">1</span><span>2</span><span>3</span><span>→</span></div>
      </div>
    </div>
  </div>
</main>`;
};

const pageSearch = () => {
  const ql = state.q.trim().toLowerCase();
  const results = ql ? PRODUCTS.filter(p => (p.name + ' ' + p.cat).toLowerCase().includes(ql)) : [];
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
    <div class="grid g4">${NEW_ARRIVALS.map(p => card(p, false)).join('')}</div>
  </section>
</main>`;

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
};

function render() {
  const path = location.hash.replace('#', '') || '/';
  const page = routes[path] || pageHome;
  app.innerHTML = promoBar() + header() + page() + footer();
  bind();
  startHeroCycle();
  window.scrollTo(0, 0);
}

function bind() {
  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => {
    state.q = e.target.value;
    if (state.q.trim()) {
      if (location.hash !== '#/recherche') location.hash = '#/recherche';
      else { app.querySelector('main').outerHTML = pageSearch(); }
    } else if (location.hash === '#/recherche') {
      location.hash = '#/';
    }
    const el = document.getElementById('search-input');
    el.focus(); el.setSelectionRange(el.value.length, el.value.length);
  });
  const sort = document.getElementById('sort-select');
  if (sort) sort.addEventListener('change', (e) => { state.sort = e.target.value; render(); });
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
render();
