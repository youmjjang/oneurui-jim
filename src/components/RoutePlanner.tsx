import React from 'react';
import { METRO_STATIONS } from '../data/metroStations';
import { LuggageSize } from '../types';
import { RouteCalcInput } from '../services/routeCalculator';
import { MapPin, ArrowRight, Clock, Briefcase, Sparkles, Navigation } from 'lucide-react';

interface RoutePlannerProps {
  plannerInput: RouteCalcInput;
  onChangeInput: (input: RouteCalcInput) => void;
  onSearch: () => void;
  sameHomeStation: boolean;
  setSameHomeStation: (val: boolean) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  plannerInput,
  onChangeInput,
  onSearch,
  sameHomeStation,
  setSameHomeStation
}) => {
  const handleStationChange = (field: 'startStationId' | 'destStationId' | 'homeStationId', value: string) => {
    const updated = { ...plannerInput, [field]: value };
    if (sameHomeStation && field === 'startStationId') {
      updated.homeStationId = value;
    }
    onChangeInput(updated);
  };

  const handleQuickPreset = (startId: string, destId: string, size: LuggageSize, startT: string, pickupT: string) => {
    onChangeInput({
      startStationId: startId,
      destStationId: destId,
      homeStationId: sameHomeStation ? startId : plannerInput.homeStationId,
      luggageSize: size,
      startTimeStr: startT,
      pickupTimeStr: pickupT
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-6">
      {/* 타이틀 및 해커톤 프리셋 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full mb-1">
            <Navigation className="w-3.5 h-3.5" /> 1단계: 이동 계획 입력
          </span>
          <h2 className="text-lg font-bold text-slate-900">어디서 출발해서 어디로 이동하시나요?</h2>
          <p className="text-xs text-slate-500">
            단순 거리만 보는 것이 아니라, <strong>짐을 맡기고 되찾아가는 전체 이동 손실(우회 시간)</strong>을 계산합니다.
          </p>
        </div>

        {/* 빠른 시연용 시나리오 칩 (해커톤 심사용) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-400 font-medium mr-1">시연 프리셋:</span>
          <button
            onClick={() => handleQuickPreset('seoul_station', 'seongsu', 'large', '14:00', '20:30')}
            className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 px-2.5 py-1 rounded-lg transition border border-slate-200"
          >
            ① 서울역→성수 (서울)
          </button>
          <button
            onClick={() => handleQuickPreset('bs_busan_station', 'bs_haeundae', 'large', '11:00', '18:00')}
            className="text-xs bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-lg transition border border-slate-200 font-semibold"
          >
            ② 부산역→해운대 (부산)
          </button>
          <button
            onClick={() => handleQuickPreset('hongdae', 'hyehwa', 'medium', '15:00', '23:45')}
            className="text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 px-2.5 py-1 rounded-lg transition border border-slate-200"
          >
            ③ 홍대→혜화 (심야주의)
          </button>
        </div>
      </div>

      {/* 1. 역 선택 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* 출발역 */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 출발역 (현재 위치)
          </label>
          <div className="relative">
            <select
              value={plannerInput.startStationId}
              onChange={(e) => handleStationChange('startStationId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {METRO_STATIONS.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}역 ({station.lines.join('/')}) {station.popularTag ? `• ${station.popularTag}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['seoul_station', 'hongdae', 'gangnam', 'yongsan'].map((sid) => {
              const st = METRO_STATIONS.find(s => s.id === sid);
              if (!st) return null;
              return (
                <button
                  key={sid}
                  type="button"
                  onClick={() => handleStationChange('startStationId', sid)}
                  className={`text-[11px] px-2 py-0.5 rounded-md transition ${plannerInput.startStationId === sid ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {st.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 목적지 (약속/일정 장소) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600" /> 목적지 (약속/일정 장소)
          </label>
          <div className="relative">
            <select
              value={plannerInput.destStationId}
              onChange={(e) => handleStationChange('destStationId', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {METRO_STATIONS.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}역 ({station.lines.join('/')}) {station.popularTag ? `• ${station.popularTag}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {['seongsu', 'myeongdong', 'hyehwa', 'yeouido', 'jamsil'].map((sid) => {
              const st = METRO_STATIONS.find(s => s.id === sid);
              if (!st) return null;
              return (
                <button
                  key={sid}
                  type="button"
                  onClick={() => handleStationChange('destStationId', sid)}
                  className={`text-[11px] px-2 py-0.5 rounded-md transition ${plannerInput.destStationId === sid ? 'bg-blue-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {st.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 귀가 / 최종 이동역 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span> 짐 회수 후 귀가역
            </label>
            <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={sameHomeStation}
                onChange={(e) => {
                  setSameHomeStation(e.target.checked);
                  if (e.target.checked) {
                    handleStationChange('homeStationId', plannerInput.startStationId);
                  }
                }}
                className="rounded text-blue-600 focus:ring-blue-500 text-xs"
              />
              출발역으로 귀가
            </label>
          </div>

          <div className="relative">
            <select
              disabled={sameHomeStation}
              value={sameHomeStation ? plannerInput.startStationId : (plannerInput.homeStationId || plannerInput.startStationId)}
              onChange={(e) => handleStationChange('homeStationId', e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                sameHomeStation
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50 text-slate-900 border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white'
              }`}
            >
              {METRO_STATIONS.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name}역 ({station.lines.join('/')})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            {sameHomeStation ? '✓ 일정이 끝나면 출발했던 위치로 복귀합니다' : '✓ 일정이 끝난 뒤 다른 곳으로 귀가합니다'}
          </p>
        </div>
      </div>

      {/* 2. 짐 크기 선택 (정직한 크기 및 규격 안내) */}
      <div className="mb-5">
        <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-blue-600" /> 맡기실 짐 크기 (정직한 규격별 설치 칸수 제공)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 소형 */}
          <button
            type="button"
            onClick={() => onChangeInput({ ...plannerInput, luggageSize: 'small' })}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              plannerInput.luggageSize === 'small'
                ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-900">🧳 소형 (Small)</span>
              <span className="text-xs font-semibold text-blue-600">4시간 2,200원</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">서류가방 · 핸드백 · 쇼핑백 · 백팩</p>
            <p className="text-[11px] text-slate-400 mt-1">규격: 450 × 300 × 500 mm</p>
          </button>

          {/* 중형 */}
          <button
            type="button"
            onClick={() => onChangeInput({ ...plannerInput, luggageSize: 'medium' })}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              plannerInput.luggageSize === 'medium'
                ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-900">🧳 중형 (Medium)</span>
              <span className="text-xs font-semibold text-blue-600">4시간 3,300원</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">기내용 20인치 캐리어 · 보스턴백</p>
            <p className="text-[11px] text-slate-400 mt-1">규격: 450 × 600 × 500 mm</p>
          </button>

          {/* 대형 */}
          <button
            type="button"
            onClick={() => onChangeInput({ ...plannerInput, luggageSize: 'large' })}
            className={`p-3.5 rounded-xl border text-left transition-all relative ${
              plannerInput.luggageSize === 'large'
                ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-slate-900">🧳 대형 (Large)</span>
              <span className="text-xs font-semibold text-blue-600">4시간 4,400원</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">화물용 24~28인치 캐리어 · 골프백</p>
            <p className="text-[11px] text-slate-400 mt-1">규격: 450 × 900 × 500 mm</p>
          </button>
        </div>
      </div>

      {/* 3. 보관 시간 및 찾을 시간 (심야 폐쇄 감금 검사용) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> 보관 시작 시간
          </label>
          <input
            type="time"
            value={plannerInput.startTimeStr}
            onChange={(e) => onChangeInput({ ...plannerInput, startTimeStr: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">약속 전 짐을 넣을 예정 시각</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> 짐 찾을 시간 (회수 예정 시각)
          </label>
          <input
            type="time"
            value={plannerInput.pickupTimeStr}
            onChange={(e) => onChangeInput({ ...plannerInput, pickupTimeStr: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-1.5 mt-1.5">
            <button
              type="button"
              onClick={() => onChangeInput({ ...plannerInput, pickupTimeStr: '21:00' })}
              className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-100"
            >
              저녁 21:00
            </button>
            <button
              type="button"
              onClick={() => onChangeInput({ ...plannerInput, pickupTimeStr: '23:30' })}
              className="text-[10px] bg-white border border-amber-200 px-2 py-0.5 rounded text-amber-700 hover:bg-amber-50 font-medium"
            >
              마감임박 23:30
            </button>
            <button
              type="button"
              onClick={() => onChangeInput({ ...plannerInput, pickupTimeStr: '23:55' })}
              className="text-[10px] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-rose-700 hover:bg-rose-100 font-bold"
            >
              자정폐쇄 23:55
            </button>
          </div>
        </div>
      </div>

      {/* 추천 버튼 */}
      <button
        type="button"
        onClick={onSearch}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 text-base transition-all transform active:scale-[0.99]"
      >
        <Sparkles className="w-5 h-5" />
        전체 동선 손실 비교 & 최적 보관함 추천받기
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
};
