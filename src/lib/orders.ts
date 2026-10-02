export type OrderStatus = 'Nouveau' | 'Confirmé' | 'En livraison' | 'Livré' | 'Annulé';

export interface Order {
  id: string;
  date: string;
  fullName: string;
  phone: string;
  wilaya: string;
  deliveryType: 'desk' | 'home';
  productName: string;
  quantity: number;
  total: number;
  status: OrderStatus;
  syncedToSheet?: boolean;
}

const STORAGE_KEY = 'kadyadz_store_orders';
const SETTINGS_KEY = 'kadyadz_sheet_settings';

export const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1yT77pxncTVPdq2RewH4CZv0oFwbp_NuejTLnUxjXV90/edit?gid=0#gid=0';

const INITIAL_ORDERS: Order[] = [
  {
    id: 'KD-7821',
    date: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    fullName: 'Karim Benali',
    phone: '0550123456',
    wilaya: '16 - Alger',
    deliveryType: 'home',
    productName: 'Perceuse-Visseuse CROWN 20V CT21055LM',
    quantity: 1,
    total: 13100,
    status: 'Nouveau',
    syncedToSheet: true,
  },
  {
    id: 'KD-7820',
    date: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    fullName: 'Youcef Belkacem',
    phone: '0661987654',
    wilaya: '31 - Oran',
    deliveryType: 'desk',
    productName: 'Niveau Laser INGCO 3D 12 Lignes',
    quantity: 1,
    total: 15400,
    status: 'Confirmé',
    syncedToSheet: true,
  },
  {
    id: 'KD-7819',
    date: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    fullName: 'Amine Djilali',
    phone: '0770334455',
    wilaya: '25 - Constantine',
    deliveryType: 'home',
    productName: 'Meuleuse d’angle INGCO 115mm 1010W',
    quantity: 2,
    total: 14200,
    status: 'En livraison',
    syncedToSheet: true,
  },
  {
    id: 'KD-7818',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    fullName: 'Redha Mebarki',
    phone: '0561223344',
    wilaya: '19 - Sétif',
    deliveryType: 'desk',
    productName: 'Poste à souder Inverter MMA 200A',
    quantity: 1,
    total: 21500,
    status: 'Livré',
    syncedToSheet: true,
  },
  {
    id: 'KD-7817',
    date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    fullName: 'Sofiane Mansouri',
    phone: '0658443322',
    wilaya: '09 - Blida',
    deliveryType: 'home',
    productName: 'Boîte à outils complète 108 pièces BEETRO',
    quantity: 1,
    total: 9800,
    status: 'Livré',
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

export function saveOrder(orderData: Omit<Order, 'id' | 'date' | 'status'> & { id?: string; date?: string; status?: OrderStatus }): Order {
  const orders = getOrders();
  const newOrder: Order = {
    id: orderData.id || `KD-${Math.floor(1000 + Math.random() * 9000)}`,
    date: orderData.date || new Date().toISOString(),
    fullName: orderData.fullName,
    phone: orderData.phone,
    wilaya: orderData.wilaya,
    deliveryType: orderData.deliveryType,
    productName: orderData.productName,
    quantity: orderData.quantity || 1,
    total: orderData.total,
    status: orderData.status || 'Nouveau',
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
    return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: '' };
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: '' };
    const parsed = JSON.parse(raw);
    return {
      sheetUrl: parsed.sheetUrl || DEFAULT_SHEET_URL,
      webhookUrl: parsed.webhookUrl || '',
    };
  } catch {
    return { sheetUrl: DEFAULT_SHEET_URL, webhookUrl: '' };
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

export async function syncOrderToGoogleSheet(order: Order, customWebhookUrl?: string): Promise<boolean> {
  const settings = getSheetSettings();
  const targetUrl = (customWebhookUrl || settings.webhookUrl || '').trim();

  // Try serverless endpoint first or direct webhook
  try {
    const payload = {
      orderId: order.id,
      date: new Date(order.date).toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
      fullName: order.fullName,
      phone: order.phone,
      wilaya: order.wilaya,
      deliveryType: order.deliveryType === 'desk' ? 'Bureau (Stop Desk)' : 'Domicile',
      productName: order.productName,
      quantity: order.quantity,
      total: order.total,
      status: order.status,
      webhookUrl: targetUrl || undefined,
    };

    // 1. Post via /api/order
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

  // 2. Direct Webhook fallback if configured
  if (targetUrl) {
    try {
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script Web App standard mode
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          date: new Date(order.date).toLocaleString('fr-FR'),
          fullName: order.fullName,
          phone: order.phone,
          wilaya: order.wilaya,
          deliveryType: order.deliveryType === 'desk' ? 'Bureau' : 'Domicile',
          productName: order.productName,
          quantity: order.quantity,
          total: order.total,
          status: order.status,
        }),
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

export async function syncAllUnsynced(customWebhookUrl?: string): Promise<{ success: number; failed: number }> {
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

export function exportOrdersToCSV(ordersToExport?: Order[]): void {
  const orders = ordersToExport || getOrders();
  if (!orders.length) return;

  const headers = [
    'ID Commande',
    'Date',
    'Client',
    'Téléphone',
    'Wilaya',
    'Mode de livraison',
    'Produit',
    'Quantité',
    'Total (DZD)',
    'Statut',
  ];

  const rows = orders.map((o) => [
    `"${o.id}"`,
    `"${new Date(o.date).toLocaleString('fr-FR')}"`,
    `"${(o.fullName || '').replace(/"/g, '""')}"`,
    `"${o.phone || ''}"`,
    `"${(o.wilaya || '').replace(/"/g, '""')}"`,
    `"${o.deliveryType === 'desk' ? 'Bureau' : 'Domicile'}"`,
    `"${(o.productName || '').replace(/"/g, '""')}"`,
    o.quantity,
    o.total,
    `"${o.status}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `commandes_kadyadz_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
