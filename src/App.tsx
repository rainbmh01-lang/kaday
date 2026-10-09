import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter, useSearchParams } from 'wouter';
import {
  ArrowDownUp,
  ArrowRight,
  Banknote,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock3,
  Grid2X2,
  Heart,
  Layers,
  ListFilter,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Breadcrumbs,
  CartDrawer,
  CategoryTile,
  FilterRail,
  Footer,
  Header,
  Logo,
  ProductCard,
  ProductGrid,
  ProductVisual,
  SearchOverlay,
  SectionHeading,
  type CartLine,
} from '@/components/storefront';
import { LeadForm } from '@/components/lead-form';
import {
  brands,
  categories,
  findBrand,
  findCategory,
  findProduct,
  findProfession,
  formatDzd,
  products,
  professions,
  type Product,
  type CatalogLink,
} from '@/data/store';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import StoreAdmin from '@/pages/store-admin';
import { getDbCategories, getDbBrands, getDbProducts, inferProductType, type DbBrand, type DbProduct } from '@/lib/store-data';
import heroWorkshop from '@/assets/edengroupes-workshop-hero.jpg';
import {
  trackPageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
} from '@/lib/meta-tracker';

const queryClient = new QueryClient();

function mapDbProductToProduct(
  p: DbProduct,
  categoryMap: Map<string, string>
): Product {
  const catSlug = p.category_slug || 'outillage-electroportatif';
  const catLabel = categoryMap.get(catSlug) || catSlug;
  const primaryImg = p.images && p.images.length > 0 ? p.images[0] : undefined;

  return {
    id: p.id,
    slug: p.slug || p.id,
    name: p.name,
    brand: p.brand || p.brand_name || 'KADYA',
    category: catSlug,
    categoryLabel: catLabel,
    profession: 'macon',
    price: Number(p.price) || 0,
    oldPrice: p.old_price ? Number(p.old_price) : undefined,
    rating: 4.8,
    reviews: 14,
    badge: p.old_price && Number(p.old_price) > Number(p.price) ? 'PROMO' : undefined,
    stock: p.in_stock ? 'En stock' : 'Rupture',
    summary: p.summary || p.tech_summary || '',
    specs: Array.isArray(p.specs) && p.specs.length > 0 ? p.specs : [],
    color: '#f0b83d',
    icon: 'wrench',
    imageUrl: primaryImg,
    images: Array.isArray(p.images) && p.images.length > 0 ? p.images : (primaryImg ? [primaryImg] : []),
    techSummary: p.tech_summary,
    productType: p.product_type || inferProductType(p.name, p.category_slug) || '',
  };
}

type StoreContextValue = {
  cart: CartLine[];
  favorites: string[];
  addToCart: (product: Product) => void;
  toggleFavorite: (product: Product) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeLine: (id: string) => void;
  allProducts: Product[];
  liveCategories: CatalogLink[];
  liveBrands: DbBrand[];
  isLoadingProducts: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('Store context is missing');
  return context;
}

function Shell({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const [liveCategories, setLiveCategories] = useState<CatalogLink[]>(categories);
  const [liveBrands, setLiveBrands] = useState<DbBrand[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, brs, prods] = await Promise.all([
          getDbCategories(),
          getDbBrands(),
          getDbProducts(false),
        ]);

        const catMap = new Map<string, string>();
        if (cats && cats.length > 0) {
          const formattedCats: CatalogLink[] = cats
            .filter((c) => c.is_active)
            .map((c) => {
              catMap.set(c.slug, c.name);
              return {
                slug: c.slug,
                label: c.name,
                sub: c.description || '',
                count: 'Découvrir',
                color: '#f0b83d',
                icon: 'drill',
                image_url: c.image_url,
              };
            });
          setLiveCategories(formattedCats);
        } else {
          categories.forEach((c) => catMap.set(c.slug, c.label));
        }

        if (brs && brs.length > 0) {
          setLiveBrands(brs.filter((b) => b.is_active));
        }

        if (prods && prods.length > 0) {
          const mappedProds = prods.map((p) => mapDbProductToProduct(p, catMap));
          setAllProducts(mappedProds);
        }
      } catch (err) {
        console.error('Error initializing store data:', err);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(location);
  }, [location]);

  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const addToCart = (product: Product) => {
    trackAddToCart(product, 1);
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      return existing
        ? current.map((line) => line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line)
        : [...current, { product, quantity: 1 }];
    });
    setDrawerOpen(true);
  };
  const toggleFavorite = (product: Product) => setFavorites((current) => current.includes(product.id) ? current.filter((id) => id !== product.id) : [...current, product.id]);
  const updateQuantity = (id: string, quantity: number) => setCart((current) => quantity < 1 ? current.filter((line) => line.product.id !== id) : current.map((line) => line.product.id === id ? { ...line, quantity } : line));
  const removeLine = (id: string) => setCart((current) => current.filter((line) => line.product.id !== id));
  const onSearch = (value: string) => setLocation(`/search?q=${encodeURIComponent(value)}`);

  const store = {
    cart,
    favorites,
    addToCart,
    toggleFavorite,
    updateQuantity,
    removeLine,
    allProducts,
    liveCategories,
    liveBrands,
    isLoadingProducts,
  };
  return <StoreContext.Provider value={store}><div className="min-h-[100dvh] overflow-x-hidden bg-[var(--ed-paper)] text-[var(--ed-ink)]">
    <Header cartCount={cartCount} favoriteCount={favorites.length} onOpenSearch={() => setSearchOpen(true)} />
    <main>{children}</main>
    <Footer />
    <CartDrawer open={drawerOpen} lines={cart} onClose={() => setDrawerOpen(false)} onQuantity={updateQuantity} onRemove={removeLine} />
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onSubmit={onSearch} productsList={allProducts} />
  </div></StoreContext.Provider>;
}

function Home() {
  const [carousel, setCarousel] = useState(0);
  const [cartFlash, setCartFlash] = useState<Product | null>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const { favorites, addToCart, toggleFavorite, allProducts, liveCategories } = useStore();

  const featured = allProducts;
  const add = (product: Product) => { addToCart(product); setCartFlash(product); window.setTimeout(() => setCartFlash(null), 1200); };
  return <div>
    <section className="relative overflow-hidden bg-[var(--ed-ink)] text-white">
      <div className="absolute inset-0 opacity-55"><img src={heroWorkshop} alt="" className="h-full w-full object-cover object-center" /></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--ed-ink)] via-[var(--ed-ink)]/90 to-[var(--ed-ink)]/35" />
      <div className="relative mx-auto grid min-h-[590px] max-w-[1440px] items-end gap-8 px-5 pb-12 pt-20 md:grid-cols-[1.05fr_.95fr] md:items-center md:pb-20">
        <div className="max-w-2xl">
          <div className="mb-6 flex items-center gap-3"><span className="ed-mono bg-[var(--ed-yellow)] px-2 py-1 text-[10px] font-bold uppercase tracking-[.18em] text-[var(--ed-ink)]">Depuis Alger, pour vos chantiers</span><span className="ed-mono text-[10px] uppercase tracking-[.16em] text-white/55">Édition 2024</span></div>
          <h1 className="ed-display max-w-xl text-6xl font-extrabold leading-[.88] tracking-tight md:text-8xl">Le bon outil.<br /><span className="text-[var(--ed-yellow)]">Le chantier avance.</span></h1>
          <p className="mt-7 max-w-lg text-base leading-7 text-white/70 md:text-lg">Outillage professionnel, équipement d’atelier et solutions techniques. Choisis pour les réalités du terrain algérien.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/shop" className="ed-button inline-flex items-center gap-2 bg-[var(--ed-yellow)] px-5 py-4 text-sm font-bold text-[var(--ed-ink)] hover:bg-white" data-testid="link-hero-shop">Voir toute la boutique <ArrowRight size={17} /></Link><Link href="/profession/macon" className="ed-button inline-flex items-center gap-2 border border-white/30 px-5 py-4 text-sm font-semibold text-white hover:border-[var(--ed-yellow)] hover:text-[var(--ed-yellow)]" data-testid="link-hero-profession">Je suis un professionnel</Link></div>
          <div className="mt-10 flex flex-wrap gap-5 text-xs text-white/60"><span className="flex items-center gap-2"><Truck size={15} className="text-[var(--ed-yellow)]" /> Livraison nationale</span><span className="flex items-center gap-2"><Banknote size={15} className="text-[var(--ed-yellow)]" /> Paiement à la livraison</span><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-[var(--ed-yellow)]" /> Conseil technique</span></div>
        </div>
        <div className="hidden justify-end md:flex"><div className="w-[370px] border border-white/20 bg-[var(--ed-ink)]/45 p-5 backdrop-blur-sm"><div className="flex items-center justify-between border-b border-white/15 pb-4"><span className="ed-mono text-[10px] uppercase tracking-[.17em] text-[var(--ed-yellow)]">Dans l’atelier</span><span className="ed-mono text-[10px] text-white/45">01 / 03</span></div><div className="py-7"><p className="ed-display text-5xl font-bold">+1 200</p><p className="mt-2 text-sm text-white/65">références pour équiper<br />vos journées de travail.</p></div><div className="grid grid-cols-2 border-t border-white/15 pt-4 text-xs text-white/55"><span>CROWN · INGCO<br />BEETRO · FIXTOP</span><span className="text-right">Algérie<br />24 wilayas livrées</span></div></div></div>
      </div>
      <div className="absolute bottom-5 right-5 hidden items-center gap-2 md:flex"><button onClick={() => setCarousel(Math.max(0, carousel - 1))} className="grid h-9 w-9 place-items-center border border-white/30 hover:border-[var(--ed-yellow)] hover:text-[var(--ed-yellow)]" data-testid="button-hero-previous"><ChevronLeft size={17} /></button><button onClick={() => setCarousel(Math.min(2, carousel + 1))} className="grid h-9 w-9 place-items-center border border-white/30 hover:border-[var(--ed-yellow)] hover:text-[var(--ed-yellow)]" data-testid="button-hero-next"><ChevronRight size={17} /></button></div>
    </section>

    {/* Section Catégories avec aperçu partiel et expansion au clic */}
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:py-20">
      <SectionHeading
        title="Toutes les catégories"
        sub="Pas besoin de connaître la référence. Commencez par votre métier, votre univers ou votre prochain chantier."
      />
      <div className="relative">
        <div
          className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${
            categoriesExpanded || liveCategories.length <= 4
              ? 'max-h-[3000px]'
              : 'max-h-[520px] md:max-h-[315px]'
          }`}
        >
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {liveCategories.map((category) => (
              <CategoryTile key={category.slug} category={category} />
            ))}
          </div>
        </div>

        {!categoriesExpanded && liveCategories.length > 4 && (
          <div
            onClick={() => setCategoriesExpanded(true)}
            className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[var(--ed-paper)] via-[var(--ed-paper)]/85 to-transparent flex flex-col items-center justify-end pb-2 cursor-pointer group z-20"
            title="Afficher toutes les catégories"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCategoriesExpanded(true);
              }}
              className="ed-button inline-flex items-center gap-2 border-2 border-[var(--ed-ink)] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--ed-ink)] shadow-md group-hover:bg-[var(--ed-yellow)] group-hover:border-[var(--ed-ink)] transition-all transform group-hover:-translate-y-0.5"
            >
              <span>Voir toutes les catégories</span>
              <ChevronDown size={16} className="transition-transform group-hover:translate-y-0.5" />
            </button>
            <p className="mt-1 text-[11px] font-semibold text-slate-500 group-hover:text-[var(--ed-ink)]">
              Cliquez pour afficher toute la sélection
            </p>
          </div>
        )}

        {categoriesExpanded && liveCategories.length > 4 && (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setCategoriesExpanded(false)}
              className="ed-button inline-flex items-center gap-2 border border-slate-300 bg-white px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:border-[var(--ed-ink)] hover:text-[var(--ed-ink)] transition-colors shadow-xs"
            >
              <span>Réduire la liste</span>
              <ChevronUp size={16} />
            </button>
          </div>
        )}
      </div>
    </section>

    {/* Section Produits Essentiels avec aperçu partiel et lien vers /shop (Tout pour travailler) */}
    <section className="bg-[#eae7df]">
      <div className="mx-auto max-w-[1440px] px-5 py-16 md:py-20">
        <SectionHeading
          title="Tous les produits"
          sub="Une sélection courte, utile, disponible maintenant — avec des prix affichés en dinars, sans détour."
        />
        <div className="relative">
          <div className="overflow-hidden max-h-[880px] md:max-h-[530px]">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={add}
                  onFavorite={toggleFavorite}
                  isFavorite={favorites.includes(product.id)}
                />
              ))}
            </div>
          </div>

          {featured.length > 4 && (
            <Link
              href="/shop"
              className="absolute bottom-0 inset-x-0 h-44 bg-gradient-to-t from-[#eae7df] via-[#eae7df]/85 to-transparent flex flex-col items-center justify-end pb-3 cursor-pointer group z-20"
              title="Accéder à la boutique (Tout pour travailler)"
              data-testid="link-home-view-all-products"
            >
              <span
                className="ed-button inline-flex items-center gap-2 border-2 border-[var(--ed-ink)] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--ed-ink)] shadow-md group-hover:bg-[var(--ed-yellow)] group-hover:border-[var(--ed-ink)] transition-all transform group-hover:-translate-y-0.5"
              >
                <span>Voir tous les produits</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
              <p className="mt-1 text-[11px] font-semibold text-slate-500 group-hover:text-[var(--ed-ink)]">
                Accéder au catalogue complet dans la boutique
              </p>
            </Link>
          )}
        </div>
      </div>
    </section>
    <section className="mx-auto max-w-[1440px] px-5 py-16 md:py-20"><div className="grid gap-5 md:grid-cols-[1.25fr_.75fr]"><Link href="/profession/macon" className="ed-noise relative min-h-[360px] overflow-hidden bg-[var(--ed-rust)] p-7 text-white md:p-10" data-testid="link-home-macon"><div className="absolute -right-12 top-10 h-64 w-64 rounded-full border-[34px] border-white/10" /><div className="relative flex h-full flex-col justify-between"><div><p className="ed-mono text-[10px] uppercase tracking-[.2em] text-white/60">Sélection métier 01</p><h2 className="ed-display mt-4 max-w-md text-6xl font-bold leading-[.88]">Pour ceux<br />qui bâtissent.</h2></div><div className="flex items-end justify-between gap-5"><p className="max-w-xs text-sm leading-6 text-white/75">EPI, mesure, électroportatif et consommables pour avancer sans perdre une journée.</p><span className="grid h-12 w-12 shrink-0 place-items-center bg-[var(--ed-yellow)] text-[var(--ed-ink)]"><ArrowRight /></span></div></div></Link><div className="grid gap-5"><Link href="/brand/INGCO" className="ed-card flex min-h-[168px] items-end justify-between bg-[var(--ed-yellow)] p-6 text-[var(--ed-ink)]" data-testid="link-home-ingco"><div><p className="ed-mono text-[10px] uppercase tracking-[.2em] opacity-60">Marque repère</p><h3 className="ed-display mt-3 text-5xl font-bold">INGCO</h3><p className="mt-1 text-sm opacity-70">L’énergie jaune pour chaque atelier.</p></div><ArrowRight /></Link><Link href="/category/mesure-detection" className="ed-card flex min-h-[168px] items-end justify-between bg-[var(--ed-ink)] p-6 text-white" data-testid="link-home-measure"><div><p className="ed-mono text-[10px] uppercase tracking-[.2em] text-white/50">Précision d’abord</p><h3 className="ed-display mt-3 text-4xl font-bold">Mesure & détection</h3><p className="mt-1 text-sm text-white/60">Niveaux, lasers, testeurs.</p></div><ArrowRight className="text-[var(--ed-yellow)]" /></Link></div></div></section>
    <section className="ed-grid border-y border-[var(--ed-line)] bg-[#f7f5ef]"><div className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-14 md:grid-cols-[.8fr_1.2fr] md:py-20"><div><p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">Le terrain, en chiffres</p><h2 className="ed-display mt-3 text-5xl font-bold leading-none text-[var(--ed-ink)]">Pas un catalogue.<br />Un équipement.</h2></div><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['1 200+', 'références actives'], ['8', 'marques choisies'], ['58', 'wilayas couvertes'], ['24 h', 'pour préparer votre colis']].map(([number, label]) => <div key={label} className="border-l-2 border-[var(--ed-yellow)] pl-4"><p className="ed-display text-4xl font-bold text-[var(--ed-ink)]">{number}</p><p className="mt-1 text-xs leading-5 text-slate-500">{label}</p></div>)}</div></div></section>
    {cartFlash && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 bg-[var(--ed-ink)] px-4 py-3 text-sm font-semibold text-white shadow-xl"><Check size={16} className="text-[var(--ed-yellow)]" /> Ajouté : {cartFlash.brand} {cartFlash.name.split(' ').slice(0, 3).join(' ')} </div>}
  </div>;
}

function CatalogPage({ mode }: { mode?: 'promotions' | 'shop' }) {
  const [category, setCategory] = useState<string>();
  const [brand, setBrand] = useState<string>();
  const [productType, setProductType] = useState<string>();
  const [sort, setSort] = useState('featured');
  const { favorites, addToCart, toggleFavorite, allProducts, liveCategories, liveBrands } = useStore();
  const [mobileFilters, setMobileFilters] = useState(false);
  const [mobileBrandsOpen, setMobileBrandsOpen] = useState(false);
  const [mobileTypesOpen, setMobileTypesOpen] = useState(false);

  const currentBrandList = useMemo(() => {
    if (liveBrands.length > 0) {
      return liveBrands.map((b) => b.name);
    }
    const distinct = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    return distinct.length > 0 ? distinct : brands;
  }, [liveBrands, allProducts]);

  const currentTypeList = useMemo(() => {
    const distinct = Array.from(new Set(allProducts.map((p) => p.productType).filter(Boolean))) as string[];
    return distinct.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allProducts]);

  const filtered = useMemo(() => {
    const list = allProducts.filter((product) => {
      const matchCat = !category || product.category.toLowerCase() === category.toLowerCase() || (product.categoryLabel && product.categoryLabel.toLowerCase() === category.toLowerCase());
      const matchBrand = !brand || product.brand.toLowerCase() === brand.toLowerCase();
      const matchPromo = mode !== 'promotions' || Boolean(product.oldPrice && product.oldPrice > product.price);
      const matchType = !productType || (product.productType && product.productType.toLowerCase() === productType.toLowerCase());
      return matchCat && matchBrand && matchPromo && matchType;
    });
    return [...list].sort((a, b) => sort === 'price-low' ? a.price - b.price : sort === 'price-high' ? b.price - a.price : b.rating - a.rating);
  }, [allProducts, category, brand, productType, sort, mode]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12">
      {mode === 'promotions' && <Breadcrumbs items={[{ label: 'Promotions' }]} />}
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--ed-line)] pb-7 md:flex-row md:items-end">
        <div>
          {mode === 'promotions' && <p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">Prix atelier</p>}
          <h1 className="ed-display mt-2 text-[38px] sm:text-5xl md:text-6xl font-bold leading-none text-[var(--ed-ink)] whitespace-nowrap tracking-tight">
            {mode === 'promotions' ? 'Les promotions.' : 'Tous les produits'}
          </h1>
          {mode === 'promotions' && (
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
              Les offres courtes sur les références qui font vraiment la différence au quotidien.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setMobileFilters(!mobileFilters);
              setMobileBrandsOpen(false);
              setMobileTypesOpen(false);
            }}
            className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-sm font-semibold lg:hidden ${mobileFilters ? 'bg-[var(--ed-rust)] text-white' : 'bg-white'}`}
            data-testid="button-mobile-filters"
          >
            <SlidersHorizontal size={15} /> Filtres
          </button>
          {currentTypeList.length > 0 && (
            <button
              onClick={() => {
                setMobileTypesOpen(!mobileTypesOpen);
                setMobileFilters(false);
                setMobileBrandsOpen(false);
              }}
              className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-sm font-semibold lg:hidden ${mobileTypesOpen || productType ? 'bg-[var(--ed-rust)] text-white' : 'bg-white'}`}
              data-testid="button-mobile-types"
            >
              <Layers size={15} /> {productType ? productType : 'Types'}
            </button>
          )}
          <button
            onClick={() => {
              setMobileBrandsOpen(!mobileBrandsOpen);
              setMobileFilters(false);
              setMobileTypesOpen(false);
            }}
            className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-sm font-semibold lg:hidden ${mobileBrandsOpen || brand ? 'bg-[var(--ed-ink)] text-white' : 'bg-white'}`}
            data-testid="button-mobile-brands"
          >
            <Tag size={15} /> {brand ? brand : 'Marques'}
          </button>
          <label className="flex items-center gap-2 border border-[var(--ed-line)] bg-white px-3 py-2 text-sm">
            <ArrowDownUp size={14} className="text-slate-400" />
            <select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent outline-none" data-testid="select-sort">
              <option value="featured">Pertinence</option>
              <option value="price-low">Prix croissant</option>
              <option value="price-high">Prix décroissant</option>
            </select>
          </label>
        </div>
      </div>

      {/* Mobile Types Drawer */}
      {mobileTypesOpen && (
        <div className="mt-6 border border-[var(--ed-line)] bg-white p-4 shadow-sm lg:hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--ed-line)] pb-3">
            <p className="ed-mono text-[10px] uppercase tracking-[.18em] font-bold text-slate-600">Sélectionner un type d'équipement</p>
            {productType && (
              <button
                onClick={() => setProductType(undefined)}
                className="text-xs font-semibold text-[var(--ed-rust)] underline"
              >
                Tous les types
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currentTypeList.map((typeName) => {
              const isSelected = productType?.toLowerCase() === typeName.toLowerCase();
              return (
                <button
                  key={typeName}
                  onClick={() => {
                    setProductType(isSelected ? undefined : typeName);
                    setMobileTypesOpen(false);
                  }}
                  className={`flex items-center justify-between border p-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[var(--ed-rust)] bg-[var(--ed-rust)] text-white shadow-xs'
                      : 'border-[var(--ed-line)] bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{typeName}</span>
                  {isSelected && <Check size={12} className="shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Brands Drawer */}
      {mobileBrandsOpen && (
        <div className="mt-6 border border-[var(--ed-line)] bg-white p-4 shadow-sm lg:hidden animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--ed-line)] pb-3">
            <p className="ed-mono text-[10px] uppercase tracking-[.18em] font-bold text-slate-600">Sélectionner une marque</p>
            {brand && (
              <button
                onClick={() => setBrand(undefined)}
                className="text-xs font-semibold text-[var(--ed-rust)] underline"
              >
                Toutes les marques
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {currentBrandList.map((brandName) => {
              const isSelected = brand?.toLowerCase() === brandName.toLowerCase();
              return (
                <button
                  key={brandName}
                  onClick={() => {
                    setBrand(isSelected ? undefined : brandName);
                    setMobileBrandsOpen(false);
                  }}
                  className={`flex items-center justify-between border p-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[var(--ed-ink)] bg-[var(--ed-ink)] text-white shadow-xs'
                      : 'border-[var(--ed-line)] bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{brandName}</span>
                  {isSelected && <Check size={12} className="shrink-0 text-[var(--ed-yellow)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      <div className={`mt-6 ${mobileFilters ? 'block' : 'hidden'} border border-[var(--ed-line)] bg-white p-4 lg:hidden`}>
        <p className="ed-mono text-[10px] uppercase tracking-[.18em] text-slate-400">Filtrer par catégorie</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {liveCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(category === cat.slug ? undefined : cat.slug)}
              className={`px-3 py-2 text-xs font-semibold ${category === cat.slug ? 'bg-[var(--ed-rust)] text-white' : 'bg-slate-100 text-slate-600'}`}
              data-testid={`button-mobile-category-${cat.slug}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {currentTypeList.length > 0 && (
          <>
            <p className="ed-mono mt-5 text-[10px] uppercase tracking-[.18em] text-slate-400">Filtrer par type</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentTypeList.map((item) => (
                <button
                  key={item}
                  onClick={() => setProductType(productType === item ? undefined : item)}
                  className={`px-3 py-2 text-xs font-semibold ${productType === item ? 'bg-[var(--ed-rust)] text-white' : 'bg-slate-100 text-slate-600'}`}
                  data-testid={`button-mobile-type-${item}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}
        <p className="ed-mono mt-5 text-[10px] uppercase tracking-[.18em] text-slate-400">Filtrer par marque</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {currentBrandList.map((item) => (
            <button
              key={item}
              onClick={() => setBrand(brand === item ? undefined : item)}
              className={`px-3 py-2 text-xs font-semibold ${brand === item ? 'bg-[var(--ed-ink)] text-white' : 'bg-slate-100 text-slate-600'}`}
              data-testid={`button-mobile-brand-${item}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex gap-10">
        <FilterRail
          activeCategory={category}
          onCategory={setCategory}
          activeBrand={brand}
          onBrand={setBrand}
          activeType={productType}
          onType={setProductType}
          categoriesList={liveCategories}
          brandsList={currentBrandList}
          typesList={currentTypeList}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="ed-mono text-[10px] uppercase tracking-[.18em] text-slate-400">{filtered.length} références affichées</span>
              {productType && (
                <span className="inline-flex items-center gap-1.5 bg-[var(--ed-rust)] text-white px-2.5 py-1 text-xs font-semibold">
                  Type : {productType}
                  <button onClick={() => setProductType(undefined)} className="hover:text-[var(--ed-yellow)] cursor-pointer" title="Supprimer le filtre de type">
                    <X size={12} />
                  </button>
                </span>
              )}
            </div>
            {(category || brand || productType) && (
              <button
                onClick={() => {
                  setCategory(undefined);
                  setBrand(undefined);
                  setProductType(undefined);
                }}
                className="text-xs font-semibold text-[var(--ed-rust)] underline"
                data-testid="button-clear-filters"
              >
                Effacer les filtres
              </button>
            )}
          </div>
          <ProductGrid items={filtered} onAdd={addToCart} onFavorite={toggleFavorite} favorites={favorites} />
        </div>
      </div>
    </div>
  );
}

function CategoryPage() {
  const { category: slug } = useParams<{ category: string }>();
  const { favorites, addToCart, toggleFavorite, allProducts, liveCategories, liveBrands } = useStore();
  const category = liveCategories.find((c) => c.slug.toLowerCase() === slug?.toLowerCase()) || findCategory(slug);

  const [brand, setBrand] = useState<string>();
  const [productType, setProductType] = useState<string>();
  const [sort, setSort] = useState('featured');
  const [mobileFilters, setMobileFilters] = useState(false);
  const [mobileBrandsOpen, setMobileBrandsOpen] = useState(false);
  const [mobileTypesOpen, setMobileTypesOpen] = useState(false);

  const currentBrandList = useMemo(() => {
    if (liveBrands.length > 0) {
      return liveBrands.map((b) => b.name);
    }
    const distinct = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    return distinct.length > 0 ? distinct : brands;
  }, [liveBrands, allProducts]);

  const categoryTypes = useMemo(() => {
    const catProds = allProducts.filter((product) => {
      return (
        product.category.toLowerCase() === slug?.toLowerCase() ||
        (product.categoryLabel && product.categoryLabel.toLowerCase() === slug?.toLowerCase())
      );
    });
    const distinct = Array.from(new Set(catProds.map((p) => p.productType).filter(Boolean))) as string[];
    return distinct.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allProducts, slug]);

  const items = useMemo(() => {
    const list = allProducts.filter((product) => {
      const matchCat =
        product.category.toLowerCase() === slug?.toLowerCase() ||
        (product.categoryLabel && product.categoryLabel.toLowerCase() === slug?.toLowerCase());
      const matchBrand = !brand || product.brand.toLowerCase() === brand.toLowerCase();
      const matchType = !productType || (product.productType && product.productType.toLowerCase() === productType.toLowerCase());
      return matchCat && matchBrand && matchType;
    });

    return [...list].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      return b.rating - a.rating;
    });
  }, [allProducts, slug, brand, productType, sort]);

  if (!category) return <NotFound />;
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12">
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--ed-line)] pb-6 md:flex-row md:items-end">
        <div>
          <h1 className="ed-display text-5xl md:text-6xl font-bold leading-none text-[var(--ed-ink)]">{category.label}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">{category.sub ? `${category.sub}. ` : ''}Des solutions choisies pour les exigences du chantier, de l’atelier et de la maintenance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setMobileFilters(!mobileFilters);
              setMobileBrandsOpen(false);
              setMobileTypesOpen(false);
            }}
            className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              mobileFilters ? 'bg-[var(--ed-rust)] text-white' : 'bg-white hover:bg-slate-50 text-[var(--ed-ink)]'
            }`}
            data-testid="button-category-filters"
          >
            <SlidersHorizontal size={15} /> Filtres
          </button>
          {categoryTypes.length > 0 && (
            <button
              onClick={() => {
                setMobileTypesOpen(!mobileTypesOpen);
                setMobileFilters(false);
                setMobileBrandsOpen(false);
              }}
              className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
                mobileTypesOpen || productType ? 'bg-[var(--ed-rust)] text-white' : 'bg-white hover:bg-slate-50 text-[var(--ed-ink)]'
              }`}
              data-testid="button-category-types"
            >
              <Layers size={15} /> {productType ? productType : 'Types'}
            </button>
          )}
          <button
            onClick={() => {
              setMobileBrandsOpen(!mobileBrandsOpen);
              setMobileFilters(false);
              setMobileTypesOpen(false);
            }}
            className={`flex items-center gap-2 border border-[var(--ed-line)] px-3 py-2 text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              mobileBrandsOpen || brand ? 'bg-[var(--ed-ink)] text-white' : 'bg-white hover:bg-slate-50 text-[var(--ed-ink)]'
            }`}
            data-testid="button-category-brands"
          >
            <Tag size={15} /> {brand ? brand : 'Marques'}
          </button>
          <label className="flex items-center gap-2 border border-[var(--ed-line)] bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--ed-ink)] shadow-xs cursor-pointer hover:bg-slate-50">
            <ArrowDownUp size={14} className="text-slate-400 shrink-0" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-xs sm:text-sm font-semibold text-[var(--ed-ink)]"
              data-testid="select-sort-category"
            >
              <option value="featured">Pertinence</option>
              <option value="price-low">Prix croissant</option>
              <option value="price-high">Prix décroissant</option>
            </select>
          </label>
        </div>
      </div>

      {/* Types Drawer */}
      {mobileTypesOpen && (
        <div className="mt-6 border border-[var(--ed-line)] bg-white p-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--ed-line)] pb-3">
            <p className="ed-mono text-[10px] uppercase tracking-[.18em] font-bold text-slate-600">Sélectionner un type d'équipement</p>
            {productType && (
              <button
                onClick={() => setProductType(undefined)}
                className="text-xs font-semibold text-[var(--ed-rust)] underline"
              >
                Tous les types
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {categoryTypes.map((typeName) => {
              const isSelected = productType?.toLowerCase() === typeName.toLowerCase();
              return (
                <button
                  key={typeName}
                  onClick={() => {
                    setProductType(isSelected ? undefined : typeName);
                    setMobileTypesOpen(false);
                  }}
                  className={`flex items-center justify-between border p-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[var(--ed-rust)] bg-[var(--ed-rust)] text-white shadow-xs'
                      : 'border-[var(--ed-line)] bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{typeName}</span>
                  {isSelected && <Check size={12} className="shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Brands Drawer */}
      {mobileBrandsOpen && (
        <div className="mt-6 border border-[var(--ed-line)] bg-white p-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--ed-line)] pb-3">
            <p className="ed-mono text-[10px] uppercase tracking-[.18em] font-bold text-slate-600">Sélectionner une marque</p>
            {brand && (
              <button
                onClick={() => setBrand(undefined)}
                className="text-xs font-semibold text-[var(--ed-rust)] underline"
              >
                Toutes les marques
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {currentBrandList.map((brandName) => {
              const isSelected = brand?.toLowerCase() === brandName.toLowerCase();
              return (
                <button
                  key={brandName}
                  onClick={() => {
                    setBrand(isSelected ? undefined : brandName);
                    setMobileBrandsOpen(false);
                  }}
                  className={`flex items-center justify-between border p-2.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-[var(--ed-ink)] bg-[var(--ed-ink)] text-white shadow-xs'
                      : 'border-[var(--ed-line)] bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{brandName}</span>
                  {isSelected && <Check size={12} className="shrink-0 text-[var(--ed-yellow)]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories / Filters Drawer */}
      {mobileFilters && (
        <div className="mt-6 border border-[var(--ed-line)] bg-white p-4 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[var(--ed-line)] pb-3">
            <p className="ed-mono text-[10px] uppercase tracking-[.18em] font-bold text-slate-600">Naviguer par catégorie</p>
            <button
              onClick={() => setMobileFilters(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Fermer
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {liveCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                onClick={() => setMobileFilters(false)}
                className={`px-3 py-2 text-xs font-semibold ${
                  cat.slug.toLowerCase() === slug?.toLowerCase()
                    ? 'bg-[var(--ed-rust)] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Active filters indicators */}
      {(brand || productType) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Filtres actifs :</span>
          {productType && (
            <span className="inline-flex items-center gap-1.5 bg-[var(--ed-rust)] text-white px-2.5 py-1 text-xs font-semibold">
              Type : {productType}
              <button
                onClick={() => setProductType(undefined)}
                className="hover:text-[var(--ed-yellow)] cursor-pointer"
                title="Supprimer le filtre de type"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {brand && (
            <span className="inline-flex items-center gap-1.5 bg-[var(--ed-ink)] text-white px-2.5 py-1 text-xs font-semibold">
              {brand}
              <button
                onClick={() => setBrand(undefined)}
                className="hover:text-[var(--ed-yellow)] cursor-pointer"
                title="Supprimer le filtre de marque"
              >
                <X size={12} />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setBrand(undefined);
              setProductType(undefined);
            }}
            className="text-xs text-[var(--ed-rust)] underline ml-2 font-medium"
          >
            Effacer
          </button>
        </div>
      )}

      <div className="mt-8">
        <ProductGrid items={items} onAdd={addToCart} onFavorite={toggleFavorite} favorites={favorites} emptyLabel="Aucun produit dans cette catégorie pour le moment." />
      </div>
    </div>
  );
}

function BrandPage() {
  const { brand: brandParam } = useParams<{ brand: string }>();
  const { favorites, addToCart, toggleFavorite, allProducts, liveBrands } = useStore();

  const currentBrand = useMemo(() => {
    const match = liveBrands.find((b) => b.name.toLowerCase() === brandParam?.toLowerCase() || b.slug.toLowerCase() === brandParam?.toLowerCase());
    return match ? match.name : (findBrand(brandParam) || brandParam || '');
  }, [liveBrands, brandParam]);

  const items = useMemo(() => {
    return allProducts.filter((product) => product.brand.toLowerCase() === brandParam?.toLowerCase());
  }, [allProducts, brandParam]);

  if (!currentBrand) return <NotFound />;
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Marques', href: '/brands' }, { label: currentBrand }]} />
      <div className="flex flex-col justify-between gap-5 border-b border-[var(--ed-line)] pb-8 md:flex-row md:items-end">
        <div>
          <p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">Marque disponible en Algérie</p>
          <h1 className="ed-display mt-2 text-8xl font-extrabold leading-[.8] text-[var(--ed-ink)]">{currentBrand}</h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-slate-500">Une sélection KADYA DZ pour équiper l’atelier avec des références fiables, lisibles et au bon prix.</p>
        </div>
        <Link href="/shop" className="flex items-center gap-2 text-sm font-bold text-[var(--ed-rust)]" data-testid="link-brand-back-shop">
          Retour au catalogue <ArrowRight size={16} />
        </Link>
      </div>
      <div className="mt-10">
        <ProductGrid items={items} onAdd={addToCart} onFavorite={toggleFavorite} favorites={favorites} emptyLabel="Aucun produit trouvé pour cette marque." />
      </div>
    </div>
  );
}

function ProfessionPage() {
  const { profession: slug } = useParams<{ profession: string }>();
  const profession = findProfession(slug);
  const { favorites, addToCart, toggleFavorite, allProducts } = useStore();
  const items = useMemo(() => {
    return allProducts.filter((product) => product.profession === slug || product.category.toLowerCase() === slug?.toLowerCase());
  }, [allProducts, slug]);
  if (!profession) return <NotFound />;
  return <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12"><Breadcrumbs items={[{ label: 'Par métier', href: '/professions' }, { label: profession.label }]} /><div className="grid gap-8 bg-[var(--ed-yellow)] p-7 md:grid-cols-[1fr_.7fr] md:p-12"><div><p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-ink)]/60">Votre sélection métier</p><h1 className="ed-display mt-3 text-7xl font-bold leading-[.82] text-[var(--ed-ink)]">{profession.label}</h1><p className="mt-6 max-w-lg text-sm leading-6 text-[var(--ed-ink)]/70">Les outils qui restent à portée de main quand le chantier, l’installation ou la réparation ne peut pas attendre.</p></div><div className="flex items-end justify-end"><div className="border-l-2 border-[var(--ed-ink)]/25 pl-5"><p className="ed-display text-5xl font-bold text-[var(--ed-ink)]">{profession.count.split(' ')[0]}</p><p className="mt-1 text-sm text-[var(--ed-ink)]/60">références à découvrir</p></div></div></div><div className="mt-10"><ProductGrid items={items} onAdd={addToCart} onFavorite={toggleFavorite} favorites={favorites} /></div></div>;
}

function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { allProducts } = useStore();
  const product = allProducts.find((p) => p.slug.toLowerCase() === slug?.toLowerCase() || p.id === slug) || findProduct(slug);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayImages = useMemo(() => {
    if (!product) return [];
    return product.images && product.images.length > 0
      ? product.images
      : (product.imageUrl ? [product.imageUrl] : []);
  }, [product]);

  useEffect(() => {
    if (product) {
      trackViewContent(product);
      setActiveImageIdx(0);
    }
  }, [product?.id]);

  useEffect(() => {
    if (displayImages.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setActiveImageIdx((prev) => (prev + 1) % displayImages.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [displayImages.length, isPaused]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 40) {
        setActiveImageIdx((prev) => (prev + 1) % displayImages.length);
      } else if (diff < -40) {
        setActiveImageIdx((prev) => (prev - 1 + displayImages.length) % displayImages.length);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 3500);
  };

  if (!product) return <NotFound />;

  return (
    <div id="product-main" className="mx-auto max-w-[1440px] px-4 py-4 sm:px-5 sm:py-6 md:py-12">
      <div className="grid gap-5 md:grid-cols-[1.05fr_.95fr] md:gap-8">
        <div className="border border-[var(--ed-line)] bg-white relative overflow-hidden group">
          {displayImages.length > 0 ? (
            <div
              className="relative overflow-hidden bg-white select-none touch-pan-y"
              dir="ltr"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onPointerDown={() => setIsPaused(true)}
              onPointerUp={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out aspect-square w-full max-w-[320px] sm:max-w-[360px] mx-auto md:max-w-none md:min-h-[380px]"
                style={{ transform: `translateX(-${activeImageIdx * 100}%)` }}
              >
                {displayImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="w-full shrink-0 h-full flex items-center justify-center p-3 sm:p-4"
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      className="h-full w-full object-contain pointer-events-none select-none"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>

              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev - 1 + displayImages.length) % displayImages.length);
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-white/85 text-[var(--ed-ink)] shadow border border-slate-200 backdrop-blur transition hover:bg-white active:scale-95"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImageIdx((prev) => (prev + 1) % displayImages.length);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-white/85 text-[var(--ed-ink)] shadow border border-slate-200 backdrop-blur transition hover:bg-white active:scale-95"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight size={18} />
                  </button>

                  <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center items-center gap-1.5 pointer-events-auto">
                    {displayImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIdx(idx)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          activeImageIdx === idx
                            ? 'w-6 bg-[var(--ed-rust)]'
                            : 'w-2 bg-slate-300 hover:bg-slate-400'
                        }`}
                        aria-label={`Photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <ProductVisual product={product} large />
          )}
        </div>

        <div className="pt-1 md:pt-2">
          <h1 className="ed-display text-[28px] font-bold leading-[1.1] text-[var(--ed-ink)] sm:text-[34px] md:text-5xl md:leading-[.95]">
            {product.name}
          </h1>

          <p className="mt-2 text-xs sm:text-sm md:text-base leading-5 sm:leading-6 text-slate-600">{product.summary}</p>

          <div className="mt-3 border-y border-[var(--ed-line)] py-2 sm:py-3.5">
            <div className="flex items-end gap-3">
              <span className="ed-display text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--ed-ink)]">{formatDzd(product.price)}</span>
              {product.oldPrice && <span className="mb-0.5 sm:mb-1 text-xs sm:text-sm text-slate-400 line-through">{formatDzd(product.oldPrice)}</span>}
            </div>
            <p className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-xs text-emerald-700">
              <PackageCheck size={14} /> {product.stock} · Expédition rapide sous 24h
            </p>
          </div>

          {/* Lead Form embedded in Product Page */}
          <div className="mt-4 sm:mt-6">
            <LeadForm productName={product.name} unitPrice={product.price} initialQuantity={1} />
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-8 md:grid-cols-[.8fr_1.2fr]">
        <div>
          <h2 className="ed-display text-4xl font-bold">Fiche technique</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">{product.techSummary || product.summary}</p>
        </div>
        <div className="border-t border-[var(--ed-line)]">
          {product.specs.length > 0 ? (
            product.specs.map((spec, index) => (
              <div key={index} className="flex items-center justify-between border-b border-[var(--ed-line)] py-4 text-sm gap-4">
                <span className="font-semibold text-[var(--ed-ink)] text-left">{spec}</span>
                <span className="text-slate-500 shrink-0">{String(index + 1).padStart(2, '0')}</span>
              </div>
            ))
          ) : (
            <div className="py-6 text-slate-400 text-sm">Aucune spécification technique renseignée.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('q') || '' : '');
  const { favorites, addToCart, toggleFavorite, allProducts } = useStore();

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return allProducts;

    const terms = trimmed.split(/\s+/).filter(Boolean);

    return allProducts
      .map((product) => {
        const nameLower = product.name.toLowerCase();
        const brandLower = product.brand.toLowerCase();
        const catLower = (product.categoryLabel || product.category).toLowerCase();
        const summaryLower = (product.summary || '').toLowerCase();
        const specsLower = product.specs.join(' ').toLowerCase();

        let score = 0;

        // Exact full name match gets top priority
        if (nameLower === trimmed) {
          score += 2000;
        } else if (nameLower.startsWith(trimmed)) {
          score += 1000;
        } else if (nameLower.includes(trimmed)) {
          score += 500;
        }

        // Full query in brand or category
        if (brandLower === trimmed) {
          score += 400;
        } else if (brandLower.includes(trimmed)) {
          score += 200;
        }

        // Individual term matches
        let matchedTerms = 0;
        for (const term of terms) {
          let termMatched = false;
          if (nameLower.includes(term)) {
            score += 100;
            termMatched = true;
          }
          if (brandLower.includes(term)) {
            score += 60;
            termMatched = true;
          }
          if (catLower.includes(term)) {
            score += 30;
            termMatched = true;
          }
          if (summaryLower.includes(term) || specsLower.includes(term)) {
            score += 15;
            termMatched = true;
          }
          if (termMatched) matchedTerms++;
        }

        // Bonus if all terms matched
        if (matchedTerms === terms.length) {
          score += 300;
        }

        return { product, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.product);
  }, [allProducts, query]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Recherche' }]} />
      <div className="border-b border-[var(--ed-line)] pb-8">
        <p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">Recherche catalogue</p>
        <h1 className="ed-display mt-3 text-6xl font-bold leading-none">
          Résultats pour<br />
          <span className="text-[var(--ed-rust)]">“{query}”</span>
        </h1>
      </div>
      <div className="mt-10">
        <ProductGrid
          items={results}
          onAdd={addToCart}
          onFavorite={toggleFavorite}
          favorites={favorites}
          emptyLabel="Aucun résultat pour cette recherche."
        />
      </div>
    </div>
  );
}

function CollectionsPage({ type }: { type: 'brands' | 'professions' }) {
  const isBrands = type === 'brands';
  const { liveBrands, allProducts } = useStore();

  const brandItems = useMemo(() => {
    if (liveBrands.length > 0) return liveBrands.map((b) => b.name);
    const distinct = Array.from(new Set(allProducts.map((p) => p.brand).filter(Boolean)));
    return distinct.length > 0 ? distinct : brands;
  }, [liveBrands, allProducts]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 md:py-12">
      <Breadcrumbs items={[{ label: isBrands ? 'Marques' : 'Par métier' }]} />
      <div className="border-b border-[var(--ed-line)] pb-8">
        <p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">
          {isBrands ? 'Des marques qui ont fait leurs preuves' : 'Un point de départ plus direct'}
        </p>
        <h1 className="ed-display mt-3 text-7xl font-bold leading-[.85] text-[var(--ed-ink)]">
          {isBrands ? 'Nos marques.' : 'Par métier.'}
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
          {isBrands
            ? 'CROWN, INGCO, BEETRO, HONESTPRO et les autres : sélectionnées pour leur disponibilité, leur rapport qualité-prix et leur utilité terrain.'
            : 'Maçon, mécanicien, électricien, soudeur : partez de votre quotidien pour trouver les bons essentiels plus vite.'}
        </p>
      </div>
      {isBrands ? (
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {brandItems.map((brand, index) => (
            <Link
              key={brand}
              href={`/brand/${brand}`}
              className="ed-card group flex min-h-[180px] items-end justify-between border border-[var(--ed-line)] bg-white p-6"
              data-testid={`link-brand-${brand}`}
            >
              <div>
                <span className="ed-mono text-[10px] text-slate-400">
                  {String(index + 1).padStart(2, '0')} / {String(brandItems.length).padStart(2, '0')}
                </span>
                <h2 className="ed-display mt-5 text-6xl font-bold text-[var(--ed-ink)]">{brand}</h2>
                <p className="mt-1 text-xs text-slate-500">Voir la sélection disponible</p>
              </div>
              <ArrowRight className="text-[var(--ed-rust)] transition-transform group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {professions.map((profession) => (
            <Link
              key={profession.slug}
              href={`/profession/${profession.slug}`}
              className="ed-card border border-[var(--ed-line)] bg-white p-6"
              data-testid={`link-profession-${profession.slug}`}
            >
              <div className="grid h-12 w-12 place-items-center bg-[var(--ed-ink)] text-[var(--ed-yellow)]">
                <Grid2X2 size={22} />
              </div>
              <h2 className="ed-display mt-12 text-4xl font-bold text-[var(--ed-ink)]">{profession.label}</h2>
              <p className="mt-2 text-xs text-slate-500">{profession.count}</p>
              <span className="mt-7 flex items-center gap-2 text-xs font-bold text-[var(--ed-rust)]">
                Voir la sélection <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CartPage() {
  const { cart: lines, updateQuantity: onQuantity, removeLine: onRemove } = useStore();
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  useEffect(() => {
    if (lines.length > 0) {
      trackInitiateCheckout(lines, total);
    }
  }, [lines.length]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 md:py-12">
      <Breadcrumbs items={[{ label: 'Panier' }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="flex items-end justify-between border-b border-[var(--ed-line)] pb-6">
            <div>
              <p className="ed-mono text-[10px] uppercase tracking-[.2em] text-[var(--ed-rust)]">Votre commande</p>
              <h1 className="ed-display mt-2 text-5xl font-bold">Panier.</h1>
            </div>
            <span className="text-sm text-slate-500">{lines.length} article{lines.length > 1 ? 's' : ''}</span>
          </div>
          {!lines.length ? (
            <div className="py-24 text-center">
              <ShoppingCart className="mx-auto text-slate-300" size={40} />
              <p className="mt-4 font-semibold">Votre panier est vide.</p>
              <Link href="/shop" className="mt-6 inline-flex bg-[var(--ed-yellow)] px-5 py-3 text-sm font-bold" data-testid="link-empty-cart-shop">
                Voir la boutique
              </Link>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-[var(--ed-line)] border-y border-[var(--ed-line)]">
              {lines.map((line) => (
                <div key={line.product.id} className="flex gap-4 py-5">
                  <div className="hidden h-28 w-28 shrink-0 sm:block">
                    <ProductVisual product={line.product} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="ed-mono text-[10px] text-slate-400">{line.product.brand}</p>
                    <h2 className="mt-1 font-semibold leading-5">{line.product.name}</h2>
                    <p className="mt-2 text-sm font-bold">{formatDzd(line.product.price)}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center border border-[var(--ed-line)] bg-white">
                        <button onClick={() => onQuantity(line.product.id, line.quantity - 1)} className="grid h-8 w-8 place-items-center" data-testid={`button-page-minus-${line.product.id}`}>
                          <Minus size={13} />
                        </button>
                        <span className="ed-mono w-8 text-center text-xs">{line.quantity}</span>
                        <button onClick={() => onQuantity(line.product.id, line.quantity + 1)} className="grid h-8 w-8 place-items-center" data-testid={`button-page-plus-${line.product.id}`}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <button onClick={() => onRemove(line.product.id)} className="text-xs text-slate-400 underline hover:text-[var(--ed-rust)]" data-testid={`button-page-remove-${line.product.id}`}>
                        Retirer
                      </button>
                    </div>
                  </div>
                  <p className="hidden font-bold sm:block">{formatDzd(line.product.price * line.quantity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LeadForm replacing the old aside */}
        <aside className="h-fit lg:sticky lg:top-24">
          {lines.length > 0 ? (
            <LeadForm
              productName={lines.map((l) => `${l.quantity}x ${l.product.name}`).join(' + ')}
              unitPrice={total}
              initialQuantity={1}
            />
          ) : (
            <div className="border border-[var(--ed-line)] bg-white p-6 text-center text-slate-500 text-sm">
              أضف منتجات إلى السلة للمتابعة إلى تأكيد الطلب
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const isOrdersDashboard = location === '/dashboard' || location.startsWith('/dashboard/');
  const isStoreAdmin = location === '/admin' || location.startsWith('/admin/');

  if (isOrdersDashboard) {
    return <Dashboard />;
  }

  if (isStoreAdmin) {
    return <StoreAdmin />;
  }

  return (
    <Shell>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop"><CatalogPage mode="shop" /></Route>
        <Route path="/promotions"><CatalogPage mode="promotions" /></Route>
        <Route path="/category/:category" component={CategoryPage} />
        <Route path="/brand/:brand" component={BrandPage} />
        <Route path="/profession/:profession" component={ProfessionPage} />
        <Route path="/product/:slug" component={ProductPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/brands"><CollectionsPage type="brands" /></Route>
        <Route path="/professions"><CollectionsPage type="professions" /></Route>
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function RoutedErrorBoundary({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Router /></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;