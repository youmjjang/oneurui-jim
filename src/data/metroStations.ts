import { Station } from '../types';

export const METRO_STATIONS: Station[] = [
  // 1. 서울·수도권 주요 역
  { id: 'hongdae', name: '홍대입구', lines: ['2호선', '경의중앙선', '공항철도'], popularTag: '약속/쇼핑 핫스팟', region: 'seoul' },
  { id: 'seoul_station', name: '서울역', lines: ['1호선', '4호선', '공항철도', '경의중앙선'], popularTag: 'KTX/공항철도 관문', region: 'seoul' },
  { id: 'gangnam', name: '강남', lines: ['2호선', '신분당선'], popularTag: '비즈니스/약속 핫스팟', region: 'seoul' },
  { id: 'jamsil', name: '잠실', lines: ['2호선', '8호선'], popularTag: '롯데월드/쇼핑몰', region: 'seoul' },
  { id: 'myeongdong', name: '명동', lines: ['4호선'], popularTag: '관광/쇼핑 명소', region: 'seoul' },
  { id: 'seongsu', name: '성수', lines: ['2호선'], popularTag: '카페거리/핫플레이스', region: 'seoul' },
  { id: 'express_bus', name: '고속터미널', lines: ['3호선', '7호선', '9호선'], popularTag: '고속버스/신세계 환승', region: 'seoul' },
  { id: 'euljiro_1ga', name: '을지로입구', lines: ['2호선'], popularTag: '명동 북측/시청 인근', region: 'seoul' },
  { id: 'ddp', name: '동대문역사문화공원', lines: ['2호선', '4호선', '5호선'], popularTag: '3개 노선 핵심 환승', region: 'seoul' },
  { id: 'sinchon', name: '신촌', lines: ['2호선'], popularTag: '대학가/약속', region: 'seoul' },
  { id: 'jongno_3ga', name: '종로3가', lines: ['1호선', '3호선', '5호선'], popularTag: '탑골공원/익선동', region: 'seoul' },
  { id: 'konkuk', name: '건대입구', lines: ['2호선', '7호선'], popularTag: '로데오거리/환승 거점', region: 'seoul' },
  { id: 'yeouido', name: '여의도', lines: ['5호선', '9호선'], popularTag: '더현대서울/금융가', region: 'seoul' },
  { id: 'itaewon', name: '이태원', lines: ['6호선'], popularTag: '관광/다이닝', region: 'seoul' },
  { id: 'yongsan', name: '용산', lines: ['1호선', '경의중앙선'], popularTag: 'KTX/아이파크몰', region: 'seoul' },
  { id: 'sadang', name: '사당', lines: ['2호선', '4호선'], popularTag: '경기남부 광역환승', region: 'seoul' },
  { id: 'gyodae', name: '교대', lines: ['2호선', '3호선'], popularTag: '법조타운/남부 환승', region: 'seoul' },
  { id: 'sindorim', name: '신도림', lines: ['1호선', '2호선'], popularTag: '서남권 최대 환승역', region: 'seoul' },
  { id: 'wangsimni', name: '왕십리', lines: ['2호선', '5호선', '경의중앙선', '수인분당선'], popularTag: '4중 환승 허브', region: 'seoul' },
  { id: 'hapjeong', name: '합정', lines: ['2호선', '6호선'], popularTag: '상수/망원 카페거리', region: 'seoul' },
  { id: 'hyehwa', name: '혜화', lines: ['4호선'], popularTag: '대학로/공연거리', region: 'seoul' },
  { id: 'city_hall', name: '시청', lines: ['1호선', '2호선'], popularTag: '도심 중심지', region: 'seoul' },

  // 2. 부산 도시철도 주요 역 (부산교통공사 연계)
  { id: 'bs_busan_station', name: '부산역(부산)', lines: ['부산1호선', 'KTX'], popularTag: '부산 관문/KTX 환승', region: 'busan' },
  { id: 'bs_seomyeon', name: '서면', lines: ['부산1호선', '부산2호선'], popularTag: '부산 최대 상권/환승 허브', region: 'busan' },
  { id: 'bs_haeundae', name: '해운대', lines: ['부산2호선'], popularTag: '해수욕장/관광 핫스팟', region: 'busan' },
  { id: 'bs_gwangan', name: '광안', lines: ['부산2호선'], popularTag: '광안리해변/카페거리', region: 'busan' },
  { id: 'bs_nampo', name: '남포', lines: ['부산1호선'], popularTag: '자갈치/국제시장/BIFF', region: 'busan' },
  { id: 'bs_centum', name: '센텀시티', lines: ['부산2호선'], popularTag: '신세계백화점/벡스코', region: 'busan' },
  { id: 'bs_sasang', name: '사상', lines: ['부산2호선', '김해경전철'], popularTag: '시외버스터미널/공항연계', region: 'busan' },

  // 3. 전국 KTX/SRT 철도 거점역 (국가철도공단 연계)
  { id: 'kr_dongdaegu', name: '동대구역(KTX)', lines: ['KTX/SRT', '대구1호선'], popularTag: '영남권 복합환승센터', region: 'railway' },
  { id: 'kr_daejeon', name: '대전역(KTX)', lines: ['KTX/SRT', '대전1호선'], popularTag: '중부권 철도 교통 허브', region: 'railway' },
  { id: 'kr_gwangju_songjeong', name: '광주송정역(KTX)', lines: ['KTX/SRT', '광주1호선'], popularTag: '호남권 KTX 관문', region: 'railway' },
  { id: 'kr_suseo', name: '수서역(SRT)', lines: ['SRT', '3호선', '수인분당선'], popularTag: '강남권 고속철도 종점', region: 'railway' }
];

export const getStationByName = (name: string): Station | undefined => {
  return METRO_STATIONS.find(s => s.name === name || s.name.replace('역', '') === name.replace('역', ''));
};
