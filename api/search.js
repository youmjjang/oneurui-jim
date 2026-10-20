import { transitRoute } from '../lib/transit.js';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const BASE = 'https://apis.data.go.kr/B551982/psl_v2/';
const buckets = new Map();

// 내장 전국 공공데이터 로드 (Fallback용)
let NATIONAL_DATA = null;
async function getNationalData() {
  if (NATIONAL_DATA) return NATIONAL_DATA;
  try {
    const filePath = fileURLToPath(new URL('../dist/data/전국_통합_물품보관함_공공데이터.json', import.meta.url));
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    NATIONAL_DATA = parsed.data || [];
  } catch {
    NATIONAL_DATA = [];
  }
  return NATIONAL_DATA;
}

async function json(url, options = {}) {
  const r = await fetch(url, { ...options, signal: AbortSignal.timeout(18000) });
  if (!r.ok) {
    let code = '';
    const text = await r.text();
    try {
      const error = JSON.parse(text);
      code = String(error.errorType || error.code || '');
    } catch {
      code = text.match(/<(?:returnAuthMsg|errMsg|resultCode)>([^<]+)</)?.[1] || '';
    }
    code = code.replace(/[^a-zA-Z0-9_ -]/g, '').slice(0, 70);
    throw Error((new URL(url).hostname === 'dapi.kakao.com' ? '카카오' : '공공데이터') + ' API 요청 거절 (' + r.status + (code ? ' / ' + code : '') + ').');
  }
  try {
    return await r.json();
  } catch {
    throw Error('공공 API가 JSON을 반환하지 않았어요.');
  }
}

async function kakao(pathUrl, params) {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw Error('카카오 키 미설정');
  return json('https://dapi.kakao.com/' + pathUrl + '?' + new URLSearchParams(params), {
    headers: { Authorization: 'KakaoAK ' + key }
  });
}

async function place(q) {
  try {
    const stationAliases = { '성수':'성수역', '강남':'강남역', '홍대입구':'홍대입구역', '명동':'명동역', '여의도':'여의도역', '혜화':'혜화역', '잠실':'잠실역', '고속터미널':'고속터미널역', '용산':'용산역', '판교':'판교역', '수원':'수원역', '건대':'건대입구역', '서면':'서면역', '해운대':'해운대역', '광안':'광안역', '남포':'남포역', '사상':'사상역', '수서':'수서역', '신촌':'신촌역', '사당':'사당역', '이태원':'이태원역', '동대문역사문화공원':'동대문역사문화공원역' };
    const query = stationAliases[q] || q;
    const d = await kakao('v2/local/search/keyword.json', { query, size: '1', ...(stationAliases[q] || q.endsWith('역') ? {category_group_code:'SW8'} : {}) });
    const p = d.documents?.[0];
    if (p) return { name: p.place_name, x: p.x, y: p.y, address: p.road_address_name || p.address_name };
  } catch {}
  
  // 키가 없거나 실패 시 장소 휴리스틱 좌표 Fallback (서울/부산/전국 주요역 및 직접 입력 거점)
  const PRESET_PLACES = {
    '서울역': { name: '서울역', x: '126.9723', y: '37.5562', address: '서울특별시 중구 한강대로 405' },
    '홍대입구': { name: '홍대입구역', x: '126.9244', y: '37.5575', address: '서울특별시 마포구 양화로 160' },
    '강남': { name: '강남역', x: '127.0276', y: '37.4979', address: '서울특별시 강남구 강남대로 396' },
    '성수': { name: '성수역', x: '127.0559', y: '37.5446', address: '서울특별시 성동구 아차산로 100' },
    '명동': { name: '명동역', x: '126.9863', y: '37.5609', address: '서울특별시 중구 퇴계로 126' },
    '여의도': { name: '여의도역', x: '126.9242', y: '37.5216', address: '서울특별시 영등포구 여의나루로 40' },
    '혜화': { name: '혜화역', x: '127.0018', y: '37.5823', address: '서울특별시 종로구 대학로 120' },
    '잠실': { name: '잠실역', x: '127.1002', y: '37.5133', address: '서울특별시 송파구 올림픽로 265' },
    '고속터미널': { name: '고속터미널역', x: '127.0050', y: '37.5049', address: '서울특별시 서초구 신반포로 194' },
    '용산': { name: '용산역', x: '126.9648', y: '37.5299', address: '서울특별시 용산구 한강대로23길 55' },
    '판교': { name: '판교역', x: '127.1111', y: '37.3947', address: '경기도 성남시 분당구 판교역로 160' },
    '수원': { name: '수원역', x: '127.0001', y: '37.2657', address: '경기도 수원시 팔달구 덕영대로 924' },
    '건대': { name: '건대입구역', x: '127.0694', y: '37.5404', address: '서울특별시 광진구 아차산로 243' },
    '신도림': { name: '신도림역', x: '126.8913', y: '37.5088', address: '서울특별시 구로구 경인로 688' },
    '수서': { name: '수서역', x: '127.1018', y: '37.4875', address: '서울특별시 강남구 밤고개로 99' },
    '인천공항': { name: '인천국제공항', x: '126.4505', y: '37.4602', address: '인천광역시 중구 공항로 272' },
    '김포공항': { name: '김포공항역', x: '126.8013', y: '37.5623', address: '서울특별시 강서구 하늘길 지하 77' },
    '부산역': { name: '부산역', x: '129.0422', y: '35.1152', address: '부산광역시 동구 중앙대로 206' },
    '서면': { name: '서면역', x: '129.0593', y: '35.1578', address: '부산광역시 부산진구 중앙대로 730' },
    '해운대': { name: '해운대역', x: '129.1585', y: '35.1631', address: '부산광역시 해운대구 구남로 39' },
    '광안': { name: '광안역', x: '129.1132', y: '35.1579', address: '부산광역시 수영구 수영로 576' },
    '남포': { name: '남포역', x: '129.0326', y: '35.0979', address: '부산광역시 중구 구덕로 12' },
    '사상': { name: '사상역', x: '128.9818', y: '35.1624', address: '부산광역시 사상구 사상로 201' },
    '대전역': { name: '대전역', x: '127.4342', y: '36.3323', address: '대전광역시 동구 중앙로 218' },
    '동대구역': { name: '동대구역', x: '128.6285', y: '35.8799', address: '대구광역시 동구 동대구로 550' },
    '광주송정': { name: '광주송정역', x: '126.7912', y: '35.1378', address: '광주광역시 광산구 상무대로 201' },
    '울산역': { name: '울산역', x: '129.1387', y: '35.5518', address: '울산광역시 울주군 삼남읍 울산역로 177' }
  };

  for (const [k, v] of Object.entries(PRESET_PLACES)) {
    if (q.includes(k)) return v;
  }
  throw Error('장소를 확인하지 못했어요. 정확한 역명이나 장소명을 입력해주세요.');
}

async function data(kind, code) {
  let key = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (key && /%[0-9a-f]{2}/i.test(key)) {
    try { key = decodeURIComponent(key); } catch {}
  }
  if (!key) throw Error('공공데이터 키 미설정');
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const q = new URLSearchParams({
      serviceKey: key,
      pageNo: String(page),
      numOfRows: '100',
      type: 'JSON',
      ...(code ? { stdgCd: code } : {})
    });
    const d = await json(BASE + kind + '?' + q);
    const root = d.response || d;
    const h = root.header;
    if (h?.resultCode === 'K3') return out;
    if (h?.resultCode && !['K0', '00', '0'].includes(String(h.resultCode))) throw Error('공공데이터 오류: ' + h.resultCode);
    const b = root.body || {};
    let rows = b.items?.item || b.item || b.items || [];
    if (!Array.isArray(rows)) rows = rows ? [rows] : [];
    out.push(...rows);
    if (!rows.length || out.length >= Number(b.totalCount || out.length)) break;
  }
  return out;
}

const distance = (a, b) => {
  const rad = n => n * Math.PI / 180;
  const lat = rad(Number(a.y) - Number(b.y)), lon = rad(Number(a.x) - Number(b.x));
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(Math.sin(lat / 2) ** 2 + Math.cos(rad(+a.y)) * Math.cos(rad(+b.y)) * Math.sin(lon / 2) ** 2)));
};

async function route(a, b) {
  const distKm = distance(a, b);
  if (distKm < 0.05) return { minutes: 1, steps: ['도보 1분 (역내 이동)'] };

  try {
    const d = await kakao('v2/routing/publictraffic', { start_x: a.x, start_y: a.y, end_x: b.x, end_y: b.y });
    const r = (d.routes || []).filter(r => Number.isFinite(r.properties?.totalTime)).sort((a, b) => a.properties.totalTime - b.properties.totalTime)[0];
    if (r) {
      return {
        minutes: Math.ceil(r.properties.totalTime / 60),
        steps: (r.steps || []).map(s => s.properties?.guidance).filter(Boolean)
      };
    }
  } catch {}

  // Fallback: 현실적인 전국 대중교통(지하철 & KTX 고속철도) 이동 시간 모델
  let approxMinutes = 0;
  if (distKm <= 10) {
    // 10km 이내 시내 지하철 (약 10~25분)
    approxMinutes = Math.max(3, Math.round((distKm / 30) * 60) + 4);
  } else if (distKm <= 40) {
    // 수도권 광역 시내 이동 (약 25~45분)
    approxMinutes = Math.min(50, Math.round((distKm / 35) * 60) + 8);
  } else {
    // 40km 초과: 전국 KTX/SRT 고속철도 구간 (시속 약 180km 기준)
    // 서울-대전(140km: 약 55분), 서울-대구(240km: 약 100분), 서울-부산(330km: 약 135분)
    approxMinutes = Math.min(150, Math.round((distKm / 170) * 60) + 15);
  }

  return {
    minutes: approxMinutes,
    steps: [`${a.name} → ${b.name} 이동 (약 ${approxMinutes}분)`]
  };
}

// 심야 역사 셔터 마감(24:00) 짐 감금 위험 체크 함수
function checkCurfewWarning(pickupTimeStr) {
  if (!pickupTimeStr) return null;
  const d = new Date(pickupTimeStr);
  const hours = d.getHours();
  const mins = d.getMinutes();
  const totalMins = hours * 60 + mins;

  // 23:45 이후 또는 자정 넘은 시간
  if (totalMins >= 23 * 60 + 45 || hours < 5) {
    return '🚨 심야 역사 셔터 폐쇄(24:00) 짐 감금 위험! 자정 전 필수 회수 필요';
  } else if (totalMins >= 23 * 60) {
    return '⚠️ 역사 마감 1시간 전입니다. 지하철 막차 및 역사 폐쇄 전 회수하세요.';
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'POST required' });
  }

  try {
    const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0];
    const now = Date.now();
    if (buckets.size > 1000) buckets.clear();
    let b = buckets.get(ip);
    if (!b || now - b.time > 60000) b = { time: now, n: 0 };
    buckets.set(ip, b);
    if (++b.n > 10) return res.status(429).json({ error: '잠시 후 다시 검색해주세요.' });

    const q = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!q || !['near', 'route'].includes(q.mode) || !['S', 'M', 'L'].includes(q.size) || !['start', ...(q.mode === 'route' ? ['visit', 'end'] : [])].every(k => typeof q[k] === 'string' && q[k].trim().length > 0)) {
      return res.status(400).json({ error: '장소와 이동 정보를 확인해주세요.' });
    }

    if (q.coords && (!Number.isFinite(q.coords.x) || !Number.isFinite(q.coords.y) || Math.abs(q.coords.x) > 180 || Math.abs(q.coords.y) > 90)) {
      return res.status(400).json({ error: '위치 정보를 확인해주세요.' });
    }
    if (q.mode === 'route' && !process.env.KAKAO_REST_API_KEY?.trim()) return res.status(503).json({ error: '실제 지하철·도보 동선 비교를 위해 카카오 API 연결이 필요해요. .env의 KAKAO_REST_API_KEY를 설정해주세요.', code: 'TRANSIT_NOT_CONFIGURED' });
    const [start, visit, end] = await Promise.all([
      q.coords ? Promise.resolve({ name: '현재 위치', x: String(q.coords.x), y: String(q.coords.y) }) : place(q.start),
      q.mode === 'route' ? place(q.visit) : null,
      q.mode === 'route' ? place(q.end) : null
    ]);

    let candidates = [];
    let isOfflineFallback = false;

    // 1. 외부 실시간 API 시도
    try {
      let code = q.code;
      const regionPoint = q.region ? await place(q.region) : start;
      if (!code && process.env.KAKAO_REST_API_KEY) {
        const region = await kakao('v2/local/geo/coord2regioncode.json', { x: regionPoint.x, y: regionPoint.y });
        const found = region.documents?.find(d => d.region_type === 'B');
        if (found) code = found.code.slice(0, 5) + '00000';
      }

      let [info, detail, realtime] = await Promise.all([
        data('locker_info_v2', code || ''),
        data('locker_detail_info_v2', code || ''),
        data('locker_realtime_use_v2', code || '')
      ]);

      if (info && info.length) {
        const key = { S: 'usePsbltySmlszStlckCnt', M: 'usePsbltyMdmszStlckCnt', L: 'usePsbltyLrgszStlckCnt' }[q.size];
        const size = { S: '소형', M: '중형', L: '대형' }[q.size];

        candidates = info
          .filter(l => +l.lat && +l.lot)
          .map(l => ({ ...l, km: distance(start, { x: l.lot, y: l.lat }) }))
          .sort((a, b) => a.km - b.km)
          .slice(0, 15)
          .map(l => {
            const ds = detail.filter(d => d.stlckId === l.stlckId);
            const rt = realtime.filter(r => r.stlckId === l.stlckId).sort((a, b) => String(b.totDt).localeCompare(String(a.totDt)))[0];
            return {
              id: l.stlckId,
              name: l.stlckRprsPstnNm,
              address: l.fcltRoadNmAddr || l.fcltLotnoAddr,
              location: l.stlckDtlPstnNm,
              km: l.km,
              x: l.lot,
              y: l.lat,
              available: rt?.[key] ?? null,
              asOf: rt?.totDt || null,
              details: ds.filter(d => d.stlckKndNm?.includes(size)),
              hours: {
                weekday: [l.wkdyOperBgngTm, l.wkdyOperEndTm],
                saturday: [l.satOperBgngTm, l.satOperEndTm],
                holiday: [l.lhldyOperBgngTm, l.lhldyOperEndTm]
              }
            };
          });
      }
    } catch {
      // 외부 API 호출 실패 또는 키 미설정 시 Fallback으로 전환
    }

    // 2. Fallback: 서울교통공사, 부산교통공사, 국가철도공단 전국 통합 공공데이터 연계
    if (!candidates.length) {
      isOfflineFallback = true;
      const allData = await getNationalData();
      const sizeKey = { S: 'small', M: 'medium', L: 'large' }[q.size];

      candidates = allData
        .map(l => {
          const pt = { x: l.lng, y: l.lat };
          const distStart = distance(start, pt);
          const distVisit = visit ? distance(visit, pt) : distStart;
          const distEnd = end ? distance(end, pt) : distStart;
          const minRouteDist = Math.min(distStart, distVisit, distEnd);

          return {
            id: l.id,
            name: `${l.station} (${l.line})`,
            address: `${l.region} ${l.station}역사`,
            location: `${l.location} [${l.gate}]`,
            km: distStart,
            minRouteDist,
            x: String(l.lng),
            y: String(l.lat),
            available: l[sizeKey] || 0,
            totalSlots: l.total || 0,
            asOf: '공공데이터 공식 설치수량 기준',
            details: [{
              stlckKndNm: `${q.size === 'S' ? '소형' : q.size === 'M' ? '중형' : '대형'} (설치: ${l[sizeKey]}칸)`,
              utztnCrgExpln: `기본 4시간 ${l.baseFee.toLocaleString()}원`,
              addCrgExpln: `초과 1시간당 ${l.addFee.toLocaleString()}원`,
              stlckWdthLenExpln: '450mm',
              stlckHgtExpln: q.size === 'S' ? '300mm' : q.size === 'M' ? '600mm' : '900mm',
              stlckDpthExpln: '500mm'
            }],
            hours: {
              weekday: ['0500', '2400'],
              saturday: ['0530', '2400'],
              holiday: ['0530', '2400']
            }
          };
        })
        .sort((a, b) => a.minRouteDist - b.minRouteDist)
        .slice(0, 15);
    }

    // 심야 폐쇄 감금 위험 분석
    const curfewWarning = checkCurfewWarning(q.pickup);

    const baselineLegs = q.mode === 'route' ? await Promise.all([transitRoute(start,visit),transitRoute(visit,end)]) : [];
    const baselineTotal = baselineLegs.reduce((n,l)=>n+l.minutes,0);
    // 경로 시간 연산
    const candidateRoutes = await Promise.allSettled(candidates.map(async l => {
      const p = { name: l.name, x: l.x, y: l.y };
      const legs = await Promise.all(
        (q.mode === 'route'
          ? [[start, p], [p, visit], [visit, p], [p, end]]
          : [[start, p]]
        ).map(([a, b]) => q.mode === 'route' ? transitRoute(a,b) : route(a, b))
      );

      const total = legs.every(Boolean) ? legs.reduce((s, r) => s + r.minutes, 0) : null;
      const carry = legs.every(Boolean) ? (legs[0]?.minutes || 0) + (legs[3]?.minutes || 0) : null;

      return {
        id: l.id,
        name: l.name,
        address: l.address,
        location: l.location,
        coordinates: { lat: Number(l.y), lng: Number(l.x) },
        km: Number(l.km.toFixed(2)),
        walkMinutes: Math.max(1, Math.ceil(l.km / 4 * 60)),
        available: l.available,
        asOf: l.asOf,
        details: l.details,
        hours: l.hours,
        curfewWarning: curfewWarning,
        legs,
        total,
        carry,
        routeVerified: q.mode === 'route' && legs.every(l=>l.verified),
        baselineTotal: q.mode === 'route' ? baselineTotal : null,
        detourMinutes: q.mode === 'route' ? Math.max(0,total-baselineTotal) : null,
        walkingMinutes: q.mode === 'route' ? legs.reduce((n,l)=>n+l.walkingMinutes,0) : null,
        transfers: q.mode === 'route' ? legs.reduce((n,l)=>n+l.transfers,0) : null,
        planB: {
          name: `${l.name} 플랜 B 대안 보관함`,
          tip: '현장 만차 시 같은 역사 내 타 출구 또는 인접 보관소 즉시 이동 가능'
        }
      };
    }));

    const results = candidateRoutes.filter(r=>r.status==='fulfilled').map(r=>r.value);
    const excludedCount = candidateRoutes.length-results.length;
    if (q.mode === 'route' && !results.length) return res.status(502).json({error:'실제 전체 동선을 확인할 수 있는 보관함이 없어요. API 연결이나 장소를 확인해주세요.'});

    // 편의성(소요시간 최소) 및 가능성(칸수 넉넉함) 종합 가중치 정렬
    results.sort((a, b) => {
      if (q.mode === 'near') return a.km - b.km;
      const timeA = q.priority === 'carry' ? (a.carry ?? 9999) : (a.total ?? 9999);
      const timeB = q.priority === 'carry' ? (b.carry ?? 9999) : (b.total ?? 9999);

      if (timeA === timeB) return (b.available || 0) - (a.available || 0);

      return timeA - timeB;
    });

    // 편의성과 가능성 상위 7개까지만 엄선
    const top7Results = results.slice(0, 7);

    res.status(200).json({
      start,
      visit,
      end,
      results: top7Results,
      baselineLegs, baselineTotal, excludedCount,
      routeSource: q.mode === 'route' ? 'kakao-public-transit' : 'distance-estimate',
      scope: isOfflineFallback
        ? '전국 공공데이터(서울·부산·KTX) 기반 최적 동선 및 규격별 정직한 설치 수량'
        : '실시간 공영 보관함 API 및 카카오 대중교통 경로 연계',
      source: '서울교통공사 · 부산교통공사 · 국가철도공단 · 행정안전부 공공데이터',
      note: q.mode === 'near' ? '입력한 위치에서 직선거리 순으로 추천해요. 도보시간은 추정치이며, 설치 칸수는 빈칸 수가 아닙니다.' : '카카오 지하철·대중교통 경로 기준으로 보관·방문·회수·최종 이동을 합산했어요. 입력 시각의 시간표·막차와 역사 내부 이동시간은 별도 확인이 필요합니다.'
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
