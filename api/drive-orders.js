export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sampleOrders = [
    {
      id: 'KD-7821',
      date: new Date().toISOString(),
      fullName: 'Karim Benali',
      phone: '0550123456',
      wilaya: '16 - Alger',
      deliveryType: 'home',
      productName: 'Perceuse-Visseuse CROWN 20V CT21055LM',
      quantity: 1,
      total: 13100,
      status: 'Nouveau',
    },
    {
      id: 'KD-7820',
      date: new Date(Date.now() - 3600000 * 2).toISOString(),
      fullName: 'Youcef Belkacem',
      phone: '0661987654',
      wilaya: '31 - Oran',
      deliveryType: 'desk',
      productName: 'Niveau Laser INGCO 3D 12 Lignes',
      quantity: 1,
      total: 15400,
      status: 'Confirmé',
    },
    {
      id: 'KD-7819',
      date: new Date(Date.now() - 3600000 * 6).toISOString(),
      fullName: 'Amine Djilali',
      phone: '0770334455',
      wilaya: '25 - Constantine',
      deliveryType: 'home',
      productName: 'Meuleuse d’angle INGCO 115mm 1010W',
      quantity: 2,
      total: 14200,
      status: 'En livraison',
    },
  ];

  if (req.query?.format === 'csv') {
    const headers = [
      'Date',
      'ID Commande',
      'Client',
      'Téléphone',
      'Wilaya',
      'Mode Livraison',
      'Produit',
      'Quantité',
      'Total (DZD)',
      'Statut',
    ];
    const rows = sampleOrders.map((o) => [
      `"${new Date(o.date).toLocaleString('fr-FR')}"`,
      `"${o.id}"`,
      `"${o.fullName}"`,
      `"'${o.phone}"`,
      `"${o.wilaya}"`,
      `"${o.deliveryType === 'desk' ? 'Bureau' : 'Domicile'}"`,
      `"${o.productName}"`,
      o.quantity,
      o.total,
      `"${o.status}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kadya_commandes.csv"');
    return res.status(200).send(csv);
  }

  return res.status(200).json({
    status: 'ok',
    store: 'KADYA DZ',
    count: sampleOrders.length,
    orders: sampleOrders,
  });
}
