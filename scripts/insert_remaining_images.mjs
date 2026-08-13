import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Pexels images by category
const POLO_IMAGES = [
  'https://images.pexels.com/photos/28843617/pexels-photo-28843617.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/34894401/pexels-photo-34894401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17987935/pexels-photo-17987935.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8068701/pexels-photo-8068701.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/6256848/pexels-photo-6256848.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/32130981/pexels-photo-32130981.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5543438/pexels-photo-5543438.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/17987934/pexels-photo-17987934.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const HOODIE_IMAGES = [
  'https://images.pexels.com/photos/4662564/pexels-photo-4662564.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/20763010/pexels-photo-20763010.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5198384/pexels-photo-5198384.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/12606659/pexels-photo-12606659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/31052880/pexels-photo-31052880.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const SHORTS_IMAGES = [
  'https://images.pexels.com/photos/29346389/pexels-photo-29346389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5384602/pexels-photo-5384602.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29205081/pexels-photo-29205081.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

function getImagesForProduct(p) {
  const dept = (p.department || '').toUpperCase();
  if (dept.includes('POLO')) return POLO_IMAGES;
  if (dept.includes('HOODIE') || dept.includes('CHANDAIL')) return HOODIE_IMAGES;
  if (dept.includes('SHORT') || dept.includes('BERMUDA')) return SHORTS_IMAGES;
  if (dept.includes('ACCESSOIRE') || dept.includes('BAS')) return SHORTS_IMAGES;
  return POLO_IMAGES; // default
}

async function main() {
  const { data: products } = await supabase
    .from('products')
    .select('id, numref, name, supplier, category, department')
    .not('numref', 'is', null)
    .order('numref');

  const { data: existingImages } = await supabase
    .from('product_images')
    .select('numref')
    .not('numref', 'is', null);

  const existingNumrefs = new Set((existingImages || []).map(i => i.numref));
  const missing = products.filter(p => !existingNumrefs.has(p.numref) && p.numref);

  console.log(`Products still missing images: ${missing.length}`);
  for (const p of missing) {
    console.log(`  ${p.supplier} ${p.numref} (${p.name}) - ${p.department}`);
  }

  const allRows = [];
  for (const p of missing) {
    const images = getImagesForProduct(p);
    images.forEach((url, idx) => {
      allRows.push({
        product_id: p.id,
        numref: p.numref,
        image_number: idx + 1,
        filename: `pexels_${p.numref}_${idx + 1}.jpg`,
        image_url: url,
      });
    });
  }

  console.log(`\nTotal image rows to insert: ${allRows.length}`);

  const BATCH = 100;
  let totalInserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { data, error } = await supabase.rpc('insert_product_images_batch', {
      images: batch,
    });
    if (error) {
      console.error(`Batch error: ${error.message}`);
    } else {
      totalInserted += data || 0;
    }
  }
  console.log(`Inserted: ${totalInserted}`);
}

main().catch(console.error);
