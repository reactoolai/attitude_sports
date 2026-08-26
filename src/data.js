export const DEPTS = {
  hommes: { label: 'Hommes', sub: 'Performance et style pour tous les terrains.', cats: ['HOMME'], sizes: ['XS','S','M','L','XL','XXL'] },
  femmes: { label: 'Femmes', sub: 'Bouge avec assurance et liberté.', cats: ['FEMME'], sizes: ['XS','S','M','L','XL'] },
  enfants: { label: 'Enfants', sub: 'Prêts pour l\'aventure.', cats: ['GARCON','FILLE'], sizes: ['4-5','6-7','8-9','10-11','12-13'] },
  unisexe: { label: 'Unisexe', sub: 'Pour tout le monde, sans compromis.', cats: ['UNISEXE'], sizes: ['XS','S','M','L','XL','XXL'] },
  chaussures: { label: 'Chaussures', sub: 'Trouve ta pointure.', cats: ['CHAUSSURE'], sizes: [] },
};

export const DISCOUNTS = ['20 % et plus', '30 % et plus', '50 % et plus'];
export const RATINGS = ['4 étoiles et plus', '3 étoiles et plus'];

export const BENEFITS = [
  { t: 'Livraison gratuite à partir de 200 $', d: 'Partout au Canada, en 2 à 5 jours ouvrables.' },
  { t: "Conseils d'experts", d: 'Notre équipe pratique ce qu\'elle vend.' },
  { t: 'Ramassage en boutique', d: 'Commandez en ligne, récupérez en magasin.' },
];

export const FOOTER_COLS = [
  { t: 'Magasiner', links: [
    { label: 'Hommes', href: '/hommes', internal: true },
    { label: 'Femmes', href: '/femmes', internal: true },
    { label: 'Enfants', href: '/enfants', internal: true },
    { label: 'Unisexe', href: '/unisexe', internal: true },
    { label: 'Chaussures', href: '/chaussures', internal: true },
  ]},
  { t: 'Aide', links: [
    { label: 'Nous joindre', href: '/nous-joindre', internal: true },
    { label: 'Notre histoire', href: '/a-propos', internal: true },
  ]},
  { t: 'Suivez-nous', links: [
    { label: 'Facebook', href: 'https://www.facebook.com/p/Attitude-Sports-61575319387545/', internal: false },
    { label: 'Instagram', href: 'https://www.instagram.com/', internal: false },
  ]},
];

export const FITS = [
  { t: 'Compression ajustée', d: 'Soutien musculaire et récupération plus rapide.' },
  { t: 'Séchage rapide', d: 'Tissu AS-Dry qui évacue la transpiration.' },
  { t: 'Coutures plates', d: 'Moins d\'irritation, plus de confort.' },
];

export const TECHS = [
  { t: 'AS-Dry', d: 'Évacuation de l\'humidité' },
  { t: 'AS-Warm', d: 'Isolation thermique légère' },
  { t: 'AS-Shield', d: 'Traitement anti-odeurs' },
  { t: 'AS-Flex', d: 'Élasticité 4 directions' },
];

export const BOUTIQUE_INFO = {
  email: 'info@lechoixdesophie.com',
  phone: 'À CONFIRMER',
  address: 'À CONFIRMER',
  hours: 'À CONFIRMER',
  facebook: 'https://www.facebook.com/p/Attitude-Sports-61575319387545/',
};

export const THREE_SHOPS = [
  { name: 'Attitude Sports', desc: 'Vêtements et chaussures de sport pour toute la famille — performance, confort et style au quotidien.', logo: '/images/logos/attitudesport-logo.png', href: '/', internal: true, current: true },
  { name: 'Le Choix de Sophie', desc: 'Mode féminine à Alma — des pièces choisies une à une, du chic décontracté au glamour urbain.', logo: '/images/logos/lechoixdesophie-logo.jpg', href: 'https://lechoixdesophie.com', internal: false },
  { name: 'Le Mercier Alma', desc: 'Mercerie pour homme à Alma — chemises, costumes, polos et accessoires de marques sélectionnées, avec ajustements sur mesure en boutique.', logo: '/images/logos/lemercier-logo.jpg', href: 'https://lemercieralma.com', internal: false },
];
