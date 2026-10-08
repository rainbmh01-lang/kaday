export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  profession: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  badge?: string;
  stock: string;
  summary: string;
  specs: string[];
  color: string;
  icon: string;
  imageUrl?: string;
  images?: string[];
  techSummary?: string;
  productType?: string;
};

export type CatalogLink = {
  slug: string;
  label: string;
  sub: string;
  count: string;
  color: string;
  icon: string;
};

export const categories: CatalogLink[] = [
  { slug: 'outillage-electroportatif', label: 'Outillage électroportatif', sub: 'Perceuses, meuleuses, batteries', count: '214 produits', color: '#f0b83d', icon: 'drill' },
  { slug: 'soudage', label: 'Soudage & brasage', sub: 'Postes, torches, accessoires', count: '86 produits', color: '#d8553d', icon: 'flame' },
  { slug: 'levage-manutention', label: 'Levage & manutention', sub: 'Palan, treuil, chariot', count: '53 produits', color: '#5a7d9c', icon: 'anchor' },
  { slug: 'mesure-detection', label: 'Mesure & détection', sub: 'Lasers, testeurs, niveaux', count: '119 produits', color: '#6c9b73', icon: 'ruler' },
  { slug: 'electricite', label: 'Électricité', sub: 'Câbles, coffrets, éclairage', count: '176 produits', color: '#e5a94d', icon: 'zap' },
  { slug: 'automobile', label: 'Automobile', sub: 'Diagnostic & atelier', count: '72 produits', color: '#75818b', icon: 'car' },
  { slug: 'agriculture-jardin', label: 'Agriculture & jardin', sub: 'Pompes, taille, irrigation', count: '61 produits', color: '#699773', icon: 'sprout' },
  { slug: 'securite', label: 'Sécurité & EPI', sub: 'Protection chantier', count: '48 produits', color: '#d37a45', icon: 'shield' },
];

export const brands = ['CROWN', 'INGCO', 'BEETRO', 'HONESTPRO', 'POWERBLU', 'FIXTOP', 'DINGQI', 'MODE PRO'];

export const professions = [
  { slug: 'macon', label: 'Maçon & chantier', icon: 'hard-hat', count: '182 références' },
  { slug: 'mecanicien', label: 'Mécanicien', icon: 'wrench', count: '146 références' },
  { slug: 'electricien', label: 'Électricien', icon: 'zap', count: '129 références' },
  { slug: 'soudeur', label: 'Soudeur', icon: 'flame', count: '88 références' },
  { slug: 'plombier', label: 'Plombier', icon: 'pipe', count: '74 références' },
  { slug: 'jardinier', label: 'Jardinier & agriculteur', icon: 'sprout', count: '57 références' },
];

export const products: Product[] = [
  {
    id: 'crown-ct38084',
    slug: 'crown-ct38084-perceuse-visseuse',
    name: 'Perceuse-visseuse sans fil 20V CROWN CT38084',
    brand: 'CROWN',
    category: 'outillage-electroportatif',
    categoryLabel: 'Outillage électroportatif',
    profession: 'macon',
    price: 8900,
    oldPrice: 10900,
    rating: 4.8,
    reviews: 38,
    badge: 'PROMO',
    stock: 'En stock',
    summary: 'Un outil compact et endurant pour le vissage quotidien et le perçage chantier.',
    specs: ['Batterie 20V Li-ion', 'Mandrin 10 mm', '2 vitesses mécaniques', '2 batteries incluses'],
    color: '#f1be44',
    icon: 'drill',
    imageUrl: '/images/prod-12.webp',
    productType: 'Perceuse',
  },
  {
    id: 'beetro-hoist-2t',
    slug: 'beetro-palan-electrique-2t',
    name: 'Palan électrique BEETRO 2 tonnes — 6 m',
    brand: 'BEETRO',
    category: 'levage-manutention',
    categoryLabel: 'Levage & manutention',
    profession: 'mecanicien',
    price: 48500,
    rating: 4.7,
    reviews: 21,
    badge: 'ARRIVAGE',
    stock: 'En stock',
    summary: 'Palan robuste pour atelier, garage et opérations de manutention répétées.',
    specs: ['Capacité 2 000 kg', 'Chaîne 6 mètres', 'Télécommande filaire', 'Moteur 1 500 W'],
    color: '#6c879d',
    icon: 'anchor',
    imageUrl: '/images/prod-1.webp',
    productType: 'Palan & levage',
  },
  {
    id: 'ingco-cidli20601',
    slug: 'ingco-visseuse-a-chocs-20v',
    name: 'Visseuse à chocs 20V INGCO CIDLI20601',
    brand: 'INGCO',
    category: 'outillage-electroportatif',
    categoryLabel: 'Outillage électroportatif',
    profession: 'mecanicien',
    price: 15800,
    oldPrice: 17900,
    rating: 4.9,
    reviews: 52,
    badge: 'TOP VENTE',
    stock: 'En stock',
    summary: 'Couple maîtrisé et format court pour le montage, la mécanique et la fixation.',
    specs: ['Couple max. 200 Nm', 'Mandrin 1/4"', 'Moteur brushless', 'Batterie vendue séparément'],
    color: '#e6a83d',
    icon: 'settings',
    imageUrl: '/images/prod-2.webp',
    productType: 'Visseuse',
  },
  {
    id: 'honestpro-laser-4d',
    slug: 'honestpro-niveau-laser-4d',
    name: 'Niveau laser 4D 16 lignes HONESTPRO',
    brand: 'HONESTPRO',
    category: 'mesure-detection',
    categoryLabel: 'Mesure & détection',
    profession: 'electricien',
    price: 23900,
    oldPrice: 27500,
    rating: 4.6,
    reviews: 17,
    badge: 'PROMO',
    stock: 'En stock',
    summary: 'Projection précise pour implantation, pose de cloisons, carrelage et réseaux.',
    specs: ['16 lignes vertes', 'Autonivelant ±3°', 'Portée 30 m', 'Batterie 4000 mAh'],
    color: '#7ca27d',
    icon: 'scan-line',
    imageUrl: '/images/prod-3.webp',
    productType: 'Niveau laser',
  },
  {
    id: 'powerblu-led-100',
    slug: 'powerblu-projecteur-led-100w',
    name: 'Projecteur LED chantier POWERBLU 100W',
    brand: 'POWERBLU',
    category: 'electricite',
    categoryLabel: 'Électricité',
    profession: 'electricien',
    price: 6200,
    oldPrice: 7500,
    rating: 4.5,
    reviews: 44,
    badge: 'PROMO',
    stock: 'En stock',
    summary: 'Lumière puissante et large pour chantier, atelier ou extérieur.',
    specs: ['Puissance 100W', '6500K lumière froide', 'IP65', 'Support orientable'],
    color: '#e4ae3d',
    icon: 'lamp',
    imageUrl: '/images/prod-4.webp',
    productType: 'Éclairage',
  },
  {
    id: 'fixtop-welder-250',
    slug: 'fixtop-poste-a-souder-250a',
    name: 'Poste à souder inverter FIXTOP 250A',
    brand: 'FIXTOP',
    category: 'soudage',
    categoryLabel: 'Soudage & brasage',
    profession: 'soudeur',
    price: 18400,
    rating: 4.7,
    reviews: 29,
    badge: 'ATELIER',
    stock: 'En stock',
    summary: 'Un inverter stable et simple à régler pour l’entretien et la fabrication.',
    specs: ['Intensité 20–250A', 'Électrodes 1.6–4.0 mm', 'Anti-stick', 'Ventilation forcée'],
    color: '#d65a41',
    icon: 'flame',
    imageUrl: '/images/prod-5.webp',
    productType: 'Poste à souder',
  },
  {
    id: 'dingqi-multimeter',
    slug: 'dingqi-multimetre-professionnel',
    name: 'Multimètre digital professionnel DINGQI',
    brand: 'DINGQI',
    category: 'mesure-detection',
    categoryLabel: 'Mesure & détection',
    profession: 'electricien',
    price: 4900,
    rating: 4.4,
    reviews: 15,
    stock: 'En stock',
    summary: 'Mesures fiables et protection renforcée pour diagnostic électrique quotidien.',
    specs: ['6000 points', 'Tension AC/DC', 'Test continuité', 'Étui de protection'],
    color: '#71869c',
    icon: 'activity',
    imageUrl: '/images/prod-6.webp',
    productType: 'Multimètre & mesure',
  },
  {
    id: 'modepro-compressor',
    slug: 'mode-pro-compresseur-50l',
    name: 'Compresseur MODE PRO 50 L — 2.5 HP',
    brand: 'MODE PRO',
    category: 'automobile',
    categoryLabel: 'Automobile',
    profession: 'mecanicien',
    price: 32900,
    oldPrice: 35900,
    rating: 4.6,
    reviews: 12,
    badge: 'ARRIVAGE',
    stock: 'Bientôt disponible',
    summary: 'Réserve d’air polyvalente pour gonflage, nettoyage et outils pneumatiques.',
    specs: ['Cuve 50 litres', 'Moteur 2.5 HP', 'Pression max. 8 bar', 'Roues de transport'],
    color: '#7a8f9d',
    icon: 'gauge',
    imageUrl: '/images/prod-7.webp',
    productType: 'Compresseur',
  },
  {
    id: 'ingco-grinder',
    slug: 'ingco-meuleuse-1400w',
    name: 'Meuleuse d’angle INGCO 1400W',
    brand: 'INGCO',
    category: 'outillage-electroportatif',
    categoryLabel: 'Outillage électroportatif',
    profession: 'soudeur',
    price: 7800,
    oldPrice: 8600,
    rating: 4.8,
    reviews: 31,
    badge: 'TOP VENTE',
    stock: 'En stock',
    summary: 'Une meuleuse fiable pour tronçonnage, ébarbage et préparation des soudures.',
    specs: ['Puissance 1400W', 'Disque 125 mm', 'Démarrage progressif', 'Poignée 3 positions'],
    color: '#d9993b',
    icon: 'circle-dot',
    imageUrl: '/images/prod-8.webp',
    productType: 'Meuleuse',
  },
  {
    id: 'honestpro-scanner',
    slug: 'honestpro-diagnostic-obd2',
    name: 'Valise diagnostic automobile HONESTPRO OBD2',
    brand: 'HONESTPRO',
    category: 'automobile',
    categoryLabel: 'Automobile',
    profession: 'mecanicien',
    price: 21600,
    rating: 4.5,
    reviews: 18,
    stock: 'En stock',
    summary: 'Lecture et effacement des défauts moteur pour atelier et dépannage.',
    specs: ['Écran couleur 5"', 'OBD2 / EOBD', 'Lecture des codes', 'Mises à jour USB'],
    color: '#4d7893',
    icon: 'scan',
    imageUrl: '/images/prod-9.webp',
    productType: 'Diagnostic auto',
  },
  {
    id: 'powerblu-pump',
    slug: 'powerblu-pompe-eau-1-5hp',
    name: 'Pompe à eau POWERBLU 1.5 HP',
    brand: 'POWERBLU',
    category: 'agriculture-jardin',
    categoryLabel: 'Agriculture & jardin',
    profession: 'jardinier',
    price: 14500,
    rating: 4.3,
    reviews: 9,
    stock: 'En stock',
    summary: 'Pour irrigation, transfert d’eau et besoins quotidiens à la ferme.',
    specs: ['Moteur 1.5 HP', 'Débit 30 m³/h', 'Corps fonte', 'Aspiration 8 m'],
    color: '#719b78',
    icon: 'droplets',
    imageUrl: '/images/prod-10.webp',
    productType: 'Pompe à eau',
  },
];

export const formatDzd = (value: number) =>
  `${new Intl.NumberFormat('fr-DZ').format(value)} DA`;

export const findProduct = (slug?: string) => products.find((product) => product.slug === slug);
export const findCategory = (slug?: string) => categories.find((category) => category.slug === slug);
export const findBrand = (brand?: string) => brands.find((item) => item.toLowerCase() === brand?.toLowerCase());
export const findProfession = (slug?: string) => professions.find((item) => item.slug === slug);
