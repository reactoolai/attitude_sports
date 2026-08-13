import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) envVars[match[1].trim()] = match[2].trim();
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

const SHOE_IMAGES = [
  'https://images.pexels.com/photos/260044/pexels-photo-260044.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8454904/pexels-photo-8454904.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7880182/pexels-photo-7880182.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8456072/pexels-photo-8456072.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8454901/pexels-photo-8454901.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const WOMEN_SPORT_IMAGES = [
  'https://images.pexels.com/photos/16701762/pexels-photo-16701762.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/14174571/pexels-photo-14174571.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5992692/pexels-photo-5992692.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/28774695/pexels-photo-28774695.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const KIDS_IMAGES = [
  'https://images.pexels.com/photos/8224681/pexels-photo-8224681.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8224537/pexels-photo-8224537.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/30637221/pexels-photo-30637221.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/7201565/pexels-photo-7201565.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/30637220/pexels-photo-30637220.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const TSHIRT_IMAGES = [
  'https://images.pexels.com/photos/28843615/pexels-photo-28843615.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/28843617/pexels-photo-28843617.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/34894401/pexels-photo-34894401.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/8068701/pexels-photo-8068701.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const HOODIE_IMAGES = [
  'https://images.pexels.com/photos/4662564/pexels-photo-4662564.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/20763010/pexels-photo-20763010.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5198384/pexels-photo-5198384.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/31052880/pexels-photo-31052880.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const SHORTS_IMAGES = [
  'https://images.pexels.com/photos/29346389/pexels-photo-29346389.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/5384602/pexels-photo-5384602.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  'https://images.pexels.com/photos/29205081/pexels-photo-29205081.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
];

const products = [
  { id: '7532556e-0044-446c-a909-ba3c120d9967', name: 'T-shirt AS-Dry Performance', images: TSHIRT_IMAGES },
  { id: '17172e26-e443-4eb1-949e-8c031af99613', name: 'Débardeur Cadence', images: TSHIRT_IMAGES },
  { id: 'c1226c4d-7b8d-4aa6-b7d0-0313f05eab5c', name: 'Manches longues Thermo', images: TSHIRT_IMAGES },
  { id: '791c15f9-8ae0-4ef8-9161-ae641bfec3f4', name: 'Chandail à capuchon Fortitude', images: HOODIE_IMAGES },
  { id: '02c831a9-49b0-4afd-baa8-f9b61596d356', name: 'T-shirt graphique AS', images: TSHIRT_IMAGES },
  { id: '4dcc5575-25c5-4f72-8ea7-baeb062c7efb', name: 'Polo Précision', images: TSHIRT_IMAGES },
  { id: '13a3237a-10b3-43df-888c-9fdb671eb386', name: 'Legging Momentum 7/8', images: WOMEN_SPORT_IMAGES },
  { id: 'b1d72068-a9a9-4486-b774-70583d7b99c3', name: 'Brassière Impulsion', images: WOMEN_SPORT_IMAGES },
  { id: 'dd944970-24b3-4527-a56f-669dd14576ab', name: 'Short Élan 2-en-1', images: SHORTS_IMAGES },
  { id: '17a49238-4ce0-4450-b22a-e25d08c69527', name: 'Veste Tempo', images: HOODIE_IMAGES },
  { id: '7c9a7df1-3d9c-4156-b49e-b200fd3eca3a', name: 'T-shirt Mini Attitude', images: KIDS_IMAGES },
  { id: 'f0dfbd68-1638-4e19-8039-a2dfd1653640', name: 'Ensemble molleton Junior', images: KIDS_IMAGES },
  { id: '5a367e47-979c-4e62-a9f7-ec18ea9340bf', name: "Short d'équipe Junior", images: KIDS_IMAGES },
  { id: 'a1a90cff-cacf-46c4-96b4-090c6e24881a', name: 'Chaussure Vitesse 3', images: SHOE_IMAGES },
  { id: '5650be82-2c35-43ab-bdb9-2c82e747c7b4', name: 'Chaussure Fondation TR', images: SHOE_IMAGES },
  { id: '1505559a-04f3-4e51-ac61-cd622ae3fa77', name: 'Chaussure Verdict Court', images: SHOE_IMAGES },
];

async function main() {
  const allRows = [];
  for (const p of products) {
    p.images.forEach((url, idx) => {
      allRows.push({
        product_id: p.id,
        numref: `CUSTOM-${p.id.substring(0, 8)}`,
        image_number: idx + 1,
        filename: `pexels_${p.id}_${idx + 1}.jpg`,
        image_url: url,
      });
    });
  }

  console.log(`Inserting ${allRows.length} images for ${products.length} products`);

  const { data, error } = await supabase.rpc('insert_product_images_batch', {
    images: allRows,
  });
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log(`Inserted: ${data}`);
  }
}

main().catch(console.error);
