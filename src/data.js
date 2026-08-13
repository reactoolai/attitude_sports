// Données produits et départements — Attitude Sports
export const COLORS = { K: '#16161A', O: '#FF5A1F', S: '#2E2E34', G: '#9C9CA4', W: '#F2F0EB' };
const { K, O, G, W } = COLORS;

export const DEPTS = {
  hommes: { label: 'Hommes', sub: 'Entraînement, course et mode de vie — bâti pour la performance.', cats: ['T-shirts', 'Chandails à capuchon', 'Shorts', 'Pantalons', 'Accessoires'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] },
  femmes: { label: 'Femmes', sub: 'Du studio à la rue : leggings, brassières, vestes et plus.', cats: ['Leggings', 'Brassières', 'T-shirts', 'Chandails', 'Accessoires'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
  enfants: { label: 'Enfants', sub: 'Pour bouger, grandir et tout donner.', cats: ['Garçons', 'Filles', "Vêtements d'équipe", 'Accessoires'], sizes: ['XS (5-6)', 'S (7-8)', 'M (10-12)', 'L (14-16)', 'XL (18-20)'] },
  chaussures: { label: 'Chaussures', sub: 'Course, entraînement, basketball — trouve ta pointure.', cats: ['Course', 'Entraînement', 'Basketball', 'Mode de vie'], sizes: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12', '13'] },
  unisexe: { label: 'Unisexe', sub: 'Des essentiels pour tous, sans compromis.', cats: ['Chandails', 'Accessoires', 'Casquettes', 'Sacs'], sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
};

export const FITS = ['Ajustée', 'Régulière', 'Ample'];
export const TECHS = ['AS-Dry', 'Thermo', 'Sans coutures', 'Anti-odeur'];
export const DISCOUNTS = ['20 % et plus', '30 % et plus', '50 % et plus'];
export const RATINGS = ['4 étoiles et plus', '3 étoiles et plus'];

export const BENEFITS = [
  { t: 'Livraison gratuite à partir de 150 $', d: 'Partout au Canada, en 2 à 5 jours ouvrables.' },
  { t: 'Retours sous 60 jours', d: 'En ligne ou en boutique, sans tracas.' },
  { t: "Conseils d'experts", d: 'Notre équipe pratique ce qu\'elle vend.' },
];

export const FOOTER_COLS = [
  { t: 'Magasiner', links: ['Hommes', 'Femmes', 'Enfants', 'Unisexe', 'Chaussures'] },
  { t: 'Aide', links: ['Suivi de commande', 'Livraison', 'Retours et échanges', 'Guide des tailles', 'Nous joindre'] },
  { t: 'À propos', links: ['Notre histoire', 'Nos boutiques', 'Carrières', 'Programme équipes'] },
  { t: 'Suivez-nous', links: ['Instagram', 'Facebook', 'TikTok', 'YouTube'] },
];
