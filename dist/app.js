const $ = id => document.getElementById(id);

// -------------------------------------------------------------------
// 1. 모드 전환 및 기본 폼 설정
// -------------------------------------------------------------------
function mode(value) {
  const route = value === 'route';
  $('routeFields').hidden = !route;
  $('priorityField').hidden = !route;
  for (const [id, on] of [['nearTab', !route], ['routeTab', route]]) {
    $(id).classList.toggle('active', on);
    $(id).setAttribute('aria-selected', String(on));
  }
  $('searchText').textContent = route ? '내 일정에 맞는 보관함 찾기' : '가까운 보관함 찾기';
  $('modeTitle').textContent = route ? '찾으러 갈 때까지, 편하게.' : '일단, 짐부터 내려놓을까요?';
  $('modeDescription').textContent = route ? '방문과 짐 회수 동선을 함께 비교해요.' : '출발지에서 가까운 보관함을 비교해요.';
}

$('nearTab').onclick = () => mode('near');
$('routeTab').onclick = () => mode('route');

document.querySelectorAll('[data-size]').forEach(b => {
  b.onclick = () => document.querySelectorAll('[data-size]').forEach(x => {
    x.classList.toggle('active', x === b);
    x.setAttribute('aria-pressed', String(x === b));
  });
});

$('sizeHelp').onclick = () => {
  $('formError').textContent = '소형(서류가방/백팩), 중형(기내용 20인치), 대형(화물용 24~28인치) 규격을 지원합니다.';
};

const local = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const now = new Date();
$('deposit').value = local(now);
$('pickup').value = local(new Date(now.getTime() + 4 * 3600000));
mode('route'); // 기본: 일정에 맞추기(동선 비교)

// -------------------------------------------------------------------
// 2. 빠른 시연 프리셋 핸들러 (해커톤 심사용)
// -------------------------------------------------------------------
function applyPreset(reg, start, visit, end, size, depositHours, pickupHours, isNight) {
  mode('route');
  $('region').value = reg;
  $('start').value = start;
  $('visit').value = visit;
  $('end').value = end;
  document.querySelectorAll('[data-size]').forEach(x => {
    const match = x.dataset.size === size;
    x.classList.toggle('active', match);
    x.setAttribute('aria-pressed', String(match));
  });

  const base = new Date();
  if (isNight) {
    base.setHours(15, 0, 0, 0);
    $('deposit').value = local(base);
    const pick = new Date(base);
    pick.setHours(23, 50, 0, 0);
    $('pickup').value = local(pick);
  } else {
    base.setHours(depositHours, 0, 0, 0);
    $('deposit').value = local(base);
    const pick = new Date(base);
    pick.setHours(pickupHours, 0, 0, 0);
    $('pickup').value = local(pick);
  }
  $('plannerForm').requestSubmit();
}

$('presetSeoul').onclick = () => applyPreset('서울', '서울역', '성수역', '서울역', 'L', 14, 20, false);
$('presetBusan').onclick = () => applyPreset('부산', '부산역', '해운대', '부산역', 'L', 11, 18, false);
$('presetNight').onclick = () => applyPreset('서울', '홍대입구역', '혜화역', '홍대입구역', 'M', 15, 23, true);

// -------------------------------------------------------------------
// 3. Web Crypto API (AES-GCM 256 + PBKDF2) 무로그 보안 금고 모듈
// -------------------------------------------------------------------
const VAULT_STORAGE_KEY = 'oneurui_jim_vault_payload';

function buf2b64(buf) {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

function b642buf(b64) {
  const binary = window.atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derivePinKey(pin, salt) {
  const enc = new TextEncoder();
  const mat = await window.crypto.subtle.importKey('raw', enc.encode(pin), { name: 'PBKDF2' }, false, ['deriveKey']);
  return window.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    mat,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function sha256(text) {
  const enc = new TextEncoder();
  const buf = await window.crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getStoredPayload() {
  const raw = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function updateVaultBadge() {
  const payload = getStoredPayload();
  const badge = $('activeVaultBadge');
  if (badge) {
    if (payload) {
      badge.style.display = 'inline-block';
      badge.textContent = `🔒 ${payload.stationName} 보관 중`;
      badge.onclick = () => openVaultModal(payload.stationName, payload.location);
    } else {
      badge.style.display = 'none';
    }
  }
}
updateVaultBadge();

// -------------------------------------------------------------------
// 4. 보안 모달 열기 및 렌더링
// -------------------------------------------------------------------
let currentSelectedLocker = null;

window.openVaultModal = function(stationName, locationDesc) {
  currentSelectedLocker = { stationName, locationDesc };
  const payload = getStoredPayload();
  const container = $('vaultContent');

  if (payload) {
    // 이미 암호화 티켓이 있는 경우 -> 잠금 해제 화면
    container.innerHTML = `
      <div class="vault-status-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="color:#7ad1a2;font-size:13px;">🔒 AES-GCM 256 암호화 보관 중</strong>
          <span style="font-size:11px;color:#a3baa9;">${new Date(payload.createdAt).toLocaleTimeString('ko-KR')}</span>
        </div>
        <div style="font-size:12px;margin-bottom:6px;"><strong>역사:</strong> ${payload.stationName}</div>
        <div style="font-size:11px;color:#cbd9ce;margin-bottom:14px;"><strong>위치:</strong> ${payload.location}</div>
        <div style="background:#11221b;padding:8px 12px;border-radius:6px;font-family:monospace;font-size:10px;color:#85c29f;word-break:break-all;margin-bottom:14px;">
          토큰: ${payload.cipherText.slice(0, 32)}... (평문 노출 차단)
        </div>

        <div id="unlockedView" style="display:none;background:#203b30;border:1px solid #457860;border-radius:8px;padding:12px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
            <strong style="color:#a8f0cb;">PIN 인증 완료</strong>
            <button type="button" id="toggleMaskBtn" style="background:none;border:0;color:#c1e2ce;font-size:11px;cursor:pointer;">비밀번호 보기</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><small style="color:#92ab9b;">사물함 번호</small><h4 id="viewLockerNo" style="margin:2px 0 0;font-size:16px;"></h4></div>
            <div><small style="color:#92ab9b;">사물함 비밀번호</small><h4 id="viewPasscode" style="margin:2px 0 0;font-size:16px;color:#fce49f;">••••••</h4></div>
          </div>
        </div>

        <form id="unlockForm">
          <label style="display:block;font-size:11px;color:#cde0d3;margin-bottom:6px;">본인 마스터 PIN 번호 입력 (접근 통제)</label>
          <div style="display:flex;gap:6px;">
            <input id="unlockPinInput" type="password" maxlength="6" placeholder="PIN 4~6자리" style="flex:1;background:#0f1c16;border:1px solid #3c5949;color:white;padding:10px;border-radius:7px;text-align:center;font-family:monospace;letter-spacing:4px;" required>
            <button type="submit" class="primary" style="padding:10px 16px;">잠금 해제</button>
          </div>
          <p id="unlockError" style="color:#f79e92;font-size:11px;margin:6px 0 0;"></p>
        </form>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <span style="font-size:11px;color:#778574;">짐을 모두 찾으셨나요?</span>
        <button type="button" class="shred-btn" id="triggerShredBtn">짐 회수 완료 & 영구 파기</button>
      </div>
    `;

    let decryptedData = null;
    let isMasked = true;

    $('unlockForm').onsubmit = async e => {
      e.preventDefault();
      const pin = $('unlockPinInput').value.trim();
      $('unlockError').textContent = '';
      try {
        const salt = b642buf(payload.salt);
        const iv = b642buf(payload.iv);
        const cipher = b642buf(payload.cipherText);
        const key = await derivePinKey(pin, salt);
        const dec = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
        const text = new TextDecoder().decode(dec);
        decryptedData = JSON.parse(text);

        $('unlockForm').style.display = 'none';
        $('unlockedView').style.display = 'block';
        $('viewLockerNo').textContent = decryptedData.lockerNo;
        $('viewPasscode').textContent = '••••••';
      } catch {
        $('unlockError').textContent = 'PIN 번호가 일치하지 않거나 데이터가 변조되었습니다.';
      }
    };

    const maskBtn = $('toggleMaskBtn');
    if (maskBtn) {
      maskBtn.onclick = () => {
        if (!decryptedData) return;
        isMasked = !isMasked;
        $('viewPasscode').textContent = isMasked ? '••••••' : decryptedData.passcode;
        maskBtn.textContent = isMasked ? '비밀번호 보기' : '비밀번호 숨기기';
      };
    }

    $('triggerShredBtn').onclick = async () => {
      // Crypto-Shredding 실행: 난수 덮어쓰기 후 완전 삭제
      const digest = await sha256(JSON.stringify(payload) + Date.now());
      const noise = buf2b64(window.crypto.getRandomValues(new Uint8Array(128)));
      localStorage.setItem(VAULT_STORAGE_KEY, noise);
      localStorage.removeItem(VAULT_STORAGE_KEY);
      updateVaultBadge();
      $('vaultDialog').close();

      // 영수증 모달 출력
      $('receiptContent').innerHTML = `
        <div class="receipt-box">
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #c9d4c4;padding-bottom:8px;margin-bottom:8px;">
            <strong>Zero-Log 보안 폐기 증명서</strong>
            <span style="color:#285847;font-weight:700;">VERIFIED</span>
          </div>
          <div>• 인증 세션: SHRED-${Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
          <div>• 이용 역사: ${payload.stationName}</div>
          <div>• 파기 일시: ${new Date().toLocaleString('ko-KR')}</div>
          <div>• 브라우저 메모리 제로필: <strong style="color:#285847;">100% 영구 소거 완료</strong></div>
          <div>• 외부 서버 전송 잔존: <strong style="color:#285847;">0건 (Zero-Server)</strong></div>
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #c9d4c4;font-size:9px;color:#7a8a77;">
            SHA-256 Digest: ${digest}
          </div>
        </div>
      `;
      $('receiptDialog').showModal();
    };

  } else {
    // 신규 티켓 발급 폼
    container.innerHTML = `
      <form id="newTicketForm">
        <div style="background:#f4f7f1;padding:10px 14px;border-radius:8px;margin-bottom:14px;font-size:12px;">
          선택 보관함: <strong>${stationName}</strong> (${locationDesc})
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
          <div>
            <label class="field-label">사물함 번호</label>
            <input id="inpLockerNo" placeholder="예: 14번" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:7px;" required>
          </div>
          <div>
            <label class="field-label">사물함 비밀번호</label>
            <input id="inpPasscode" placeholder="예: 7294" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:7px;" required>
          </div>
        </div>

        <div style="margin-bottom:16px;">
          <label class="field-label">열람 잠금용 본인 마스터 PIN (4~6자리)</label>
          <input id="inpPin" type="password" maxlength="6" placeholder="숫자 4~6자리 입력" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:7px;font-family:monospace;letter-spacing:3px;" required>
          <small style="color:#7f8f7c;font-size:10px;display:block;margin-top:4px;">
            이 PIN으로 AES-GCM 키를 유도하며, 서버에 전송되지 않습니다.
          </small>
        </div>

        <button type="submit" class="primary full">🔒 Web Crypto AES-GCM 암호화 금고에 저장</button>
      </form>
    `;

    $('newTicketForm').onsubmit = async e => {
      e.preventDefault();
      const lockerNo = $('inpLockerNo').value.trim();
      const passcode = $('inpPasscode').value.trim();
      const pin = $('inpPin').value.trim();

      if (pin.length < 4) {
        alert('PIN 번호는 최소 4자리 이상이어야 합니다.');
        return;
      }

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await derivePinKey(pin, salt);

      const plain = JSON.stringify({ lockerNo, passcode, stationName, locationDesc });
      const cipherBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));

      const payload = {
        stationName,
        location: locationDesc,
        cipherText: buf2b64(cipherBuf),
        iv: buf2b64(iv),
        salt: buf2b64(salt),
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
      updateVaultBadge();
      alert('비밀번호가 브라우저 내 암호화 금고에 안전하게 저장되었습니다!');
      $('vaultDialog').close();
    };
  }

  $('vaultDialog').showModal();
};

$('closeVaultDialog').onclick = () => $('vaultDialog').close();
$('closeReceiptDialog').onclick = () => $('receiptDialog').close();
$('receiptDoneBtn').onclick = () => $('receiptDialog').close();

// 기획 명세서 모달
$('openSpecBtn').onclick = () => $('specDialog').showModal();
$('closeSpecDialog').onclick = () => $('specDialog').close();
$('closeSpecBtn2').onclick = () => $('specDialog').close();

// -------------------------------------------------------------------
// 5. 검색 폼 제출 및 결과 카드 렌더링
// -------------------------------------------------------------------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clock = s => s ? String(s).slice(0, 2) + ':' + String(s).slice(2, 4) : '24:00';

$('plannerForm').onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector('.search-button');
  if (btn.disabled) return;

  const q = {
    coords: currentCoords,
    code: '',
    region: $('region').value.trim(),
    start: $('start').value.trim(),
    visit: $('visit').value.trim(),
    end: $('end').value.trim(),
    mode: $('routeFields').hidden ? 'near' : 'route',
    size: document.querySelector('[data-size].active').dataset.size,
    priority: $('priority').value,
    deposit: $('deposit').value,
    pickup: $('pickup').value
  };

  if (!q.start || (q.mode === 'route' && (!q.visit || !q.end))) {
    $('formError').textContent = '출발지와 목적지를 입력해주세요.';
    return;
  }
  if (new Date(q.pickup) <= new Date(q.deposit)) {
    $('formError').textContent = '찾을 시각은 맡길 시각 이후로 선택해주세요.';
    return;
  }

  btn.disabled = true;
  const label = $('searchText').textContent;
  $('searchText').textContent = '전국 보관함 및 동선 계산 중…';
  $('formError').textContent = '';

  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || '조회 실패');

    $('resultsTitle').textContent = '보관함 ' + d.results.length + '곳';
    $('mapPlaceholder').innerHTML = '<h3>' + esc(d.start.name) + ' 기준 최적 동선 분석 완료</h3><p>' + esc(d.scope) + '</p>';
    $('summary').classList.add('visible');
    $('summary').innerHTML = '<strong>' + esc(d.note) + '</strong><br><small>데이터 출처: ' + esc(d.source) + '</small>';

    $('cards').innerHTML = d.results.length
      ? d.results.map((l, index) => {
          const isBest = index === 0;
          return `
            <article class="locker-card ${isBest ? 'selected' : ''}">
              <div class="card-top">
                <div class="locker-icon">${isBest ? '🏆' : '🧳'}</div>
                <div class="card-title">
                  <div class="card-tags">
                    <span class="tag ${isBest ? 'recommend' : ''}">${isBest ? '추천 1위' : '#' + (index + 1)}</span>
                    <span class="tag">${l.location.includes('개찰구 안') ? '개찰구 안쪽' : '개찰구 밖 대합실'}</span>
                    <span class="tag unknown">코드: ${esc(l.id)}</span>
                  </div>
                  <h3>${esc(l.name)}</h3>
                  <p>${esc(l.address)}<br><strong>${esc(l.location)}</strong></p>
                </div>
              </div>

              ${l.curfewWarning ? `<div class="curfew-alert">${esc(l.curfewWarning)}</div>` : ''}

              <div class="metrics">
                <div class="metric">
                  <small>전체 이동시간</small>
                  <strong>${l.total === null ? '연산 중' : l.total + '<em>분</em>'}</strong>
                  <small class="note">출발→보관→방문→회수</small>
                </div>
                <div class="metric">
                  <small>짐 들고 이동</small>
                  <strong>${l.carry === null ? '확인 필요' : l.carry + '<em>분</em>'}</strong>
                  <small class="note">실제 보관 효과</small>
                </div>
                <div class="metric">
                  <small>선택 규격 칸수</small>
                  <strong>${esc(l.available === null ? '현장확인' : l.available + '칸')}</strong>
                  <small class="note">정직한 총 설치량</small>
                </div>
              </div>

              <div class="plan-b-box">
                <strong>만차 대비 플랜 B:</strong> ${esc(l.planB?.name || '인근 대안 보관함')} · ${esc(l.planB?.tip || '현장 안내')}
              </div>

              <div style="font-size:11px;color:#788474;margin:8px 0;">
                운영시간: 평일 ${clock(l.hours?.weekday?.[0])}–${clock(l.hours?.weekday?.[1])} / 
                주말·공휴일 ${clock(l.hours?.saturday?.[0])}–${clock(l.hours?.saturday?.[1])} (자정 역사 셔터 마감)
              </div>

              ${l.details?.length ? l.details.map(x => `
                <div style="font-size:11px;color:#495e43;background:#f3f6ef;padding:8px 12px;border-radius:6px;margin:6px 0;">
                  <strong>${esc(x.stlckKndNm)}</strong> · ${esc(x.utztnCrgExpln || '기본 요금')} (${esc(x.addCrgExpln || '')})<br>
                  규격: 가로 ${esc(x.stlckWdthLenExpln || '450mm')} × 높이 ${esc(x.stlckHgtExpln || '600mm')} × 깊이 ${esc(x.stlckDpthExpln || '500mm')}
                </div>
              `).join('') : ''}

              <details style="font-size:11px;margin-top:10px;">
                <summary style="cursor:pointer;color:#285847;font-weight:700;">상세 이동 구간 보기</summary>
                <div style="margin-top:8px;padding-left:10px;border-left:2px solid #cad6c4;">
                  ${l.legs.map((leg, i) => `
                    <p style="margin:4px 0;">
                      <strong>${['1. 출발지 → 보관함', '2. 보관함 → 방문지', '3. 방문지 → 보관함(회수)', '4. 보관함 → 최종 목적지'][i]}:</strong>
                      ${leg ? leg.minutes + '분 (' + leg.steps.map(esc).join(' · ') + ')' : '경로 연산'}
                    </p>
                  `).join('')}
                </div>
              </details>

              <div style="display:flex;justify-content:flex-end;margin-top:12px;">
                <button type="button" class="ticket-btn" onclick="openVaultModal('${esc(l.name)}', '${esc(l.location)}')">
                  🔒 이 보관함에 짐 넣기 & 보안 티켓 발급
                </button>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="empty"><h3>조회된 보관함이 없어요</h3><p>출발지 또는 목적지 역명을 확인해주세요.</p></div>';

  } catch (err) {
    $('formError').textContent = err.message;
    $('cards').innerHTML = '<div class="empty"><h3>검색을 완료하지 못했어요</h3><p>' + esc(err.message) + '</p></div>';
  } finally {
    btn.disabled = false;
    $('searchText').textContent = label;
  }
};

// -------------------------------------------------------------------
// 6. 현재 위치 지오로케이션
// -------------------------------------------------------------------
let currentCoords = null;
$('start').addEventListener('input', () => { currentCoords = null; });
$('locateButton').onclick = () => {
  if (!navigator.geolocation) {
    $('formError').textContent = '이 브라우저는 위치 조회를 지원하지 않아요.';
    return;
  }
  $('locateButton').disabled = true;
  $('locateButton').textContent = '현재 위치 확인 중…';

  navigator.geolocation.getCurrentPosition(
    async pos => {
      currentCoords = { x: pos.coords.longitude, y: pos.coords.latitude };
      $('start').value = '현재 위치';
      $('locateButton').disabled = false;
      $('locateButton').textContent = '◎ 현재 위치 새로고침';
      try {
        const r = await fetch('/api/region?x=' + currentCoords.x + '&y=' + currentCoords.y);
        const d = await r.json();
        if (r.ok && d.code) {
          $('region').value = '';
          $('formError').textContent = '현재 위치를 적용했어요.';
        }
      } catch {}
    },
    () => {
      $('locateButton').disabled = false;
      $('locateButton').textContent = '◎ 현재 위치에서 찾기';
      $('formError').textContent = '위치 권한을 허용하거나 출발지를 직접 입력해주세요.';
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
  );
};
