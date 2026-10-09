export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetUrl =
    req.query?.sheetUrl ||
    'https://docs.google.com/spreadsheets/d/1yT77pxncTVPdq2RewH4CZv0oFwbp_NuejTLnUxjXV90/export?format=csv';

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      throw new Error(`Google Sheet fetch returned status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    // If Google Apps Script returned direct JSON (doGet)
    if (contentType.includes('application/json')) {
      const jsonData = await response.json();
      if (jsonData && Array.isArray(jsonData.orders)) {
        const normalized = jsonData.orders.map((o) => ({
          id: o.id || '',
          date: o.date || new Date().toISOString(),
          fullName: o.customer || o.fullName || '',
          phone: (o.phone || '').replace(/^'/, ''),
          wilaya: o.wilaya || '',
          commune: o.commune || '',
          deliveryType: (o.shipping || '').includes('منزل') || (o.shipping || '').includes('home') ? 'home' : 'desk',
          productName: o.size || o.productName || '',
          quantity: 1,
          shippingFee: parseInt(String(o.shippingFee || '600').replace(/[^\d]/g, ''), 10) || 600,
          total: parseInt(String(o.total || '0').replace(/[^\d]/g, ''), 10) || 0,
          status: normalizeStatus(o.status),
          notes: o.notes || '',
          syncedToSheet: true,
        }));
        return res.status(200).json({ success: true, count: normalized.length, orders: normalized });
      }
    }

    // CSV format parsing
    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      return res.status(200).json({ success: true, count: 0, orders: [] });
    }

    function parseCSVLine(text) {
      const result = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
          if (inQuotes && text[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    }

    function normalizeStatus(raw) {
      const s = String(raw || '').trim();
      if (s === 'جديد' || s.toLowerCase() === 'nouveau' || s.includes('Nouveau')) return 'Nouveau';
      if (s === 'مؤكدة' || s === 'مؤكد' || s.toLowerCase() === 'confirmé' || s.toLowerCase() === 'confirme' || s.includes('Confirm')) return 'Confirmé';
      if (s === 'مؤجلة' || s === 'مؤجل' || s.toLowerCase() === 'reporté' || s.toLowerCase() === 'reporte' || s.includes('Report')) return 'Reporté';
      if (s === 'ملغاة' || s === 'ملغى' || s.toLowerCase() === 'annulé' || s.toLowerCase() === 'annule' || s.includes('Annul')) return 'Annulé';
      if (s === 'فاشلة 1' || s.toLowerCase() === 'tentative 1' || s.includes('Tentative 1')) return 'Tentative 1';
      if (s === 'فاشلة 2' || s.toLowerCase() === 'tentative 2' || s.includes('Tentative 2')) return 'Tentative 2';
      if (s === 'فاشلة 3' || s.toLowerCase() === 'tentative 3' || s.includes('Tentative 3')) return 'Tentative 3';
      if (s === 'قيد التوصيل' || s.toLowerCase().includes('livraison')) return 'En livraison';
      if (s === 'تم التوصيل' || s === 'مسلّم' || s.toLowerCase() === 'livré' || s.toLowerCase() === 'livre' || s.includes('Livr')) return 'Livré';
      return 'Nouveau';
    }

    const orders = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 4) continue;

      // Check if 12-column matjari-store format
      // Cols: [0] ID, [1] Date, [2] Name, [3] Status, [4] Phone, [5] Wilaya, [6] Commune, [7] Product, [8] Delivery, [9] ShippingFee, [10] Total, [11] Notes
      if (cols.length === 12) {
        orders.push({
          id: cols[0] || `#${1000 + i}`,
          date: cols[1] || new Date().toISOString(),
          fullName: cols[2] || '',
          status: normalizeStatus(cols[3]),
          phone: (cols[4] || '').replace(/^'/, ''),
          wilaya: cols[5] || '',
          commune: cols[6] || '',
          productName: cols[7] || '',
          deliveryType: (cols[8] || '').includes('منزل') || (cols[8] || '').toLowerCase().includes('domicile') ? 'home' : 'desk',
          shippingFee: parseInt(String(cols[9] || '600').replace(/[^\d]/g, ''), 10) || 600,
          total: parseInt(String(cols[10] || '').replace(/[^\d]/g, ''), 10) || 0,
          notes: cols[11] || '',
          quantity: 1,
          syncedToSheet: true,
        });
      } else {
        // Fallback 14-column layout
        orders.push({
          id: cols[0] || `#${1000 + i}`,
          date: cols[1] || new Date().toISOString(),
          fullName: cols[2] || '',
          phone: (cols[3] || '').replace(/^'/, ''),
          wilaya: cols[4] || '',
          commune: cols[5] || '',
          deliveryType: (cols[6] || '').includes('Stop') || (cols[6] || '').includes('Bureau') || (cols[6] || '').includes('المكتب') ? 'desk' : 'home',
          productName: cols[7] || '',
          quantity: parseInt(cols[8], 10) || 1,
          shippingFee: parseInt(String(cols[10] || '600').replace(/[^\d]/g, ''), 10) || 600,
          total: parseInt(String(cols[11] || '').replace(/[^\d]/g, ''), 10) || 0,
          status: normalizeStatus(cols[12]),
          notes: cols[13] || '',
          syncedToSheet: true,
        });
      }
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      source: 'Google Sheet Cloud',
    });
  } catch (err) {
    console.error('sync-sheet error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Sync failed' });
  }
}
