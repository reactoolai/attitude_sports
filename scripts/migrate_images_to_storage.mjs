import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://llzejjwjfmfpkomdbjua.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not found in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const BUCKET = 'product-images';
const CONCURRENCY = 5;
const MAX_RETRIES = 3;

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
      if (resp.ok) return await resp.arrayBuffer();
      console.warn(`  Attempt ${attempt+1}: HTTP ${resp.status} for ${url.substring(0,80)}...`);
    } catch (e) {
      console.warn(`  Attempt ${attempt+1}: ${e.message} for ${url.substring(0,80)}...`);
    }
    await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
  }
  return null;
}

function getContentType(url) {
  const lower = url.toLowerCase();
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  return 'image/jpeg';
}

function getExtension(url) {
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.webp')) return 'webp';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.gif')) return 'gif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpg';
  return 'jpg';
}

async function processImage(img) {
  const { id, numref, image_number, image_url } = img;
  const path = `${numref}/${numref}_${image_number}.${getExtension(image_url)}`;

  // Check if already in storage
  const { data: existing } = await supabase.storage.from(BUCKET).getPublicUrl(path);
  if (existing) {
    // Try to head the file
    try {
      const { data: check } = await supabase.storage.from(BUCKET).download(path);
      if (check) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
        if (image_url === publicUrl) return { status: 'skip', id };
        const { error: upErr } = await supabase.from('product_images').update({ image_url: publicUrl }).eq('id', id);
        if (upErr) console.warn(`  Failed to update DB for ${numref}_${image_number}: ${upErr.message}`);
        return { status: 'exists', id };
      }
    } catch {}
  }

  const buf = await fetchWithRetry(image_url);
  if (!buf) return { status: 'fail', id };

  const contentType = getContentType(image_url);
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
    contentType,
    upsert: true,
  });
  if (upErr) {
    console.warn(`  Upload failed for ${numref}_${image_number}: ${upErr.message}`);
    return { status: 'fail', id };
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
  const { error: dbErr } = await supabase.from('product_images').update({ image_url: publicUrl }).eq('id', id);
  if (dbErr) {
    console.warn(`  DB update failed for ${numref}_${image_number}: ${dbErr.message}`);
    return { status: 'fail', id };
  }

  return { status: 'done', id };
}

async function main() {
  console.log('Fetching external images from database...');
  const { data: images, error } = await supabase
    .from('product_images')
    .select('id,numref,image_number,image_url')
    .eq('deleted', false)
    .or('image_url.like.%scene7.com%,image_url.like.%pexels.com%')
    .order('numref')
    .limit(10000);

  if (error) {
    console.error('DB query error:', error);
    process.exit(1);
  }

  console.log(`Found ${images.length} external images to migrate`);

  let done = 0, failed = 0, skipped = 0;
  const failedList = [];

  // Process in batches
  for (let i = 0; i < images.length; i += CONCURRENCY) {
    const batch = images.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(img => processImage(img)));

    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'done') done++;
      else if (r.status === 'exists' || r.status === 'skip') skipped++;
      else { failed++; failedList.push(batch[j]); }
    }

    const total = i + batch.length;
    console.log(`Progress: ${total}/${images.length} (${done} done, ${skipped} skipped, ${failed} failed)`);

    // Small delay between batches
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nMigration complete: ${done} uploaded, ${skipped} already in storage, ${failed} failed`);
  if (failedList.length > 0) {
    console.log('Failed images:');
    failedList.forEach(f => console.log(`  ${f.numref}_${f.image_number}: ${f.image_url.substring(0, 100)}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
