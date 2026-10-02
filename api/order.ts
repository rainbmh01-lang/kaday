import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  body: any;
  query: Record<string, string>;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  send: (body: any) => VercelResponse;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
        // keep as is
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
      deliveryType,
      productName,
      quantity,
      total,
      status,
      webhookUrl,
    } = body || {};

    const targetWebhook = webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;

    let sheetResponse = null;
    if (targetWebhook) {
      try {
        const gasRes = await fetch(targetWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            date: date || new Date().toISOString(),
            fullName,
            phone,
            wilaya,
            deliveryType,
            productName,
            quantity: quantity || 1,
            total,
            status: status || 'Nouveau',
          }),
        });
        sheetResponse = { ok: gasRes.ok, status: gasRes.status };
      } catch (err: any) {
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
  } catch (err: any) {
    console.error('Order handler error:', err);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
