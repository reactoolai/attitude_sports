import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Load .env manually
try {
  const env = readFileSync('.env', 'utf-8');
  for (const line of env.split('\n')) {
    const m = line.match(/^(\w+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
} catch {}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[prerender] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY, skipping prerender');
  process.exit(0);
}

const supabase = createClient(url, key);
const DIST = join(process.cwd(), 'dist');
const BASE_URL = 'https://attitudesport.ca';

function slugify(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function productUrl(p) {
  return `/produit/${(p.numref || 'produit').replace(/[^a-zA-Z0-9.-]/g, '')}-${slugify(p.name)}`;
}

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function truncate(s, n) {
  return (s || '').slice(0, n);
}

function buildProductMeta(p, firstImg, firstSku) {
  const rawPrice = firstSku?.price || p.price || '';
  const price = rawPrice ? parseFloat(rawPrice).toFixed(2) : '';
  const desc = truncate(p.description_fr || p.description_web || p.description_en || '', 155);
  const imgUrl = firstImg?.image_url || '';
  const absImgUrl = imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`;
  const slug = productUrl(p);
  const canonicalUrl = `${BASE_URL}${slug}`;
  const totalStock = 0; // Can't compute without all SKUs here
  const availability = 'https://schema.org/InStock';

  const title = `${p.name || 'Produit'} — ${p.supplier || 'Attitude Sports'} | Attitude Sports`;

  return `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}${price ? ' — ' + price + ' $ CAD' : ''}. Réf. ${escapeHtml(p.numref || '')}.">
<link rel="canonical" href="${canonicalUrl}">
<meta property="og:type" content="product">
<meta property="og:title" content="${escapeHtml(p.name || '')} — ${escapeHtml(p.supplier || '')}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonicalUrl}">
<meta property="og:image" content="${absImgUrl}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="1200">
<meta property="product:price:amount" content="${price}">
<meta property="product:price:currency" content="CAD">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(p.name || '')} — ${escapeHtml(p.supplier || '')}">
<meta name="twitter:description" content="${escapeHtml(desc)}">
<meta name="twitter:image" content="${absImgUrl}">
<script type="application/ld+json" id="product-jsonld">
{"@context":"https://schema.org","@type":"Product","name":${JSON.stringify(p.name || '')},"sku":${JSON.stringify(p.numref || '')},"brand":{"@type":"Brand","name":${JSON.stringify(p.supplier || 'Attitude Sports')}},"description":${JSON.stringify(desc)},"image":${JSON.stringify(absImgUrl)},"url":${JSON.stringify(canonicalUrl)},"offers":{"@type":"Offer","price":"${price || '0'}","priceCurrency":"CAD","availability":"${availability}","url":${JSON.stringify(canonicalUrl)}}}
</script>
<script type="application/ld+json" id="breadcrumb-jsonld">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Accueil","item":"${BASE_URL}/"},{"@type":"ListItem","position":2,"name":${JSON.stringify(p.category || 'Produits')},"item":"${BASE_URL}/${(p.category || '').toLowerCase()}"},{"@type":"ListItem","position":3,"name":${JSON.stringify(p.name || '')},"item":${JSON.stringify(canonicalUrl)}}]}
</script>
`;
}

function buildPageMeta(title, desc, path) {
  const canonical = `${BASE_URL}${path}`;
  return `
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary_large_image">
`;
}

async function fetchAll(query) {
  const all = [];
  let offset = 0;
  while (true) {
    const { data, error } = await query.range(offset, offset + 999);
    if (error) { console.error('fetchAll error:', error); break; }
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return all;
}

async function main() {
  // Read the built index.html
  const indexPath = join(DIST, 'index.html');
  if (!existsSync(indexPath)) {
    console.warn('[prerender] dist/index.html not found, skipping');
    return;
  }
  const indexHtml = readFileSync(indexPath, 'utf-8');

  // Fetch all products + images + SKUs
  console.log('[prerender] Fetching products...');
  const [products, images, skus] = await Promise.all([
    fetchAll(supabase.from('products').select('id,numref,name,supplier,category,department,description_fr,description_web,description_en,price,season').order('created_at', { ascending: false })),
    fetchAll(supabase.from('product_images').select('numref,image_url,image_number').eq('deleted', false)),
    fetchAll(supabase.from('skus').select('product_id,price,quantity')),
  ]);

  console.log(`[prerender] ${products.length} products, ${images.length} images, ${skus.length} SKUs`);

  // Build sitemap
  const staticPages = ['/', '/hommes', '/femmes', '/enfants', '/unisexe', '/chaussures', '/a-propos', '/nous-joindre'];
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  for (const p of staticPages) {
    sitemap += `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq><priority>${p === '/' ? '1.0' : '0.8'}</priority></url>\n`;
  }
  for (const p of products) {
    if (!p.numref) continue;
    const slug = productUrl(p);
    sitemap += `  <url><loc>${BASE_URL}${slug}</loc><changefreq>weekly</changefreq><priority>0.6</priority></url>\n`;
  }
  sitemap += '</urlset>\n';
  writeFileSync(join(DIST, 'sitemap.xml'), sitemap);
  console.log('[prerender] sitemap.xml written');

  // robots.txt
  const robots = `User-agent: *\nDisallow: /admin\nDisallow: /connexion\nDisallow: /commande\n\nSitemap: ${BASE_URL}/sitemap.xml\n`;
  writeFileSync(join(DIST, 'robots.txt'), robots);
  console.log('[prerender] robots.txt written');

  // Prerender static pages
  const staticMeta = {
    '/': { title: 'Attitude Sports — Vêtements et chaussures de sport à Alma', desc: 'Attitude Sports : vêtements et chaussures de sport pour toute la famille. Under Armour, PUMA, SAXX, BOGS et plus. Livraison 25 $, gratuite dès 200 $.' },
    '/hommes': { title: 'Hommes — Attitude Sports', desc: 'Vêtements et chaussures de sport pour hommes. Under Armour, PUMA, SAXX et plus.' },
    '/femmes': { title: 'Femmes — Attitude Sports', desc: 'Vêtements et chaussures de sport pour femmes. Under Armour, PUMA et plus.' },
    '/enfants': { title: 'Enfants — Attitude Sports', desc: 'Vêtements et chaussures de sport pour enfants.' },
    '/unisexe': { title: 'Unisexe — Attitude Sports', desc: 'Vêtements et accessoires de sport unisexe.' },
    '/chaussures': { title: 'Chaussures — Attitude Sports', desc: 'Chaussures de sport pour toute la famille.' },
    '/a-propos': { title: 'À propos — Attitude Sports', desc: 'Attitude Sports, votre destination de choix pour les vêtements et chaussures de sport à Alma.' },
    '/nous-joindre': { title: 'Nous joindre — Attitude Sports', desc: 'Contactez Attitude Sports. Adresse, téléphone, heures d\'ouverture et courriel.' },
  };

  for (const [path, meta] of Object.entries(staticMeta)) {
    const dir = join(DIST, path === '/' ? '' : path);
    if (path !== '/') mkdirSync(dir, { recursive: true });
    const html = indexHtml.replace('<!--SEO-->', buildPageMeta(meta.title, meta.desc, path));
    writeFileSync(join(dir === DIST ? DIST : dir, 'index.html'), html);
  }
  console.log('[prerender] Static pages prerendered');

  // Prerender product pages
  let count = 0;
  for (const p of products) {
    if (!p.numref) continue;
    const slug = productUrl(p);
    const prodImgs = images.filter(i => i.numref === p.numref).sort((a, b) => (a.image_number || 1) - (b.image_number || 1));
    const prodSkus = skus.filter(s => s.product_id === p.id);
    const firstSku = prodSkus[0] || {};
    const meta = buildProductMeta(p, prodImgs[0], firstSku);
    const dir = join(DIST, slug);
    mkdirSync(dir, { recursive: true });
    const html = indexHtml.replace('<!--SEO-->', meta);
    writeFileSync(join(dir, 'index.html'), html);
    count++;
  }
  console.log(`[prerender] ${count} product pages prerendered`);
  console.log('[prerender] Done!');
}

main().catch(err => { console.error('[prerender] Error:', err); process.exit(1); });
