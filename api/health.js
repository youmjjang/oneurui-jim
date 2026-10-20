export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return res.status(405).json({error:'Method not allowed'}); }
  return res.status(200).json({service:'oneurui-jim',mode:'demo',configured:{kakao: Boolean(process.env.KAKAO_REST_API_KEY),publicData:Boolean(process.env.PUBLIC_DATA_SERVICE_KEY)}});
}
