import React from 'react';
import { LockerItem } from '../types';
import { MapPin, Navigation, Info, DoorOpen, Footprints } from 'lucide-react';

interface SubwayLockerMapProps {
  locker: LockerItem;
}

export const SubwayLockerMap: React.FC<SubwayLockerMapProps> = ({ locker }) => {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 text-xs text-slate-700">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">
            {locker.stationName}역사 내 보관함 찾아가는 길
          </h4>
        </div>
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            locker.gateType === 'gate_in'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-indigo-100 text-indigo-800'
          }`}
        >
          {locker.gateType === 'gate_in' ? '승차 개찰구 안쪽' : '개찰구 바깥 대합실'}
        </span>
      </div>

      {/* 안내 다이어그램 */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-semibold">
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>상세 위치: {locker.locationDesc}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <Footprints className="w-4 h-4 text-slate-400" />
          <span>도보 가이드: {locker.exitNear} 방향으로 도보 약 1~2분 소요</span>
        </div>
        <div className="flex items-center gap-2 text-slate-600">
          <DoorOpen className="w-4 h-4 text-slate-400" />
          <span>
            교통카드 태그 안내:{' '}
            {locker.gateType === 'gate_in'
              ? '지하철 승차 중 개찰구를 나가지 않고 바로 이용 가능 (추가 요금 없음)'
              : '개찰구 밖 출구 방면 위치 (출구 밖 이용객 및 지상 약속에 최적)'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
        <span>보관함 키오스크 화면에서 '보관' 선택 후 휴대폰 번호 또는 PIN으로 열 수 있습니다.</span>
      </div>
    </div>
  );
};
