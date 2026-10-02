export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sampleOrders = [
    {
      orderId: '#1001',
      date: '2026-10-02 21:55',
      fullName: 'Hani Test',
      phone: '0550123456',
      wilaya: '16 - الجزائر (Alger)',
      commune: 'Alger Centre',
      deliveryType: 'المكتب (Bureau)',
      productName: 'Perceuse-Visseuse CROWN 20V CT21055LM',
      quantity: 1,
      productPrice: '12 500,00 DA',
      shippingFee: '600,00 DA',
      total: '13 100,00 DA',
      status: 'Nouveau (جديد)',
      notes: 'Commande test officielle',
    },
    {
      orderId: '#1002',
      date: '2026-10-02 22:10',
      fullName: 'Karim Benali',
      phone: '0661987654',
      wilaya: '31 - وهران (Oran)',
      commune: 'Es Senia',
      deliveryType: 'المنزل (Domicile)',
      productName: 'Niveau Laser INGCO 3D 12 Lignes',
      quantity: 1,
      productPrice: '14 500,00 DA',
      shippingFee: '900,00 DA',
      total: '15 400,00 DA',
      status: 'Confirmé (مؤكد)',
      notes: 'Client confirmé par téléphone',
    },
    {
      orderId: '#1003',
      date: '2026-10-02 22:25',
      fullName: 'Youcef Belkacem',
      phone: '0770334455',
      wilaya: '25 - قسنطينة (Constantine)',
      commune: 'El Khroub',
      deliveryType: 'المكتب (Bureau)',
      productName: 'Meuleuse d’angle INGCO 115mm 1010W',
      quantity: 2,
      productPrice: '13 600,00 DA',
      shippingFee: '600,00 DA',
      total: '14 200,00 DA',
      status: 'En livraison (قيد التوصيل)',
      notes: 'Bordereau Yalidine généré',
    },
    {
      orderId: '#1004',
      date: '2026-10-02 22:40',
      fullName: 'Redha Mebarki',
      phone: '0561223344',
      wilaya: '19 - سطيف (Sétif)',
      commune: 'Sétif Ville',
      deliveryType: 'المكتب (Bureau)',
      productName: 'Poste à souder Inverter MMA 200A',
      quantity: 1,
      productPrice: '20 900,00 DA',
      shippingFee: '600,00 DA',
      total: '21 500,00 DA',
      status: 'Livré (تم التوصيل)',
      notes: 'Colis livré et encaissé',
    },
    {
      orderId: '#1005',
      date: '2026-10-02 22:50',
      fullName: 'Sofiane Mansouri',
      phone: '0658443322',
      wilaya: '09 - البليدة (Blida)',
      commune: 'Boufarik',
      deliveryType: 'المنزل (Domicile)',
      productName: 'Boîte à outils complète 108 pièces BEETRO',
      quantity: 1,
      productPrice: '9 000,00 DA',
      shippingFee: '800,00 DA',
      total: '9 800,00 DA',
      status: 'Livré (تم التوصيل)',
      notes: 'Colis livré et encaissé',
    },
  ];

  if (req.query?.format === 'csv') {
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
    const rows = sampleOrders.map((o) => [
      `"${o.orderId}"`,
      `"${o.date}"`,
      `"${o.fullName}"`,
      `"'${o.phone}"`,
      `"${o.wilaya}"`,
      `"${o.commune}"`,
      `"${o.deliveryType}"`,
      `"${o.productName}"`,
      o.quantity,
      `"${o.productPrice}"`,
      `"${o.shippingFee}"`,
      `"${o.total}"`,
      `"${o.status}"`,
      `"${o.notes}"`,
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kadya_commandes_14_colonnes.csv"');
    return res.status(200).send(csv);
  }

  return res.status(200).json({
    status: 'ok',
    store: 'KADYA DZ',
    columns: 14,
    count: sampleOrders.length,
    orders: sampleOrders,
  });
}
