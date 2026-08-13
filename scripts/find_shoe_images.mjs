import { tavily } from '@tavily/core';

const client = tavily({ apiKey: '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' });

const shoes = [
  { numref: '3025060', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '3026175', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3026179', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '3026727', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3027000', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3027007', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '3027219', name: 'SANDALE', category: 'HOMME' },
  { numref: '3028256', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3028262', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '3028296', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3028408', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '3028409', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '3028486', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '6000760', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '6005798', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '6006724', name: 'ESPADRILLE', category: 'FEMME' },
  { numref: '6007140', name: 'ESPADRILLE', category: 'HOMME' },
  { numref: '6007532', name: 'SANDALE', category: 'FEMME' },
  { numref: '6007537', name: 'SANDALE', category: 'GARCON' },
  { numref: '6007538', name: 'SANDALE', category: 'FILLE' },
  { numref: '6009366', name: 'SANDALE', category: 'HOMME' },
  { numref: '73455', name: 'CROC', category: 'UNISEXE' },
];

const results = [];

for (const shoe of shoes) {
  const query = `under armour ${shoe.numref} ${shoe.name} ${shoe.category} canada`;
  try {
    const res = await client.search(query, {
      searchDepth: 'advanced',
      maxResults: 5,
      includeImages: true,
      includeImageDescriptors: true,
    });

    let imageUrl = null;

    // Check images array first
    if (res.images && res.images.length > 0) {
      imageUrl = res.images[0].url;
    }

    // Also check results for image URLs in content
    if (!imageUrl && res.results) {
      for (const r of res.results) {
        const urlMatch = r.url || '';
        // Look for product pages with images
        if (urlMatch.includes('underarmour.com') || urlMatch.includes('clement.ca') || urlMatch.includes('sportsexperts.ca') || urlMatch.includes('sourceforsports.ca')) {
          // Try to extract image from the page content
          const content = r.content || '';
          const imgMatch = content.match(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/i);
          if (imgMatch) {
            imageUrl = imgMatch[0];
            break;
          }
        }
      }
    }

    if (imageUrl) {
      console.log(`FOUND\t${shoe.numref}\t${imageUrl}`);
      results.push({ numref: shoe.numref, image_url: imageUrl });
    } else {
      console.log(`NONE\t${shoe.numref}`);
      // Print what we got for debugging
      if (res.results) {
        for (const r of res.results.slice(0, 2)) {
          console.log(`  -> ${r.url}`);
        }
      }
    }
  } catch (e) {
    console.log(`ERR\t${shoe.numref}\t${e.message}`);
  }

  // Small delay to avoid rate limiting
  await new Promise(r => setTimeout(r, 500));
}

console.log('\n--- JSON RESULTS ---');
console.log(JSON.stringify(results, null, 2));
