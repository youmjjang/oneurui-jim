const pending = new Map();
const values = new Map();
let active = 0;
const queue = [];
async function limited(task) {
  if (active >= 4) await new Promise(resolve => queue.push(resolve));
  active++;
  try { return await task(); } finally { active--; queue.shift()?.(); }
}
export function normalizeTransitRoute(route) {
  if (!Number.isFinite(route?.properties?.totalTime)) throw Error('대중교통 응답 형식을 확인해주세요.');
  const segments = (route.steps || route.legs?.flatMap(l => l.steps || []) || []).map(s => ({
    mode: s.properties?.type || 'WALKING',
    guidance: s.properties?.guidance || '도보 이동',
    seconds: Number(s.properties?.time || 0),
    distance: Number(s.properties?.distance || 0),
    vehicles: (s.properties?.vehicles || []).map(v => v.name).filter(Boolean),
    stops: (s.properties?.stops || []).map(v => v.name).filter(Boolean),
    points: (s.path?.points || []).filter(p => p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
  }));
  return {
    minutes: Math.ceil(route.properties.totalTime / 60),
    walkingMinutes: Math.ceil(segments.filter(s => s.mode === 'WALKING').reduce((n,s) => n+s.seconds,0)/60),
    transfers: Number(route.properties.transfers || 0),
    steps: segments.map(s => s.guidance), segments,
    source: 'kakao', verified: true
  };
}
export async function transitRoute(a, b) {
  const key = [a.x,a.y,b.x,b.y].join(',');
  const cached = values.get(key);
  if (cached && Date.now()-cached.at < 300000) return cached.value;
  if (pending.has(key)) return pending.get(key);
  const task = limited(async () => {
    const apiKey = process.env.KAKAO_REST_API_KEY?.trim().replace(/^['"]|['"]$/g,'');
    if (!apiKey) throw Error('실제 지하철·도보 동선 비교를 위해 KAKAO_REST_API_KEY 설정이 필요해요.');
    if (+a.x === +b.x && +a.y === +b.y) return {minutes:0,walkingMinutes:0,transfers:0,steps:['같은 위치'],segments:[],source:'same-point',verified:true};
    const query = new URLSearchParams({start_x:a.x,start_y:a.y,end_x:b.x,end_y:b.y,s_name:a.name,e_name:b.name,output_coord:'WGS84'});
    const km = Math.hypot((+a.y- +b.y)*111,(+a.x- +b.x)*88);
    if (km < 0.8) {
      const walkResponse = await fetch('https://dapi.kakao.com/v2/routing/walk?'+query,{headers:{Authorization:'KakaoAK '+apiKey},signal:AbortSignal.timeout(12000)});
      if (walkResponse.ok) {
        const walk = await walkResponse.json();
        if (walk.route?.properties?.totalDistance <= 1500) {
          const value = normalizeTransitRoute(walk.route);
          values.set(key,{at:Date.now(),value});
          return value;
        }
      }
    }
    const response = await fetch('https://dapi.kakao.com/v2/routing/publictraffic?'+query, {headers:{Authorization:'KakaoAK '+apiKey},signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw Error('대중교통 API 연결을 확인해주세요. (HTTP '+response.status+')');
    const data = await response.json();
    let routes = (data.routes || []).filter(r => Number.isFinite(r.properties?.totalTime));
    // Prefer subway-only journeys. Mixed/public bus journeys remain available outside subway coverage.
    const subway = routes.filter(r=>r.properties.type === 'SUBWAY');
    if (subway.length) routes = subway;
    routes.sort((a,b)=>a.properties.totalTime-b.properties.totalTime);
    let chosen = routes[0];
    if (!chosen) {
      const walkResponse = await fetch('https://dapi.kakao.com/v2/routing/walk?'+query,{headers:{Authorization:'KakaoAK '+apiKey},signal:AbortSignal.timeout(12000)});
      if (walkResponse.ok) {
        const walk = await walkResponse.json();
        // A short station-access segment may legitimately have no transit service.
        if (walk.route?.properties?.totalDistance <= 1000) chosen = walk.route;
      }
    }
    if (!chosen) throw Error('이 구간의 실제 대중교통 경로를 찾지 못했어요.');
    const value = normalizeTransitRoute(chosen);
    if (values.size > 300) values.clear();
    values.set(key,{at:Date.now(),value});
    return value;
  });
  pending.set(key,task);
  try { return await task; } finally { pending.delete(key); }
}
