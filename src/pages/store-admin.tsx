import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Package,
  Layers,
  Tag,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  LogOut,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ArrowRight,
  UploadCloud,
  X,
  Check,
  Wrench,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  getDbCategories,
  saveDbCategory,
  deleteDbCategory,
  type DbCategory,
  getDbBrands,
  saveDbBrand,
  deleteDbBrand,
  type DbBrand,
  getDbProducts,
  saveDbProduct,
  deleteDbProduct,
  uploadProductImage,
  seedInitialProducts,
  type DbProduct,
} from '@/lib/store-data';
import { formatDzd } from '@/data/store';

type Tab = 'products' | 'categories' | 'brands' | 'types';

export default function StoreAdmin() {
  const [session, setSession] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState<Tab>('categories');

  // Categories state
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<DbCategory> | null>(null);
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string>('');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState('');

  // Brands state
  const [brands, setBrands] = useState<DbBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<DbBrand> | null>(null);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string>('');
  const [brandSaving, setBrandSaving] = useState(false);
  const [brandError, setBrandError] = useState('');

  // Products state
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<DbProduct> | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productImageFiles, setProductImageFiles] = useState<(File | null)[]>([null, null, null, null, null]);
  const [productSpecs, setProductSpecs] = useState<string[]>(['']);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [typeSearch, setTypeSearch] = useState('');

  const adminAvailableTypes = useMemo(() => {
    const distinct = Array.from(new Set(products.map((p) => p.product_type).filter(Boolean))) as string[];
    return distinct.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [products]);

  const typesStats = useMemo(() => {
    const map = new Map<string, { count: number; products: DbProduct[] }>();
    products.forEach((p) => {
      const t = p.product_type?.trim();
      if (t) {
        if (!map.has(t)) {
          map.set(t, { count: 0, products: [] });
        }
        const item = map.get(t)!;
        item.count += 1;
        item.products.push(p);
      }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, count: data.count, products: data.products }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));
  }, [products]);

  const [successToast, setSuccessToast] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load categories
  const loadCategories = async () => {
    setCatsLoading(true);
    try {
      const data = await getDbCategories();
      setCategories(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setCatsLoading(false);
    }
  };

  // Load brands
  const loadBrands = async () => {
    setBrandsLoading(true);
    try {
      const data = await getDbBrands();
      setBrands(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setBrandsLoading(false);
    }
  };

  // Load products
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const data = await getDbProducts(true);
      setProducts(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadCategories();
      loadBrands();
      loadProducts();
    }
  }, [session]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 3500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setLoginError(error.message || 'Échec de connexion. Vérifiez vos identifiants.');
    } else {
      setSession(data.session);
    }
    setLoginLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // --- Category Handlers ---
  const handleOpenAddCat = () => {
    setEditingCat({
      name: '',
      slug: '',
      description: '',
      sort_order: categories.length + 1,
      is_active: true,
      image_url: '',
    });
    setCatImageFile(null);
    setCatImagePreview('');
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: DbCategory) => {
    setEditingCat({ ...cat });
    setCatImageFile(null);
    setCatImagePreview(cat.image_url || '');
    setCatError('');
    setIsCatModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCatImageFile(file);
      setCatImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name || !editingCat?.slug) {
      setCatError('Le nom et le slug sont requis.');
      return;
    }

    setCatSaving(true);
    setCatError('');

    try {
      await saveDbCategory(editingCat, catImageFile || undefined);
      setIsCatModalOpen(false);
      showToast('Catégorie enregistrée avec succès !');
      await loadCategories();
    } catch (err: any) {
      setCatError(err.message || 'Erreur lors de l’enregistrement.');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat: DbCategory) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;

    try {
      await deleteDbCategory(cat.id);
      showToast(`Catégorie "${cat.name}" supprimée.`);
      await loadCategories();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleToggleActiveCat = async (cat: DbCategory) => {
    try {
      await saveDbCategory({ ...cat, is_active: !cat.is_active });
      showToast(cat.is_active ? 'Catégorie masquée' : 'Catégorie activée');
      await loadCategories();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // --- Brand Handlers ---
  const handleOpenAddBrand = () => {
    setEditingBrand({
      name: '',
      slug: '',
      description: '',
      sort_order: brands.length + 1,
      is_active: true,
      logo_url: '',
    });
    setBrandLogoFile(null);
    setBrandLogoPreview('');
    setBrandError('');
    setIsBrandModalOpen(true);
  };

  const handleOpenEditBrand = (brand: DbBrand) => {
    setEditingBrand({ ...brand });
    setBrandLogoFile(null);
    setBrandLogoPreview(brand.logo_url || '');
    setBrandError('');
    setIsBrandModalOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandLogoFile(file);
      setBrandLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand?.name || !editingBrand?.slug) {
      setBrandError('Le nom et le slug sont requis.');
      return;
    }

    setBrandSaving(true);
    setBrandError('');

    try {
      await saveDbBrand(editingBrand, brandLogoFile || undefined);
      setIsBrandModalOpen(false);
      showToast('Marque enregistrée avec succès !');
      await loadBrands();
    } catch (err: any) {
      setBrandError(err.message || 'Erreur lors de l’enregistrement de la marque.');
    } finally {
      setBrandSaving(false);
    }
  };

  const handleDeleteBrand = async (brand: DbBrand) => {
    if (!window.confirm(`Supprimer la marque "${brand.name}" ?`)) return;

    try {
      await deleteDbBrand(brand.id);
      showToast(`Marque "${brand.name}" supprimée.`);
      await loadBrands();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleToggleActiveBrand = async (brand: DbBrand) => {
    try {
      await saveDbBrand({ ...brand, is_active: !brand.is_active });
      showToast(brand.is_active ? 'Marque masquée' : 'Marque activée');
      await loadBrands();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  // Product Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct({
      name: '',
      slug: '',
      summary: '',
      product_type: '',
      brand_name: brands[0]?.name || '',
      category_slug: categories[0]?.slug || '',
      price: 0,
      old_price: undefined,
      tech_summary: '',
      is_active: true,
      in_stock: true,
    });
    setProductImages([]);
    setProductImageFiles([null, null, null, null, null]);
    setProductSpecs(['']);
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (p: DbProduct) => {
    setEditingProduct({ ...p, product_type: p.product_type || '' });
    setProductImages(p.images ? [...p.images] : []);
    setProductImageFiles([null, null, null, null, null]);
    setProductSpecs(p.specs && p.specs.length > 0 ? [...p.specs] : ['']);
    setProductError('');
    setIsProductModalOpen(true);
  };

  const handleProductImageSlotChange = (slotIndex: number, file: File | null) => {
    const updatedFiles = [...productImageFiles];
    updatedFiles[slotIndex] = file;
    setProductImageFiles(updatedFiles);

    if (file) {
      const previewUrl = URL.createObjectURL(file);
      const updatedImages = [...productImages];
      updatedImages[slotIndex] = previewUrl;
      setProductImages(updatedImages);
    }
  };

  const handleRemoveProductImageSlot = (slotIndex: number) => {
    const updatedFiles = [...productImageFiles];
    updatedFiles.splice(slotIndex, 1);
    updatedFiles.push(null);
    setProductImageFiles(updatedFiles);

    const updatedImages = [...productImages];
    updatedImages.splice(slotIndex, 1);
    setProductImages(updatedImages);
  };

  const handleAddSpecLine = () => {
    if (productSpecs.length >= 10) return;
    setProductSpecs([...productSpecs, '']);
  };

  const handleSpecChange = (index: number, val: string) => {
    const updated = [...productSpecs];
    updated[index] = val;
    setProductSpecs(updated);
  };

  const handleRemoveSpec = (index: number) => {
    if (productSpecs.length <= 1) {
      setProductSpecs(['']);
      return;
    }
    const updated = [...productSpecs];
    updated.splice(index, 1);
    setProductSpecs(updated);
  };

  const handleSeedProducts = async () => {
    if (!window.confirm('Voulez-vous importer les 10 produits du catalogue KADYA DZ dans la base de données ?')) return;
    setSeeding(true);
    try {
      await seedInitialProducts();
      showToast('10 produits importés avec succès dans la base de données !');
      await loadProducts();
    } catch (err: any) {
      console.error('Seed error:', err);
      alert(`Erreur d'importation: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name?.trim()) {
      setProductError('Le nom du produit est obligatoire.');
      return;
    }
    if (editingProduct.price === undefined || editingProduct.price === null || isNaN(Number(editingProduct.price))) {
      setProductError('Veuillez renseigner un prix de vente valide.');
      return;
    }

    setProductSaving(true);
    setProductError('');

    try {
      const slug = editingProduct.slug?.trim()
        ? editingProduct.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : editingProduct.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      // Upload any new image files
      const finalImages: string[] = [];
      for (let i = 0; i < 5; i++) {
        const file = productImageFiles[i];
        if (file) {
          const uploadedUrl = await uploadProductImage(file, slug, i + 1);
          finalImages.push(uploadedUrl);
        } else if (productImages[i] && !productImages[i].startsWith('blob:')) {
          finalImages.push(productImages[i]);
        }
      }

      // Filter non-empty specs
      const cleanSpecs = productSpecs
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, 10);

      const brandVal = editingProduct.brand_name || editingProduct.brand || (brands[0]?.name ?? 'CROWN');
      const catSlug = editingProduct.category_slug || (categories[0]?.slug ?? 'outillage-electroportatif');

      await saveDbProduct({
        ...editingProduct,
        slug,
        brand: brandVal,
        brand_name: brandVal,
        category_slug: catSlug,
        images: finalImages,
        specs: cleanSpecs,
      });

      setIsProductModalOpen(false);
      showToast('Produit enregistré avec succès !');
      await loadProducts();
    } catch (err: any) {
      console.error('Save product error:', err);
      setProductError(err.message || 'Erreur lors de l’enregistrement du produit.');
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteProduct = async (p: DbProduct) => {
    if (!window.confirm(`Supprimer le produit "${p.name}" ?`)) return;
    try {
      await deleteDbProduct(p.id);
      showToast(`Produit "${p.name}" supprimé.`);
      await loadProducts();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleToggleActiveProduct = async (p: DbProduct) => {
    try {
      await saveDbProduct({ ...p, is_active: !p.is_active });
      showToast(p.is_active ? 'Produit masqué' : 'Produit activé');
      await loadProducts();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleToggleStockProduct = async (p: DbProduct) => {
    try {
      await saveDbProduct({ ...p, in_stock: !p.in_stock });
      showToast(p.in_stock ? 'Produit marqué en rupture' : 'Produit marqué en stock');
      await loadProducts();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f8f7f3] grid place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <RefreshCw className="animate-spin text-[var(--ed-rust)]" size={20} />
          <span>Vérification de la session...</span>
        </div>
      </div>
    );
  }

  // Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-[#f8f7f3] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md bg-white border border-[var(--ed-line)] p-8 shadow-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 bg-[var(--ed-ink)] text-[var(--ed-yellow)] font-black text-2xl mb-3">
              K
            </div>
            <h1 className="ed-display text-3xl font-bold text-[var(--ed-ink)]">
              KADYA DZ STORE
            </h1>
            <p className="ed-mono text-xs uppercase tracking-widest text-slate-500 mt-1">
              Administration du catalogue
            </p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Adresse Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kadyadz.com"
                className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] font-bold py-3 text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter au catalogue</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/dashboard" className="hover:text-[var(--ed-rust)] font-medium">
              → Tableau des commandes
            </Link>
            <Link href="/" className="hover:text-[var(--ed-rust)] font-medium">
              Retour boutique ↗
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f7f3] text-[var(--ed-ink)]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-50 bg-[var(--ed-ink)] text-white px-4 py-3 rounded shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-[var(--ed-yellow)]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-[var(--ed-line)] bg-white sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-[var(--ed-ink)] text-[var(--ed-yellow)] font-black text-lg grid place-items-center">
              K
            </div>
            <div>
              <span className="font-bold text-base tracking-tight block leading-tight">
                KADYA DZ · Catalogue
              </span>
              <span className="ed-mono text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                ● Connecté ({session.user?.email})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-semibold px-3 py-2 border border-[var(--ed-line)] bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <ShoppingBag size={14} className="text-[var(--ed-rust)]" />
              <span className="hidden sm:inline">Gestion des commandes</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold px-3 py-2 border border-[var(--ed-line)] bg-white hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
            >
              <span className="hidden sm:inline">Voir la boutique</span>
              <ExternalLink size={13} className="text-slate-400" />
            </Link>

            <button
              onClick={handleLogout}
              className="text-xs font-semibold px-3 py-2 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Déconnexion"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[var(--ed-line)] mb-8 gap-2 sm:gap-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2.5 pb-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'categories'
                ? 'border-[var(--ed-rust)] text-[var(--ed-rust)]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers size={17} />
            <span>Catégories & Photos ({categories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('brands')}
            className={`flex items-center gap-2.5 pb-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'brands'
                ? 'border-[var(--ed-rust)] text-[var(--ed-rust)]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Tag size={17} />
            <span>Marques & Logos ({brands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('types')}
            className={`flex items-center gap-2.5 pb-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'types'
                ? 'border-[var(--ed-rust)] text-[var(--ed-rust)]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench size={17} />
            <span>Types d’équipements ({typesStats.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 pb-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-[var(--ed-rust)] text-[var(--ed-rust)]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package size={17} />
            <span>Produits ({products.length})</span>
          </button>
        </div>

        {/* Tab: Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[var(--ed-line)] p-5">
              <div>
                <h2 className="ed-display text-2xl font-bold">Gestion des Catégories</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Définissez une photo personnalisée pour chaque catégorie qui s'affiche sur la page d'accueil.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadCategories}
                  className="p-2 border border-slate-200 text-slate-500 hover:text-[var(--ed-ink)] hover:bg-slate-50 transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={15} className={catsLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleOpenAddCat}
                  className="bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nouvelle Catégorie</span>
                </button>
              </div>
            </div>

            {catsLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2 text-[var(--ed-rust)]" size={24} />
                <p className="text-xs font-semibold">Chargement des catégories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white border border-[var(--ed-line)] p-12 text-center text-slate-400">
                <Layers size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-slate-700">Aucune catégorie trouvée</p>
                <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvelle Catégorie" pour en ajouter une.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-[var(--ed-line)] flex flex-col justify-between overflow-hidden shadow-sm group hover:border-[var(--ed-rust)] transition-colors"
                  >
                    {/* Image Area */}
                    <div className="h-40 bg-slate-50 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name}
                          className="h-full w-full object-cover p-0 group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={34} className="mb-1" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                            Pas de photo
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          cat.is_active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {cat.is_active ? 'Visible' : 'Masquée'}
                      </span>

                      <span className="absolute top-2.5 right-2.5 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-500 ed-mono">
                        #{cat.sort_order}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-base text-[var(--ed-ink)] leading-snug">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {cat.description || 'Sans description.'}
                        </p>
                        <span className="inline-block mt-2 text-[10px] text-slate-400 ed-mono bg-slate-100 px-2 py-0.5">
                          /category/{cat.slug}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <button
                          onClick={() => handleToggleActiveCat(cat)}
                          className="text-xs font-semibold text-slate-500 hover:text-[var(--ed-ink)] flex items-center gap-1 cursor-pointer"
                          title={cat.is_active ? 'Masquer' : 'Rendre visible'}
                        >
                          {cat.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                          <span className="text-[11px]">{cat.is_active ? 'Masquer' : 'Afficher'}</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCat(cat)}
                            className="p-1.5 text-slate-600 hover:text-[var(--ed-ink)] hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Modifier"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Brands */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[var(--ed-line)] p-5">
              <div>
                <h2 className="ed-display text-2xl font-bold">Gestion des Marques</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gérez les marques partenaires, leurs logos et leur apparition dans le bouton mobile.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={loadBrands}
                  className="p-2 border border-slate-200 text-slate-500 hover:text-[var(--ed-ink)] hover:bg-slate-50 transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={15} className={brandsLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleOpenAddBrand}
                  className="bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nouvelle Marque</span>
                </button>
              </div>
            </div>

            {brandsLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2 text-[var(--ed-rust)]" size={24} />
                <p className="text-xs font-semibold">Chargement des marques...</p>
              </div>
            ) : brands.length === 0 ? (
              <div className="bg-white border border-[var(--ed-line)] p-12 text-center text-slate-400">
                <Tag size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-slate-700">Aucune marque trouvée</p>
                <p className="text-xs text-slate-400 mt-1">Cliquez sur "Nouvelle Marque" pour en ajouter une.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    className="bg-white border border-[var(--ed-line)] flex flex-col justify-between overflow-hidden shadow-sm group hover:border-[var(--ed-rust)] transition-colors p-4"
                  >
                    {/* Logo Area */}
                    <div className="h-24 bg-slate-50 relative flex items-center justify-center border border-slate-100 rounded overflow-hidden p-2">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="font-black text-xl tracking-wider text-slate-700 ed-display">
                          {brand.name}
                        </span>
                      )}

                      <span
                        className={`absolute top-1.5 left-1.5 h-2 w-2 rounded-full ${
                          brand.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={brand.is_active ? 'Active' : 'Masquée'}
                      />
                    </div>

                    {/* Brand Details */}
                    <div className="mt-3 text-center">
                      <h3 className="font-bold text-sm text-[var(--ed-ink)] uppercase tracking-wider truncate">
                        {brand.name}
                      </h3>
                      <span className="text-[10px] text-slate-400 ed-mono block mt-0.5">
                        /brand/{brand.slug}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleActiveBrand(brand)}
                        className="text-xs text-slate-500 hover:text-[var(--ed-ink)] cursor-pointer"
                        title={brand.is_active ? 'Masquer' : 'Activer'}
                      >
                        {brand.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditBrand(brand)}
                          className="p-1 text-slate-600 hover:text-[var(--ed-ink)] hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteBrand(brand)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Types d'équipements */}
        {activeTab === 'types' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-[var(--ed-line)] p-5">
              <div>
                <h2 className="ed-display text-2xl font-bold">Types d’équipements & Matériel</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Gestion des types d'équipements (مثقاب، أحذية، مضخة، ميزان...) pour alimenter les filtres de la boutique et faciliter la recherche des artisans.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <button
                  onClick={loadProducts}
                  className="p-2 border border-slate-200 text-slate-500 hover:text-[var(--ed-ink)] hover:bg-slate-50 transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={15} className={productsLoading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nouveau Produit avec Type</span>
                </button>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[var(--ed-line)] p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-50 border border-amber-200 flex items-center justify-center text-[var(--ed-rust)] font-bold">
                  <Wrench size={18} />
                </div>
                <div>
                  <div className="text-xl font-black text-[var(--ed-ink)]">{typesStats.length}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Types répertoriés</div>
                </div>
              </div>

              <div className="bg-white border border-[var(--ed-line)] p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-xl font-black text-[var(--ed-ink)]">{products.filter((p) => p.product_type).length}</div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Produits typés</div>
                </div>
              </div>

              <div className="bg-white border border-[var(--ed-line)] p-4 flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="text-xl font-black text-[var(--ed-ink)]">
                    {products.filter((p) => !p.product_type).length}
                  </div>
                  <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Sans type explicite</div>
                </div>
              </div>
            </div>

            {/* Search & Suggested Types Bar */}
            <div className="bg-white border border-[var(--ed-line)] p-4 space-y-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un type d'équipement (ex: perceuse, pompe, chaussures...)"
                  value={typeSearch}
                  onChange={(e) => setTypeSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 text-xs focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              {/* Suggestions chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 font-semibold mr-1">Types standards :</span>
                {[
                  { label: 'Perceuse (مثقاب)', val: 'Perceuse' },
                  { label: 'Visseuse (مفك)', val: 'Visseuse' },
                  { label: 'Meuleuse (صاروخ)', val: 'Meuleuse' },
                  { label: 'Niveau laser (ليزر)', val: 'Niveau laser' },
                  { label: 'Pompe à eau (مضخة)', val: 'Pompe à eau' },
                  { label: 'Chaussures (أحذية)', val: 'Chaussures de sécurité' },
                  { label: 'Poste à souder (لحام)', val: 'Poste à souder' },
                  { label: 'Compresseur (ضاغط)', val: 'Compresseur' },
                  { label: 'Palan & levage (رافعة)', val: 'Palan & levage' },
                  { label: 'Multimètre (قياس)', val: 'Multimètre & mesure' },
                  { label: 'Plomberie (سباكة)', val: 'Plomberie & tuyauterie' },
                ].map((chip) => {
                  const existingCount = typesStats.find((t) => t.name.toLowerCase() === chip.val.toLowerCase())?.count || 0;
                  return (
                    <button
                      key={chip.val}
                      onClick={() => {
                        if (existingCount > 0) {
                          setSelectedTypeFilter(chip.val);
                          setActiveTab('products');
                        } else {
                          handleOpenAddProduct();
                          setEditingProduct((prev) => ({
                            ...prev,
                            product_type: chip.val,
                          }));
                        }
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        existingCount > 0
                          ? 'bg-amber-50 border-amber-200 text-[var(--ed-ink)] font-bold hover:bg-amber-100'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      title={existingCount > 0 ? `${existingCount} produits — Cliquer pour voir` : `0 produit — Cliquer pour créer un produit`}
                    >
                      <span>{chip.label}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded ${existingCount > 0 ? 'bg-[var(--ed-rust)] text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {existingCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Types Cards Grid */}
            {typesStats.length === 0 ? (
              <div className="bg-white border border-[var(--ed-line)] p-12 text-center text-slate-400">
                <Wrench size={40} className="mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-slate-700">Aucun type d'équipement enregistré</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Attribuez un type à vos produits existants lors de la modification ou créez un nouveau produit avec un type défini.
                </p>
              </div>
            ) : (() => {
              const filteredTypes = typesStats.filter((t) =>
                !typeSearch.trim() || t.name.toLowerCase().includes(typeSearch.toLowerCase().trim())
              );

              if (filteredTypes.length === 0) {
                return (
                  <div className="bg-white border border-[var(--ed-line)] p-8 text-center text-slate-400">
                    <p className="font-semibold text-slate-700">Aucun type ne correspond à la recherche "{typeSearch}"</p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTypes.map((typeItem) => (
                    <div
                      key={typeItem.name}
                      className="bg-white border border-[var(--ed-line)] p-4 flex flex-col justify-between hover:border-[var(--ed-rust)] transition-all shadow-xs"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                              <Wrench size={14} />
                            </div>
                            <div>
                              <h3 className="font-bold text-sm text-[var(--ed-ink)] leading-tight">{typeItem.name}</h3>
                              <span className="text-[10px] text-slate-400 ed-mono">Type d’équipement</span>
                            </div>
                          </div>
                          <span className="bg-[var(--ed-ink)] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {typeItem.count} {typeItem.count > 1 ? 'produits' : 'produit'}
                          </span>
                        </div>

                        {/* List preview of up to 3 products */}
                        <div className="border-t border-slate-100 pt-2.5 mt-2 space-y-1.5">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Références associées :</p>
                          {typeItem.products.slice(0, 3).map((prod) => (
                            <div key={prod.id} className="flex items-center justify-between text-xs text-slate-700 gap-2">
                              <span className="truncate" title={prod.name}>• {prod.name}</span>
                              <span className="text-[10px] ed-mono text-slate-500 shrink-0">{formatDzd(prod.price)}</span>
                            </div>
                          ))}
                          {typeItem.products.length > 3 && (
                            <p className="text-[10px] text-slate-400 italic">
                              + {typeItem.products.length - 3} autre(s) référence(s)...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t border-slate-100 pt-3 mt-4 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            setSelectedTypeFilter(typeItem.name);
                            setActiveTab('products');
                          }}
                          className="flex-1 text-center bg-slate-50 hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] border border-slate-200 text-xs font-semibold py-1.5 transition-colors cursor-pointer"
                        >
                          Voir les produits
                        </button>
                        <button
                          onClick={() => {
                            handleOpenAddProduct();
                            setEditingProduct((prev) => ({
                              ...prev,
                              product_type: typeItem.name,
                            }));
                          }}
                          className="bg-amber-50 hover:bg-amber-100 text-[var(--ed-rust)] border border-amber-200 text-xs font-bold px-2.5 py-1.5 transition-colors cursor-pointer flex items-center gap-1"
                          title="Ajouter un produit sous ce type"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab: Products */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white border border-[var(--ed-line)] p-5">
              <div>
                <h2 className="ed-display text-2xl font-bold">Gestion des Produits</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Catalogue complet : photos (jusqu'à 5), caractéristiques techniques (jusqu'à 10), prix et gestion du stock.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                <button
                  onClick={handleSeedProducts}
                  disabled={seeding}
                  className="border border-[var(--ed-line)] bg-slate-50 hover:bg-slate-100 text-[var(--ed-ink)] text-xs font-semibold px-3 py-2.5 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Importer les 10 produits du catalogue KADYA DZ"
                >
                  <RefreshCw size={13} className={seeding ? 'animate-spin' : ''} />
                  <span>{seeding ? 'Importation...' : 'Importer les 10 produits par défaut'}</span>
                </button>

                <button
                  onClick={loadProducts}
                  className="p-2 border border-slate-200 text-slate-500 hover:text-[var(--ed-ink)] hover:bg-slate-50 transition-colors"
                  title="Rafraîchir"
                >
                  <RefreshCw size={15} className={productsLoading ? 'animate-spin' : ''} />
                </button>

                <button
                  onClick={handleOpenAddProduct}
                  className="bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Nouveau Produit</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-[var(--ed-line)] p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, référence ou marque..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 text-xs focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Category filter */}
                <select
                  value={selectedCatFilter}
                  onChange={(e) => setSelectedCatFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Brand filter */}
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                >
                  <option value="">Toutes les marques</option>
                  {brands.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>

                {/* Type filter */}
                {adminAvailableTypes.length > 0 && (
                  <select
                    value={selectedTypeFilter}
                    onChange={(e) => setSelectedTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-200 text-xs bg-white text-slate-700 outline-none"
                  >
                    <option value="">Tous les types d'équipements</option>
                    {adminAvailableTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Products List / Grid */}
            {productsLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="animate-spin mx-auto mb-2 text-[var(--ed-rust)]" size={24} />
                <p className="text-xs font-semibold">Chargement des produits...</p>
              </div>
            ) : (() => {
              const filteredList = products.filter((p) => {
                const matchQuery =
                  !productSearch.trim() ||
                  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.slug.toLowerCase().includes(productSearch.toLowerCase()) ||
                  (p.brand_name && p.brand_name.toLowerCase().includes(productSearch.toLowerCase())) ||
                  (p.product_type && p.product_type.toLowerCase().includes(productSearch.toLowerCase()));
                const matchCat =
                  !selectedCatFilter ||
                  (p.category_slug && p.category_slug.toLowerCase() === selectedCatFilter.toLowerCase());
                const matchBrand =
                  !selectedBrandFilter ||
                  (p.brand_name && p.brand_name.toLowerCase() === selectedBrandFilter.toLowerCase());
                const matchType =
                  !selectedTypeFilter ||
                  (p.product_type && p.product_type.toLowerCase() === selectedTypeFilter.toLowerCase());
                return matchQuery && matchCat && matchBrand && matchType;
              });

              if (filteredList.length === 0) {
                return (
                  <div className="bg-white border border-[var(--ed-line)] p-12 text-center text-slate-400">
                    <Package size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-slate-700">Aucun produit trouvé</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      {products.length === 0
                        ? 'Vous pouvez créer un nouveau produit manuellement ou importer les 10 produits du catalogue en un clic.'
                        : 'Aucun produit ne correspond aux critères de recherche.'}
                    </p>
                    {products.length === 0 && (
                      <div className="mt-5 flex justify-center gap-3">
                        <button
                          onClick={handleSeedProducts}
                          disabled={seeding}
                          className="bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <RefreshCw size={14} className={seeding ? 'animate-spin' : ''} />
                          <span>Importer les 10 produits du catalogue</span>
                        </button>
                        <button
                          onClick={handleOpenAddProduct}
                          className="border border-[var(--ed-line)] bg-white hover:bg-slate-50 text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Nouveau produit</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredList.map((product) => {
                    const coverImg = product.images && product.images.length > 0 ? product.images[0] : null;
                    const imgCount = product.images ? product.images.length : 0;
                    const specsCount = product.specs ? product.specs.length : 0;

                    return (
                      <div
                        key={product.id}
                        className="bg-white border border-[var(--ed-line)] flex flex-col justify-between overflow-hidden shadow-sm group hover:border-[var(--ed-rust)] transition-colors"
                      >
                        {/* Cover Image & Badges */}
                        <div className="h-48 bg-slate-50 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                          {coverImg ? (
                            <img
                              src={coverImg}
                              alt={product.name}
                              className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-300">
                              <ImageIcon size={34} className="mb-1" />
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                Sans photo
                              </span>
                            </div>
                          )}

                          {/* Image count badge */}
                          {imgCount > 0 && (
                            <span className="absolute bottom-2 left-2 bg-black/70 text-white px-1.5 py-0.5 text-[10px] font-bold rounded flex items-center gap-1">
                              <ImageIcon size={10} />
                              <span>{imgCount} / 5</span>
                            </span>
                          )}

                          {/* Stock status toggle button */}
                          <button
                            onClick={() => handleToggleStockProduct(product)}
                            className={`absolute top-2.5 left-2.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer transition-colors ${
                              product.in_stock
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-rose-600 text-white hover:bg-rose-700'
                            }`}
                            title="Cliquer pour changer l'état du stock"
                          >
                            {product.in_stock ? 'En stock' : 'Rupture'}
                          </button>

                          {/* Visibility badge */}
                          <button
                            onClick={() => handleToggleActiveProduct(product)}
                            className={`absolute top-2.5 right-2.5 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded cursor-pointer ${
                              product.is_active
                                ? 'bg-white text-slate-700 hover:bg-slate-100'
                                : 'bg-slate-800 text-white hover:bg-slate-900'
                            }`}
                            title={product.is_active ? 'Visible sur la boutique' : 'Masqué sur la boutique'}
                          >
                            {product.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          </button>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              {product.brand_name && (
                                <span className="ed-mono text-[10px] font-bold uppercase tracking-wider text-[var(--ed-rust)] bg-amber-50 px-1.5 py-0.5 border border-amber-200">
                                  {product.brand_name}
                                </span>
                              )}
                              {product.product_type && (
                                <span className="ed-mono text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-1.5 py-0.5 border border-sky-200">
                                  {product.product_type}
                                </span>
                              )}
                              {product.category_slug && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 truncate max-w-[120px]">
                                  {categories.find((c) => c.slug === product.category_slug)?.name || product.category_slug}
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-sm text-[var(--ed-ink)] leading-snug line-clamp-2" title={product.name}>
                              {product.name}
                            </h3>

                            {product.summary && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                {product.summary}
                              </p>
                            )}

                            {/* Pricing */}
                            <div className="mt-3 flex items-baseline gap-2">
                              <span className="font-extrabold text-base text-[var(--ed-ink)]">
                                {formatDzd(product.price)}
                              </span>
                              {product.old_price && product.old_price > product.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  {formatDzd(product.old_price)}
                                </span>
                              )}
                            </div>

                            {/* Specs count indicator */}
                            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                              <span>● {specsCount} / 10 spécification{specsCount > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 ed-mono truncate max-w-[120px]">
                              /{product.slug}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditProduct(product)}
                                className="p-1.5 text-slate-600 hover:text-[var(--ed-ink)] hover:bg-slate-100 transition-colors cursor-pointer rounded"
                                title="Modifier le produit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer rounded"
                                title="Supprimer le produit"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* Modal Add / Edit Category */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg border border-[var(--ed-line)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#f8f7f3]">
              <h3 className="font-bold text-base text-[var(--ed-ink)]">
                {editingCat?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              {catError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{catError}</span>
                </div>
              )}

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Photo de fond de la catégorie
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center overflow-hidden relative">
                    {catImagePreview ? (
                      <img
                        src={catImagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                      <UploadCloud size={15} />
                      <span>{catImagePreview ? 'Changer la photo' : 'Téléverser une photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Photo d'atelier ou outils. Sera affichée en fond avec un voile protecteur.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom de la catégorie *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat?.name || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const slugVal = val
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    setEditingCat((prev) => ({
                      ...prev,
                      name: val,
                      slug: prev?.id ? prev.slug : slugVal,
                    }));
                  }}
                  placeholder="Ex: Outillage électroportatif"
                  className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Lien / Slug (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCat?.slug || ''}
                  onChange={(e) =>
                    setEditingCat((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="outillage-electroportatif"
                  className="w-full px-3.5 py-2 border border-slate-300 text-xs ed-mono focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description / Sous-titre
                </label>
                <input
                  type="text"
                  value={editingCat?.description || ''}
                  onChange={(e) =>
                    setEditingCat((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Ex: Perceuses, meuleuses, batteries"
                  className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={editingCat?.sort_order ?? 0}
                    onChange={(e) =>
                      setEditingCat((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Visibilité
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingCat?.is_active ?? true}
                      onChange={(e) =>
                        setEditingCat((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="h-4 w-4 rounded accent-[var(--ed-rust)]"
                    />
                    <span>Visible sur le magasin</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="px-5 py-2.5 bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {catSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Téléversement...</span>
                    </>
                  ) : (
                    <span>Enregistrer la catégorie</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Brand */}
      {isBrandModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg border border-[var(--ed-line)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#f8f7f3]">
              <h3 className="font-bold text-base text-[var(--ed-ink)]">
                {editingBrand?.id ? 'Modifier la marque' : 'Nouvelle marque'}
              </h3>
              <button
                onClick={() => setIsBrandModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-6 space-y-4">
              {brandError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{brandError}</span>
                </div>
              )}

              {/* Logo Upload Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Logo de la marque (Optionnel)
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-24 shrink-0 bg-slate-50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center overflow-hidden p-1">
                    {brandLogoPreview ? (
                      <img
                        src={brandLogoPreview}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Tag size={24} className="text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1">
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors">
                      <UploadCloud size={15} />
                      <span>{brandLogoPreview ? 'Changer le logo' : 'Téléverser le logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      Logo au format PNG ou WebP avec fond transparent de préférence.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Nom de la marque *
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand?.name || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const slugVal = val
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)+/g, '');
                    setEditingBrand((prev) => ({
                      ...prev,
                      name: val,
                      slug: prev?.id ? prev.slug : slugVal,
                    }));
                  }}
                  placeholder="Ex: CROWN, TOTAL, INGCO"
                  className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Lien / Slug (URL) *
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand?.slug || ''}
                  onChange={(e) =>
                    setEditingBrand((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="crown"
                  className="w-full px-3.5 py-2 border border-slate-300 text-xs ed-mono focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description courte (Optionnelle)
                </label>
                <input
                  type="text"
                  value={editingBrand?.description || ''}
                  onChange={(e) =>
                    setEditingBrand((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Ex: Outillage électroportatif robuste"
                  className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={editingBrand?.sort_order ?? 0}
                    onChange={(e) =>
                      setEditingBrand((prev) => ({
                        ...prev,
                        sort_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Visibilité
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingBrand?.is_active ?? true}
                      onChange={(e) =>
                        setEditingBrand((prev) => ({ ...prev, is_active: e.target.checked }))
                      }
                      className="h-4 w-4 rounded accent-[var(--ed-rust)]"
                    />
                    <span>Visible sur le magasin</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBrandModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={brandSaving}
                  className="px-5 py-2.5 bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {brandSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <span>Enregistrer la marque</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Product */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl border border-[var(--ed-line)] shadow-2xl my-6 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-[#f8f7f3]">
              <div>
                <h3 className="font-bold text-base text-[var(--ed-ink)]">
                  {editingProduct?.id ? 'Modifier le produit' : 'Nouveau produit'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remplissez la fiche produit, les tarifs, la galerie photos et les caractéristiques techniques.
                </p>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 hover:bg-slate-200 text-slate-500 cursor-pointer rounded"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {productError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 rounded">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{productError}</span>
                </div>
              )}

              {/* SECTION 1: Informations Générales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Package size={16} className="text-[var(--ed-rust)]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    1. Informations Générales
                  </h4>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Perceuse-visseuse sans fil 20V CROWN CT38084"
                    value={editingProduct?.name || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditingProduct((prev) => ({
                        ...prev,
                        name: val,
                        // Auto-generate slug if not manually touched
                        slug: prev?.id ? prev.slug : val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
                      }));
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Catégorie *
                    </label>
                    <select
                      required
                      value={editingProduct?.category_slug || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          category_slug: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none bg-white"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Marque *
                    </label>
                    <select
                      required
                      value={editingProduct?.brand_name || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          brand_name: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none bg-white"
                    >
                      <option value="">Sélectionner une marque</option>
                      {brands.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Type d'équipement / نوع المنتج */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Type d'équipement / نوع المنتج
                    </label>
                    <span className="text-[11px] text-slate-400">Pour le filtre par type (مثقاب، أحذية، مضخة...)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Perceuse, Visseuse, Chaussures de sécurité, Pompe à eau..."
                    value={editingProduct?.product_type || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        product_type: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 border border-slate-300 text-sm focus:border-[var(--ed-ink)] focus:outline-none bg-white"
                  />
                  {/* Quick selection chips */}
                  <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] text-slate-400 mr-1">Suggestions rapides :</span>
                    {[
                      { label: 'Perceuse (مثقاب)', val: 'Perceuse' },
                      { label: 'Visseuse (مفك)', val: 'Visseuse' },
                      { label: 'Meuleuse (صاروخ)', val: 'Meuleuse' },
                      { label: 'Niveau laser (ليزر)', val: 'Niveau laser' },
                      { label: 'Pompe à eau (مضخة)', val: 'Pompe à eau' },
                      { label: 'Chaussures (أحذية)', val: 'Chaussures de sécurité' },
                      { label: 'Poste à souder (لحام)', val: 'Poste à souder' },
                      { label: 'Compresseur (ضاغط)', val: 'Compresseur' },
                      { label: 'Palan & levage (رافعة)', val: 'Palan & levage' },
                      { label: 'Multimètre (قياس)', val: 'Multimètre & mesure' },
                      { label: 'Plomberie (سباكة)', val: 'Plomberie & tuyauterie' },
                    ].map((chip) => (
                      <button
                        key={chip.val}
                        type="button"
                        onClick={() =>
                          setEditingProduct((prev) => ({
                            ...prev,
                            product_type: chip.val,
                          }))
                        }
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          editingProduct?.product_type === chip.val
                            ? 'bg-[var(--ed-ink)] text-white border-[var(--ed-ink)]'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Slug d'accès (URL)
                  </label>
                  <input
                    type="text"
                    placeholder="crown-perceuse-visseuse-20v"
                    value={editingProduct?.slug || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-'),
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 text-xs ed-mono focus:border-[var(--ed-ink)] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    URL générée : /product/{editingProduct?.slug || 'mon-produit'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Résumé court (Accroche atelier)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Couple 50 Nm, 2 vitesses, mandrin auto-serrant 13 mm, 2 batteries 2.0 Ah incluses."
                    value={editingProduct?.summary || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        summary: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 text-xs focus:border-[var(--ed-ink)] focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* SECTION 2: Tarification & Stock */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Tag size={16} className="text-[var(--ed-rust)]" />
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    2. Tarifs & Disponibilité
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Prix de vente (DZD) *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={50}
                      placeholder="18500"
                      value={editingProduct?.price || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          price: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 text-sm font-bold text-[var(--ed-ink)] focus:border-[var(--ed-ink)] focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Affichage : {formatDzd(editingProduct?.price || 0)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Ancien prix barré (Optionnel)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="21000"
                      value={editingProduct?.old_price || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          old_price: e.target.value ? parseFloat(e.target.value) : undefined,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 border border-slate-300 text-sm text-slate-600 focus:border-[var(--ed-ink)] focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Permet d'afficher une promotion barrée
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingProduct?.in_stock ?? true}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          in_stock: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-emerald-600"
                    />
                    <span>En stock (Disponible immédiatement à la commande)</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={editingProduct?.is_active ?? true}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded accent-[var(--ed-rust)]"
                    />
                    <span>Actif (Visible sur le catalogue public)</span>
                  </label>
                </div>
              </div>

              {/* SECTION 3: Galerie de Photos (Max 5) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-[var(--ed-rust)]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      3. Galerie de Photos (Jusqu'à 5 photos)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {productImages.filter(Boolean).length} / 5 photos ajoutées
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  La <strong>première photo</strong> sera utilisée comme photo de couverture principale. Formats recommandés : WEBP, PNG ou JPG fond blanc.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map((slotIdx) => {
                    const imgUrl = productImages[slotIdx];
                    const isCover = slotIdx === 0;

                    return (
                      <div
                        key={slotIdx}
                        className={`relative border flex flex-col items-center justify-center h-36 rounded overflow-hidden transition-all ${
                          imgUrl
                            ? 'border-slate-300 bg-white shadow-xs'
                            : 'border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        {/* Cover Badge */}
                        {isCover && (
                          <span className="absolute top-1.5 left-1.5 z-10 bg-[var(--ed-yellow)] text-[var(--ed-ink)] text-[9px] font-black uppercase px-1.5 py-0.5 shadow-xs">
                            Couverture
                          </span>
                        )}

                        {imgUrl ? (
                          <>
                            <img
                              src={imgUrl}
                              alt={`Slot ${slotIdx + 1}`}
                              className="h-full w-full object-contain p-2"
                            />
                            {/* Action overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <label className="p-1.5 bg-white text-slate-700 rounded hover:bg-slate-100 cursor-pointer shadow-md">
                                <UploadCloud size={14} />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                      handleProductImageSlotChange(slotIdx, e.target.files[0]);
                                    }
                                  }}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => handleRemoveProductImageSlot(slotIdx)}
                                className="p-1.5 bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer shadow-md"
                                title="Supprimer cette photo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-3 text-center">
                            <UploadCloud size={22} className="text-slate-400 mb-1" />
                            <span className="text-[10px] font-bold text-slate-600">
                              {isCover ? 'Photo 1 (Cover)' : `Photo ${slotIdx + 1}`}
                            </span>
                            <span className="text-[9px] text-slate-400 mt-0.5">Choisir</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleProductImageSlotChange(slotIdx, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 4: Fiche Technique & Spécifications (Max 10) */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[var(--ed-rust)]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                      4. Fiche Technique & Spécifications (Jusqu'à 10 lignes)
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {productSpecs.length} / 10 lignes
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Introduction / Synthèse technique
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Équipée d'un moteur haute performance avec technologie Brushless garantissant une autonomie supérieure."
                    value={editingProduct?.tech_summary || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        tech_summary: e.target.value,
                      }))
                    }
                    className="w-full px-3.5 py-2 border border-slate-300 text-xs focus:border-[var(--ed-ink)] focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Lignes de spécifications (Affichage technique)
                  </label>

                  {productSpecs.map((spec, specIdx) => (
                    <div key={specIdx} className="flex items-center gap-2">
                      <span className="ed-mono text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-2 border border-slate-200 shrink-0">
                        {String(specIdx + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        placeholder={`Spécification ${specIdx + 1} (ex: Tension 20V Max, Mandrin 13mm acier...)`}
                        value={spec}
                        onChange={(e) => handleSpecChange(specIdx, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 text-xs focus:border-[var(--ed-ink)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(specIdx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}

                  {productSpecs.length < 10 && (
                    <button
                      type="button"
                      onClick={handleAddSpecLine}
                      className="mt-2 text-xs font-bold text-[var(--ed-rust)] hover:text-[var(--ed-ink)] flex items-center gap-1.5 py-1.5 px-2.5 border border-dashed border-[var(--ed-rust)]/40 hover:border-[var(--ed-rust)] transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Ajouter une caractéristique ({10 - productSpecs.length} restantes)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 sticky bottom-0 bg-white py-3">
                {productError && (
                  <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 rounded">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{productError}</span>
                  </div>
                )}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={productSaving}
                    className="px-6 py-2.5 bg-[var(--ed-yellow)] hover:bg-[var(--ed-ink)] hover:text-white text-[var(--ed-ink)] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                  >
                    {productSaving ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Téléversement et enregistrement...</span>
                      </>
                    ) : (
                      <span>Enregistrer le produit</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
