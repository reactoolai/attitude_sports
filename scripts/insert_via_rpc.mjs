import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const results = JSON.parse(readFileSync('scripts/ua_image_results.json', 'utf-8'));

const viewOrder = { FC: 0, BC: 1, LOGO: 2 };
const allRows = [];

for (const { product, images } of results) {
  if (!images || images.length === 0) continue;
  const sorted = [...images].sort((a, b) => {
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return (viewOrder[a.view] || 9) - (viewOrder[b.view] || 9);
  });
  sorted.forEach((img, idx) => {
    allRows.push({
      product_id: product.id,
      numref: product.numref,
      image_number: idx + 1,
      filename: `ua_${product.numref}_${img.color}_${img.view}.jpg`,
      image_url: img.url,
    });
  });
}

console.log(`Total rows to insert: ${allRows.length}`);

const BATCH = 100;
let totalInserted = 0;

async function main() {
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { data, error } = await supabase.rpc('insert_product_images_batch', {
      images: batch,
    });
    if (error) {
      console.error(`Batch ${i}-${i + BATCH}: ${error.message}`);
    } else {
      totalInserted += data || 0;
      if ((i / BATCH) % 5 === 0) {
        console.log(`  Progress: ${i + batch.length}/${allRows.length}, inserted: ${totalInserted}`);
      }
    }
  }
  console.log(`\nDone! Total inserted: ${totalInserted}`);
}

main().catch(console.error);
