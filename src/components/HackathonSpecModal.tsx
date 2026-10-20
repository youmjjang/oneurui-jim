import React from 'react';
import { X, ShieldCheck, Database, Lock, AlertTriangle, FileText, CheckCircle2, Award } from 'lucide-react';

interface HackathonSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HackathonSpecModal: React.FC<HackathonSpecModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* 모달 헤더 */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">「짐 좀 내려놓자」 해커톤 기획 및 기술 명세서</h3>
              <p className="text-xs text-slate-400">팀원: 김유미, 조원웅 • 공공데이터 & 보안 융합 프로젝트</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모달 본문 (스크롤) */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* 1. 문제 정의 요약 */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-base mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              1. 문제 정의 & 아직 안 풀린 이유
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <p className="font-semibold text-slate-900">
                "약속 전 짐을 맡기려는 사람이 ‘짐을 맡기고 목적지에 갔다가 나중에 다시 찾으러 오는 전체 동선’을 미리 계산하지 못해 길에서 시간을 낭비하고, 보관함 크기·운영시간 정보 부족으로 헛걸음하거나 비밀번호 노출·분실 위험을 겪는다."
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1">
                <li><strong>되찾으러 오는 동선 무시:</strong> 기존 지도는 눈앞의 출발역만 추천하여 밤에 짐을 찾으러 30~45분 역주행하게 만듦.</li>
                <li><strong>정보 파편화 & 거짓 잔여석:</strong> 실시간 센서 없는 보관함의 빈자리 허위 안내 및 대형 캐리어 칸수 미확인으로 헛걸음 유발.</li>
                <li><strong>보안 취약성:</strong> 번호와 비번을 카톡 나에게 보내기나 사진첩에 방치하여 도난 및 사생활 노출 위험.</li>
              </ul>
            </div>
          </div>

          {/* 2. 해커톤 5대 기반 지식 과목 충족 명세 */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              2. 해커톤 5개 기반 지식 과목별 구현 내역
            </h4>

            <div className="space-y-3 text-xs">
              {/* 과목 1 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-700">과목 1: 데이터 기초 & 가공 (공공데이터)</span>
                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded">구현 완료</span>
                </div>
                <p className="text-slate-600">
                  서울교통공사 물품보관함 공공데이터(역사, 출구 위치, 개찰구 안/밖, 크기별 칸수, 요금) 및 서울 지하철 역간 소요시간 네트워크를 가공하여 최단 경로 다익스트라(Dijkstra) 알고리즘으로 우회 손실 시간을 실시간 연산.
                </p>
              </div>

              {/* 과목 2 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-700">과목 2: 네트워크 & 보안 기본 (암호화)</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">구현 완료</span>
                </div>
                <p className="text-slate-600">
                  브라우저 내장 <strong>Web Crypto API</strong>를 활용해 <strong>PBKDF2 10만 회 반복 키 유도</strong> 및 <strong>AES-GCM 256비트 대칭키 암호화</strong>를 구현. 서버 통신 없는 완전 무로그(Zero-Log) 보안 실현.
                </p>
              </div>

              {/* 과목 3 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-indigo-700">과목 3: 권한 & 접근통제 (PIN 잠금)</span>
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-0.5 rounded">구현 완료</span>
                </div>
                <p className="text-slate-600">
                  보관함 번호와 비밀번호를 본인 PIN 인증 없이는 열람할 수 없도록 격리. 연속 오입력 차단 및 UI 마스킹(••••)을 통해 스마트폰 분실 또는 타인 화면 노출 시 도난 원천 차단.
                </p>
              </div>

              {/* 과목 4 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-700">과목 4: 로그 분석 & 이상/위험 탐지 (심야 감금 방지)</span>
                  <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded">구현 완료</span>
                </div>
                <p className="text-slate-600">
                  사용자가 고른 회수 예정 시각과 지하철 역사 셔터 마감 시각(24:00)을 교차 분석하여 <strong>심야 역사 폐쇄로 인한 짐 감금 위험을 자동 탐지</strong>하고 위험 역사 사전 배제 및 경고 알림.
                </p>
              </div>

              {/* 과목 5 */}
              <div className="border border-slate-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-teal-700">과목 5: 대응 자동화, 승인, 처리, 보고서 (Crypto-Shredding)</span>
                  <span className="bg-teal-50 text-teal-600 text-[10px] font-bold px-2 py-0.5 rounded">구현 완료</span>
                </div>
                <p className="text-slate-600">
                  만차 대비 인접 <strong>플랜 B 대안 보관함 자동 연계</strong> 및 짐 회수 완료 시 난수(Zero-fill) 덮어쓰기 후 메모리를 영구 소거하는 <strong>Crypto-Shredding</strong> 수행. 파기 무결성 검증 SHA-256 증명서 발행.
                </p>
              </div>
            </div>
          </div>

          {/* 3. 서울교통공사 실시간 공공데이터 연계 규격 */}
          <div>
            <h4 className="font-extrabold text-slate-900 text-base mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-900"></span>
              3. 공공데이터 및 요금 표준
            </h4>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p>• <strong>소형 (Small):</strong> 450 × 300 × 500 mm (기본 4시간 2,200원 / 추가 1시간당 500원)</p>
              <p>• <strong>중형 (Medium):</strong> 450 × 600 × 500 mm (기본 4시간 3,300원 / 추가 1시간당 800원)</p>
              <p>• <strong>대형 (Large):</strong> 450 × 900 × 500 mm (기본 4시간 4,400원 / 추가 1시간당 1,000원)</p>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                * 출처: 공공데이터포털(data.go.kr) 서울교통공사 물품보관함 운영 현황 및 T-Locker 표준 규격
              </p>
            </div>
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
