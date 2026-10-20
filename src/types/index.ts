// 타입 정의: 짐 좀 내려놓자 프로젝트

export type LuggageSize = 'small' | 'medium' | 'large';
export type RegionType = 'seoul' | 'busan' | 'railway';

export interface Station {
  id: string;
  name: string;
  lines: string[]; // e.g. ["2호선", "경의중앙선", "공항철도"]
  region?: RegionType;
  x?: number;      // 지도/시각화 좌표
  y?: number;
  popularTag?: string; // e.g. "쇼핑/약속 핫스팟", "KTX 환승 거점"
}

export interface LockerItem {
  id: string;                  // 고유 ID (e.g. "HDA-01")
  stationName: string;         // 역명 (e.g. "홍대입구")
  stationId: string;
  line: string;                // 호선 (e.g. "2호선")
  region?: RegionType;
  locationDesc: string;        // 상세 위치 (e.g. "9번 출구 지하 1층 개찰구 밖")
  gateType: 'gate_in' | 'gate_out'; // 개찰구 안 / 개찰구 밖
  exitNear: string;            // 인접 출구 (e.g. "8·9번 출구 방면")
  
  // 정직한 설치 칸수 데이터 (빈자리 거짓 표시 금지!)
  capacity: {
    small: number;   // 소형 칸수 (서류가방, 쇼핑백, 백팩: 450x300x500mm)
    medium: number;  // 중형 칸수 (20인치 기내용 캐리어: 450x600x500mm)
    large: number;   // 대형 칸수 (24~28인치 화물용 캐리어: 450x900x500mm)
    total: number;
  };

  // 운영 시간 및 심야 셔터 마감 (심야 감금 방지)
  operatingHours: {
    weekdayOpen: string;  // e.g. "05:00"
    weekdayClose: string; // e.g. "24:00"
    weekendOpen: string;  // e.g. "05:30"
    weekendClose: string; // e.g. "24:00"
    shutterCloseHour: number; // e.g. 24 (자정 역사 셔터 폐쇄)
  };

  // 요금 체계 (서울교통공사 T-Locker 기준)
  pricing: {
    baseHours: number;      // 기본 4시간
    basePriceSmall: number; // 2,200원
    basePriceMedium: number;// 3,300원
    basePriceLarge: number; // 4,400원
    addPerHourSmall: number;// 500원
    addPerHourMedium: number;// 800원
    addPerHourLarge: number; // 1,000원
  };

  planBAlternativeId?: string; // 만차 대비 플랜 B 대체 보관함 ID
  notes?: string;              // 특이사항 (e.g. "주말 오후 대형칸 대기 잦음")
}

// 동선 경로 계산 결과
export interface RouteOption {
  locker: LockerItem;
  routeType: 'direct_dest' | 'on_the_way' | 'start_station' | 'alt_hub';
  routeLabel: string;          // e.g. "목적지 보관 (최단 우회 0분)", "경유 환승역 보관", "출발역 보관"
  
  // 시간 상세 (분 단위)
  timeStartToLocker: number;   // 출발역 -> 보관함
  timeLockerToDest: number;    // 보관함 -> 목적지
  timeDestToLocker: number;    // 목적지 -> 회수 보관함
  timeLockerToFinal: number;   // 회수 보관함 -> 귀가/최종역
  
  directTripTime: number;      // 출발역 -> 목적지 직행 시간
  totalTripTimeWithDrop: number; // 보관 및 회수를 포함한 총 이동 시간
  detourPenaltyMinutes: number;// 우회 손실 시간 (직행 대비 낭비되는 분)

  // 비용 계산
  expectedDurationHours: number;
  estimatedFee: number;

  // 안전 검사 결과
  safetyCheck: {
    isSafeFromCurfew: boolean;  // 심야 셔터 폐쇄 전 회수 가능한가
    shutterCloseTimeStr: string;
    curfewWarning?: string;     // 심야 감금 위험 경고 메시지
    sizeSupported: boolean;     // 고른 크기 칸이 있는가
    capacityCount: number;      // 해당 규격 설치 칸수
  };

  // 플랜 B 보관함 정보
  planB?: LockerItem;
}

// 4단계: 암호화 티켓 정보 (Zero-Log Web Crypto API)
export interface EncryptedVaultPayload {
  version: string;
  cipherText: string;  // Base64-encoded AES-GCM ciphertext
  iv: string;          // Base64-encoded 12-byte IV
  salt: string;        // Base64-encoded 16-byte PBKDF2 salt
  createdAt: string;   // ISO timestamp
  stationName: string; // 열람 전 안내용 (공개 정보)
  lockerLocation: string; // 열람 전 안내용
  lockerId: string;
}

export interface PlainLockerTicket {
  stationName: string;
  lockerNumber: string;    // 사물함 번호 (e.g. "14번")
  secretPasscode: string;  // 비밀번호 (e.g. "7294")
  storedAt: string;        // 보관 시작 시간
  pickupPlannedAt: string; // 예정 회수 시간
  size: LuggageSize;
  notes?: string;
  gateLocation?: string;
}

// 5단계: 영구 파기(Shredding) 증명서
export interface CryptoShredReceipt {
  shreddedAt: string;
  sessionId: string;
  dataDigest: string;       // SHA-256 해시 증명
  memoryWiped: boolean;
  localStorageCleared: boolean;
  totalSavedMinutes: number;
  totalFeePaid: number;
  stationUsed: string;
}
