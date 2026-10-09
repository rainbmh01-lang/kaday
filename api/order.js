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

    const targetWebhook =
      body?.webhookUrl ||
      process.env.GOOGLE_SHEET_WEBHOOK_URL ||
      'https://script.google.com/macros/s/AKfycbzCo0T9FxQel0Vxklx2AB_sE5ymyLlC7WxQoC9YGbQVVi7MSI46EwFfgGzniMGQcHT7/exec';

    // 1. Two-way update order action (status, commune, notes)
    if (body?.action === 'update_order') {
      const updatePayload = {
        action: 'update_order',
        id: body.id || body.orderId,
        status: body.status,
        commune: body.commune,
        notes: body.notes,
      };

      let sheetResponse = null;
      if (targetWebhook) {
        try {
          const gasRes = await fetch(targetWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
          });
          sheetResponse = { ok: gasRes.ok, status: gasRes.status };
        } catch (err) {
          console.warn('Google Sheet update relay error:', err?.message);
          sheetResponse = { error: err?.message };
        }
      }

      return res.status(200).json({
        success: true,
        action: 'update_order',
        id: updatePayload.id,
        sheetSynced: !!targetWebhook && sheetResponse?.ok !== false,
        sheetResponse,
      });
    }

    // 2. Add order action (both 12-column matjari-store format & legacy flat format)
    const {
      orderId,
      id,
      date,
      fullName,
      customer,
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
    } = body || {};

    const resolvedId = orderId || id || `#${Math.floor(1000 + Math.random() * 9000)}`;
    const resolvedCustomer = fullName || customer || 'Client Web';
    const resolvedDate = date || new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers' });
    const resolvedStatus = status || 'Nouveau';

    const gasPayload = {
      action: 'add_order',
      order: {
        id: resolvedId,
        date: resolvedDate,
        customer: resolvedCustomer,
        status: resolvedStatus,
        phone: phone || '',
        wilaya: wilaya || '',
        commune: commune || '',
        size: productName || '',
        shipping: deliveryType === 'desk' ? 'Bureau' : 'Domicile',
        shippingFee: `${(shippingFee || 600).toString().replace(/[^\d]/g, '')} DA`,
        total: `${(total || 13100).toString().replace(/[^\d]/g, '')} DA`,
        notes: notes || 'Commande boutique web',
      },
      // Flat fields for backward compatibility
      orderId: resolvedId,
      date: resolvedDate,
      fullName: resolvedCustomer,
      phone: phone || '',
      wilaya: wilaya || '',
      commune: commune || '',
      deliveryType: deliveryType === 'desk' ? 'المكتب (Bureau)' : 'المنزل (Domicile)',
      productName: productName || 'Perceuse-Visseuse CROWN 20V',
      quantity: quantity || 1,
      productPrice: productPrice || (total ? total - (shippingFee || 600) : 12500),
      shippingFee: shippingFee || 600,
      total: total || 13100,
      status: resolvedStatus,
      notes: notes || 'Commande site web',
    };

    let sheetResponse = null;
    if (targetWebhook) {
      try {
        const gasRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gasPayload),
        });
        sheetResponse = { ok: gasRes.ok, status: gasRes.status };
      } catch (err) {
        console.warn('Google Sheet Webhook relay error:', err?.message);
        sheetResponse = { error: err?.message };
      }
    }

    return res.status(200).json({
      success: true,
      orderId: resolvedId,
      sheetSynced: !!targetWebhook && sheetResponse?.ok !== false,
      sheetResponse,
    });
  } catch (err) {
    console.error('Order handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
