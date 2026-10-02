import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  Anchor,
  ArrowDownUp,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bike,
  Box,
  BriefcaseBusiness,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Droplets,
  Flame,
  Gauge,
  Grid2X2,
  HardHat,
  Heart,
  House,
  Lamp,
  ListFilter,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  PanelTop,
  Plus,
  Ruler,
  Scan,
  ScanLine,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Truck,
  UserRound,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import type { CatalogLink, Product } from '@/data/store';
import { categories, formatDzd, products, professions, brands } from '@/data/store';

const iconMap = {
  activity: Activity,
  anchor: Anchor,
  bike: Bike,
  box: Box,
  car: Car,
  circle: CircleDot,
  'circle-dot': CircleDot,
  droplets: Droplets,
  drill: Settings,
  flame: Flame,
  gauge: Gauge,
  'grid-2': Grid2X2,
  'hard-hat': HardHat,
  lamp: Lamp,
  pipe: Droplets,
  ruler: Ruler,
  scan: Scan,
  'scan-line': ScanLine,
  settings: Settings,
  shield: Shield,
  sprout: Sprout,
  wrench: Wrench,
  zap: Zap,
} as const;

export type CartLine = { product: Product; quantity: number };

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const IconComponent = iconMap[name as keyof typeof iconMap] ?? Box;
  return <IconComponent size={size} strokeWidth={1.8} />;
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0" data-testid="link-logo">
      <span className="relative grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center bg-[var(--ed-yellow)] text-[var(--ed-ink)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 75%, 75% 100%, 0 100%)' }}>
        <span className="ed-display text-xl sm:text-2xl font-black leading-none">K</span>
      </span>
      {!compact && (
        <span className="leading-none shrink-0 flex flex-col justify-center">
          <span className="ed-display block text-[20px] sm:text-[22px] md:text-[23px] font-black tracking-tight text-[var(--ed-ink)]">
            KADYA <span className="text-[var(--ed-rust)] font-black">DZ</span>
          </span>
          <span className="ed-mono mt-0.5 block text-[6px] sm:text-[7px] md:text-[7.5px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
            Outils · Équipement
          </span>
        </span>
      )}
    </Link>
  );
}

export function ProductVisual({ product, large = false }: { product: Product; large?: boolean }) {
  if (product.imageUrl) {
    return (
      <div className={`relative flex items-center justify-center overflow-hidden bg-white p-3 sm:p-4 ${large ? 'aspect-square w-full max-w-[320px] sm:max-w-[360px] mx-auto md:max-w-none md:min-h-[340px]' : 'h-[190px]'}`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
    );
  }
  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${large ? 'aspect-square w-full max-w-[320px] sm:max-w-[360px] mx-auto md:max-w-none md:min-h-[340px]' : 'h-[190px]'}`} style={{ background: `linear-gradient(135deg, ${product.color} 0%, #f1f0e8 74%)` }}>
      <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full border-[18px] border-white/25" />
      <div className="absolute bottom-0 left-0 h-16 w-full bg-gradient-to-t from-black/10 to-transparent" />
      <div className="relative grid place-items-center text-[var(--ed-ink)]" style={{ transform: large ? 'scale(4.8)' : 'scale(3.1)' }}>
        <Icon name={product.icon} size={28} />
      </div>
    </div>
  );
}

export function ProductCard({ product, onAdd }: { product: Product; onAdd?: (product: Product) => void; onFavorite?: (product: Product) => void; isFavorite?: boolean }) {
  return (
    <article className="ed-card group overflow-hidden border border-[var(--ed-line)] bg-white" data-testid={`card-product-${product.id}`}>
      <div className="relative">
        <Link href={`/product/${product.slug}`} data-testid={`link-product-${product.id}`}>
          <ProductVisual product={product} />
        </Link>
        {product.badge && <span className="absolute left-3 top-3 bg-[var(--ed-rust)] px-2 py-1 text-[10px] font-bold tracking-[.12em] text-white">{product.badge}</span>}
      </div>
      <div className="space-y-3 p-4">
        <Link href={`/product/${product.slug}`} className="block" data-testid={`link-product-title-${product.id}`}>
          <h3 className="min-h-[48px] text-[15px] font-semibold leading-6 text-[var(--ed-ink)] group-hover:text-[var(--ed-rust)]">{product.name}</h3>
        </Link>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="ed-display text-[25px] font-bold leading-none text-[var(--ed-ink)]">{formatDzd(product.price)}</p>
            {product.oldPrice && <p className="mt-1 text-xs text-slate-400 line-through">{formatDzd(product.oldPrice)}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
          <PackageCheck size={14} className="text-emerald-600" /> {product.stock}
        </div>
      </div>
    </article>
  );
}

export function Header({ cartCount, favoriteCount, onOpenSearch }: { cartCount?: number; favoriteCount: number; onOpenSearch: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [arabic, setArabic] = useState(false);
  const [location] = useLocation();
  return (
    <>
      <div className="hidden bg-[var(--ed-ink)] text-white md:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-2 text-[11px] font-medium tracking-wide">
          <span className="flex items-center gap-2"><MapPin size={13} className="text-[var(--ed-yellow)]" /> Livraison partout en Algérie · Paiement à la livraison</span>
          <span className="flex items-center gap-5 text-white/70"><span>Service client : 0560 00 00 00</span><button onClick={() => { setArabic(!arabic); document.documentElement.dir = !arabic ? 'rtl' : 'ltr'; }} data-testid="button-language" className="text-white hover:text-[var(--ed-yellow)]">{arabic ? 'العربية' : 'FR'} <span className="text-white/40">/</span> {arabic ? 'FR' : 'العربية'}</button></span>
        </div>
      </div>
      <header className="sticky top-0 z-50 border-b border-[var(--ed-line)] bg-[#f8f7f3]/98 backdrop-blur shadow-xs">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 sm:gap-3 md:gap-4 px-2.5 sm:px-4 py-3 sm:py-3.5 md:py-3.5 md:px-5">
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center text-[var(--ed-ink)] md:hidden" data-testid="button-open-menu"><Menu size={19} className="sm:hidden" /><Menu size={21} className="hidden sm:block" /></button>
          <Logo />
          <div className="hidden items-center gap-1 lg:flex">
            <Link href="/shop" className={`px-3 py-3 text-sm font-semibold ${location === '/shop' ? 'text-[var(--ed-rust)]' : 'text-[var(--ed-ink)] hover:text-[var(--ed-rust)]'}`} data-testid="link-nav-shop">Boutique</Link>
            <Link href="/promotions" className="px-3 py-3 text-sm font-semibold text-[var(--ed-rust)] hover:text-[var(--ed-ink)]" data-testid="link-nav-promotions">Promotions</Link>
            <Link href="/brands" className="px-3 py-3 text-sm font-semibold text-[var(--ed-ink)] hover:text-[var(--ed-rust)]" data-testid="link-nav-brands">Marques</Link>
            <Link href="/professions" className="px-3 py-3 text-sm font-semibold text-[var(--ed-ink)] hover:text-[var(--ed-rust)]" data-testid="link-nav-professions">Par métier</Link>
          </div>
          <button onClick={onOpenSearch} className="flex min-w-0 flex-1 items-center justify-start gap-1.5 sm:gap-2 rounded-md border border-[var(--ed-line)] bg-white px-2.5 sm:px-3 py-2 sm:py-2.5 text-slate-500 hover:border-slate-400 md:ml-auto md:max-w-[420px]" data-testid="button-open-search">
            <Search size={16} className="shrink-0 text-slate-400 sm:size-[17px]" /><span className="truncate text-xs sm:text-sm font-medium">ابحث عن المنتج</span><span className="ed-mono ml-auto hidden text-[9px] text-slate-400 md:block">⌘ K</span>
          </button>
          <Link href="/dashboard" className="hidden h-10 w-10 place-items-center text-[var(--ed-ink)] hover:text-[var(--ed-rust)] md:grid" title="Tableau de bord Ventes & Marketing" data-testid="button-account"><UserRound size={20} /></Link>
          {favoriteCount > 0 && <span className="sr-only">{favoriteCount} favoris</span>}
        </div>
        {menuOpen && (
          <div className="border-t border-[var(--ed-line)] bg-white px-5 py-4 md:hidden">
            <nav className="grid gap-1">
              {[
                ['/shop', 'Boutique'],
                ['/promotions', 'Promotions'],
                ['/brands', 'Marques'],
                ['/professions', 'Par métier'],
                ['/dashboard', 'Tableau de bord (Admin)'],
              ].map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="border-b border-slate-100 py-3 text-sm font-semibold" data-testid={`link-mobile-${label}`}>{label}</Link>)}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 bg-[var(--ed-ink)] text-white">
      <div className="mx-auto max-w-[1440px] px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo compact />
            <p className="mt-5 max-w-[300px] text-sm leading-6 text-white/65">L’outillage et l’équipement professionnel, livrés partout en Algérie. Des références choisies pour travailler juste.</p>
            <div className="mt-6 flex items-center gap-2 text-xs text-white/55"><MapPin size={15} className="text-[var(--ed-yellow)]" /> Alger · Oran · Constantine · Toute l’Algérie</div>
          </div>
          <div><p className="ed-mono mb-4 text-[10px] uppercase tracking-[.2em] text-[var(--ed-yellow)]">Acheter</p><div className="grid gap-2 text-sm text-white/70"><Link href="/shop" className="hover:text-white" data-testid="link-footer-shop">Tous les produits</Link><Link href="/promotions" className="hover:text-white" data-testid="link-footer-promotions">Promotions</Link><Link href="/brands" className="hover:text-white" data-testid="link-footer-brands">Nos marques</Link><Link href="/professions" className="hover:text-white" data-testid="link-footer-professions">Par métier</Link></div></div>
          <div><p className="ed-mono mb-4 text-[10px] uppercase tracking-[.2em] text-[var(--ed-yellow)]">Besoin d’aide</p><div className="grid gap-2 text-sm text-white/70"><a href="tel:0560000000" className="text-left hover:text-white" data-testid="link-footer-contact">Nous contacter</a><a href="mailto:service@edengroupes.com" className="text-left hover:text-white" data-testid="link-footer-delivery">Livraison & retours</a><a href="mailto:service@edengroupes.com" className="text-left hover:text-white" data-testid="link-footer-payment">Paiement à la livraison</a><Link href="/dashboard" className="text-left hover:text-[var(--ed-yellow)] font-bold text-white/90" data-testid="link-footer-dashboard">Tableau de bord (Admin)</Link></div></div>
          <div><p className="ed-mono mb-4 text-[10px] uppercase tracking-[.2em] text-[var(--ed-yellow)]">Kadya DZ pro</p><p className="text-sm leading-6 text-white/70">Un besoin en quantité ? Écrivez à notre équipe pour un devis chantier ou atelier.</p><a href="mailto:pro@kadyadz.com" className="ed-button mt-5 inline-flex items-center gap-2 bg-[var(--ed-yellow)] px-4 py-3 text-sm font-bold text-[var(--ed-ink)] hover:bg-white" data-testid="link-pro-contact">Demander un devis <ArrowRight size={15} /></a></div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/40 md:flex-row"><span>© 2024 KADYA DZ · La sélection technique.</span><span>Mentions légales · Conditions de vente</span></div>
      </div>
    </footer>
  );
}

export function SearchOverlay({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  const suggestions = useMemo(() => {
    if (!value.trim()) return ['Perceuse-visseuse 20V', 'Niveau laser', 'Poste à souder inverter', 'Projecteur LED chantier'];
    const lower = value.toLowerCase().trim();
    return products
      .filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(lower))
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aExact = aName === lower ? 3 : aName.startsWith(lower) ? 2 : 1;
        const bExact = bName === lower ? 3 : bName.startsWith(lower) ? 2 : 1;
        return bExact - aExact;
      })
      .slice(0, 5)
      .map((p) => p.name);
  }, [value]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[60] bg-[var(--ed-ink)]/60 p-4 backdrop-blur-sm" onClick={onClose}>
    <div className="mx-auto mt-[10vh] max-w-2xl bg-[#f8f7f3] p-5 shadow-2xl md:p-7" onClick={(event) => event.stopPropagation()}>
      <div className="flex items-center justify-between"><p className="ed-display text-2xl font-bold text-[var(--ed-ink)]">ابحث عن منتجك</p><button onClick={onClose} className="grid h-9 w-9 place-items-center hover:bg-black/5" data-testid="button-close-search"><X size={19} /></button></div>
      <form className="mt-6 flex border-2 border-[var(--ed-ink)] bg-white rounded-md overflow-hidden" onSubmit={(event) => { event.preventDefault(); onSubmit(value); onClose(); }}><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} className="min-w-0 flex-1 px-4 py-4 text-base outline-none text-right" dir="rtl" placeholder="ابحث عن المنتج، العلامة، أو الأداة" data-testid="input-search-overlay" /><button className="bg-[var(--ed-yellow)] px-5 text-[var(--ed-ink)]" data-testid="button-submit-search"><Search size={20} /></button></form>
      <div className="mt-6"><p className="ed-mono text-[10px] uppercase tracking-[.18em] text-slate-400">اقتراحات سريعة</p><div className="mt-3 grid gap-1">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => { setValue(suggestion); onSubmit(suggestion); onClose(); }} className="flex items-center gap-3 border-b border-slate-200 py-3 text-left text-sm font-medium text-[var(--ed-ink)] hover:text-[var(--ed-rust)]" data-testid={`button-suggestion-${suggestion.slice(0, 10)}`}><Search size={15} className="text-slate-400" />{suggestion}<ArrowRight size={14} className="ml-auto text-slate-400" /></button>)}</div></div>
    </div>
  </div>;
}

export function TrustStrip() {
  const items = [
    [Truck, 'Livraison partout en Algérie', 'Départ quotidien depuis Alger'],
    [Banknote, 'Paiement à la livraison', 'Simple, clair, sans surprise'],
    [BadgeCheck, 'Produits sélectionnés', 'Des marques qui travaillent dur'],
    [Clock3, 'Une équipe qui répond', 'Conseil avant et après achat'],
  ];
  return <div className="border-y border-[var(--ed-line)] bg-white"><div className="mx-auto grid max-w-[1440px] divide-y divide-[var(--ed-line)] md:grid-cols-4 md:divide-x md:divide-y-0">{items.map(([Item, title, sub]) => <div key={title as string} className="flex items-center gap-3 px-5 py-5"><Item size={20} className="shrink-0 text-[var(--ed-rust)]" /><div><p className="text-sm font-bold text-[var(--ed-ink)]">{title as string}</p><p className="mt-0.5 text-xs text-slate-500">{sub as string}</p></div></div>)}</div></div>;
}

export function SectionHeading({ eyebrow, title, sub, action }: { eyebrow: string; title: string; sub?: string; action?: React.ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="ed-mono mb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-[var(--ed-rust)]">{eyebrow}</p><h2 className="ed-display text-4xl font-bold leading-none text-[var(--ed-ink)] md:text-5xl">{title}</h2>{sub && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{sub}</p>}</div>{action}</div>;
}

export function CategoryTile({ category }: { category: CatalogLink }) {
  return <Link href={`/category/${category.slug}`} className="ed-card group relative min-h-[190px] overflow-hidden border border-[var(--ed-line)] bg-white p-5" data-testid={`link-category-${category.slug}`}><div className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30" style={{ background: category.color }} /><div className="relative flex h-full flex-col justify-between"><span className="grid h-11 w-11 place-items-center bg-[var(--ed-ink)] text-[var(--ed-yellow)]"><Icon name={category.icon} size={22} /></span><div><h3 className="ed-display text-2xl font-bold leading-none text-[var(--ed-ink)]">{category.label}</h3><p className="mt-2 text-xs text-slate-500">{category.sub}</p><span className="ed-mono mt-4 block text-[10px] uppercase tracking-[.15em] text-[var(--ed-rust)]">{category.count} <ArrowRight className="ml-1 inline" size={12} /></span></div></div></Link>;
}

export function ProductGrid({ items, onAdd, onFavorite, favorites, emptyLabel = 'Aucun produit trouvé.' }: { items: Product[]; onAdd?: (product: Product) => void; onFavorite: (product: Product) => void; favorites: string[]; emptyLabel?: string }) {
  if (!items.length) return <div className="border border-dashed border-[var(--ed-line)] bg-white px-6 py-16 text-center"><Box className="mx-auto text-slate-300" size={38} /><p className="mt-4 font-semibold text-[var(--ed-ink)]">{emptyLabel}</p><p className="mt-1 text-sm text-slate-500">Essayez une autre marque, catégorie ou référence.</p></div>;
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">{items.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onFavorite={onFavorite} isFavorite={favorites.includes(product.id)} />)}</div>;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <div className="mb-5 flex flex-wrap items-center gap-2 text-xs text-slate-400"><Link href="/" className="hover:text-[var(--ed-rust)]" data-testid="link-breadcrumb-home">Accueil</Link>{items.map((item, index) => <span key={item.label} className="flex items-center gap-2"><ChevronRight size={12} />{item.href ? <Link href={item.href} className="hover:text-[var(--ed-rust)]" data-testid={`link-breadcrumb-${index}`}>{item.label}</Link> : <span className="text-slate-600">{item.label}</span>}</span>)}</div>;
}

export function FilterRail({ activeCategory, onCategory, activeBrand, onBrand }: { activeCategory?: string; onCategory: (value?: string) => void; activeBrand?: string; onBrand: (value?: string) => void }) {
  return <aside className="hidden w-56 shrink-0 lg:block"><div className="sticky top-24 space-y-7"><div><p className="ed-mono mb-3 text-[10px] uppercase tracking-[.18em] text-slate-400">Catégories</p><div className="grid gap-1">{categories.map((cat) => <button key={cat.slug} onClick={() => onCategory(activeCategory === cat.slug ? undefined : cat.slug)} className={`flex items-center justify-between py-2 text-left text-sm ${activeCategory === cat.slug ? 'font-bold text-[var(--ed-rust)]' : 'text-slate-600 hover:text-[var(--ed-ink)]'}`} data-testid={`button-filter-category-${cat.slug}`}><span>{cat.label}</span><span className="ed-mono text-[10px] text-slate-400">{cat.count.split(' ')[0]}</span></button>)}</div></div><div className="border-t border-[var(--ed-line)] pt-6"><p className="ed-mono mb-3 text-[10px] uppercase tracking-[.18em] text-slate-400">Marques</p><div className="grid gap-1">{brands.map((brand) => <button key={brand} onClick={() => onBrand(activeBrand === brand ? undefined : brand)} className={`flex items-center gap-2 py-2 text-left text-sm ${activeBrand === brand ? 'font-bold text-[var(--ed-rust)]' : 'text-slate-600 hover:text-[var(--ed-ink)]'}`} data-testid={`button-filter-brand-${brand}`}><span className={`h-2 w-2 rounded-full ${activeBrand === brand ? 'bg-[var(--ed-rust)]' : 'bg-slate-300'}`} />{brand}</button>)}</div></div></div></aside>;
}

export function CartDrawer({ open, lines, onClose, onQuantity, onRemove }: { open: boolean; lines: CartLine[]; onClose: () => void; onQuantity: (id: string, quantity: number) => void; onRemove: (id: string) => void }) {
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  if (!open) return null;
  return <div className="fixed inset-0 z-[55] bg-[var(--ed-ink)]/45" onClick={onClose}><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#f8f7f3] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-[var(--ed-line)] px-5 py-5"><div><p className="ed-mono text-[10px] uppercase tracking-[.18em] text-[var(--ed-rust)]">Votre sélection</p><h2 className="ed-display mt-1 text-3xl font-bold text-[var(--ed-ink)]">Panier</h2></div><button onClick={onClose} className="grid h-9 w-9 place-items-center hover:bg-black/5" data-testid="button-close-cart"><X size={19} /></button></div><div className="flex-1 overflow-auto px-5 py-5">{!lines.length ? <div className="py-20 text-center"><ShoppingCart className="mx-auto text-slate-300" size={42} /><p className="mt-4 font-semibold text-[var(--ed-ink)]">Votre panier est vide</p><Link href="/shop" onClick={onClose} className="mt-5 inline-flex bg-[var(--ed-yellow)] px-4 py-3 text-sm font-bold text-[var(--ed-ink)]" data-testid="link-cart-empty-shop">Voir la boutique</Link></div> : <div className="space-y-4">{lines.map((line) => <div key={line.product.id} className="flex gap-3 border-b border-[var(--ed-line)] pb-4"><div className="h-20 w-20 shrink-0"><ProductVisual product={line.product} /></div><div className="min-w-0 flex-1"><p className="ed-mono text-[10px] text-slate-400">{line.product.brand}</p><p className="mt-1 text-sm font-semibold leading-5 text-[var(--ed-ink)]">{line.product.name}</p><div className="mt-2 flex items-center justify-between"><div className="flex items-center border border-[var(--ed-line)] bg-white"><button className="grid h-7 w-7 place-items-center" onClick={() => onQuantity(line.product.id, line.quantity - 1)} data-testid={`button-cart-minus-${line.product.id}`}><Minus size={12} /></button><span className="ed-mono w-7 text-center text-xs">{line.quantity}</span><button className="grid h-7 w-7 place-items-center" onClick={() => onQuantity(line.product.id, line.quantity + 1)} data-testid={`button-cart-plus-${line.product.id}`}><Plus size={12} /></button></div><span className="font-bold text-[var(--ed-ink)]">{formatDzd(line.product.price * line.quantity)}</span></div><button onClick={() => onRemove(line.product.id)} className="mt-2 text-[11px] text-slate-400 underline hover:text-[var(--ed-rust)]" data-testid={`button-cart-remove-${line.product.id}`}>Retirer</button></div></div>)}</div>}</div>{lines.length > 0 && <div className="border-t border-[var(--ed-line)] bg-white px-5 py-5"><div className="flex justify-between text-sm text-slate-500"><span>Sous-total</span><span className="font-bold text-[var(--ed-ink)]">{formatDzd(total)}</span></div><p className="mt-2 text-[11px] text-slate-500">Frais de livraison calculés à la confirmation selon la wilaya.</p><Link href="/cart" onClick={onClose} className="ed-button mt-5 flex items-center justify-center gap-2 bg-[var(--ed-yellow)] px-4 py-3.5 text-sm font-bold text-[var(--ed-ink)] hover:bg-[var(--ed-ink)] hover:text-white" data-testid="link-cart-checkout">Passer la commande <ArrowRight size={16} /></Link></div>}</aside></div>;
}