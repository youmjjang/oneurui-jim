import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = 'dist/data';
const datasets = [
  { name: '코레일 물품보관함 (사용자 제공 엑셀 정규화)', file: 'korail-lockers.json', type: 'json' },
  { name: '대전도시철도 1호선', file: 'daejeon-lockers.json', type: 'json' },
  { name: '인천도시철도 1·2호선', file: 'incheon-lockers.json', type: 'json' },
  { name: '대구도시철도 1·2·3호선', file: 'daegu-lockers.json', type: 'json' },
  { name: '부산도시철도 1~4호선·동해선', file: 'busan-lockers.json', type: 'json' },
  { name: '광주도시철도 1호선', file: 'gwangju-lockers.json', type: 'json' },
  { name: '국토부 KRIC 철도산업정보센터', file: 'kric_lockers_synced.json', type: 'json' },
  { name: '전국 통합 물품보관함 공공데이터', file: '전국_통합_물품보관함_공공데이터.json', type: 'json' },
  { name: '서울교통공사 공식 보관함', file: 'seoul_metro_lockers_official.json', type: 'json' },
  { name: '행정안전부 공영 보관소 스냅샷', file: 'public_gov_lockers_synced.json', type: 'json' },
  { name: '국토부 TAGO 열차 연계역', file: 'tago-train-stations.json', type: 'json' },
  { name: '서울교통공사 CSV', file: '서울교통공사_물품보관함_위치및설치수량.csv', type: 'csv' },
  { name: '부산교통공사 CSV', file: '부산교통공사_물품보관함_운영현황.csv', type: 'csv' },
  { name: '국가철도공단 CSV', file: '국가철도공단_역사별_물품보관함_현황.csv', type: 'csv' }
];

console.log('=== [1] 파일 존재 및 규격 점검 ===');
const stats = [];
for (const ds of datasets) {
  const filePath = path.join(DATA_DIR, ds.file);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ [파일 누락] ${ds.name}: ${filePath}`);
    continue;
  }
  const stat = fs.statSync(filePath);
  let count = 0;
  let sample = '';
  try {
    if (ds.type === 'json') {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) count = data.length;
      else if (data.data && Array.isArray(data.data)) count = data.data.length;
      else if (data.lockers && Array.isArray(data.lockers)) count = data.lockers.length;
      else if (data.items && Array.isArray(data.items)) count = data.items.length;
      else if (data.stations && Array.isArray(data.stations)) count = data.stations.length;
      sample = JSON.stringify(data).slice(0, 80);
    } else {
      const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(l => l.trim());
      count = lines.length - 1; // 헤더 제외
      sample = lines[0];
    }
    console.log(`✅ ${ds.name} (${ds.file}): ${count.toLocaleString()}건 (${(stat.size / 1024).toFixed(1)} KB)`);
    stats.push({ ...ds, count, size: stat.size });
  } catch (err) {
    console.error(`❌ [파싱 실패] ${ds.name}: ${err.message}`);
  }
}

console.log('\n=== [2] 실제 API 검색 연동 테스트 ===');
// 각 지역 대표 역으로 /api/search 호출하여 보관함이 제대로 나오는지 확인
const testCases = [
  { name: '대전역 (코레일 + 대전도시철도)', query: { mode: 'near', start: '대전역' } },
  { name: '서울역 (코레일 + 서울교통공사)', query: { mode: 'near', start: '서울역' } },
  { name: '부산역 (코레일 + 부산교통공사)', query: { mode: 'near', start: '부산역' } },
  { name: '동대구역 (코레일 + 대구도시철도)', query: { mode: 'near', start: '동대구역' } },
  { name: '광주송정역 (코레일 + 광주도시철도)', query: { mode: 'near', start: '광주송정역' } },
  { name: '부평역 (인천도시철도 + 수도권 1호선)', query: { mode: 'near', start: '부평역' } },
  { name: '서대전네거리역 (대전 1호선 단독)', query: { mode: 'near', start: '서대전네거리역' } },
  { name: '성수역 (서울 2호선)', query: { mode: 'near', start: '성수역' } },
  { name: '강릉역 (코레일 KTX 관문역)', query: { mode: 'near', start: '강릉역' } },
  { name: '전주역 (코레일 전라선)', query: { mode: 'near', start: '전주역' } },
  { name: '경주역 (코레일 동해선/경부고속선)', query: { mode: 'near', start: '경주역' } },
  { name: '목포역 (코레일 호남선)', query: { mode: 'near', start: '목포역' } }
];

async function runApiTests() {
  let passed = 0;
  for (const tc of testCases) {
    try {
      const res = await fetch('http://127.0.0.1:4173/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tc.query)
      });
      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ [${tc.name}] 응답 오류 ${res.status}: ${data.error}`);
        continue;
      }
      const count = data.results?.length || 0;
      const top = data.results?.[0];
      if (count > 0 && top) {
        console.log(`✅ [${tc.name}] 성공! ${count}개 보관소 매칭 (1순위: ${top.name}, 출처: ${top.facilities?.[0]?.source || top.source || '공공'})`);
        passed++;
      } else {
        console.warn(`⚠️ [${tc.name}] 결과 없음 (results: 0)`);
      }
    } catch (err) {
      console.error(`❌ [${tc.name}] 통신 실패: ${err.message}`);
    }
  }
  console.log(`\n테스트 완료: ${passed} / ${testCases.length} 통과 (${(passed / testCases.length * 100).toFixed(1)}%)`);
}

runApiTests();
