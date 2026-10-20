import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { RoutePlanner } from './components/RoutePlanner';
import { RouteVisualizer } from './components/RouteVisualizer';
import { LockerComparison } from './components/LockerComparison';
import { SecurityTicketVault } from './components/SecurityTicketVault';
import { ReturnCompleteModal } from './components/ReturnCompleteModal';
import { HackathonSpecModal } from './components/HackathonSpecModal';
import { SubwayLockerMap } from './components/SubwayLockerMap';
import { RouteCalcInput, calculateOptimalLockers } from './services/routeCalculator';
import { LockerItem, RouteOption } from './types';
import { getSavedEncryptedPayload } from './services/cryptoVault';
import { METRO_STATIONS } from './data/metroStations';
import { Sparkles, Shield, Database, Download, FileSpreadsheet, MapPin } from 'lucide-react';

export function App() {
  // 1단계 입력 상태 (기본값: 서울역 -> 성수, 대형 캐리어, 14:00 -> 20:30)
  const [plannerInput, setPlannerInput] = useState<RouteCalcInput>({
    startStationId: 'seoul_station',
    destStationId: 'seongsu',
    homeStationId: 'seoul_station',
    luggageSize: 'large',
    startTimeStr: '14:00',
    pickupTimeStr: '20:30'
  });

  const [sameHomeStation, setSameHomeStation] = useState(true);

  // 모달 제어 상태
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [savedMinutesForReceipt, setSavedMinutesForReceipt] = useState(35);
  const [feeForReceipt, setFeeForReceipt] = useState(4400);

  // 선택된 보관함 상태
  const [selectedLocker, setSelectedLocker] = useState<LockerItem | null>(null);

  // 동선 및 최적 보관함 계산 (메모이제이션)
  const routeOptions = useMemo(() => {
    return calculateOptimalLockers(plannerInput);
  }, [plannerInput]);

  const bestOption = routeOptions[0];
  const worstOrStartOption = routeOptions.find(o => o.locker.stationId === plannerInput.startStationId);

  // 현재 저장된 티켓 개수
  const activeTicket = getSavedEncryptedPayload();

  // 검색 트리거
  const handleSearch = () => {
    const element = document.getElementById('results-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 보관함 선택 시
  const handleSelectLocker = (locker: LockerItem, _option: RouteOption) => {
    setSelectedLocker(locker);
    const vaultSection = document.getElementById('vault-section');
    if (vaultSection) {
      vaultSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 짐 회수 완료 트리거
  const handleTriggerShredAndComplete = (savedMins: number, fee: number) => {
    setSavedMinutesForReceipt(savedMins);
    setFeeForReceipt(fee);
    setIsCompleteModalOpen(true);
  };

  // 전체 리셋
  const handleResetAll = () => {
    setSelectedLocker(null);
    setPlannerInput({
      startStationId: 'seoul_station',
      destStationId: 'seongsu',
      homeStationId: 'seoul_station',
      luggageSize: 'large',
      startTimeStr: '14:00',
      pickupTimeStr: '20:30'
    });
  };

  const startStationObj = METRO_STATIONS.find(s => s.id === plannerInput.startStationId);
  const destStationObj = METRO_STATIONS.find(s => s.id === plannerInput.destStationId);
  const homeStationObj = METRO_STATIONS.find(s => s.id === (plannerInput.homeStationId || plannerInput.startStationId));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* 글로벌 상단 헤더 */}
      <Header
        onOpenSpecModal={() => setIsSpecModalOpen(true)}
        activeTicketCount={activeTicket ? 1 : 0}
      />

      {/* 메인 히어로 배너 */}
      <div className="bg-gradient-to-b from-blue-700 via-indigo-700 to-slate-900 text-white py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-sm mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>전국 지하철·철도 동선 손실 계산 + 브라우저 Web Crypto AES-GCM</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              오늘의 짐, 어디에 맡기실 건가요?<br className="hidden sm:inline" />
              <span className="text-amber-300">되찾으러 올 동선</span>까지 계산해 드립니다.
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-blue-100 font-normal leading-relaxed">
              수도권 지하철부터 부산 도시철도, 전국 KTX 철도역까지!
              전체 동선 낭비(우회 시간)를 줄여주는 최적 보관함을 추천하고, 사물함 비밀번호는 암호화 금고로 지킵니다.
            </p>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 컨테이너 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 -mt-6 flex-1 w-full pb-16">
        {/* 1단계: 이동 계획 입력기 */}
        <RoutePlanner
          plannerInput={plannerInput}
          onChangeInput={setPlannerInput}
          onSearch={handleSearch}
          sameHomeStation={sameHomeStation}
          setSameHomeStation={setSameHomeStation}
        />

        {/* 결과 분석 섹션 */}
        <div id="results-section">
          {bestOption && (
            <RouteVisualizer
              bestOption={bestOption}
              startStationName={startStationObj?.name || '출발'}
              destStationName={destStationObj?.name || '목적지'}
              homeStationName={homeStationObj?.name || '귀가'}
              worstOrStartOption={worstOrStartOption}
            />
          )}

          {/* 2~3단계: 추천 보관함 랭킹 & 정직한 설치 칸수 & 플랜 B */}
          <LockerComparison
            options={routeOptions}
            luggageSize={plannerInput.luggageSize}
            onSelectLocker={handleSelectLocker}
          />
        </div>

        {/* 선택된 보관함의 상세 안내도 */}
        {selectedLocker && (
          <div className="mb-6">
            <SubwayLockerMap locker={selectedLocker} />
          </div>
        )}

        {/* 4단계: Web Crypto API 암호화 금고 티켓 모듈 */}
        <div id="vault-section">
          <SecurityTicketVault
            selectedLocker={selectedLocker || bestOption?.locker || null}
            luggageSize={plannerInput.luggageSize}
            pickupTimeStr={plannerInput.pickupTimeStr}
            onTriggerShredAndComplete={handleTriggerShredAndComplete}
          />
        </div>

        {/* 공공데이터 다운로드 및 출처 센터 (심사용 증빙) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 mb-8 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              활용 공공데이터 파일 다운로드 센터 (심사위원 및 데이터 검증용)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            「오늘의 짐」에서 전처리 및 결합하여 실제 사용하는 전국 공공데이터 원본 파일입니다. 아래 링크에서 직접 내려받아 검증하실 수 있습니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="/data/서울교통공사_물품보관함_위치및설치수량.csv"
              download
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">서울교통공사 데이터</p>
                  <p className="text-[11px] text-slate-500">위치·설치수량 (CSV)</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="/data/부산교통공사_물품보관함_운영현황.csv"
              download
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">부산교통공사 데이터</p>
                  <p className="text-[11px] text-slate-500">1~4호선 현황 (CSV)</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </a>

            <a
              href="/data/국가철도공단_역사별_물품보관함_현황.csv"
              download
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">국가철도공단 데이터</p>
                  <p className="text-[11px] text-slate-500">전국 KTX 역사 (CSV)</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800 text-sm">
              「오늘의 짐」 — 공공데이터 & 보안 융합 해커톤 프로젝트
            </p>
            <p className="mt-1">
              팀원: <strong>김유미 · 조원웅</strong> | 데이터 출처: 서울교통공사, 부산교통공사, 국가철도공단
            </p>
          </div>

          <div className="flex items-center gap-4 text-slate-600">
            <button
              onClick={() => setIsSpecModalOpen(true)}
              className="hover:text-blue-600 underline font-medium"
            >
              기획·기술 명세서 보기
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <Shield className="w-3.5 h-3.5" /> Zero-Server Certified
            </span>
          </div>
        </div>
      </footer>

      {/* 5단계: 짐 회수 완료 & 영구 파기 모달 */}
      <ReturnCompleteModal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        savedMinutes={savedMinutesForReceipt}
        feePaid={feeForReceipt}
        onResetAll={handleResetAll}
      />

      {/* 해커톤 기획 및 기술 명세서 모달 */}
      <HackathonSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </div>
  );
}

export default App;
