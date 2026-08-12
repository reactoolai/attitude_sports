// Données produits et départements — Attitude Sports
export const COLORS = { K: '#16161A', O: '#FF5A1F', S: '#2E2E34', G: '#9C9CA4', W: '#F2F0EB' };
const { K, O, G, W } = COLORS;

export const DEPTS = {
  hommes: { label: 'Hommes', sub: 'Entraînement, course et mode de vie — bâti pour la performance.', cats: ['T-shirts', 'Chandails à capuchon', 'Shorts', 'Pantalons', 'Accessoires'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] },
  femmes: { label: 'Femmes', sub: 'Du studio à la rue : leggings, brassières, vestes et plus.', cats: ['Leggings', 'Brassières', 'T-shirts', 'Chandails', 'Accessoires'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
  enfants: { label: 'Enfants', sub: 'Pour bouger, grandir et tout donner.', cats: ['Garçons', 'Filles', "Vêtements d'équipe", 'Accessoires'], sizes: ['XS (5-6)', 'S (7-8)', 'M (10-12)', 'L (14-16)', 'XL (18-20)'] },
  chaussures: { label: 'Chaussures', sub: 'Course, entraînement, basketball — trouve ta pointure.', cats: ['Course', 'Entraînement', 'Basketball', 'Mode de vie'], sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12', '13'] },
  outlet: { label: 'Outlet', sub: "Jusqu'à 50 % de rabais sur une sélection d'articles. Quantités limitées.", cats: ['Hommes', 'Femmes', 'Enfants', 'Chaussures'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
};

export const PRODUCTS = [
  { name: 'T-shirt AS-Dry Performance', cat: 'Entraînement', colors: 4, price: '34,99 $', n: 34.99, oldPrice: '', badge: 'Nouveau', d: ['hommes'], rating: '4.7', reviews: 128, dots: [K, W, O] },
  { name: 'Débardeur Cadence', cat: 'Course', colors: 3, price: '29,99 $', n: 29.99, oldPrice: '', badge: '', d: ['hommes'], rating: '4.5', reviews: 64, dots: [K, G] },
  { name: 'Manches longues Thermo', cat: 'Entraînement', colors: 2, price: '44,99 $', n: 44.99, oldPrice: '', badge: '', d: ['hommes'], rating: '4.6', reviews: 87, dots: [K, '#2E2E34'] },
  { name: 'Chandail à capuchon Fortitude', cat: 'Mode de vie', colors: 5, price: '79,99 $', n: 79.99, oldPrice: '', badge: 'Nouveau', d: ['hommes', 'femmes'], rating: '4.8', reviews: 214, dots: [K, G, O, W] },
  { name: 'T-shirt graphique AS', cat: 'Mode de vie', colors: 3, price: '24,99 $', n: 24.99, oldPrice: '32,99 $', badge: 'Solde', d: ['hommes', 'outlet'], rating: '4.4', reviews: 96, dots: [K, W, O] },
  { name: 'Polo Précision', cat: 'Golf', colors: 2, price: '54,99 $', n: 54.99, oldPrice: '', badge: '', d: ['hommes'], rating: '4.6', reviews: 41, dots: [K, W] },
  { name: 'Legging Momentum 7/8', cat: 'Course', colors: 4, price: '64,99 $', n: 64.99, oldPrice: '', badge: 'Nouveau', d: ['femmes'], rating: '4.9', reviews: 302, dots: [K, G, O] },
  { name: 'Brassière Impulsion', cat: 'Entraînement', colors: 3, price: '39,99 $', n: 39.99, oldPrice: '', badge: '', d: ['femmes'], rating: '4.7', reviews: 156, dots: [K, W, O] },
  { name: 'Short Élan 2-en-1', cat: 'Course', colors: 2, price: '49,99 $', n: 49.99, oldPrice: '59,99 $', badge: 'Solde', d: ['femmes', 'outlet'], rating: '4.5', reviews: 73, dots: [K, G] },
  { name: 'Veste Tempo', cat: 'Course', colors: 2, price: '89,99 $', n: 89.99, oldPrice: '', badge: '', d: ['femmes'], rating: '4.8', reviews: 58, dots: [K, O] },
  { name: 'T-shirt Mini Attitude', cat: 'Mode de vie', colors: 3, price: '19,99 $', n: 19.99, oldPrice: '', badge: '', d: ['enfants'], rating: '4.6', reviews: 44, dots: [K, O, W] },
  { name: 'Ensemble molleton Junior', cat: 'Mode de vie', colors: 2, price: '59,99 $', n: 59.99, oldPrice: '74,99 $', badge: 'Solde', d: ['enfants', 'outlet'], rating: '4.7', reviews: 39, dots: [K, G] },
  { name: "Short d'équipe Junior", cat: 'Entraînement', colors: 4, price: '24,99 $', n: 24.99, oldPrice: '', badge: 'Nouveau', d: ['enfants'], rating: '4.5', reviews: 27, dots: [K, G, O, W] },
  { name: 'Chaussure Vitesse 3', cat: 'Course', colors: 3, price: '129,99 $', n: 129.99, oldPrice: '', badge: 'Nouveau', d: ['chaussures', 'hommes'], rating: '4.8', reviews: 187, dots: [K, W, O] },
  { name: 'Chaussure Fondation TR', cat: 'Entraînement', colors: 2, price: '109,99 $', n: 109.99, oldPrice: '', badge: '', d: ['chaussures'], rating: '4.6', reviews: 92, dots: [K, G] },
  { name: 'Chaussure Verdict Court', cat: 'Basketball', colors: 2, price: '139,99 $', n: 139.99, oldPrice: '169,99 $', badge: 'Solde', d: ['chaussures', 'outlet'], rating: '4.7', reviews: 115, dots: [K, O] },
];

export const FITS = ['Ajustée', 'Régulière', 'Ample'];
export const TECHS = ['AS-Dry', 'Thermo', 'Sans coutures', 'Anti-odeur'];
export const DISCOUNTS = ['20 % et plus', '30 % et plus', '50 % et plus'];
export const RATINGS = ['4 étoiles et plus', '3 étoiles et plus'];

export const NEW_ARRIVALS = PRODUCTS.filter(p => ['T-shirt AS-Dry Performance', 'Legging Momentum 7/8', 'Chandail à capuchon Fortitude', 'Chaussure Vitesse 3'].includes(p.name));

export const BENEFITS = [
  { t: 'Livraison gratuite à partir de 150 $', d: 'Partout au Canada, en 2 à 5 jours ouvrables.' },
  { t: 'Retours sous 60 jours', d: 'En ligne ou en boutique, sans tracas.' },
  { t: "Conseils d'experts", d: 'Notre équipe pratique ce qu\'elle vend.' },
];

export const FOOTER_COLS = [
  { t: 'Magasiner', links: ['Hommes', 'Femmes', 'Enfants', 'Chaussures', 'Outlet'] },
  { t: 'Aide', links: ['Suivi de commande', 'Livraison', 'Retours et échanges', 'Guide des tailles', 'Nous joindre'] },
  { t: 'À propos', links: ['Notre histoire', 'Nos boutiques', 'Carrières', 'Programme équipes'] },
  { t: 'Suivez-nous', links: ['Instagram', 'Facebook', 'TikTok', 'YouTube'] },
];
