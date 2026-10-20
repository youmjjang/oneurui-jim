// Keyless walking routes for the local preview. FOSSGIS: at most one upstream request/second.
const cache = new Map();
let lastRequest = 0;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({error:'POST required'}); }
  try {
    const { start, end } = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const valid = p => p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat)<=90 && Math.abs(p.lng)<=180;
    if (!valid(start) || !valid(end)) return res.status(400).json({error:'출발지와 보관함 좌표를 확인해주세요.'});
    const key = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const saved = cache.get(key);
    if (saved && Date.now()-saved.time < 300000) return res.status(200).json(saved.data);
    if (Date.now()-lastRequest < 1100) return res.status(429).json({error:'잠시 후 다시 길찾기를 눌러주세요.'});
    lastRequest = Date.now();
    const response = await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/driving/${key}?overview=full&geometries=geojson&steps=true`, {
      headers: { 'User-Agent': 'OneuruiJim-LocalPreview/0.1 (walking map preview)' }, signal: AbortSignal.timeout(18000)
    });
    if (!response.ok) throw Error('도보 경로 서비스에 연결하지 못했어요. 잠시 후 다시 시도해주세요.');
    const body = await response.json();
    const route = body.routes?.[0];
    if (body.code !== 'Ok' || !route?.geometry?.coordinates?.length) return res.status(404).json({error:'이 구간의 도보 경로를 찾지 못했어요. 다른 보관함을 선택해주세요.'});
    const data = { geometry:route.geometry, distance:route.distance, minutes:Math.max(1,Math.ceil(route.duration/60)), steps:(route.legs||[]).flatMap(l=>l.steps||[]).map(s=>({ name:s.name, distance:s.distance, type:s.maneuver?.type, modifier:s.maneuver?.modifier })), source:'OpenStreetMap · OSRM / FOSSGIS' };
    if(cache.size>100) cache.clear();
    cache.set(key,{time:Date.now(),data});
    return res.status(200).json(data);
  } catch { return res.status(502).json({error:'도보 경로를 불러오지 못했어요. 잠시 후 다시 시도해주세요.'}); }
}
