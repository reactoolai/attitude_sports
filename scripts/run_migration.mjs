const SUPABASE_URL = 'https://llzejjwjfmfpkomdbjua.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsemVqandqZm1mcGtvbWRianVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1NjkwMTIsImV4cCI6MjEwMjE0NTAxMn0.nAGQZRllgvTah_KpZ6F5NAh6Vm2nsaTmqsd2em5WSYg';

const CONCURRENCY = 4;
const BATCH_DELAY = 500;

async function fetchBatch(offset) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/migrate-images?action=list&offset=${offset}`, {
    headers: { 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
  });
  return resp.json();
}

async function migrateOne(img) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/migrate-images?action=migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
    body: JSON.stringify(img),
  });
  const data = await resp.json();
  if (!resp.ok || data.error) throw new Error(data.error || `HTTP ${resp.status}`);
  return data;
}

async function main() {
  let offset = 0;
  let totalDone = 0;
  let totalFailed = 0;
  const failedList = [];

  while (true) {
    console.log(`Fetching batch at offset ${offset}...`);
    const batchData = await fetchBatch(offset);
    const images = batchData.images || [];
    console.log(`  Got ${images.length} images`);

    if (images.length === 0) break;

    for (let i = 0; i < images.length; i += CONCURRENCY) {
      const chunk = images.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(migrateOne));

      for (let j = 0; j < results.length; j++) {
        if (results[j].status === 'fulfilled') {
          totalDone++;
        } else {
          totalFailed++;
          failedList.push({ ...chunk[j], error: results[j].reason?.message });
        }
      }

      const progress = totalDone + totalFailed;
      if (progress % 50 < CONCURRENCY) {
        console.log(`Progress: ${totalDone} done, ${totalFailed} failed`);
      }

      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }

    offset += images.length;
    if (images.length < 1000) break;
  }

  console.log(`\nMigration complete: ${totalDone} uploaded, ${totalFailed} failed`);
  if (failedList.length > 0) {
    console.log('Failed:');
    failedList.slice(0, 20).forEach(f => console.log(`  ${f.numref}_${f.image_number}: ${f.error}`));
    if (failedList.length > 20) console.log(`  ... and ${failedList.length - 20} more`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
