// 서울 열린데이터광장 실시간 공공데이터 수집 스크립트
import fs from 'fs';
import path from 'path';

const TOTAL_COUNT = 337;
const BATCH_SIZE = 5;
const ALL_ITEMS = [];

async function fetchBatch(start, end) {
  const url = `http://openapi.seoul.go.kr:8088/sample/json/getFcLckr/${start}/${end}/`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data?.response?.body?.items?.item) {
      const items = data.response.body.items.item;
      if (Array.isArray(items)) {
        ALL_ITEMS.push(...items);
      } else if (items) {
        ALL_ITEMS.push(items);
      }
    }
  } catch (err) {
    console.error(`Error fetching ${start} ~ ${end}:`, err.message);
  }
}

async function main() {
  console.log(`[시작] 서울교통공사 물품보관함 공공데이터 실시간 수집 (총 ${TOTAL_COUNT}건)...`);
  
  for (let i = 1; i <= TOTAL_COUNT; i += BATCH_SIZE) {
    const start = i;
    const end = Math.min(i + BATCH_SIZE - 1, TOTAL_COUNT);
    await fetchBatch(start, end);
    process.stdout.write(`\r수집 진행률: ${Math.min(ALL_ITEMS.length, TOTAL_COUNT)} / ${TOTAL_COUNT}`);
    // 약간의 딜레이
    await new Promise(r => setTimeout(r, 60));
  }

  console.log(`\n[완료] 총 ${ALL_ITEMS.length}건 데이터 수집 완료!`);

  // 저장 경로
  const outDir = path.resolve('public/data');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. 서울 원본 JSON 저장
  const seoulOutPath = path.join(outDir, 'seoul_metro_lockers_official.json');
  fs.writeFileSync(seoulOutPath, JSON.stringify(ALL_ITEMS, null, 2), 'utf8');
  console.log(`- 서울 원본 데이터 저장: ${seoulOutPath}`);

  // 2. CSV 파일로도 변환하여 저장
  const header = [
    '호선', '역명', '보관함ID', '보관함명', '상세위치', '총칸수',
    '소형칸수', '중형칸수', '대형칸수', '기본요금(4시간)', '추가요금(시간당)', '위도', '경도'
  ];

  const csvRows = [header.join(',')];

  ALL_ITEMS.forEach(item => {
    const line = [
      `"${item.lineNm || ''}"`,
      `"${item.stnNm || ''}"`,
      `"${item.lckrId || ''}"`,
      `"${(item.lckrNm || '').replace(/"/g, '""')}"`,
      `"${(item.lckrDtlLocNm || '').replace(/"/g, '""')}"`,
      item.lckrCnt || 0,
      item.usePsbltySmttypeLckrCnt || 0,
      item.usePsbltyMdtypeLckrCnt || 0,
      item.usePsbltyLrtypeLckrCnt || 0,
      2200,
      500,
      item.LAT || '',
      item.LOT || ''
    ];
    csvRows.push(line.join(','));
  });

  const seoulCsvPath = path.join(outDir, '서울교통공사_물품보관함_위치및설치수량.csv');
  fs.writeFileSync(seoulCsvPath, '\uFEFF' + csvRows.join('\n'), 'utf8');
  console.log(`- 서울 CSV 파일 저장: ${seoulCsvPath}`);
}

main();
