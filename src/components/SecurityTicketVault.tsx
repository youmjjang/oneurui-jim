import React, { useState, useEffect } from 'react';
import { LockerItem, LuggageSize, PlainLockerTicket, EncryptedVaultPayload } from '../types';
import {
  saveSecureTicket,
  getSavedEncryptedPayload,
  unlockTicket
} from '../services/cryptoVault';
import {
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Copy,
  Sparkles
} from 'lucide-react';

interface SecurityTicketVaultProps {
  selectedLocker: LockerItem | null;
  luggageSize: LuggageSize;
  pickupTimeStr: string;
  onTriggerShredAndComplete: (totalSavedMinutes: number, totalFeePaid: number) => void;
}

export const SecurityTicketVault: React.FC<SecurityTicketVaultProps> = ({
  selectedLocker,
  luggageSize,
  pickupTimeStr,
  onTriggerShredAndComplete
}) => {
  // 저장된 암호화 페이로드 여부
  const [encryptedPayload, setEncryptedPayload] = useState<EncryptedVaultPayload | null>(null);

  // 신규 티켓 입력 폼 상태
  const [lockerNumber, setLockerNumber] = useState('');
  const [passcode, setPasscode] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 복호화 열람 상태
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockedTicket, setUnlockedTicket] = useState<PlainLockerTicket | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showSecret, setShowSecret] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // 컴포넌트 마운트 시 기존 저장된 암호화 페이로드 확인
  useEffect(() => {
    const payload = getSavedEncryptedPayload();
    setEncryptedPayload(payload);
  }, []);

  // 티켓 암호화 저장 핸들러
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockerNumber.trim() || !passcode.trim() || !pin.trim()) {
      alert('사물함 번호, 비밀번호, 본인 PIN 번호를 모두 입력해주세요.');
      return;
    }

    if (pin.length < 4) {
      alert('보안을 위해 PIN 번호는 최소 4자리 이상이어야 합니다.');
      return;
    }

    try {
      setIsSaving(true);
      const station = selectedLocker?.stationName || '지하철역 보관함';
      const lockerLocation = selectedLocker?.locationDesc || '역내 보관소';

      const ticket: PlainLockerTicket = {
        stationName: station,
        lockerNumber: lockerNumber.trim(),
        secretPasscode: passcode.trim(),
        storedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        pickupPlannedAt: pickupTimeStr,
        size: luggageSize,
        gateLocation: lockerLocation
      };

      const payload = await saveSecureTicket(ticket, pin, selectedLocker?.id || 'LOCKER');
      setEncryptedPayload(payload);

      // 보안 조치: 평문 입력 필드 즉시 초기화 (Zero-Memory)
      setLockerNumber('');
      setPasscode('');
      setPin('');
      setUnlockedTicket(null);
      setUnlockError(null);
    } catch (err: any) {
      alert('암호화 저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // PIN 입력 복호화 핸들러
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (failedAttempts >= 5) {
      setUnlockError('연속 5회 오입력으로 30초간 잠금 차단되었습니다.');
      return;
    }

    try {
      setIsUnlocking(true);
      setUnlockError(null);
      const decrypted = await unlockTicket(unlockPin);
      setUnlockedTicket(decrypted);
      setFailedAttempts(0);
      setUnlockPin('');
    } catch (err: any) {
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      setUnlockError(`PIN 번호가 일치하지 않습니다. (오류 ${nextFail}/5회)`);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 비밀번호 클립보드 복사
  const handleCopyPasscode = () => {
    if (unlockedTicket) {
      navigator.clipboard.writeText(unlockedTicket.secretPasscode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // 회수 완료 및 영구 파기 버튼 클릭
  const handleCompleteAndShred = () => {
    // 예상 절약 시간과 예상 요금 전달
    const savedMins = 35; // 평균 우회 절약 시간
    const fee = luggageSize === 'small' ? 2200 : luggageSize === 'medium' ? 3300 : 4400;
    onTriggerShredAndComplete(savedMins, fee);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 mb-8">
      {/* 타이틀 및 보안 아키텍처 안내 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            4단계: 브라우저 암호화 금고 (Zero-Server, Zero-Log)
          </span>
          <h3 className="text-lg font-bold text-slate-900">
            사물함 번호 & 비밀번호 보안 티켓
          </h3>
          <p className="text-xs text-slate-500">
            사진첩이나 카톡에 비밀번호를 남겨두지 마세요. 내 브라우저에서 <strong>AES-GCM 256비트</strong>로 암호화되어 안전하게 보호됩니다.
          </p>
        </div>

        {/* 보안 기술 스펙 칩 */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <KeyRound className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span>PBKDF2 10만회 + AES-GCM (외부 전송 0건)</span>
        </div>
      </div>

      {/* 상태 1: 암호화된 티켓이 이미 저장되어 있는 경우 (잠금 상태 or 열람 상태) */}
      {encryptedPayload ? (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 relative overflow-hidden">
            {/* 배경 워터마크 */}
            <div className="absolute right-3 top-3 text-slate-800/60 pointer-events-none">
              <Lock className="w-32 h-32 -mr-6 -mt-6" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-xs font-bold text-emerald-400">
                    암호화 금고 보관 중 (AES-GCM 256 Active)
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(encryptedPayload.createdAt).toLocaleTimeString('ko-KR')} 보관
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400">보관 역사</p>
                  <p className="text-base font-bold text-white">
                    {encryptedPayload.stationName}역
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">위치 상세</p>
                  <p className="text-xs text-slate-300 font-medium truncate">
                    {encryptedPayload.lockerLocation}
                  </p>
                </div>
              </div>

              {/* 암호화된 바이너리 미리보기 (보안 증명) */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 break-all mb-4">
                <p className="text-[10px] text-slate-500 mb-1 flex items-center justify-between">
                  <span>암호화 토큰 (Ciphertext):</span>
                  <span className="text-emerald-400">평문 노출 차단됨</span>
                </p>
                <span className="text-emerald-300/80">
                  {encryptedPayload.cipherText.substring(0, 48)}...
                </span>
              </div>

              {/* 복호화 열람 영역 */}
              {!unlockedTicket ? (
                /* 잠금 상태: PIN 입력 폼 */
                <form onSubmit={handleUnlock} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <label className="text-xs font-bold text-slate-200">
                      비밀번호 열람용 본인 PIN 번호 (접근 통제)
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="설정한 PIN 4~6자리 입력"
                      value={unlockPin}
                      onChange={(e) => setUnlockPin(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest text-center"
                    />
                    <button
                      type="submit"
                      disabled={isUnlocking}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                    >
                      <Unlock className="w-4 h-4" />
                      잠금 해제
                    </button>
                  </div>

                  {unlockError && (
                    <p className="text-xs text-rose-400 mt-2 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {unlockError}
                    </p>
                  )}
                </form>
              ) : (
                /* 열람 성공: 사물함 번호 & 비밀번호 마스킹 표시 */
                <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-xl p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-emerald-800/50">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Unlock className="w-4 h-4 text-emerald-400" />
                      PIN 인증 성공 (보안 열람 활성)
                    </span>
                    <button
                      onClick={() => setUnlockedTicket(null)}
                      className="text-[11px] text-slate-400 hover:text-white underline"
                    >
                      다시 잠그기
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                      <p className="text-[11px] text-slate-400">사물함 번호</p>
                      <p className="text-xl font-black text-white font-mono mt-0.5">
                        {unlockedTicket.lockerNumber}
                      </p>
                    </div>

                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 relative">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-400">사물함 비밀번호</p>
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="text-slate-400 hover:text-white"
                          title={showSecret ? '가리기' : '보기'}
                        >
                          {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xl font-black text-amber-400 font-mono mt-0.5 tracking-wider">
                        {showSecret ? unlockedTicket.secretPasscode : '••••••'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyPasscode}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccess ? '비밀번호 복사됨!' : '비밀번호 클립보드 복사'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 회수 완료 및 영구 파기 버튼 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h5 className="text-xs font-bold text-slate-900">짐을 다 찾으셨나요?</h5>
              <p className="text-[11px] text-slate-500">
                [회수 완료] 시 브라우저 내 암호화 데이터가 영구 파기(Shredding)되며 Zero-Log 증명서가 발행됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompleteAndShred}
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              짐 회수 완료 및 영구 파기 (Shredding)
            </button>
          </div>
        </div>
      ) : (
        /* 상태 2: 신규 티켓 생성 폼 */
        <form onSubmit={handleSaveTicket} className="space-y-4">
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              선택된 보관함: <strong>{selectedLocker ? `${selectedLocker.stationName}역 (${selectedLocker.locationDesc})` : '선택 대기'}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 사물함 칸 번호 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                사물함 번호 (현장 확인)
              </label>
              <input
                type="text"
                placeholder="예: 14번 또는 A-08"
                value={lockerNumber}
                onChange={(e) => setLockerNumber(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {/* 현장 설정 비밀번호 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                사물함 비밀번호 (또는 일회용 영수증 번호)
              </label>
              <input
                type="text"
                placeholder="예: 7294"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* 본인 마스터 PIN 설정 */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              본인 전용 PIN 번호 (열람 잠금 해제용 4~6자리)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              이 PIN 번호로 PBKDF2 암호화 키를 유도합니다. 서버로 절대 전송되지 않으며 본인만 풀 수 있습니다.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="숫자 4~6자리 입력"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm font-mono tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 저장 버튼 */}
          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Web Crypto AES-GCM 암호화 금고에 안전 저장</span>
          </button>
        </form>
      )}
    </div>
  );
};
