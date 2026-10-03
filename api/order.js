export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        // ignore
      }
    } else if (!body) {
      body = await new Promise((resolve) => {
        let data = '';
        req.on('data', (chunk) => {
          data += chunk;
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve({});
          }
        });
      });
    }

    const {
      orderId,
      date,
      fullName,
      phone,
      wilaya,
      commune,
      deliveryType,
      productName,
      quantity,
      productPrice,
      shippingFee,
      total,
      status,
      notes,
      webhookUrl,
    } = body || {};

    const targetWebhook =
      webhookUrl ||
      process.env.GOOGLE_SHEET_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbzCo0T9FxQel0Vxklx2AB_sE5ymyLlC7WxQoC9YGbQVVi7MSI46EwFfgGzniMGQcHT7/exec';

    let sheetResponse = null;
    if (targetWebhook) {
      try {
        const gasRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId || `#${Math.floor(1000 + Math.random() * 9000)}`,
            date: date || new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' }),
            fullName: fullName || 'Client Web',
            phone: phone || '',
            wilaya: wilaya || '',
            commune: commune || '',
            deliveryType: deliveryType || 'المكتب (Bureau)',
            productName: productName || 'Perceuse-Visseuse CROWN 20V',
            quantity: quantity || 1,
            productPrice: productPrice || (total ? total - (shippingFee || 600) : 12500),
            shippingFee: shippingFee || 600,
            total: total || 13100,
            status: status || 'Nouveau (جديد)',
            notes: notes || 'Commande site web',
          }),
        });
        sheetResponse = { ok: gasRes.ok, status: gasRes.status };
      } catch (err) {
        console.warn('Google Sheet Webhook relay error:', err?.message);
        sheetResponse = { error: err?.message };
      }
    }

    return res.status(200).json({
      success: true,
      orderId,
      sheetSynced: !!targetWebhook && sheetResponse?.ok !== false,
      sheetResponse,
    });
  } catch (err) {
    console.error('Order handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
