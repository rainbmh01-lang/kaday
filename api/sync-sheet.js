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

    const csvText = await response.text();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length <= 1) {
      return res.status(200).json({ success: true, count: 0, orders: [] });
    }

    // Helper to parse CSV line handling quotes
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

    const orders = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length >= 4) {
        orders.push({
          id: cols[0] || `#${1000 + i}`,
          date: cols[1] || new Date().toISOString(),
          fullName: cols[2] || '',
          phone: (cols[3] || '').replace(/^'/, ''),
          wilaya: cols[4] || '',
          commune: cols[5] || '',
          deliveryType: (cols[6] || '').includes('Stop') || (cols[6] || '').includes('Bureau') || (cols[6] || '').includes('المكتب') ? 'desk' : 'home',
          deliveryTypeRaw: cols[6] || '',
          productName: cols[7] || '',
          quantity: parseInt(cols[8], 10) || 1,
          productPrice: cols[9] || '',
          shippingFee: cols[10] || '',
          total: parseInt(String(cols[11] || '').replace(/[^\d]/g, ''), 10) || 0,
          totalFormatted: cols[11] || '',
          status: cols[12] || 'Nouveau',
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
