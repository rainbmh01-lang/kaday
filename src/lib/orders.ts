export type OrderStatus = 'Nouveau' | 'Confirmé' | 'En livraison' | 'Livré' | 'Annulé';

export interface Order {
  id: string;
  date: string;
  fullName: string;
  phone: string;
  wilaya: string;
  commune?: string;
  deliveryType: 'desk' | 'home';
  deliveryTypeRaw?: string;
  productName: string;
  quantity: number;
  productPrice?: number;
  shippingFee?: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  syncedToSheet?: boolean;
}

const STORAGE_KEY = 'kadyadz_store_orders';
const SETTINGS_KEY = 'kadyadz_sheet_settings';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1yT77pxncTVPdq2RewH4CZv0oFwbp_NuejTLnUxjXV90/edit?gid=0#gid=0';

export const DEFAULT_SHEET_EXPORT_URL =
  'https://docs.google.com/spreadsheets/d/1yT77pxncTVPdq2RewH4CZv0oFwbp_NuejTLnUxjXV90/export?format=csv';

export const DEFAULT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbzCo0T9FxQel0Vxklx2AB_sE5ymyLlC7WxQoC9YGbQVVi7MSI46EwFfgGzniMGQcHT7/exec';

const INITIAL_ORDERS: Order[] = [
  {
    id: '#1001',
    date: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    fullName: 'Hani Test',
    phone: '0550123456',
    wilaya: '16 - الجزائر (Alger)',
    commune: 'Alger Centre',
    deliveryType: 'desk',
    productName: 'Perceuse-Visseuse CROWN 20V CT21055LM',
    quantity: 1,
    productPrice: 12500,
    shippingFee: 600,
    total: 13100,
    status: 'Nouveau',
    notes: 'Commande test officielle',
    syncedToSheet: true,
  },
  {
    id: '#1002',
    date: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    fullName: 'Karim Benali',
    phone: '0661987654',
    wilaya: '31 - وهران (Oran)',
    commune: 'Es Senia',
    deliveryType: 'home',
    productName: 'Niveau Laser INGCO 3D 12 Lignes',
    quantity: 1,
    productPrice: 14500,
    shippingFee: 900,
    total: 15400,
    status: 'Confirmé',
    notes: 'Client confirmé par téléphone',
    syncedToSheet: true,
  },
  {
    id: '#1003',
    date: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    fullName: 'Youcef Belkacem',
    phone: '0770334455',
    wilaya: '25 - قسنطينة (Constantine)',
    commune: 'El Khroub',
    deliveryType: 'desk',
    productName: 'Meuleuse d’angle INGCO 115mm 1010W',
    quantity: 2,
    productPrice: 13600,
    shippingFee: 600,
    total: 14200,
    status: 'En livraison',
    notes: 'Bordereau Yalidine généré',
    syncedToSheet: true,
  },
  {
    id: '#1004',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    fullName: 'Redha Mebarki',
    phone: '0561223344',
    wilaya: '19 - سطيف (Sétif)',
    commune: 'Sétif Ville',
    deliveryType: 'desk',
    productName: 'Poste à souder Inverter MMA 200A',
    quantity: 1,
    productPrice: 20900,
    shippingFee: 600,
    total: 21500,
    status: 'Livré',
    notes: 'Colis livré et encaissé',
    syncedToSheet: true,
  },
  {
    id: '#1005',
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    fullName: 'Sofiane Mansouri',
    phone: '0658443322',
    wilaya: '09 - البليدة (Blida)',
    commune: 'Boufarik',
    deliveryType: 'home',
    productName: 'Boîte à outils complète 108 pièces BEETRO',
    quantity: 1,
    productPrice: 9000,
    shippingFee: 800,
    total: 9800,
    status: 'Livré',
    notes: 'Colis livré et encaissé',
    syncedToSheet: true,
  },
];

export function getOrders(): Order[] {
  if (typeof window === 'undefined') return INITIAL_ORDERS;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      return INITIAL_ORDERS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load orders:', err);
    return INITIAL_ORDERS;
  }
}

export function saveOrder(
  orderData: Omit<Order, 'id' | 'date' | 'status'> & {
    id?: string;
    date?: string;
    status?: OrderStatus;
  }
): Order {
  const orders = getOrders();
  const nextNumber = 1000 + orders.length + 1;
  const newOrder: Order = {
    id: orderData.id || `#${nextNumber}`,
    date: orderData.date || new Date().toISOString(),
    fullName: orderData.fullName,
    phone: orderData.phone,
    wilaya: orderData.wilaya,
    commune: orderData.commune || '',
    deliveryType: orderData.deliveryType,
    productName: orderData.productName,
    quantity: orderData.quantity || 1,
    productPrice: orderData.productPrice || orderData.total - (orderData.shippingFee || 600),
    shippingFee: orderData.shippingFee || 600,
    total: orderData.total,
    status: orderData.status || 'Nouveau',
    notes: orderData.notes || 'Commande boutique web',
    syncedToSheet: false,
  };

  const updated = [newOrder, ...orders];
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to save order to localStorage:', err);
    }
  }

  // Trigger automatic sync in background
  syncOrderToGoogleSheet(newOrder).catch((e) => console.warn('Background sync error:', e));

  return newOrder;
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  const orders = getOrders();
  const updated = orders.map((o) => (o.id === id ? { ...o, status } : o));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function deleteOrder(id: string): void {
  const orders = getOrders();
  const updated = orders.filter((o) => o.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export function getSheetSettings(): { sheetUrl: string; webhookUrl: string } {
  if (typeof window === 'undefined') {
    return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: DEFAULT_WEBHOOK_URL };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: DEFAULT_WEBHOOK_URL };
    const parsed = JSON.parse(raw);
    return {
      sheetUrl: parsed.sheetUrl || DEFAULT_SHEET_URL,
      webhookUrl: parsed.webhookUrl || DEFAULT_WEBHOOK_URL,
    };
  } catch {
    return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: DEFAULT_WEBHOOK_URL };
  }
}

export function saveSheetSettings(settings: { sheetUrl?: string; webhookUrl: string }): void {
  if (typeof window === 'undefined') return;
  const current = getSheetSettings();
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      sheetUrl: settings.sheetUrl || current.sheetUrl || DEFAULT_SHEET_URL,
      webhookUrl: settings.webhookUrl.trim(),
    })
  );
}

export async function syncOrderToGoogleSheet(
  order: Order,
  customWebhookUrl?: string
): Promise<boolean> {
  const settings = getSheetSettings();
  const targetUrl = (customWebhookUrl || settings.webhookUrl || '').trim();

  const formattedDate = new Date(order.date).toLocaleString('fr-FR', {
    timeZone: 'Africa/Algiers',
  });
  const deliveryLabel =
    order.deliveryType === 'desk' ? 'المكتب (Bureau)' : 'المنزل (Domicile)';

  const payload = {
    orderId: order.id,
    date: formattedDate,
    fullName: order.fullName,
    phone: order.phone,
    wilaya: order.wilaya,
    commune: order.commune || '',
    deliveryType: deliveryLabel,
    productName: order.productName,
    quantity: order.quantity,
    productPrice: `${(order.productPrice || order.total - (order.shippingFee || 600)).toLocaleString('fr-DZ')} DA`,
    shippingFee: `${(order.shippingFee || 600).toLocaleString('fr-DZ')} DA`,
    total: `${order.total.toLocaleString('fr-DZ')} DA`,
    status: order.status === 'Nouveau' ? 'Nouveau (جديد)' : order.status,
    notes: order.notes || 'Commande boutique web',
    webhookUrl: targetUrl || undefined,
  };

  // 1. Post via /api/order
  try {
    const apiRes = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (apiRes.ok) {
      markOrderSynced(order.id);
      return true;
    }
  } catch (err) {
    console.warn('Backend /api/order call failed, trying direct webhook if available:', err);
  }

  // 2. Direct Webhook fallback
  if (targetUrl) {
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      markOrderSynced(order.id);
      return true;
    } catch (e) {
      console.error('Direct webhook failed:', e);
      return false;
    }
  }

  return false;
}

function markOrderSynced(orderId: string) {
  const orders = getOrders();
  const updated = orders.map((o) => (o.id === orderId ? { ...o, syncedToSheet: true } : o));
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
}

export async function syncAllUnsynced(
  customWebhookUrl?: string
): Promise<{ success: number; failed: number }> {
  const orders = getOrders();
  const unsynced = orders.filter((o) => !o.syncedToSheet);
  let success = 0;
  let failed = 0;

  for (const order of unsynced) {
    const ok = await syncOrderToGoogleSheet(order, customWebhookUrl);
    if (ok) success++;
    else failed++;
  }
  return { success, failed };
}

export async function fetchLiveSheetOrders(): Promise<Order[]> {
  try {
    const res = await fetch('/api/sync-sheet');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
      const merged = mergeOrdersWithLocal(data.orders);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch via /api/sync-sheet, attempting direct CSV fallback...', err);
  }

  // Fallback: direct public CSV
  try {
    const directRes = await fetch(DEFAULT_SHEET_EXPORT_URL);
    if (directRes.ok) {
      const csv = await directRes.text();
      const parsed = parseCSVOrders(csv);
      if (parsed.length > 0) {
        const merged = mergeOrdersWithLocal(parsed);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (err) {
    console.error('Direct CSV fallback failed:', err);
  }

  return getOrders();
}

function mergeOrdersWithLocal(remoteOrders: Order[]): Order[] {
  const localOrders = getOrders();
  const map = new Map<string, Order>();

  for (const o of remoteOrders) {
    map.set(o.id, o);
  }
  for (const o of localOrders) {
    if (!map.has(o.id)) {
      map.set(o.id, o);
    }
  }

  return Array.from(map.values());
}

function parseCSVOrders(csvText: string): Order[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const orders: Order[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.replace(/^"|"$/g, '').trim());
    if (cols.length >= 4) {
      orders.push({
        id: cols[0] || `#${1000 + i}`,
        date: cols[1] || new Date().toISOString(),
        fullName: cols[2] || '',
        phone: (cols[3] || '').replace(/^'/, ''),
        wilaya: cols[4] || '',
        commune: cols[5] || '',
        deliveryType:
          (cols[6] || '').includes('Bureau') || (cols[6] || '').includes('المكتب') ? 'desk' : 'home',
        deliveryTypeRaw: cols[6] || '',
        productName: cols[7] || '',
        quantity: parseInt(cols[8], 10) || 1,
        total: parseInt(String(cols[11] || '').replace(/[^\d]/g, ''), 10) || 0,
        status: (cols[12] || 'Nouveau').includes('Confirm')
          ? 'Confirmé'
          : (cols[12] || '').includes('livraison')
          ? 'En livraison'
          : (cols[12] || '').includes('Livr')
          ? 'Livré'
          : (cols[12] || '').includes('Annul')
          ? 'Annulé'
          : 'Nouveau',
        notes: cols[13] || '',
        syncedToSheet: true,
      });
    }
  }
  return orders;
}

export function exportOrdersToCSV(ordersToExport?: Order[]): void {
  const orders = ordersToExport || getOrders();
  if (!orders.length) return;

  const headers = [
    'N° Commande / رقم الطلب',
    'Date / التاريخ',
    'Nom & Prénom / الاسم واللقب',
    'Téléphone / رقم الهاتف',
    'الولاية',
    'البلدية / العنوان',
    'Type de livraison / نوع التوصيل',
    'Produit / المنتج',
    'Quantité / الكمية',
    'سعر المنتج',
    'تكلفة الشحن',
    'المجموع الإجمالي',
    'Statut / حالة الطلب',
    'Remarques / ملاحظات',
  ];

  const rows = orders.map((o) => {
    const subtotal = o.productPrice || o.total - (o.shippingFee || 600);
    const shipping = o.shippingFee || 600;
    const deliveryStr =
      o.deliveryType === 'desk' ? 'المكتب (Bureau)' : 'المنزل (Domicile)';

    return [
      `"${o.id}"`,
      `"${new Date(o.date).toLocaleString('fr-FR')}"`,
      `"${(o.fullName || '').replace(/"/g, '""')}"`,
      `"'${o.phone || ''}"`,
      `"${(o.wilaya || '').replace(/"/g, '""')}"`,
      `"${(o.commune || '').replace(/"/g, '""')}"`,
      `"${deliveryStr}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.quantity,
      `"${subtotal.toLocaleString('fr-DZ')} DA"`,
      `"${shipping.toLocaleString('fr-DZ')} DA"`,
      `"${o.total.toLocaleString('fr-DZ')} DA"`,
      `"${o.status}"`,
      `"${(o.notes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kadya_dz_commandes_14_colonnes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
