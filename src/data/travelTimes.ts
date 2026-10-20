// 전국 지하철 및 철도 역간 이동 시간 그래프 (서울교통공사, 부산교통공사, 한국철도공사 기준)

interface Edge {
  to: string;
  minutes: number;
  line: string;
}

// 인접 역 및 소요시간 (단위: 분)
const ADJACENCY_LIST: Record<string, Edge[]> = {
  // --- 서울 2호선 서북~도심~강남 루프 ---
  'hongdae': [
    { to: 'sinchon', minutes: 2, line: '2호선' },
    { to: 'hapjeong', minutes: 2, line: '2호선' },
    { to: 'seoul_station', minutes: 7, line: '공항철도' },
    { to: 'yongsan', minutes: 9, line: '경의중앙선' }
  ],
  'sinchon': [
    { to: 'hongdae', minutes: 2, line: '2호선' },
    { to: 'city_hall', minutes: 6, line: '2호선' },
    { to: 'euljiro_1ga', minutes: 8, line: '2호선' }
  ],
  'hapjeong': [
    { to: 'hongdae', minutes: 2, line: '2호선' },
    { to: 'sindorim', minutes: 7, line: '2호선' },
    { to: 'itaewon', minutes: 12, line: '6호선' }
  ],
  'sindorim': [
    { to: 'hapjeong', minutes: 7, line: '2호선' },
    { to: 'seoul_station', minutes: 14, line: '1호선' },
    { to: 'yongsan', minutes: 10, line: '1호선' },
    { to: 'sadang', minutes: 16, line: '2호선' },
    { to: 'yeouido', minutes: 7, line: '1호선-급행/환승' }
  ],
  'city_hall': [
    { to: 'sinchon', minutes: 6, line: '2호선' },
    { to: 'euljiro_1ga', minutes: 2, line: '2호선' },
    { to: 'seoul_station', minutes: 2, line: '1호선' },
    { to: 'jongno_3ga', minutes: 4, line: '1호선' }
  ],
  'euljiro_1ga': [
    { to: 'city_hall', minutes: 2, line: '2호선' },
    { to: 'myeongdong', minutes: 3, line: '도보/2호선인접' },
    { to: 'ddp', minutes: 4, line: '2호선' },
    { to: 'jongno_3ga', minutes: 5, line: '도보/환승' }
  ],
  'myeongdong': [
    { to: 'euljiro_1ga', minutes: 3, line: '도보/연계' },
    { to: 'seoul_station', minutes: 3, line: '4호선' },
    { to: 'ddp', minutes: 4, line: '4호선' },
    { to: 'hyehwa', minutes: 6, line: '4호선' },
    { to: 'sadang', minutes: 16, line: '4호선' }
  ],
  'ddp': [
    { to: 'euljiro_1ga', minutes: 4, line: '2호선' },
    { to: 'myeongdong', minutes: 4, line: '4호선' },
    { to: 'hyehwa', minutes: 4, line: '4호선' },
    { to: 'wangsimni', minutes: 4, line: '2호선' },
    { to: 'jongno_3ga', minutes: 4, line: '5호선' },
    { to: 'yeouido', minutes: 16, line: '5호선' },
    { to: 'seongsu', minutes: 10, line: '2호선' }
  ],
  'hyehwa': [
    { to: 'myeongdong', minutes: 6, line: '4호선' },
    { to: 'ddp', minutes: 4, line: '4호선' },
    { to: 'jongno_3ga', minutes: 6, line: '도보/환승' }
  ],
  'jongno_3ga': [
    { to: 'city_hall', minutes: 4, line: '1호선' },
    { to: 'euljiro_1ga', minutes: 5, line: '도보/환승' },
    { to: 'ddp', minutes: 4, line: '5호선' },
    { to: 'seoul_station', minutes: 6, line: '1호선' },
    { to: 'express_bus', minutes: 16, line: '3호선' },
    { to: 'gyodae', minutes: 19, line: '3호선' }
  ],
  'wangsimni': [
    { to: 'ddp', minutes: 4, line: '2호선' },
    { to: 'seongsu', minutes: 5, line: '2호선' },
    { to: 'konkuk', minutes: 6, line: '2호선' },
    { to: 'yongsan', minutes: 13, line: '경의중앙선' }
  ],
  'seongsu': [
    { to: 'wangsimni', minutes: 5, line: '2호선' },
    { to: 'konkuk', minutes: 3, line: '2호선' },
    { to: 'ddp', minutes: 10, line: '2호선' },
    { to: 'jamsil', minutes: 9, line: '2호선' },
    { to: 'gangnam', minutes: 18, line: '2호선' }
  ],
  'konkuk': [
    { to: 'seongsu', minutes: 3, line: '2호선' },
    { to: 'jamsil', minutes: 6, line: '2호선' },
    { to: 'express_bus', minutes: 13, line: '7호선' }
  ],
  'jamsil': [
    { to: 'konkuk', minutes: 6, line: '2호선' },
    { to: 'seongsu', minutes: 9, line: '2호선' },
    { to: 'gangnam', minutes: 11, line: '2호선' }
  ],
  'gangnam': [
    { to: 'gyodae', minutes: 3, line: '2호선' },
    { to: 'jamsil', minutes: 11, line: '2호선' },
    { to: 'sadang', minutes: 10, line: '2호선' },
    { to: 'kr_suseo', minutes: 12, line: '신분당-SRT연계' }
  ],
  'gyodae': [
    { to: 'gangnam', minutes: 3, line: '2호선' },
    { to: 'express_bus', minutes: 3, line: '3호선' },
    { to: 'sadang', minutes: 7, line: '2호선' }
  ],
  'express_bus': [
    { to: 'gyodae', minutes: 3, line: '3호선' },
    { to: 'yeouido', minutes: 12, line: '9호선' },
    { to: 'jongno_3ga', minutes: 16, line: '3호선' },
    { to: 'itaewon', minutes: 11, line: '3-6환승' },
    { to: 'konkuk', minutes: 13, line: '7호선' }
  ],
  'sadang': [
    { to: 'gyodae', minutes: 7, line: '2호선' },
    { to: 'gangnam', minutes: 10, line: '2호선' },
    { to: 'sindorim', minutes: 16, line: '2호선' },
    { to: 'seoul_station', minutes: 15, line: '4호선' },
    { to: 'myeongdong', minutes: 16, line: '4호선' },
    { to: 'yongsan', minutes: 13, line: '4-1환승' }
  ],
  'seoul_station': [
    { to: 'hongdae', minutes: 7, line: '공항철도' },
    { to: 'city_hall', minutes: 2, line: '1호선' },
    { to: 'myeongdong', minutes: 3, line: '4호선' },
    { to: 'jongno_3ga', minutes: 6, line: '1호선' },
    { to: 'yongsan', minutes: 4, line: '1호선' },
    { to: 'sadang', minutes: 15, line: '4호선' },
    { to: 'yeouido', minutes: 10, line: '1-5환승' },
    { to: 'kr_daejeon', minutes: 55, line: 'KTX 고속철도' },
    { to: 'kr_dongdaegu', minutes: 100, line: 'KTX 고속철도' },
    { to: 'bs_busan_station', minutes: 135, line: 'KTX 고속철도' }
  ],
  'yongsan': [
    { to: 'seoul_station', minutes: 4, line: '1호선' },
    { to: 'sindorim', minutes: 10, line: '1호선' },
    { to: 'itaewon', minutes: 6, line: '경의-6호선' },
    { to: 'hongdae', minutes: 9, line: '경의중앙선' },
    { to: 'wangsimni', minutes: 13, line: '경의중앙선' },
    { to: 'yeouido', minutes: 6, line: '1-5연계' },
    { to: 'kr_gwangju_songjeong', minutes: 110, line: 'KTX 호남선' }
  ],
  'yeouido': [
    { to: 'express_bus', minutes: 12, line: '9호선' },
    { to: 'yongsan', minutes: 6, line: '1-5연계' },
    { to: 'sindorim', minutes: 7, line: '1호선-연계' },
    { to: 'ddp', minutes: 16, line: '5호선' },
    { to: 'seoul_station', minutes: 10, line: '1-5환승' },
    { to: 'hongdae', minutes: 11, line: '9-공항철도' }
  ],
  'itaewon': [
    { to: 'hapjeong', minutes: 12, line: '6호선' },
    { to: 'yongsan', minutes: 6, line: '6호선-경의' },
    { to: 'express_bus', minutes: 11, line: '6-3환승' }
  ],

  // --- 부산 도시철도 네트워크 (1호선 & 2호선) ---
  'bs_busan_station': [
    { to: 'bs_nampo', minutes: 4, line: '부산1호선' },
    { to: 'bs_seomyeon', minutes: 10, line: '부산1호선' },
    { to: 'seoul_station', minutes: 135, line: 'KTX 고속철도' },
    { to: 'kr_dongdaegu', minutes: 45, line: 'KTX 고속철도' }
  ],
  'bs_nampo': [
    { to: 'bs_busan_station', minutes: 4, line: '부산1호선' },
    { to: 'bs_seomyeon', minutes: 14, line: '부산1호선' }
  ],
  'bs_seomyeon': [
    { to: 'bs_busan_station', minutes: 10, line: '부산1호선' },
    { to: 'bs_nampo', minutes: 14, line: '부산1호선' },
    { to: 'bs_sasang', minutes: 11, line: '부산2호선' },
    { to: 'bs_gwangan', minutes: 14, line: '부산2호선' },
    { to: 'bs_centum', minutes: 18, line: '부산2호선' },
    { to: 'bs_haeundae', minutes: 25, line: '부산2호선' }
  ],
  'bs_sasang': [
    { to: 'bs_seomyeon', minutes: 11, line: '부산2호선' }
  ],
  'bs_gwangan': [
    { to: 'bs_seomyeon', minutes: 14, line: '부산2호선' },
    { to: 'bs_centum', minutes: 4, line: '부산2호선' },
    { to: 'bs_haeundae', minutes: 11, line: '부산2호선' }
  ],
  'bs_centum': [
    { to: 'bs_gwangan', minutes: 4, line: '부산2호선' },
    { to: 'bs_haeundae', minutes: 7, line: '부산2호선' },
    { to: 'bs_seomyeon', minutes: 18, line: '부산2호선' }
  ],
  'bs_haeundae': [
    { to: 'bs_centum', minutes: 7, line: '부산2호선' },
    { to: 'bs_gwangan', minutes: 11, line: '부산2호선' },
    { to: 'bs_seomyeon', minutes: 25, line: '부산2호선' }
  ],

  // --- 전국 KTX 거점 ---
  'kr_daejeon': [
    { to: 'seoul_station', minutes: 55, line: 'KTX 경부선' },
    { to: 'kr_dongdaegu', minutes: 45, line: 'KTX 경부선' }
  ],
  'kr_dongdaegu': [
    { to: 'kr_daejeon', minutes: 45, line: 'KTX 경부선' },
    { to: 'bs_busan_station', minutes: 45, line: 'KTX 경부선' },
    { to: 'seoul_station', minutes: 100, line: 'KTX 경부선' }
  ],
  'kr_gwangju_songjeong': [
    { to: 'yongsan', minutes: 110, line: 'KTX 호남선' }
  ],
  'kr_suseo': [
    { to: 'gangnam', minutes: 12, line: '신분당-3호선' },
    { to: 'kr_dongdaegu', minutes: 95, line: 'SRT 고속철도' },
    { to: 'bs_busan_station', minutes: 140, line: 'SRT 고속철도' }
  ]
};

// 양방향 그래프 구축
const graph: Record<string, { to: string; minutes: number }[]> = {};

Object.keys(ADJACENCY_LIST).forEach(u => {
  if (!graph[u]) graph[u] = [];
  ADJACENCY_LIST[u].forEach(edge => {
    graph[u].push({ to: edge.to, minutes: edge.minutes });
    if (!graph[edge.to]) graph[edge.to] = [];
    if (!graph[edge.to].some(e => e.to === u)) {
      graph[edge.to].push({ to: u, minutes: edge.minutes });
    }
  });
});

// 다익스트라 최단 시간 계산 함수 (캐시 적용)
const travelTimeCache: Record<string, number> = {};

export function getTravelMinutes(fromStationId: string, toStationId: string): number {
  if (fromStationId === toStationId) return 0;
  
  const cacheKey = `${fromStationId}_${toStationId}`;
  if (travelTimeCache[cacheKey] !== undefined) {
    return travelTimeCache[cacheKey];
  }

  const distances: Record<string, number> = {};
  const visited: Set<string> = new Set();
  const queue: { id: string; dist: number }[] = [];

  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
  });

  distances[fromStationId] = 0;
  queue.push({ id: fromStationId, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const current = queue.shift()!;

    if (visited.has(current.id)) continue;
    visited.add(current.id);

    if (current.id === toStationId) {
      break;
    }

    const neighbors = graph[current.id] || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.to)) continue;

      const newDist = distances[current.id] + neighbor.minutes;
      if (newDist < distances[neighbor.to]) {
        distances[neighbor.to] = newDist;
        queue.push({ id: neighbor.to, dist: newDist });
      }
    }
  }

  const result = distances[toStationId] !== Infinity ? distances[toStationId] : 30; // fallback
  travelTimeCache[cacheKey] = result;
  travelTimeCache[`${toStationId}_${fromStationId}`] = result;
  return result;
}
