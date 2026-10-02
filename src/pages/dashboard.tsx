import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import {
  ArrowDownUp,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Filter,
  Layers,
  Megaphone,
  Package,
  PhoneCall,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Truck,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { formatDzd } from '@/data/store';
import {
  getOrders,
  saveOrder,
  updateOrderStatus,
  deleteOrder,
  exportOrdersToCSV,
  syncOrderToGoogleSheet,
  syncAllUnsynced,
  getSheetSettings,
  saveSheetSettings,
  DEFAULT_SHEET_URL,
  type Order,
  type OrderStatus,
} from '@/lib/orders';
import { sendMetaEvent } from '@/lib/meta-tracker';

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; border: string }> = {
  Nouveau: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  Confirmé: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  'En livraison': { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  Livré: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  Annulé: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

const PIE_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'kadya2024';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('kadyadz_admin_auth') === 'true';
  });
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'orders' | 'analytics' | 'marketing' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [sheetSettings, setLocalSheetSettings] = useState(getSheetSettings());
  const [webhookInput, setWebhookInput] = useState(sheetSettings.webhookUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New manual order form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newWilaya, setNewWilaya] = useState('16 - Alger');
  const [newDeliveryType, setNewDeliveryType] = useState<'desk' | 'home'>('desk');
  const [newProductName, setNewProductName] = useState('Perceuse-Visseuse CROWN 20V');
  const [newTotal, setNewTotal] = useState(13000);

  // Marketing simulator state
  const [testEventStatus, setTestEventStatus] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setLocalSheetSettings(getSheetSettings());
  }, []);

  const refreshOrders = () => {
    setOrders(getOrders());
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search.trim() ||
        o.fullName.toLowerCase().includes(search.toLowerCase()) ||
        o.phone.includes(search) ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.wilaya.toLowerCase().includes(search.toLowerCase()) ||
        o.productName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Tous' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  // Analytics Metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status !== 'Annulé')
      .reduce((sum, o) => sum + o.total, 0);
    const newCount = orders.filter((o) => o.status === 'Nouveau').length;
    const confirmedCount = orders.filter((o) => o.status === 'Confirmé' || o.status === 'En livraison' || o.status === 'Livré').length;
    const deliveredCount = orders.filter((o) => o.status === 'Livré').length;
    const aov = totalOrders > 0 ? Math.round(totalRevenue / (totalOrders - orders.filter((o) => o.status === 'Annulé').length || 1)) : 0;
    const confirmationRate = totalOrders > 0 ? Math.round((confirmedCount / totalOrders) * 100) : 0;

    return {
      totalOrders,
      totalRevenue,
      newCount,
      confirmedCount,
      deliveredCount,
      aov,
      confirmationRate,
    };
  }, [orders]);

  // Chart: Status distribution
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {
      Nouveau: 0,
      Confirmé: 0,
      'En livraison': 0,
      Livré: 0,
      Annulé: 0,
    };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) counts[o.status]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Chart: Wilaya breakdown
  const wilayaChartData = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      const w = o.wilaya.split('-')[1]?.trim() || o.wilaya;
      map[w] = (map[w] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    refreshOrders();
  };

  const handleDelete = (orderId: string) => {
    if (window.confirm('Supprimer cette commande ?')) {
      deleteOrder(orderId);
      refreshOrders();
    }
  };

  const handleSyncAll = async () => {
    const currentSettings = getSheetSettings();
    if (!currentSettings.webhookUrl) {
      setSyncFeedback('⚠️ Veuillez d\'abord coller votre URL Webhook Google Apps Script dans l\'onglet "Google Sheets & Sync" pour activer la synchronisation automatique.');
      setActiveTab('settings');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncAllUnsynced(currentSettings.webhookUrl);
      if (res.success > 0) {
        setSyncFeedback(`✅ ${res.success} commande(s) synchronisée(s) avec succès vers votre Google Sheet !`);
      } else if (res.failed > 0) {
        setSyncFeedback(`⚠️ Échec de l'envoi (${res.failed} erreurs). Vérifiez que l'URL Webhook est déployée en accès "Tout le monde" (Anyone).`);
      } else {
        setSyncFeedback('Toutes les commandes sont déjà synchronisées.');
      }
      refreshOrders();
    } catch {
      setSyncFeedback('Erreur lors de la synchronisation.');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSheetSettings({ webhookUrl: webhookInput });
    setLocalSheetSettings(getSheetSettings());
    setSyncFeedback('Paramètres Google Sheet enregistrés avec succès !');
    setTimeout(() => setSyncFeedback(null), 3000);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;
    saveOrder({
      fullName: newClientName,
      phone: newClientPhone,
      wilaya: newWilaya,
      deliveryType: newDeliveryType,
      productName: newProductName,
      quantity: 1,
      total: Number(newTotal),
      status: 'Confirmé',
    });
    setShowAddModal(false);
    setNewClientName('');
    setNewClientPhone('');
    refreshOrders();
  };

  const handleSendMetaTest = async (eventName: string) => {
    setSendingTest(true);
    setTestEventStatus(null);
    try {
      const eventId = await sendMetaEvent(eventName, {
        value: 12500,
        currency: 'DZD',
        content_name: 'Test Live Dashboard Event',
      });
      setTestEventStatus(`Événement ${eventName} envoyé avec succès (ID: ${eventId})`);
    } catch (e: any) {
      setTestEventStatus(`Erreur d'envoi: ${e?.message}`);
    } finally {
      setSendingTest(false);
    }
  };

  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTestWebhook = async () => {
    const url = webhookInput.trim();
    if (!url) {
      setTestResult('⚠️ Veuillez d’abord renseigner une URL de Webhook.');
      return;
    }
    setTestingWebhook(true);
    setTestResult(null);
    try {
      const ok = await syncOrderToGoogleSheet(
        {
          id: `KD-TEST-${Math.floor(100 + Math.random() * 900)}`,
          date: new Date().toISOString(),
          fullName: 'Test Synchronisation Kadya DZ',
          phone: '0550000000',
          wilaya: '16 - Alger',
          deliveryType: 'home',
          productName: 'Ligne de test automatique',
          quantity: 1,
          total: 1000,
          status: 'Nouveau',
        },
        url
      );
      if (ok) {
        setTestResult('✅ Succès ! Une ligne de test a été envoyée vers votre Google Sheet. Vérifiez votre fichier.');
      } else {
        setTestResult('⚠️ Échec de l\'envoi. Vérifiez que le déploiement Apps Script est bien configuré avec l\'accès "Tout le monde" (Anyone).');
      }
    } catch (e: any) {
      setTestResult(`Erreur: ${e?.message}`);
    } finally {
      setTestingWebhook(false);
    }
  };

  const appsScriptCode = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // Auto-create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "ID Commande", "Nom Client", "Téléphone", "Wilaya", "Mode Livraison", "Produit", "Quantité", "Total (DZD)", "Statut"]);
    }
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.date || new Date().toLocaleString("fr-FR"),
      data.orderId || "",
      data.fullName || "",
      "'" + (data.phone || ""),
      data.wilaya || "",
      data.deliveryType || "",
      data.productName || "",
      data.quantity || 1,
      data.total || 0,
      data.status || "Nouveau"
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser.trim() === ADMIN_USER && loginPass === ADMIN_PASS) {
      setIsAuthenticated(true);
      sessionStorage.setItem('kadyadz_admin_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Nom d’utilisateur ou mot de passe incorrect.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('kadyadz_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f4ef] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--ed-line)] bg-white p-6 sm:p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center bg-[var(--ed-yellow)] text-xl font-black text-[var(--ed-ink)]">
            K
          </div>
          <h1 className="ed-display text-2xl font-black text-[var(--ed-ink)]">
            KADYA <span className="text-[var(--ed-rust)]">DZ</span>
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Connexion Tableau de Bord
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4 text-left">
            {loginError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700 text-center">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-700">Utilisateur / Username</label>
              <input
                type="text"
                required
                autoFocus
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[var(--ed-ink)]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">Mot de passe / Password</label>
              <input
                type="password"
                required
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] px-3.5 py-2.5 text-sm font-medium outline-none focus:border-[var(--ed-ink)]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[var(--ed-yellow)] py-3 text-sm font-black text-[var(--ed-ink)] hover:bg-yellow-400 transition cursor-pointer shadow-xs"
            >
              Se connecter
            </button>
          </form>

          <div className="mt-6 border-t border-[var(--ed-line)] pt-4">
            <Link href="/" className="text-xs font-bold text-slate-500 hover:text-[var(--ed-rust)]">
              ← Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-[var(--ed-ink)]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-[var(--ed-line)] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center bg-[var(--ed-yellow)] text-sm font-black text-[var(--ed-ink)]">
                K
              </span>
              <span className="ed-display text-xl font-black">
                KADYA <span className="text-[var(--ed-rust)]">DZ</span>
              </span>
            </Link>
            <span className="hidden rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 sm:inline-block">
              Espace Ventes & Marketing
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={DEFAULT_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">Google Sheet Direct</span>
              <ExternalLink size={12} />
            </a>

            <Link
              href="/"
              className="rounded-lg border border-[var(--ed-line)] bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Voir la boutique
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Navigation Tabs */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ed-line)] pb-4">
          <div className="flex gap-2">
            {[
              { id: 'orders', label: 'Commandes', icon: ShoppingBag, count: orders.length },
              { id: 'analytics', label: 'Analytique & Ventes', icon: BarChart3 },
              { id: 'marketing', label: 'Marketing & Meta Ads', icon: Megaphone },
              { id: 'settings', label: 'Google Sheets & Sync', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--ed-ink)] text-white shadow-sm'
                      : 'border border-[var(--ed-line)] bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 rounded-full px-2 py-0.2 text-[10px] font-extrabold ${
                        isActive ? 'bg-[var(--ed-yellow)] text-[var(--ed-ink)]' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === 'orders' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportOrdersToCSV(filteredOrders)}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--ed-line)] bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:border-slate-400"
              >
                <Download size={14} />
                <span>Exporter CSV</span>
              </button>

              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                <span>{isSyncing ? 'Sync...' : 'Sync Sheet'}</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--ed-yellow)] px-3.5 py-2 text-xs font-black text-[var(--ed-ink)] shadow-xs hover:bg-yellow-400"
              >
                <Plus size={15} />
                <span>Ajouter</span>
              </button>
            </div>
          )}
        </div>

        {syncFeedback && (
          <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
            {syncFeedback}
          </div>
        )}

        {/* TAB 1: COMMANDES / ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Commandes</span>
                <p className="ed-display mt-2 text-3xl font-extrabold">{stats.totalOrders}</p>
                <p className="mt-1 text-xs text-slate-500">{stats.deliveredCount} livrées</p>
              </div>

              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-amber-600">À Confirmer</span>
                <p className="ed-display mt-2 text-3xl font-extrabold text-amber-600">{stats.newCount}</p>
                <p className="mt-1 text-xs text-slate-500">Nouveaux leads COD</p>
              </div>

              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-slate-400">Chiffre d’affaires</span>
                <p className="ed-display mt-2 text-2xl sm:text-3xl font-extrabold text-[var(--ed-rust)]">
                  {formatDzd(stats.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Panier moyen: {formatDzd(stats.aov)}</p>
              </div>

              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-4">
                <span className="text-[11px] font-bold uppercase text-emerald-600">Taux Confirmation</span>
                <p className="ed-display mt-2 text-3xl font-extrabold text-emerald-600">
                  {stats.confirmationRate}%
                </p>
                <p className="mt-1 text-xs text-slate-500">{stats.confirmedCount} confirmées</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--ed-line)] bg-white p-4 sm:flex-row sm:items-center">
              <div className="relative min-w-[260px] flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher par nom, téléphone, wilaya, ID..."
                  className="w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] py-2 pl-10 pr-4 text-xs sm:text-sm font-medium outline-none focus:border-[var(--ed-ink)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
                {['Tous', 'Nouveau', 'Confirmé', 'En livraison', 'Livré', 'Annulé'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[var(--ed-ink)] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--ed-line)] bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-[var(--ed-line)] bg-[#faf9f6] text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">ID / Date</th>
                      <th className="px-4 py-3.5">Client & Contact</th>
                      <th className="px-4 py-3.5">Wilaya & Livraison</th>
                      <th className="px-4 py-3.5">Produit</th>
                      <th className="px-4 py-3.5">Total DZD</th>
                      <th className="px-4 py-3.5">Statut</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--ed-line)]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          Aucune commande trouvée.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const colors = STATUS_COLORS[order.status] || STATUS_COLORS.Nouveau;
                        return (
                          <tr key={order.id} className="transition hover:bg-slate-50/70">
                            {/* ID / Date */}
                            <td className="px-4 py-3.5 align-middle">
                              <span className="font-mono text-xs font-extrabold text-[var(--ed-ink)]">
                                {order.id}
                              </span>
                              <div className="text-[11px] text-slate-400">
                                {new Date(order.date).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </td>

                            {/* Client & Phone */}
                            <td className="px-4 py-3.5 align-middle">
                              <p className="font-bold text-[var(--ed-ink)]">{order.fullName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <a
                                  href={`tel:${order.phone}`}
                                  className="flex items-center gap-1 font-mono text-xs text-blue-600 hover:underline"
                                >
                                  <PhoneCall size={12} />
                                  {order.phone}
                                </a>
                              </div>
                            </td>

                            {/* Wilaya & Mode */}
                            <td className="px-4 py-3.5 align-middle">
                              <p className="font-semibold text-slate-800">{order.wilaya}</p>
                              <span className="inline-block mt-0.5 text-[11px] text-slate-500">
                                {order.deliveryType === 'desk' ? '🏢 Bureau (Desk)' : '🏠 Domicile'}
                              </span>
                            </td>

                            {/* Product */}
                            <td className="max-w-[220px] px-4 py-3.5 align-middle">
                              <p className="truncate font-medium text-slate-800">{order.productName}</p>
                              <span className="text-[11px] text-slate-400">Qté: {order.quantity}</span>
                            </td>

                            {/* Total */}
                            <td className="px-4 py-3.5 align-middle">
                              <span className="font-extrabold text-[var(--ed-rust)]">
                                {formatDzd(order.total)}
                              </span>
                            </td>

                            {/* Status changer */}
                            <td className="px-4 py-3.5 align-middle">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none cursor-pointer ${colors.bg} ${colors.text} ${colors.border}`}
                              >
                                <option value="Nouveau">Nouveau</option>
                                <option value="Confirmé">Confirmé</option>
                                <option value="En livraison">En livraison</option>
                                <option value="Livré">Livré</option>
                                <option value="Annulé">Annulé</option>
                              </select>
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right align-middle">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  title="Synchroniser cette commande vers Google Sheet"
                                  onClick={async () => {
                                    const ok = await syncOrderToGoogleSheet(order);
                                    if (ok) refreshOrders();
                                  }}
                                  className={`rounded-lg p-1.5 text-xs ${
                                    order.syncedToSheet
                                      ? 'text-emerald-600 bg-emerald-50'
                                      : 'text-slate-400 hover:text-emerald-600'
                                  }`}
                                >
                                  <FileSpreadsheet size={15} />
                                </button>

                                <button
                                  title="Supprimer la commande"
                                  onClick={() => handleDelete(order.id)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Chiffre d'Affaires</span>
                  <TrendingUp className="text-emerald-600" size={20} />
                </div>
                <p className="ed-display mt-3 text-4xl font-extrabold text-[var(--ed-ink)]">
                  {formatDzd(stats.totalRevenue)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Calculé sur {stats.totalOrders} commandes totales</p>
              </div>

              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Panier Moyen (AOV)</span>
                  <ShoppingBag className="text-blue-600" size={20} />
                </div>
                <p className="ed-display mt-3 text-4xl font-extrabold text-blue-700">
                  {formatDzd(stats.aov)}
                </p>
                <p className="mt-1 text-xs text-slate-500">Moyenne par panier confirmé</p>
              </div>

              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Taux de Livraison Réussie</span>
                  <Truck className="text-purple-600" size={20} />
                </div>
                <p className="ed-display mt-3 text-4xl font-extrabold text-purple-700">
                  {stats.totalOrders > 0
                    ? Math.round((stats.deliveredCount / stats.totalOrders) * 100)
                    : 0}
                  %
                </p>
                <p className="mt-1 text-xs text-slate-500">{stats.deliveredCount} colis encaissés</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Status Breakdown Pie */}
              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Répartition des Statuts de Commande
                </h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                      >
                        {statusChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Wilayas Bar */}
              <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Top 5 Wilayas de Vente
                </h3>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wilayaChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="count" fill="var(--ed-rust)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MARKETING & META ADS */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            {/* Meta Ads Credentials Card */}
            <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                      Meta Pixel & CAPI Connectés
                    </span>
                  </div>
                  <h2 className="ed-display mt-2 text-2xl font-black">
                    Dataset ID: <span className="font-mono text-[var(--ed-rust)]">4567517706859412</span>
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Double intégration active : Browser Meta Pixel + Server-Side Conversions API avec déduplication par <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">event_id</code>.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                    Mode Production (Live)
                  </span>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                    Advanced Matching Actif
                  </span>
                </div>
              </div>

              {/* Match Parameters Grid */}
              <div className="mt-6 border-t border-[var(--ed-line)] pt-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Paramètres de Correspondance Avancée (SHA-256)
                </span>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-medium">
                  {[
                    ['Téléphone (ph)', '+213 (Normalisé E.164)'],
                    ['Nom & Prénom (fn, ln)', 'Découpé et Haché SHA-256'],
                    ['Wilaya & Ville (st, ct)', 'Correspondance Algérie'],
                    ['Pays (country)', 'dz'],
                    ['IP Client', 'En-tête Vercel forwarded'],
                    ['User Agent', 'Navigateur réel'],
                    ['Cookie _fbp', 'Persistant'],
                    ['Cookie _fbc (fbclid)', 'Attribution publicitaire'],
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-3">
                      <p className="font-bold text-[var(--ed-ink)]">{label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Test Event Simulator */}
            <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-6">
              <h3 className="ed-display text-xl font-bold">Simulateur & Test d'Événements Live</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Déclenchez manuellement un événement Meta Pixel + CAPI pour vérifier la réception instantanée dans votre Meta Events Manager.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'].map((ev) => (
                  <button
                    key={ev}
                    disabled={sendingTest}
                    onClick={() => handleSendMetaTest(ev)}
                    className="rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] px-4 py-2.5 text-xs font-bold hover:bg-[var(--ed-yellow)] hover:text-[var(--ed-ink)] transition cursor-pointer disabled:opacity-50"
                  >
                    Envoyer {ev}
                  </button>
                ))}
              </div>

              {testEventStatus && (
                <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                  {testEventStatus}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: SETTINGS & GOOGLE SHEET */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Sheet Link Card */}
            <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                    Feuille Google Sheet Connectée
                  </span>
                  <h2 className="ed-display mt-2 text-2xl font-black">
                    Spreadsheet Directe
                  </h2>
                  <p className="mt-1 font-mono text-xs text-slate-500 break-all">
                    {DEFAULT_SHEET_URL}
                  </p>
                </div>

                <a
                  href={DEFAULT_SHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <FileSpreadsheet size={18} />
                  <span>Ouvrir Google Sheet</span>
                  <ExternalLink size={15} />
                </a>
              </div>
            </div>

            {/* Google Apps Script Integration Guide */}
            <div className="rounded-2xl border border-[var(--ed-line)] bg-white p-6">
              <h3 className="ed-display text-xl font-bold">Liaison Webhook Automatique (Direct Write)</h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-relaxed">
                Pour que chaque nouvelle commande s'écrive automatiquement en temps réel sur votre Google Sheet sans intervention manuelle :
              </p>

              <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-xs sm:text-sm text-slate-700">
                <li>Ouvrez votre Google Sheet et cliquez sur <strong>Extensions &gt; Apps Script</strong>.</li>
                <li>Supprimez le code existant et collez le script ci-dessous :</li>
              </ol>

              {/* Code Box */}
              <div className="relative mt-3 rounded-xl border border-slate-800 bg-slate-900 p-4 font-mono text-xs text-emerald-400">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(appsScriptCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="absolute right-3 top-3 flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedCode ? 'Copié !' : 'Copier le script'}</span>
                </button>
                <pre className="overflow-x-auto pr-24">{appsScriptCode}</pre>
              </div>

              <ol start={3} className="mt-4 list-decimal space-y-2 pl-5 text-xs sm:text-sm text-slate-700">
                <li>Cliquez sur <strong>Déployer &gt; Nouveau déploiement</strong>.</li>
                <li>Sélectionnez le type <strong>Application Web</strong>.</li>
                <li>Dans <em>Qui a accès</em>, choisissez <strong>Tout le monde (Anyone)</strong>.</li>
                <li>Copiez l’URL de l’application web obtenue et collez-la ci-dessous :</li>
              </ol>

              {/* Webhook form */}
              <form onSubmit={handleSaveSettings} className="mt-5 space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  URL de l'application Web Google Apps Script (Webhook) :
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={webhookInput}
                    onChange={(e) => setWebhookInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="flex-1 rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-[var(--ed-ink)] font-mono"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[var(--ed-ink)] px-5 py-2.5 text-xs font-bold text-white hover:bg-black cursor-pointer"
                  >
                    Enregistrer l'URL
                  </button>
                  <button
                    type="button"
                    disabled={testingWebhook}
                    onClick={handleTestWebhook}
                    className="rounded-xl border border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                  >
                    {testingWebhook ? 'Test...' : 'Tester l\'envoi'}
                  </button>
                </div>
                {testResult && (
                  <p className="mt-2 text-xs font-bold text-slate-700">
                    {testResult}
                  </p>
                )}
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Manual Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="ed-display text-2xl font-bold">Nouvelle Commande</h3>
            <p className="mt-1 text-xs text-slate-500">Ajouter manuellement une commande client.</p>

            <form onSubmit={handleCreateOrder} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700">Nom complet du client</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ex: Mourad Khelil"
                  className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Numéro de téléphone</label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  placeholder="05 / 06 / 07 XX XX XX XX"
                  className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Wilaya</label>
                  <input
                    type="text"
                    required
                    value={newWilaya}
                    onChange={(e) => setNewWilaya(e.target.value)}
                    placeholder="16 - Alger"
                    className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Livraison</label>
                  <select
                    value={newDeliveryType}
                    onChange={(e) => setNewDeliveryType(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)] cursor-pointer"
                  >
                    <option value="desk">Bureau (Stop Desk)</option>
                    <option value="home">Domicile</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Produit</label>
                <input
                  type="text"
                  required
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Total à payer (DZD)</label>
                <input
                  type="number"
                  required
                  value={newTotal}
                  onChange={(e) => setNewTotal(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-[var(--ed-line)] bg-[#faf9f6] p-2.5 text-sm outline-none focus:border-[var(--ed-ink)] font-bold text-[var(--ed-rust)]"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[var(--ed-line)] px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[var(--ed-yellow)] px-5 py-2 text-xs font-black text-[var(--ed-ink)] hover:bg-yellow-400"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
