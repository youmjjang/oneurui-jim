import React from 'react';
import { ShieldCheck, Luggage, Database, FileText, LockKeyhole } from 'lucide-react';

interface HeaderProps {
  onOpenSpecModal: () => void;
  activeTicketCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSpecModal, activeTicketCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* 서비스 타이틀 & 로고 */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Luggage className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">오늘의 짐</h1>
                <span className="text-xs bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-200">
                  전국 확장판
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                전국 지하철·철도 물품보관함 동선 비교 & 암호화 티켓 (팀: 김유미 · 조원웅)
              </p>
            </div>
          </div>

          {/* 모바일용 명세 버튼 */}
          <button
            onClick={onOpenSpecModal}
            className="sm:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
            title="기획 및 기술 명세서"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>

        {/* 보안 및 공공데이터 상태 배지 */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end text-xs">
          {/* Zero-Log 보안 뱃지 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden md:inline">Zero-Log</span> Web Crypto AES-GCM
          </div>

          {/* 공공데이터 연계 배지 */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">서울·부산·KTX</span> 전국 데이터 연계
          </div>

          {/* 보관 중인 티켓 알림 배지 */}
          {activeTicketCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-300 font-bold animate-pulse">
              <LockKeyhole className="w-3.5 h-3.5" />
              보관 중 1건
            </div>
          )}

          {/* 기술 명세 버튼 */}
          <button
            onClick={onOpenSpecModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>기획·기술 명세서</span>
          </button>
        </div>
      </div>
    </header>
  );
};
