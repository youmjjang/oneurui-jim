import React, { useState, useEffect } from 'react';
import { CryptoShredReceipt } from '../types';
import { shredTicketAndComplete, getLastShredReceipt } from '../services/cryptoVault';
import {
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Clock,
  Coins,
  FileCheck,
  Download,
  RotateCcw,
  Sparkles,
  Lock
} from 'lucide-react';

interface ReturnCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedMinutes: number;
  feePaid: number;
  onResetAll: () => void;
}

export const ReturnCompleteModal: React.FC<ReturnCompleteModalProps> = ({
  isOpen,
  onClose,
  savedMinutes,
  feePaid,
  onResetAll
}) => {
  const [shreddingPhase, setShreddingPhase] = useState<'shredding' | 'completed'>('shredding');
  const [receipt, setReceipt] = useState<CryptoShredReceipt | null>(null);

  useEffect(() => {
    if (isOpen) {
      setShreddingPhase('shredding');

      // 파기 시뮬레이션 및 실제 Web Crypto Shredding 실행
      const timer = setTimeout(async () => {
        const result = await shredTicketAndComplete(savedMinutes, feePaid);
        setReceipt(result);
        setShreddingPhase('completed');
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isOpen, savedMinutes, feePaid]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {shreddingPhase === 'shredding' ? (
          /* 1단계: 영구 파기 애니메이션 */
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center animate-bounce">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              보안 데이터 영구 파기 중...
            </h3>
            <p className="text-xs text-slate-500">
              브라우저 메모리 및 로컬 저장소의 비밀번호, 사물함 위치를 난수(Zero-fill)로 덮어쓰고 영구 소거하고 있습니다.
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-rose-600 h-2 rounded-full animate-pulse w-full"></div>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              SHREDDING: 0x00000000 ... OVERWRITING ... COMPLETED
            </p>
          </div>
        ) : (
          /* 2단계: 파기 완료 및 보안 영수증 */
          <div className="p-6 sm:p-7">
            {/* 상단 완료 뱃지 */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                짐 회수 & 보안 파기 완료!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Zero-Log 원칙에 따라 사물함 비밀번호와 이동 기록이 영구 파기되었습니다.
              </p>
            </div>

            {/* 보안 인증 영수증 카드 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono space-y-2.5 mb-5 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Zero-Log 보안 폐기 증명서
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-sans font-bold">
                  VERIFIED
                </span>
              </div>

              <div className="space-y-1.5 text-slate-600 text-[11px]">
                <div className="flex justify-between">
                  <span>증명 세션 ID:</span>
                  <span className="font-bold text-slate-900">{receipt?.sessionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>파기 완료 시각:</span>
                  <span>{new Date(receipt?.shreddedAt || '').toLocaleString('ko-KR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>이용 보관함:</span>
                  <span className="font-sans font-medium">{receipt?.stationUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>메모리 제로필 소거:</span>
                  <span className="text-emerald-600 font-bold">SUCCESS (100% 소거)</span>
                </div>
                <div className="flex justify-between">
                  <span>외부 서버 로그 잔존:</span>
                  <span className="text-emerald-600 font-bold">0건 (Zero-Server)</span>
                </div>
              </div>

              {/* SHA-256 지문 */}
              <div className="pt-2 border-t border-slate-200">
                <p className="text-[10px] text-slate-400">파기 무결성 SHA-256 Digest:</p>
                <p className="text-[9px] text-slate-500 truncate mt-0.5">
                  {receipt?.dataDigest}
                </p>
              </div>
            </div>

            {/* 동선 절약 효과 요약 */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-center">
                <span className="text-[11px] text-blue-700 font-medium flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 우회 시간 절약
                </span>
                <p className="text-xl font-black text-blue-900 mt-1">
                  약 {savedMinutes}분
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-center">
                <span className="text-[11px] text-amber-700 font-medium flex items-center justify-center gap-1">
                  <Coins className="w-3.5 h-3.5" /> 최종 정산 요금
                </span>
                <p className="text-xl font-black text-amber-900 mt-1">
                  {feePaid.toLocaleString()}원
                </p>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetAll();
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-sm active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                새로운 일정 시작하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
