export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });

  try {
    const { siparis, shopifyConfig } = req.body;
    const { store, clientId, secret } = shopifyConfig;

    const tokenRes = await fetch(`https://${store}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: secret, grant_type: 'client_credentials' })
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const orderRes = await fetch(`https://${store}/admin/api/2024-01/draft_orders.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': accessToken },
      body: JSON.stringify({
        draft_order: {
          line_items: [{ title: siparis.urunAdi, quantity: parseInt(siparis.adet) || 1, price: siparis.tutar.replace(/[^0-9]/g, '') }],
          customer: { first_name: siparis.musteri, phone: siparis.telefon },
          shipping_address: { address1: siparis.adres, city: siparis.ilce, province: siparis.il, country: 'Turkey', phone: siparis.telefon },
          note: siparis.siparisNo
        }
      })
    });

    const orderData = await orderRes.json();
    return res.status(200).json({ success: true, orderId: orderData.draft_order?.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
