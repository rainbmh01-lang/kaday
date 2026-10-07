const crypto = require('crypto');

const PIXEL_ID = '4567517706859412';
const ACCESS_TOKEN =
  'EAAWzVJOPnHEBSmuaiTVZAMW1a7bscxLO1yCUcpjzASMCq96GThfNGJ0zK6LlsXuWRFv18N61GbeBNhHUGdCcJrmPQFHXPcp0wPPRzXXiUgiEmVnnyitsi19bU3ZBzdTD8js06wcP8fENc3OBlhovkwjcxGizXzq9SHbHKb2jlDnWaM1G23Pgf0XBVHa1061gZDZD';
const TEST_CODE = 'TEST69762';

function hash(val) {
  return crypto.createHash('sha256').update(val.trim().toLowerCase()).digest('hex');
}

async function testEvent(name, customData = {}, userData = {}) {
  const payload = {
    data: [
      {
        event_name: name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: `test_${name.toLowerCase()}_${Date.now()}`,
        event_source_url: 'https://kadyadz.vercel.app/',
        action_source: 'website',
        user_data: {
          client_ip_address: '105.101.24.12',
          client_user_agent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          fbp: `fb.1.${Math.floor(Date.now() / 1000)}.123456789`,
          country: [hash('dz')],
          ...userData,
        },
        custom_data: Object.keys(customData).length ? customData : undefined,
      },
    ],
    test_event_code: TEST_CODE,
  };

  const res = await fetch(`https://graph.facebook.com/v25.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  return { status: res.status, event: name, ...data };
}

async function runAll() {
  const events = [
    { name: 'PageView' },
    {
      name: 'ViewContent',
      custom: {
        content_name: 'Perceuse-Visseuse CROWN 20V',
        content_category: 'Outillage électroportatif',
        content_ids: ['ct21055lm'],
        content_type: 'product',
        value: 12500,
        currency: 'DZD',
      },
    },
    {
      name: 'AddToCart',
      custom: {
        content_name: 'Perceuse-Visseuse CROWN 20V',
        content_ids: ['ct21055lm'],
        content_type: 'product',
        value: 12500,
        currency: 'DZD',
        num_items: 1,
      },
    },
    {
      name: 'InitiateCheckout',
      custom: {
        content_name: 'Panier KADYA DZ',
        value: 12500,
        currency: 'DZD',
        num_items: 1,
        content_type: 'product',
      },
    },
    {
      name: 'Purchase',
      custom: {
        content_name: 'Perceuse-Visseuse CROWN 20V',
        value: 13100,
        currency: 'DZD',
        content_type: 'product',
      },
      user: {
        ph: [hash('213550123456')],
        fn: [hash('karim')],
        ln: [hash('benali')],
        st: [hash('alger')],
      },
    },
    {
      name: 'Lead',
      custom: {
        value: 13100,
        currency: 'DZD',
      },
      user: {
        ph: [hash('213550123456')],
        fn: [hash('karim')],
        ln: [hash('benali')],
        st: [hash('alger')],
      },
    },
  ];

  const results = [];
  for (const ev of events) {
    const r = await testEvent(ev.name, ev.custom, ev.user);
    results.push(r);
  }
  console.log(JSON.stringify(results, null, 2));
}

runAll();
