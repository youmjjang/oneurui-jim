import { LockerItem, LuggageSize, RouteOption } from '../types';
import { LOCKERS_DATA, getLockerById } from '../data/lockersData';
import { getTravelMinutes } from '../data/travelTimes';

export interface RouteCalcInput {
  startStationId: string;
  destStationId: string;
  homeStationId?: string; // 없으면 startStationId와 동일하게 설정 (귀가)
  luggageSize: LuggageSize;
  startTimeStr: string;   // e.g. "14:00"
  pickupTimeStr: string;  // e.g. "20:30"
}

// 시간 문자열(HH:MM)을 분 단위로 변환
function timeStringToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// 두 시간 사이의 경과 시간(시간 단위, 올림) 계산
function calculateDurationHours(startTimeStr: string, pickupTimeStr: string): number {
  let startMins = timeStringToMinutes(startTimeStr);
  let pickupMins = timeStringToMinutes(pickupTimeStr);

  // 자정을 넘기는 경우
  if (pickupMins < startMins) {
    pickupMins += 24 * 60;
  }

  const diffMinutes = Math.max(1, pickupMins - startMins);
  return Math.ceil(diffMinutes / 60);
}

// 요금 계산 함수
function calculateLockerFee(locker: LockerItem, size: LuggageSize, durationHours: number): number {
  const { baseHours, basePriceSmall, basePriceMedium, basePriceLarge, addPerHourSmall, addPerHourMedium, addPerHourLarge } = locker.pricing;
  
  let basePrice = basePriceSmall;
  let addPricePerHour = addPerHourSmall;

  if (size === 'medium') {
    basePrice = basePriceMedium;
    addPricePerHour = addPerHourMedium;
  } else if (size === 'large') {
    basePrice = basePriceLarge;
    addPricePerHour = addPerHourLarge;
  }

  if (durationHours <= baseHours) {
    return basePrice;
  }

  const extraHours = durationHours - baseHours;
  return basePrice + (extraHours * addPricePerHour);
}

// 심야 마감 및 셔터 폐쇄 검사
function checkCurfewSafety(locker: LockerItem, pickupTimeStr: string): { isSafe: boolean; warning?: string; shutterTime: string } {
  const [pickupHour, pickupMinute] = pickupTimeStr.split(':').map(Number);
  const pickupTotalMinutes = pickupHour * 60 + pickupMinute;
  
  const shutterTime = `${locker.operatingHours.shutterCloseHour}:00`;

  // 23:45 이후이거나 24:00 정각 이후인 경우 심야 감금 위험
  if (pickupTotalMinutes >= 23 * 60 + 45 || pickupHour === 0 || pickupHour >= 24) {
    return {
      isSafe: false,
      warning: `🚨 심야 역사 셔터 폐쇄(${shutterTime})로 인한 짐 감금 위험! 자정 전 필수 회수 필요`,
      shutterTime
    };
  }

  // 23:00 ~ 23:45 사이는 임박 주의
  if (pickupTotalMinutes >= 23 * 60) {
    return {
      isSafe: true,
      warning: `⚠️ 마감 1시간 전입니다. 막차 및 역사 폐쇄(${shutterTime}) 전 여유 있게 회수하세요.`,
      shutterTime
    };
  }

  return {
    isSafe: true,
    shutterTime
  };
}

export function calculateOptimalLockers(input: RouteCalcInput): RouteOption[] {
  const { startStationId, destStationId, luggageSize, startTimeStr, pickupTimeStr } = input;
  const homeStationId = input.homeStationId || startStationId;

  // 1. 순수 직행 이동 시간 (짐 보관 없이 다닐 때)
  const directStartToDest = getTravelMinutes(startStationId, destStationId);
  const directDestToHome = getTravelMinutes(destStationId, homeStationId);
  const pureDirectTotal = directStartToDest + directDestToHome;

  const durationHours = calculateDurationHours(startTimeStr, pickupTimeStr);

  const results: RouteOption[] = [];

  for (const locker of LOCKERS_DATA) {
    const lStation = locker.stationId;

    // 해당 보관함이 고른 짐 규격을 지원하는지
    const capacityCount = locker.capacity[luggageSize];
    const sizeSupported = capacityCount > 0;

    // 역내 보관함 도보 시간 (개찰구 밖이면 3분, 개찰구 안이면 1분)
    const lockerWalkBuffer = locker.gateType === 'gate_out' ? 3 : 1;

    // 1구간: 출발역 -> 보관함역
    const timeStartToLocker = getTravelMinutes(startStationId, lStation) + lockerWalkBuffer;
    // 2구간: 보관함역 -> 목적지역
    const timeLockerToDest = getTravelMinutes(lStation, destStationId);
    // 3구간: 목적지역 -> 회수 보관함역
    const timeDestToLocker = getTravelMinutes(destStationId, lStation) + lockerWalkBuffer;
    // 4구간: 보관함역 -> 최종 귀가역
    const timeLockerToFinal = getTravelMinutes(lStation, homeStationId);

    // 보관함을 이용할 때의 전체 이동 시간
    const totalTripTimeWithDrop = timeStartToLocker + timeLockerToDest + timeDestToLocker + timeLockerToFinal;

    // 우회 손실 시간 (직행 대비 낭비되는 이동 분)
    const detourPenaltyMinutes = Math.max(0, totalTripTimeWithDrop - pureDirectTotal);

    // 요금 계산
    const estimatedFee = calculateLockerFee(locker, luggageSize, durationHours);

    // 심야 폐쇄 안전 검사
    const curfewCheck = checkCurfewSafety(locker, pickupTimeStr);

    // 경로 성격 분류
    let routeType: RouteOption['routeType'] = 'on_the_way';
    let routeLabel = '경유 환승역 보관';

    if (lStation === destStationId) {
      routeType = 'direct_dest';
      routeLabel = '🏆 목적지 역 보관 (우회 낭비 최소)';
    } else if (lStation === startStationId) {
      routeType = 'start_station';
      routeLabel = '출발역 보관 (되돌아올 때 손실 발생)';
    } else if (detourPenaltyMinutes <= 8) {
      routeType = 'alt_hub';
      routeLabel = '⚡ 자연스러운 환승 거점역 보관';
    }

    // 플랜 B 보관함 연계
    let planB: LockerItem | undefined = undefined;
    if (locker.planBAlternativeId) {
      planB = getLockerById(locker.planBAlternativeId);
    }

    results.push({
      locker,
      routeType,
      routeLabel,
      timeStartToLocker,
      timeLockerToDest,
      timeDestToLocker,
      timeLockerToFinal,
      directTripTime: pureDirectTotal,
      totalTripTimeWithDrop,
      detourPenaltyMinutes,
      expectedDurationHours: durationHours,
      estimatedFee,
      safetyCheck: {
        isSafeFromCurfew: curfewCheck.isSafe,
        shutterCloseTimeStr: curfewCheck.shutterTime,
        curfewWarning: curfewCheck.warning,
        sizeSupported,
        capacityCount
      },
      planB
    });
  }

  // 랭킹 정렬 규칙:
  // 1. 지원 가능한 규격 칸이 있는 곳 우선
  // 2. 심야 폐쇄 안전 여부 우선
  // 3. 우회 손실 시간(Detour Penalty) 가장 짧은 순
  // 4. 해당 크기 총 칸수가 많은 순
  results.sort((a, b) => {
    if (a.safetyCheck.sizeSupported !== b.safetyCheck.sizeSupported) {
      return a.safetyCheck.sizeSupported ? -1 : 1;
    }
    if (a.safetyCheck.isSafeFromCurfew !== b.safetyCheck.isSafeFromCurfew) {
      return a.safetyCheck.isSafeFromCurfew ? -1 : 1;
    }
    if (a.detourPenaltyMinutes !== b.detourPenaltyMinutes) {
      return a.detourPenaltyMinutes - b.detourPenaltyMinutes;
    }
    return b.safetyCheck.capacityCount - a.safetyCheck.capacityCount;
  });

  return results;
}
