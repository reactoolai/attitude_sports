import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Top 15 most common UA color codes (covers ~90% of products)
const COLOR_CODES = [
  '001', '002', '003', '004', '005', '006', '010', '011', '012',
  '100', '101', '102', '291', '390', '400', '401', '402', '403',
  '404', '405', '406', '408', '409', '410', '411', '419', '420',
  '422', '424', '425', '430', '470', '504', '600', '601', '602',
  '603', '604', '605', '609', '640', '660', '680', '690', '703',
  '705', '709', '711', '731', '781', '800', '808', '810', '811',
  '891', '911',
];

const VIEWS = ['FC', 'BC', 'LOGO'];

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
    return res.status === 200;
  } catch { return false; }
}

async function findImagesForProduct(numref) {
  // Check all color FC views in parallel (one batch)
  const checks = await Promise.all(
    COLOR_CODES.map(async color => {
      const url = `https://underarmour.scene7.com/is/image/Underarmour/V5-${numref}-${color}_FC?rp=standard-0pad%7Cpdp&qlt=85&bgc=f0f0f0&wid=800&hei=1000&op_usm=1.75%2C0.3%2C2%2C0`;
      const exists = await checkUrl(url);
      return exists ? color : null;
    })
  );
  const foundColors = checks.filter(c => c !== null);
  if (foundColors.length === 0) return [];

  // Collect all views for found colors in parallel
  const viewChecks = await Promise.all(
    foundColors.flatMap(color =>
      VIEWS.map(async view => {
        const url = `https://underarmour.scene7.com/is/image/Underarmour/V5-${numref}-${color}_${view}?rp=standard-0pad%7Cpdp&qlt=85&bgc=f0f0f0&wid=800&hei=1000&op_usm=1.75%2C0.3%2C2%2C0`;
        const exists = await checkUrl(url);
        return exists ? { color, view, url } : null;
      })
    )
  );
  return viewChecks.filter(v => v !== null);
}

async function main() {
  const { data: products } = await supabase
    .from('products')
    .select('id, numref, name, supplier')
    .not('numref', 'is', null)
    .order('numref');

  const { data: existingImages } = await supabase
    .from('product_images')
    .select('numref')
    .not('numref', 'is', null);

  const existingNumrefs = new Set((existingImages || []).map(i => i.numref));
  const missing = products.filter(p => !existingNumrefs.has(p.numref));

  const uaProducts = missing.filter(p => p.supplier === 'UNDER ARMOUR').sort((a, b) => a.numref.localeCompare(b.numref));
  console.log(`Processing ${uaProducts.length} Under Armour products...`);

  const results = [];
  // Process 5 products in parallel
  const PARALLEL = 5;
  for (let i = 0; i < uaProducts.length; i += PARALLEL) {
    const batch = uaProducts.slice(i, i + PARALLEL);
    const batchResults = await Promise.all(
      batch.map(async p => {
        const images = await findImagesForProduct(p.numref);
        console.log(`  [${i + batch.indexOf(p) + 1}/${uaProducts.length}] ${p.numref} (${p.name}): ${images.length} images`);
        return { product: p, images };
      })
    );
    results.push(...batchResults);
  }

  writeFileSync('scripts/ua_image_results.json', JSON.stringify(results, null, 2));
  const withImages = results.filter(r => r.images.length > 0);
  console.log(`\nProducts with images: ${withImages.length} / ${uaProducts.length}`);
  console.log(`Total images: ${withImages.reduce((s, r) => s + r.images.length, 0)}`);
}

main().catch(console.error);
