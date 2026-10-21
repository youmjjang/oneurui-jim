/**
 * 「오늘의 짐」 철도산업정보센터(레일포털 KRIC) 역사별 물품보관함 현황 1일 1회 배치 동기화 스크립트
 * 
 * * 담당자 요청 지침 준수:
 * 1. 도시/광역철도 전용 (일반역/KTX 제외)
 * 2. 갱신 주기가 분기/반기이므로 1일 1회 GET 또는 배치 작업으로 과도한 호출 방지
 * 3. 서비스ID: convenientInfo / 오퍼레이션ID: stationLocker
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// 1. .env 환경변수 로드
const envPath = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (k && !process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const serviceKey = process.env.KRIC_SERVICE_KEY;

console.log('=================================================================');
console.log('🚆 [오늘의 짐] 철도산업정보센터(KRIC) 물품보관함 배치 동기화 시작');
console.log('=================================================================');

if (!serviceKey) {
  console.error('❌ .env 파일에 KRIC_SERVICE_KEY가 설정되어 있지 않습니다.');
  process.exit(1);
}

// 서울교통공사 및 주요 도시철도 역사 코드 매핑 (레일포털 표준 코드)
const TARGET_STATIONS = [
  // 1호선
  { station: '서울역', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '150' },
  { station: '시청', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '151' },
  { station: '종로3가', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '153' },
  { station: '동대문', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '155' },
  { station: '제기동', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '157' },
  { station: '청량리', line: '1호선', railOprIsttCd: 'S1', lnCd: '1', stinCd: '158' },

  // 2호선
  { station: '시청', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '201' },
  { station: '을지로입구', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '202' },
  { station: '동대문역사문화공원', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '205' },
  { station: '성수', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '211' },
  { station: '건대입구', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '212' },
  { station: '잠실', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '216' },
  { station: '강남', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '222' },
  { station: '교대', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '223' },
  { station: '사당', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '226' },
  { station: '신도림', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '234' },
  { station: '합정', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '238' },
  { station: '홍대입구', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '239' },
  { station: '신촌', line: '2호선', railOprIsttCd: 'S1', lnCd: '2', stinCd: '240' },

  // 3호선
  { station: '종로3가', line: '3호선', railOprIsttCd: 'S1', lnCd: '3', stinCd: '329' },
  { station: '고속터미널', line: '3호선', railOprIsttCd: 'S1', lnCd: '3', stinCd: '339' },
  { station: '교대', line: '3호선', railOprIsttCd: 'S1', lnCd: '3', stinCd: '340' },

  // 4호선
  { station: '혜화', line: '4호선', railOprIsttCd: 'S1', lnCd: '4', stinCd: '420' },
  { station: '동대문역사문화공원', line: '4호선', railOprIsttCd: 'S1', lnCd: '4', stinCd: '422' },
  { station: '명동', line: '4호선', railOprIsttCd: 'S1', lnCd: '4', stinCd: '424' },
  { station: '사당', line: '4호선', railOprIsttCd: 'S1', lnCd: '4', stinCd: '433' },

  // 5호선
  { station: '여의도', line: '5호선', railOprIsttCd: 'S1', lnCd: '5', stinCd: '526' },

  // 6호선
  { station: '이태원', line: '6호선', railOprIsttCd: 'S1', lnCd: '6', stinCd: '630' }
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function runBatchSync() {
  console.log(`📋 총 ${TARGET_STATIONS.length}개 핵심 거점 역사 KRIC 보관함 데이터 수집 시작...`);
  const aggregatedLockers = [];
  let successCount = 0;

  for (let i = 0; i < TARGET_STATIONS.length; i++) {
    const st = TARGET_STATIONS[i];
    const q = new URLSearchParams({
      serviceKey: serviceKey,
      format: 'json',
      railOprIsttCd: st.railOprIsttCd,
      lnCd: st.lnCd,
      stinCd: st.stinCd
    });
    const url = 'https://openapi.kric.go.kr/openapi/convenientInfo/stationLocker?' + q.toString();

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const data = await res.json();
      const cnt = data.header?.resultCnt || 0;

      if (cnt > 0 && Array.isArray(data.body)) {
        successCount++;
        // 크기별 수량 집계
        let small = 0;
        let medium = 0;
        let large = 0;
        let locations = [];
        let contact = '1877-1265';

        data.body.forEach(item => {
          const num = Number(item.faclNum) || 0;
          if (item.szNm === '소') small += num;
          else if (item.szNm === '중') medium += num;
          else if (item.szNm === '대') large += num;

          if (item.dtlLoc && !locations.includes(item.dtlLoc)) {
            locations.push(item.dtlLoc);
          }
          if (item.telNo) contact = item.telNo;
        });

        aggregatedLockers.push({
          station: st.station,
          line: st.line,
          railOprIsttCd: st.railOprIsttCd,
          stinCd: st.stinCd,
          location: locations.join(' / ') || '역사 내 대합실',
          total: small + medium + large,
          small,
          medium,
          large,
          telNo: contact,
          rawList: data.body,
          updatedAt: new Date().toISOString()
        });

        console.log(`[${i + 1}/${TARGET_STATIONS.length}] ✅ ${st.station}역 (${st.line}): 총 ${small + medium + large}칸 (소${small}·중${medium}·대${large})`);
      } else {
        console.log(`[${i + 1}/${TARGET_STATIONS.length}] ℹ️ ${st.station}역 (${st.line}): KRIC 등록 데이터 없음`);
      }
    } catch (e) {
      console.warn(`[${i + 1}/${TARGET_STATIONS.length}] ⚠️ ${st.station}역 (${st.line}) 조회 오류: ${e.message}`);
    }

    // 서버 부하 방지를 위해 100ms 매너 딜레이
    await sleep(100);
  }

  console.log('-----------------------------------------------------------------');
  console.log(`📊 수집 완료: 성공 ${successCount}개역, 총 수집 보관함 세부 데이터 ${aggregatedLockers.length}건`);

  // 1. KRIC 동기화 전용 캐시 파일 저장
  const cachePath = fileURLToPath(new URL('../dist/data/kric_lockers_synced.json', import.meta.url));
  writeFileSync(cachePath, JSON.stringify({
    metadata: {
      source: '철도산업정보센터(KRIC) 레일포털',
      serviceId: 'convenientInfo',
      operationId: 'stationLocker',
      syncedAt: new Date().toISOString(),
      count: aggregatedLockers.length
    },
    lockers: aggregatedLockers
  }, null, 2), 'utf8');
  console.log(`💾 KRIC 캐시 파일 저장 완료: ${cachePath}`);

  // 2. 메인 전국 공공데이터와 안전 병합 (KRIC 상세 위치 및 최신 수량 반영)
  const nationalDataPath = fileURLToPath(new URL('../dist/data/전국_통합_물품보관함_공공데이터.json', import.meta.url));
  if (existsSync(nationalDataPath)) {
    try {
      const nationalData = JSON.parse(readFileSync(nationalDataPath, 'utf8'));
      let mergeCount = 0;

      aggregatedLockers.forEach(kricItem => {
        const found = nationalData.data.find(d => 
          d.station === kricItem.station && d.line === kricItem.line
        );
        if (found) {
          found.location = kricItem.location;
          found.small = kricItem.small || found.small;
          found.medium = kricItem.medium || found.medium;
          found.large = kricItem.large || found.large;
          found.total = (kricItem.small + kricItem.medium + kricItem.large) || found.total;
          found.contact = kricItem.telNo;
          found.kricSynced = true;
          mergeCount++;
        }
      });

      nationalData.metadata.kricSyncedAt = new Date().toISOString();
      if (!nationalData.metadata.sources.includes('철도산업정보센터(KRIC)')) {
        nationalData.metadata.sources.push('철도산업정보센터(KRIC)');
      }

      writeFileSync(nationalDataPath, JSON.stringify(nationalData, null, 2), 'utf8');
      console.log(`🔄 전국 통합 공공데이터 파일 병합 완료 (${mergeCount}개 역사 정보 최신화)`);
    } catch (e) {
      console.warn('⚠️ 전국 통합 공공데이터 병합 중 경고:', e.message);
    }
  }

  console.log('=================================================================');
  console.log('🎉 철도산업정보센터(KRIC) 보관함 1일 1회 배치 동기화 완료!');
  console.log('=================================================================');
}

runBatchSync();
