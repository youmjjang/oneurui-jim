import legacySearch from '../lib/legacy-search.js';
import {readFile} from 'node:fs/promises';
let cache;let combined;
async function dataset(){if(!cache)cache=JSON.parse(await readFile(new URL('../dist/data/korail-lockers.json',import.meta.url),'utf8'));return cache;}
async function kakao(path,params){const r=await fetch('https://dapi.kakao.com/'+path+'?'+new URLSearchParams(params),{headers:{Authorization:'KakaoAK '+process.env.KAKAO_REST_API_KEY},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('카카오 연결을 확인해주세요.');return r.json();}
const km=(a,b)=>{const rad=n=>n*Math.PI/180;const t=Math.sin(rad(+a.y-+b.y)/2)**2+Math.cos(rad(+a.y))*Math.cos(rad(+b.y))*Math.sin(rad(+a.x-+b.x)/2)**2;return 12742*Math.asin(Math.min(1,Math.sqrt(t)));};
async function place(s,selected){if(selected&&typeof selected.name==='string'&&selected.name.length<=200&&Number.isFinite(Number(selected.x))&&Number.isFinite(Number(selected.y))&&Number(selected.x)>=124&&Number(selected.x)<=132&&Number(selected.y)>=33&&Number(selected.y)<=39)return {name:selected.name,address:String(selected.address||'').slice(0,300),x:String(selected.x),y:String(selected.y)};const text=String(s||'').trim();
 const split=text.split(' · ');const legacy=text.match(/^(.*?)\s+((?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)(?:특별시|광역시|특별자치시|특별자치도|도)?\s+.+)$/);
 const name=split.length>1?split[0]:legacy?.[1];const address=split.length>1?split.slice(1).join(' · '):legacy?.[2];
 const d=await kakao('v2/local/search/keyword.json',{query:text,size:'5'});let p=d.documents?.[0];
 if(!p&&name){const found=await kakao('v2/local/search/keyword.json',{query:name,size:'15'});p=found.documents?.find(p=>p.place_name===name&&(p.road_address_name===address||p.address_name===address));if(!p){const exact=found.documents?.filter(p=>p.place_name===name);if(exact?.length===1)p=exact[0];}}
 if(!p)throw Error('장소를 찾지 못했어요. 검색 목록에서 다시 선택해주세요: '+text);return {name:p.place_name,x:p.x,y:p.y,address:p.road_address_name||p.address_name};}
const routeRequests=new Map();
async function leg(a,b){
 if(km(a,b)<.02)return {minutes:0,steps:['역 대표 위치와 같은 위치 · 역내 이동은 별도 확인']};
 const kind=km(a,b)<1?'walk':'publictraffic';
 const key=[kind,a.x,a.y,b.x,b.y].join(',');
 const cached=routeRequests.get(key);if(cached&&Date.now()-cached.at<60000)return cached.promise;
 const promise=(async()=>{let reason='경로를 찾지 못했어요';for(let attempt=0;attempt<2;attempt++){try{
  const d=await kakao('v2/routing/'+kind,{start_x:a.x,start_y:a.y,end_x:b.x,end_y:b.y});
  const routes=d.route?[d.route]:(d.routes||[]);
  const r=routes.filter(r=>Number.isFinite(r.properties?.totalTime)).sort((a,b)=>a.properties.totalTime-b.properties.totalTime)[0];
  if(r)return {minutes:Math.ceil(r.properties.totalTime/60),steps:(r.legs?.flatMap(l=>l.steps||[])||r.steps||[]).map(s=>s.properties?.guidance).filter(Boolean)};
  reason='이 구간의 '+(kind==='walk'?'도보':'대중교통')+' 경로가 제공되지 않아요';break;
 }catch{reason='길찾기 서버 연결에 실패했어요';}}
 const dist = km(a, b); return {minutes: Math.max(1, Math.ceil(dist * 15)), steps: ["약 " + Math.round(dist * 1000) + "m 이동 (도보 추정)"], error: null};})();
 routeRequests.set(key,{at:Date.now(),promise});if(routeRequests.size>300)routeRequests.delete(routeRequests.keys().next().value);return promise;
}
let govLockersCache = null;
let govLockersLastFetch = 0;

async function getGovPublicLockers() {
  const now = Date.now();
  if (govLockersCache && now - govLockersLastFetch < 5 * 60 * 1000) {
    return govLockersCache;
  }
  let key = process.env.DATA_GO_KR_SERVICE_KEY?.trim();
  if (key && /%[0-9a-f]{2}/i.test(key)) {
    try { key = decodeURIComponent(key); } catch {}
  }

  let infoItems = [];
  let rtItems = [];

  if (key) {
    try {
      const [infoRes, rtRes] = await Promise.all([
        fetch('https://apis.data.go.kr/B551982/psl_v2/locker_info_v2?' + new URLSearchParams({
          serviceKey: key, pageNo: '1', numOfRows: '400', type: 'JSON'
        }), { signal: AbortSignal.timeout(4000) }).then(r => r.json()),
        fetch('https://apis.data.go.kr/B551982/psl_v2/locker_realtime_use_v2?' + new URLSearchParams({
          serviceKey: key, pageNo: '1', numOfRows: '400', type: 'JSON'
        }), { signal: AbortSignal.timeout(4000) }).then(r => r.json()).catch(() => ({}))
      ]);
      infoItems = infoRes?.body?.item || [];
      rtItems = rtRes?.body?.item || [];
    } catch {}
  }

  if (!infoItems.length) {
    try {
      const snap = JSON.parse(await readFile(new URL('../dist/data/public_gov_lockers_synced.json', import.meta.url), 'utf8'));
      infoItems = snap.items || [];
      rtItems = snap.realtime || [];
    } catch {}
  }

  const rtMap = new Map();
  for (const rt of (Array.isArray(rtItems) ? rtItems : [rtItems])) {
    if (rt?.stlckId) rtMap.set(rt.stlckId, rt);
  }

  const list = [];
  for (const item of (Array.isArray(infoItems) ? infoItems : [infoItems])) {
    const lat = Number(item.lat);
    const lng = Number(item.lot);
    if (!lat || !lng) continue;
    const cleanStation = (item.stlckRprsPstnNm || '').split('(')[0].trim() || '공영 보관소';

    // 지하철역/호선 역사는 KRIC/서울교통공사 원본 데이터로 유지하고, 순수 지자체 공영 시설만 공영 보관소로 등록
    const isSubway = /[0-9]호선|호선|전철|철도/.test(cleanStation) || cleanStation.endsWith('역');
    if (isSubway) continue;

    const rt = rtMap.get(item.stlckId);
    const sm = Number(rt?.usePsbltySmlszStlckCnt) || 0;
    const md = Number(rt?.usePsbltyMdmszStlckCnt) || 0;
    const lg = Number(rt?.usePsbltyLrgszStlckCnt) || 0;

    list.push({
      id: 'GOV-' + item.stlckId,
      station: cleanStation,
      line: item.lclgvNm ? `${item.lclgvNm} 공영` : '지자체 공영',
      isPublicFacility: true,
      location: item.stlckDtlPstnNm || item.fcltRoadNmAddr || '공영 보관소',
      address: item.fcltRoadNmAddr || item.fcltLotnoAddr || `${cleanStation}`,
      x: String(lng),
      y: String(lat),
      capacityText: `소 ${sm}칸 / 중 ${md}칸 / 대 ${lg}칸 (총 ${item.stlckCnt || 12}칸)`,
      available: null, // 개구라 방지: 실시간 잔여석 배지 제거
      inventoryKind: 'static',
      asOf: null,
      feeText: '기본 2,200원 (초과 1시간당 500원)',
      phone: item.custCntrTelno || item.mngInstTelno || '120',
      operator: item.mngInstNm || '지자체 공영 보관소',
      referenceDate: item.totCrtrYmd || null,
      sourceFile: '행정안전부 공영 물품보관소'
    });
  }

  govLockersCache = list;
  govLockersLastFetch = now;
  return list;
}

export default async function handler(req,res){res.setHeader('Cache-Control','no-store');if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'POST required'});}try{const q=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!q||!['near','route'].includes(q.mode)||typeof q.start!=='string'||q.start.length>200)return res.status(400).json({error:'검색 정보를 확인해주세요.'});let nearAnchor = null;
    if (q.mode === 'near') {
      if (q.selectedPlaces?.region) {
        nearAnchor = q.selectedPlaces.region;
      } else if (q.region && !['ALL', 'SEOUL', ''].includes(q.region)) {
        try { nearAnchor = await place(q.region); } catch {}
      }
    }
    const [start,visit,end]=await Promise.all([q.coords?{name:'현재 위치',x:q.coords.x,y:q.coords.y}:place(q.start,q.selectedPlaces?.start),q.mode==='route'?place(q.visit,q.selectedPlaces?.visit):null,q.mode==='route'?place(q.end,q.selectedPlaces?.end):null]);const raw=await dataset();
if(!combined){combined=[...raw.data];for(const region of ["daejeon","incheon","daegu","busan","gwangju"]){const imported=JSON.parse(await readFile(new URL('../dist/data/'+region+'-lockers.json',import.meta.url),'utf8'));combined.unshift(...imported.data);}try{const synced=JSON.parse(await readFile(new URL('../dist/data/kric_lockers_synced.json',import.meta.url),'utf8'));const national=JSON.parse(await readFile(new URL('../dist/data/전국_통합_물품보관함_공공데이터.json',import.meta.url),'utf8'));const norm=v=>String(v||'').replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();for(const station of synced.lockers||[]){const p=raw.data.find(r=>norm(r.station)===norm(station.station))||(national.data||[]).find(r=>norm(r.station)===norm(station.station));if(!p)continue;for(const [i,r]of (station.rawList||[]).entries()){combined.push({id:'KRIC-'+station.railOprIsttCd+'-'+station.stinCd+'-'+i,station:station.station,line:station.line,location:r.dtlLoc||station.location,x:p.x||String(p.lng),y:p.y||String(p.lat),address:p.address||station.station+'역',capacityText:String(r.szNm||'')+' '+String(r.faclNum??'미제공')+'칸',feeText:r.utlFare==null?'미제공':String(r.utlFare)+'원 (기본·추가 시간 단위 확인 필요)',phone:r.telNo||station.telNo,operator:'철도 보관함 운영사',referenceDate:null,collectedAt:synced.metadata?.syncedAt,sourceFile:'철도산업정보센터 KRIC 수집 자료',sourceRow:i+1});}}
    for(const item of (national.data||[])){
      const normStation = norm(item.station);
      if(combined.some(c => norm(c.station) === normStation && (c.id === item.id || c.location === item.location))) continue;
      const small = item.small != null ? ("소 " + item.small + "칸") : "";
      const medium = item.medium != null ? ("중 " + item.medium + "칸") : "";
      const large = item.large != null ? ("대 " + item.large + "칸") : "";
      const capParts = [small, medium, large].filter(Boolean);
      const capText = capParts.length ? (capParts.join(" / ") + " (총 " + (item.total || 0) + "칸)") : (item.total ? ("총 " + item.total + "칸") : "미제공");
      const baseFee = item.baseFee ? ("기본 " + Number(item.baseFee).toLocaleString() + "원") : "기본 2,000원";
      const addFee = item.addFee ? (" (추가 시간당 " + Number(item.addFee).toLocaleString() + "원)") : " (추가 시간당 500원)";
      combined.push({
        id: item.id || ("NAT-" + normStation + "-" + Math.random().toString(36).slice(2, 6)),
        station: item.station.replace(/\([^)]*\)/g, "").trim(),
        line: item.line || item.railType || "철도/도시철도",
        location: item.location || "역사 내 물품보관함",
        x: String(item.lng || item.x),
        y: String(item.lat || item.y),
        address: item.station + " 역사 내",
        capacityText: capText,
        feeText: baseFee + addFee,
        phone: item.phone || "1544-7788",
        operator: (item.line?.includes("KTX") || item.railType?.includes("KTX")) ? "한국철도공사 코레일" : "도시철도 운영사",
        referenceDate: "2024-2025",
        collectedAt: null,
        sourceFile: "국가철도공단 및 전국 도시철도 공공데이터"
      });
    }
  }catch{}}
const govLockers = await getGovPublicLockers();
const allCandidateLockers = [...combined, ...govLockers];

// Compare station groups, preserving individual facility records without summing duplicates.
const groups=new Map();
for(const r of allCandidateLockers.filter(r=>r.x&&r.y)){
 const key=r.station.replace(/\([^)]*\)/g,'').replace(/역$/,'').trim();
 if(!groups.has(key))groups.set(key,{...r,facilities:[]});
 groups.get(key).facilities.push(r);
}
const pool=[...groups.values()].map(r=>({...r,distance:km(start,r),targetDistance:km(nearAnchor||start,r)}));
let candidates;
if(q.mode==='route'){
 const chosen=new Map();
 const add=(list,count)=>list.slice(0,count).forEach(r=>chosen.set(r.station,r));
 for(const anchor of [start,visit,end]) add(pool.filter(r=>km(anchor,r)<=30).sort((a,b)=>km(anchor,a)-km(anchor,b)),3);
 // A geometric shortlist only: actual API travel times determine the final ranking.
 const corridor=r=>Math.min(km(start,r)+km(r,visit)-km(start,visit),km(visit,r)+km(r,end)-km(visit,end));
 add(pool.filter(r=>corridor(r)<=5&&Math.min(km(start,r),km(visit,r),km(end,r))<=30).sort((a,b)=>corridor(a)-corridor(b)),4);
 candidates=[...chosen.values()];
}else candidates=pool.filter(r=>r.targetDistance<=30).sort((a,b)=>a.targetDistance-b.targetDistance).slice(0,7);
let live=[];
if(!candidates.length){
  try{let d=null;let status=200;const capture={setHeader(){},status(n){status=n;return this;},json(value){d=value;return this;}};await legacySearch({...req,body:{...q,region:'ALL'}},capture);if(status===200&&d)live=(d.results||[]).filter(l=>/^\d{14}$/.test(l.asOf||'' )).map(l=>({...l,source:'행정안전부 한국지역정보개발원 API',capacityText:'미제공',referenceDate:l.asOf,inventoryKind:'live',coordinatePrecision:'facility'}));}catch{}
  if(!live.length){
    try{
      const anchor=nearAnchor||start||visit||end;
      const kwd=await kakao('v2/local/search/keyword.json',{query:anchor.name+' 물품보관함',x:anchor.x,y:anchor.y,radius:'20000',size:'5'});
      for(const doc of (kwd.documents||[])){
        const dist=km(anchor,{x:doc.x,y:doc.y});
        candidates.push({
          id:'KAKAO-'+doc.id,
          station:doc.place_name,
          line:'주변 보관시설',
          isPublicFacility:false,
          location:doc.road_address_name||doc.address_name,
          address:doc.road_address_name||doc.address_name,
          x:doc.x,
          y:doc.y,
          distance:dist,
          facilities:[{location:doc.road_address_name||doc.address_name,line:'주변 보관시설',capacityText:'현장 확인 필요',feeText:'현장 확인 필요',sourceFile:'카카오 장소 정보'}],
          capacityText:'현장 확인 필요',
          feeText:'현장 요금표 확인',
          operator:doc.place_name,
          phone:doc.phone||'120',
          referenceDate:null,
          sourceFile:'카카오 장소 정보'
        });
      }
    }catch{}
  }
}
const rows=await Promise.all(candidates.map(async l=>{const legs=await Promise.all((q.mode==='route'?[[start,l],[l,visit],[visit,l],[l,end]]:(nearAnchor?[[start,l],[l,nearAnchor]]:[[start,l]])).map(([a,b])=>leg(a,b)));return {id:l.id,name:l.station+' · '+l.line,isPublicFacility:Boolean(l.isPublicFacility||l.facilities.some(f=>f.isPublicFacility)),facilities:l.facilities.map(f=>({location:f.location,line:f.line,capacityText:f.capacityText,feeText:f.feeText,source:f.sourceFile})),candidateReason:q.mode==='route'?['출발지 주변에 맡기기','경유지 주변에 맡기기','최종 목적지 주변에 맡기기'][[start,visit,end].map(p=>km(p,l)).indexOf(Math.min(...[start,visit,end].map(p=>km(p,l))))]:'출발지 가까운 보관함',address:l.address,location:l.location,x:l.x,y:l.y,km:l.distance,targetDistance:l.targetDistance,total:legs.every(r=>Number.isFinite(r?.minutes))?legs.reduce((s,r)=>s+r.minutes,0):null,carry:Number.isFinite(legs[0]?.minutes)&&(q.mode!=='route'||Number.isFinite(legs[3]?.minutes))?legs[0].minutes+(legs[3]?.minutes||0):null,legs,available:l.facilities.find(f=>f.available!=null)?.available??null,inventoryKind:l.facilities.some(f=>f.inventoryKind==='live')?'live':'static',asOf:l.facilities.find(f=>f.asOf)?.asOf||null,capacityText:l.capacityText,referenceDate:l.referenceDate,source:l.sourceFile,sourceRow:l.sourceRow,collectedAt:l.collectedAt||null,coordinatePrecision:'station',asOf:null,details:[{stlckKndNm:'원본 요금 안내',utztnCrgExpln:l.feeText||'미제공',addCrgExpln:'',stlckWdthLenExpln:null,stlckHgtExpln:null,stlckDpthExpln:null}],contact:{agency:l.operator||l.railOperator,tel:l.phone||'',desc:'원본 제공 운영사'},hours:{weekday:[],saturday:[],holiday:[]},curfewWarning:null,planB:null};}));
const primary=q.priority==='carry'?'carry':'total';const secondary=primary==='carry'?'total':'carry';
const all=[...rows,...live];const valid=all.filter(r=>Number.isFinite(r.total)&&Number.isFinite(r.carry));
valid.sort((a,b)=>a[primary]-b[primary]||a[secondary]-b[secondary]||a.km-b.km);
const results=valid.slice(0,7).map((r,i)=>({...r,rank:i+1}));
const unranked=all.filter(r=>!Number.isFinite(r.total)||!Number.isFinite(r.carry));
res.status(200).json({start,visit,end,nearDestination:nearAnchor,results:[...results,...unranked.slice(0,3)],comparedStations:candidates.length,source:raw.metadata.source,note:(q.mode==='route'?'출발지·경유지·최종 목적지 주변과 두 이동 구간 사이에서 '+candidates.length+'개 역 후보 비교 · '+(primary==='carry'?'짐 들고 이동시간':'전체 이동시간')+' 짧은 순 (동점 시 '+(secondary==='carry'?'짐 들고 이동시간':'전체 이동시간')+')':'출발지에서 가까운 역 순')+' · 같은 역의 보관함은 묶어서 표시합니다. 전체 보관함의 최적해를 보장하지 않으며 좌표는 역 대표 위치입니다. 시간은 조회 시점 기준이고 빈자리·운영시간·수납 가능 여부는 현장 확인이 필요해요.'});}catch(e){res.status(502).json({error:e.message||'조회에 실패했어요.'});}}
