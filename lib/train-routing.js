import {readFile} from 'node:fs/promises';
const cache=new Map();let stations;
const MIN=60000;
function dateKey(t){return new Date(t+9*60*MIN).toISOString().slice(0,10).replaceAll('-','');}
function parseTime(value){const s=String(value);if(!/^\d{14}$/.test(s))return NaN;return Date.parse(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}:${s.slice(12,14)}+09:00`);}
function clock(t){return new Date(t+9*60*MIN).toISOString().slice(11,16);}
export function inputTime(s){if(typeof s!=='string'||!s)return NaN;return Date.parse(s+(/(?:Z|[+-]\d\d:\d\d)$/.test(s)?'':'+09:00'));}
async function timetable(from,to,day){const id=[from.id,to.id,day].join('|');const hit=cache.get(id);if(hit&&Date.now()-hit.at<10*MIN)return hit.promise;const promise=(async()=>{let key=process.env.TAGO_TRAIN_SERVICE_KEY?.trim();if(!key)return [];if(/%[\da-f]{2}/i.test(key))key=decodeURIComponent(key);const list=[];for(let page=1;page<=5;page++){const r=await fetch('https://apis.data.go.kr/1613000/TrainInfo/GetStrtpntAlocFndTrainInfo?'+new URLSearchParams({serviceKey:key,_type:'json',depPlaceId:from.id,arrPlaceId:to.id,depPlandTime:day,numOfRows:'100',pageNo:String(page)}),{signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('열차 시간표 연결 실패');const d=await r.json();const response=d.response;if(response?.header?.resultCode!=='00')throw Error('열차 시간표 조회 실패');let items=response.body?.items?.item||[];if(!Array.isArray(items))items=[items];list.push(...items);if(page*100>=Number(response.body?.totalCount||0))break;}return list.filter(r=>String(r.depplandtime).startsWith(day)&&Number.isFinite(parseTime(r.arrplandtime))&&parseTime(r.arrplandtime)>parseTime(r.depplandtime));})();cache.set(id,{at:Date.now(),promise});if(cache.size>300)cache.delete(cache.keys().next().value);return promise;}
export function makeJourney(local,km){
 return async function journey(a,b,at){
  const base=await local(a,b);if(!process.env.TAGO_TRAIN_SERVICE_KEY||km(a,b)<30||!Number.isFinite(at))return base;
  stations ||= JSON.parse(await readFile(new URL('../dist/data/tago-train-stations.json',import.meta.url),'utf8')).stations;
  const nearby=p=>stations.map(s=>({...s,d:km(p,s)})).filter(s=>s.d<=30).sort((a,b)=>a.d-b.d).slice(0,2);
  const options=[];let failed=false;
  await Promise.all(nearby(a).flatMap(from=>nearby(b).filter(to=>to.id!==from.id).map(async to=>{try{
   const [access,exit,trains]=await Promise.all([local(a,from),local(to,b),timetable(from,to,dateKey(at))]);
   if(!Number.isFinite(access?.minutes)||!Number.isFinite(exit?.minutes))return;
   // Explicit planning allowance; not an operator-guaranteed transfer time.
   const ready=at+(access.minutes+15)*MIN;
   const usable=trains.map(t=>({t,departure:parseTime(t.depplandtime),arrival:parseTime(t.arrplandtime)})).filter(t=>t.departure>=ready).sort((a,b)=>a.arrival-b.arrival)[0];if(!usable)return;
   const finish=usable.arrival+(exit.minutes+5)*MIN;
   options.push({minutes:Math.ceil((finish-at)/MIN),steps:[...access.steps,from.name+'역 탑승 준비 15분 (계획용 여유시간)',clock(usable.departure)+' '+from.name+' → '+clock(usable.arrival)+' '+to.name+' · '+usable.t.traingradename+' '+usable.t.trainno+'호', '열차 대기 '+Math.ceil((usable.departure-ready)/MIN)+'분 · 하차 이동 여유 5분',...exit.steps],rail:{departure:new Date(usable.departure).toISOString(),arrival:new Date(usable.arrival).toISOString(),from:from.name,to:to.name,train:String(usable.t.trainno),grade:usable.t.traingradename},source:'TAGO 열차 시간표 + 카카오 시내 경로',departure:new Date(at).toISOString()});
  }catch{failed=true;}})));
  options.sort((a,b)=>a.minutes-b.minutes);const best=options[0];const railBest=best&&(!Number.isFinite(base?.minutes)||best.minutes<base.minutes)?best:base;
  return {...railBest,railChecked:true,railNotice:failed?'일부 열차 시간표를 조회하지 못했어요.':'근처 연결 철도역 최대 2곳씩의 당일 직통열차를 비교했어요. 열차 잔여석·지연과 시내교통의 미래 운행은 보장하지 않아요.'};
 };
}
