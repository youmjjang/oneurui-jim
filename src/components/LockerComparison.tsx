import React, { useState } from 'react';
import { RouteOption, LuggageSize, LockerItem } from '../types';
import {
  ShieldAlert,
  Clock,
  Coins,
  MapPin,
  ExternalLink,
  ChevronRight,
  LifeBuoy,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  KeyRound,
  DoorOpen
} from 'lucide-react';

interface LockerComparisonProps {
  options: RouteOption[];
  luggageSize: LuggageSize;
  onSelectLocker: (locker: LockerItem, option: RouteOption) => void;
}

export const LockerComparison: React.FC<LockerComparisonProps> = ({
  options,
  luggageSize,
  onSelectLocker
}) => {
  const [expandedLockerId, setExpandedLockerId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLockerId(expandedLockerId === id ? null : id);
  };

  const getSizeLabel = (size: LuggageSize) => {
    if (size === 'small') return '소형 (Small)';
    if (size === 'medium') return '중형 (Medium)';
    return '대형 (Large)';
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
            2~3단계: 추천 순위 및 정직한 칸수 확인
          </span>
          <h3 className="text-lg font-bold text-slate-900 mt-1">
            추천 보관함 목록 (우회 시간 최소 순)
          </h3>
        </div>

        {/* 정직 안내 원칙 안내문 */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
          <span>빈자리 거짓 표시 금지 원칙: 규격별 총 설치 칸수 및 플랜 B 제공</span>
        </div>
      </div>

      {options.slice(0, 5).map((opt, index) => {
        const { locker, safetyCheck, planB } = opt;
        const isBest = index === 0;
        const isExpanded = expandedLockerId === locker.id;

        return (
          <div
            key={locker.id}
            className={`bg-white rounded-2xl border transition-all ${
              isBest
                ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                : 'border-slate-200 shadow-sm hover:border-slate-300'
            }`}
          >
            {/* 상단 뱃지 라인 */}
            <div className="px-5 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isBest
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-white'
                  }`}
                >
                  #{index + 1} {opt.routeLabel}
                </span>

                {/* 개찰구 안/밖 배지 */}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    locker.gateType === 'gate_in'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}
                >
                  <DoorOpen className="w-3 h-3" />
                  {locker.gateType === 'gate_in' ? '개찰구 안 (승차 중 이용)' : '개찰구 밖 (출구 대합실)'}
                </span>

                <span className="text-xs text-slate-500 font-mono">
                  코드: {locker.id}
                </span>
              </div>

              {/* 우회 시간 & 예상 요금 */}
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="text-slate-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  우회 손실: <strong className={opt.detourPenaltyMinutes <= 5 ? 'text-emerald-600' : 'text-amber-600'}>
                    +{opt.detourPenaltyMinutes}분
                  </strong>
                </span>
                <span className="text-slate-600 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  예상 요금: <strong className="text-slate-900">{opt.estimatedFee.toLocaleString()}원</strong>
                  <span className="text-[10px] text-slate-400">({opt.expectedDurationHours}시간)</span>
                </span>
              </div>
            </div>

            {/* 메인 내용 영역 */}
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* 왼쪽: 역사 및 보관함 위치 정보 */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xl font-extrabold text-slate-900">
                      {locker.stationName}역
                    </h4>
                    <span className="text-xs bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded">
                      {locker.line}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    {locker.locationDesc}
                  </p>
                  <p className="text-xs text-slate-500">
                    인접 출구: <span className="text-slate-700 font-medium">{locker.exitNear}</span>
                  </p>
                  {locker.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-2">
                      💡 {locker.notes}
                    </p>
                  )}
                </div>

                {/* 중앙: 짐 크기별 정직한 설치 칸수 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex-shrink-0 min-w-[220px]">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    정직한 총 설치 칸수 현황
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">소형(Small):</span>
                      <span className={`font-mono font-bold ${luggageSize === 'small' ? 'text-blue-600 underline' : 'text-slate-800'}`}>
                        {locker.capacity.small}칸
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">중형(Medium):</span>
                      <span className={`font-mono font-bold ${luggageSize === 'medium' ? 'text-blue-600 underline' : 'text-slate-800'}`}>
                        {locker.capacity.medium}칸
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">대형(Large):</span>
                      <span className={`font-mono font-bold ${luggageSize === 'large' ? 'text-blue-600 underline' : 'text-slate-800'}`}>
                        {locker.capacity.large}칸
                      </span>
                    </div>
                    <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                      <span>총 설치: {locker.capacity.total}칸</span>
                      <span className="text-blue-600 font-medium">선택: {getSizeLabel(luggageSize)}</span>
                    </div>
                  </div>
                </div>

                {/* 오른쪽: 선택 및 티켓 발급 액션 */}
                <div className="flex flex-col justify-center gap-2 flex-shrink-0 min-w-[160px]">
                  <button
                    type="button"
                    onClick={() => onSelectLocker(locker, opt)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition active:scale-[0.98]"
                  >
                    <KeyRound className="w-4 h-4" />
                    이 보관함에 넣기
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleExpand(locker.id)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition"
                  >
                    <span>{isExpanded ? '상세 및 플랜 B 닫기' : '대안 플랜 B 보기'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 심야 셔터 마감 및 감금 위험 경고 표시 */}
              {safetyCheck.curfewWarning && (
                <div
                  className={`mt-4 p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    safetyCheck.isSafeFromCurfew
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900 font-medium'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{safetyCheck.curfewWarning}</p>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      역사 셔터 마감 시각: {safetyCheck.shutterCloseTimeStr} (지하철 막차 후 역사 폐쇄 시 짐 반출 불가)
                    </p>
                  </div>
                </div>
              )}

              {/* 확장 패널: 플랜 B 대안 보관함 세트 (만차 대비 자동 매칭) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <LifeBuoy className="w-4 h-4 text-amber-600" />
                      <h5 className="text-xs font-bold text-amber-900">
                        만차 대비 플랜 B (현장 만석 시 즉시 이동 가능한 대안 보관함)
                      </h5>
                    </div>

                    {planB ? (
                      <div className="bg-white p-3 rounded-lg border border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <span>{planB.stationName}역 ({planB.line})</span>
                            <span className="text-[11px] font-normal text-slate-500">코드: {planB.id}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{planB.locationDesc}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            인접 출구: {planB.exitNear} • 설치: 소형 {planB.capacity.small} / 중형 {planB.capacity.medium} / 대형 {planB.capacity.large}칸
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onSelectLocker(planB, { ...opt, locker: planB })}
                          className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                        >
                          플랜 B 보관함으로 선택
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-600">
                        인근에 등록된 보관함이 여유롭습니다. 현장 고객안내센터를 이용하실 수 있습니다.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
