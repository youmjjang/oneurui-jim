import React from 'react';
import { RouteOption } from '../types';
import { ArrowRight, Clock, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

interface RouteVisualizerProps {
  bestOption: RouteOption;
  startStationName: string;
  destStationName: string;
  homeStationName: string;
  worstOrStartOption?: RouteOption;
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({
  bestOption,
  startStationName,
  destStationName,
  homeStationName,
  worstOrStartOption
}) => {
  // 기존 방식: 출발역에 보관했을 때의 손실 시간
  const startStationDetour = worstOrStartOption
    ? worstOrStartOption.detourPenaltyMinutes
    : Math.max(35, bestOption.detourPenaltyMinutes + 30);

  const savedMinutes = Math.max(0, startStationDetour - bestOption.detourPenaltyMinutes);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 mb-6 shadow-xl border border-indigo-900/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-800/60 mb-5 gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
            동선 최적화 분석 리포트
          </span>
          <h3 className="text-lg font-bold mt-1.5 flex items-center gap-2">
            기존 거리 중심 안내 vs 「짐 좀 내려놓자」 동선 비교
          </h3>
        </div>

        {savedMinutes > 0 && (
          <div className="bg-emerald-500/20 border border-emerald-400/40 rounded-xl px-4 py-2 flex items-center gap-3">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="text-[11px] text-emerald-200 font-medium">되돌아오는 길바닥 낭비 방지</p>
              <p className="text-base font-extrabold text-emerald-300">약 {savedMinutes}분 절약!</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A안: 기존 방식 (출발역에 무심코 짐을 맡긴 경우) */}
        <div className="bg-slate-800/70 border border-rose-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              기존 지도 방식 (눈앞의 출발역 보관)
            </span>
            <span className="text-xs bg-rose-950/80 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
              우회 손실 +{startStationDetour}분 낭비
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px]">1</span>
              <span><strong>{startStationName}역</strong>에서 짐 보관 후 탑승</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px]">2</span>
              <span><strong>{destStationName}역</strong>으로 이동하여 일정 진행</span>
            </div>
            <div className="flex items-center gap-2 text-rose-300 font-medium bg-rose-950/40 p-2 rounded-lg border border-rose-900/40">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">3</span>
              <span>일정 끝난 밤, 짐 찾으러 <strong>{startStationName}역</strong>까지 역주행! (시간·차비 낭비)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-[10px]">4</span>
              <span>짐 회수 후 다시 <strong>{homeStationName}역</strong>으로 귀가</span>
            </div>
          </div>
        </div>

        {/* B안: 짐 좀 내려놓자 추천 방식 (최단 우회 거점) */}
        <div className="bg-blue-950/40 border border-blue-500/50 rounded-xl p-4 relative overflow-hidden ring-1 ring-blue-500/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              짐 좀 내려놓자 추천 ({bestOption.locker.stationName}역)
            </span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded font-mono font-bold">
              {bestOption.detourPenaltyMinutes === 0
                ? '우회 손실 0분 (직행 동일)'
                : `우회 손실 불과 +${bestOption.detourPenaltyMinutes}분`}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">1</span>
              <span>{startStationName}역에서 <strong>{bestOption.locker.stationName}역</strong>으로 바로 이동</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">2</span>
              <span>
                <strong>{bestOption.locker.locationDesc}</strong>에 안전하게 짐 보관 ({bestOption.locker.gateType === 'gate_in' ? '개찰구 안' : '개찰구 밖'})
              </span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300 font-medium bg-emerald-950/40 p-2 rounded-lg border border-emerald-900/40">
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">3</span>
              <span>일정 종료 후 현장에서 즉시 짐 회수! (역주행 이동 손실 제로)</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">4</span>
              <span>홀가분하게 <strong>{homeStationName}역</strong>으로 귀가</span>
            </div>
          </div>
        </div>
      </div>

      {/* 타임라인 요약 바 */}
      <div className="mt-4 pt-3 border-t border-indigo-800/40 flex flex-wrap items-center justify-between text-xs text-indigo-200 gap-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          <span>직행 순수 이동: <strong>{bestOption.directTripTime}분</strong></span>
          <span className="text-indigo-400">•</span>
          <span>보관함 경유 총 이동: <strong>{bestOption.totalTripTimeWithDrop}분</strong></span>
        </div>
        <div className="text-[11px] text-indigo-300">
          * 서울교통공사 운행시간표 및 환승 보행시간 표준 알고리즘 반영
        </div>
      </div>
    </div>
  );
};
