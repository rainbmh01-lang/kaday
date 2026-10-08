import React, { useState, useEffect } from 'react';
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
} from '@/lib/store-data';

type Tab = 'products' | 'categories' | 'brands';

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

  useEffect(() => {
    if (session) {
      loadCategories();
      loadBrands();
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
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2.5 pb-3.5 px-2 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'products'
                ? 'border-[var(--ed-rust)] text-[var(--ed-rust)]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Package size={17} />
            <span>Produits (Catalogue)</span>
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

        {/* Tab: Products placeholder */}
        {activeTab === 'products' && (
          <div className="bg-white border border-[var(--ed-line)] p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
              <div>
                <h2 className="ed-display text-2xl font-bold">Gestion des Produits</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ajout, modification, photos (max 5), fiche technique (max 10 lignes) et prix.
                </p>
              </div>
              <button className="bg-[var(--ed-yellow)] text-[var(--ed-ink)] text-xs font-bold px-4 py-2.5 flex items-center gap-2">
                <Plus size={15} />
                <span>Nouveau Produit</span>
              </button>
            </div>
            <div className="py-12 text-center text-slate-400">
              <Package size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-slate-600">Module Produits prêt pour l'étape suivante (Étape 5)</p>
            </div>
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
    </div>
  );
}
