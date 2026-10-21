const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clock = s => s ? String(s).slice(0, 2) + ':' + String(s).slice(2, 4) : '24:00';

// -------------------------------------------------------------------
// 1. 커스텀 드롭다운 시스템 (하향 전개 + 맨 하단 직접 입력 메뉴 일체화)
// -------------------------------------------------------------------
function initCustomDropdowns() {
  document.querySelectorAll('.custom-select-wrap').forEach(wrap => {
    const select = wrap.querySelector('select');
    if (!select || wrap.querySelector('.custom-dropdown-panel')) return;

    if (['startSelect', 'visitSelect', 'endSelect'].includes(select.id)) {
      const initial = select.value === '__DIRECT_INPUT__' ? '' : select.value;
      select.hidden = true;
      select.required = false;
      wrap.classList.add('inline-direct-mode', 'station-search-wrap');
      wrap.querySelector('.custom-select-arrow')?.remove();
      const input = document.createElement('input');
      input.type = 'search';
      input.id = select.id + 'Search';
      input.className = 'custom-select-inline-input station-search-input';
      input.placeholder = '역 또는 장소 검색 (예: 성수역, 카페, 주소)';
      input.autocomplete = 'off';
      input.value = initial === 'SAME_AS_START' ? '' : initial;
      if(select.id === 'endSelect') input.placeholder = '최종 목적지 검색 · 비우면 출발지로 돌아와요';
      input.setAttribute('aria-label', select.id === 'startSelect' ? '출발 위치 검색' : select.id === 'visitSelect' ? '방문 장소 검색' : '최종 목적지 검색');
      input.addEventListener('input', () => select.dispatchEvent(new Event('change', {bubbles:true})));
      wrap.appendChild(input);
      attachPlaceSuggestions(input, select, wrap);

      document.querySelector('label[for="'+select.id+'"]').htmlFor = input.id;
      return;
    }
    // 네이티브 select 은닉
    select.classList.add('custom-select-native-hidden');

    const existingArrow = wrap.querySelector('.custom-select-arrow');
    if (existingArrow) existingArrow.remove();

    // 1. 커스텀 트리거 버튼
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const textSpan = document.createElement('span');
    textSpan.className = 'custom-select-text';
    const selectedOpt = select.selectedOptions[0] || select.options[0];
    textSpan.textContent = selectedOpt ? selectedOpt.textContent : '';

    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'custom-select-arrow';
    arrowSpan.textContent = '▼';

    trigger.appendChild(textSpan);
    trigger.appendChild(arrowSpan);
    wrap.appendChild(trigger);

    // 2. 인라인 직접 입력 컨테이너 (직접 입력 클릭 시 원래 선택란에서 바로 입력)
    const inlineWrap = document.createElement('div');
    inlineWrap.className = 'custom-select-inline-wrap';

    const inlineInput = document.createElement('input');
    inlineInput.type = 'text';
    inlineInput.className = 'custom-select-inline-input';
    inlineInput.placeholder = wrap.dataset.placeholder || '직접 입력';

    const revertBtn = document.createElement('button');
    revertBtn.type = 'button';
    revertBtn.className = 'custom-select-revert-btn';
    revertBtn.textContent = '목록';
    revertBtn.title = '드롭다운 목록으로 돌아가기';

    inlineWrap.appendChild(inlineInput);
    inlineWrap.appendChild(revertBtn);
    wrap.appendChild(inlineWrap);

    // 3. 커스텀 드롭다운 목록 패널 (하향 전개)
    const panel = document.createElement('div');
    panel.className = 'custom-dropdown-panel';
    panel.setAttribute('role', 'listbox');

    const buildOptions = () => {
      let html = '';
      Array.from(select.children).forEach(child => {
        if (child.tagName === 'OPTGROUP') {
          html += `<div class="dropdown-optgroup-title">${esc(child.label)}</div>`;
          Array.from(child.children).forEach(opt => {
            const isDirect = opt.value === '__DIRECT_INPUT__';
            const isSelected = opt.value === select.value;
            html += `<div class="dropdown-option ${isDirect ? 'dropdown-option-direct' : ''} ${isSelected ? 'selected' : ''}" data-value="${esc(opt.value)}">${esc(opt.textContent)}</div>`;
          });
        } else if (child.tagName === 'OPTION') {
          const isDirect = child.value === '__DIRECT_INPUT__';
          const isSelected = child.value === select.value;
          html += `<div class="dropdown-option ${isDirect ? 'dropdown-option-direct' : ''} ${isSelected ? 'selected' : ''}" data-value="${esc(child.value)}">${esc(child.textContent)}</div>`;
        }
      });
      panel.innerHTML = html;
    };

    buildOptions();
    wrap.appendChild(panel);

    // 트리거 클릭 시 하향 드롭다운 열기/닫기
    trigger.onclick = e => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');

      document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
        if (w !== wrap) {
          w.classList.remove('open');
          w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        wrap.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      } else {
        wrap.classList.add('open');
        trigger.setAttribute('aria-expanded', 'true');
        const sel = panel.querySelector('.dropdown-option.selected');
        if (sel) sel.scrollIntoView({ block: 'nearest' });
      }
    };

    // 옵션 클릭 시
    panel.onclick = e => {
      const optEl = e.target.closest('.dropdown-option');
      if (!optEl) return;
      e.stopPropagation();

      const val = optEl.dataset.value;
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');

      if (val === '__DIRECT_INPUT__') {
        wrap.classList.add('inline-direct-mode');
        inlineInput.value = '';
        inlineInput.focus();
      } else {
        wrap.classList.remove('inline-direct-mode');
        select.value = val;
        syncSelectWrap(wrap, select);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // [목록] 복귀 버튼 클릭 시
    revertBtn.onclick = e => {
      e.stopPropagation();
      wrap.classList.remove('inline-direct-mode');
      inlineInput.value = '';
      const firstValid = Array.from(select.options).find(o => o.value !== '__DIRECT_INPUT__');
      if (firstValid) {
        select.value = firstValid.value;
        syncSelectWrap(wrap, select);
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    inlineInput.oninput = () => {
      select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    select.addEventListener('change', () => {
      if (!wrap.classList.contains('inline-direct-mode')) {
        syncSelectWrap(wrap, select);
      }
    });
  });
}

function syncSelectWrap(wrap, select) {
  const triggerText = wrap.querySelector('.custom-select-text');
  const selectedOpt = select.selectedOptions[0];
  if (triggerText && selectedOpt) {
    triggerText.textContent = selectedOpt.textContent;
  }
  const panel = wrap.querySelector('.custom-dropdown-panel');
  if (panel) {
    panel.querySelectorAll('.dropdown-option').forEach(el => {
      if (el.dataset.value === select.value) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }
}

function syncAllCustomSelects() {
  document.querySelectorAll('.custom-select-wrap').forEach(wrap => {
    const select = wrap.querySelector('select');
    if (select && !wrap.classList.contains('inline-direct-mode')) {
      syncSelectWrap(wrap, select);
    }
  });
}

function getFieldValue(selectId) {
  const sel = $(selectId);
  if (!sel) return '';
  const wrap = sel.closest('.custom-select-wrap');
  if (wrap && wrap.classList.contains('inline-direct-mode')) {
    const inp = wrap.querySelector('.custom-select-inline-input');
    return inp ? (inp.value.trim().replace(' · ', ' ') || (selectId === 'endSelect' ? 'SAME_AS_START' : '')) : ''; 
  }
  return (sel.value === '__DIRECT_INPUT__') ? '' : sel.value;
}

function setFieldValue(selectId, val) {
  const sel = $(selectId);
  if (!sel) return;
  const wrap = sel.closest('.custom-select-wrap');
  if (!wrap) {
    sel.value = val;
    return;
  }

  if (wrap.classList.contains('station-search-wrap')) {
    wrap.querySelector('.station-search-input').value = val === 'SAME_AS_START' ? '' : val;
    sel.dispatchEvent(new Event('change', {bubbles:true}));
    return;
  }
  const optionExists = Array.from(sel.options).some(o => o.value === val && o.value !== '__DIRECT_INPUT__');
  if (optionExists) {
    wrap.classList.remove('inline-direct-mode');
    sel.value = val;
    syncSelectWrap(wrap, sel);
  } else {
    wrap.classList.add('inline-direct-mode');
    const inp = wrap.querySelector('.custom-select-inline-input');
    if (inp) inp.value = val;
  }
  sel.dispatchEvent(new Event('change', { bubbles: true }));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.custom-select-wrap')) {
    document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// -------------------------------------------------------------------
// 2. 지역 선택 연동 가격 변동 시스템
// -------------------------------------------------------------------
const REGION_PRICES = {
  SEOUL: { S: 2200, M: 3300, L: 4400, label: '수도권 기준' },
  BUSAN: { S: 2000, M: 3000, L: 4000, label: '부산 기준' },
  DAEGU: { S: 2000, M: 3000, L: 4000, label: '대구 기준' },
  DAEJEON: { S: 2000, M: 3000, L: 4000, label: '대전 기준' },
  GWANGJU: { S: 2000, M: 3000, L: 4000, label: '광주 기준' },
  AIRPORT: { S: 3000, M: 4000, L: 5500, label: '공항 터미널 기준' },
  RAILWAY: { S: 2500, M: 3500, L: 5000, label: 'KTX/철도 기준' },
  ALL: { S: 2200, M: 3300, L: 4400, label: '전국 표준' }
};

function updatePricesByRegion() {if($('regionPriceNotice'))$('regionPriceNotice').textContent='시설별 원본 요금 확인';for(const id of ['priceS','priceM','priceL'])if($(id))$(id).textContent='시설마다 다름';}

// -------------------------------------------------------------------
// 3. 맞춤 포레스트 그린 날짜 & 시각 피커 시스템 (Chromium 블루 원천 제거)
// -------------------------------------------------------------------
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

function formatKoreanDateTime(dateObj) {
  const Y = dateObj.getFullYear();
  const M = dateObj.getMonth() + 1;
  const D = dateObj.getDate();
  const w = WEEKDAYS[dateObj.getDay()];
  const h = dateObj.getHours();
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? '오후' : '오전';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${Y}. ${M}. ${D} (${w}) ${ampm} ${String(displayH).padStart(2, '0')}:${m}`;
}

function formatYmd(d) {
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatIsoDateTime(dateObj) {
  const pad = n => String(n).padStart(2, '0');
  const Y = dateObj.getFullYear();
  const M = pad(dateObj.getMonth() + 1);
  const D = pad(dateObj.getDate());
  const h = pad(dateObj.getHours());
  const m = pad(dateObj.getMinutes());
  return `${Y}-${M}-${D}T${h}:${m}`;
}

let activeDtTarget = 'deposit'; // 'deposit' or 'pickup'
let dtState = {
  dateStr: '', // 'YYYY-MM-DD'
  hour: 14,    // 0 ~ 23
  minute: 0    // 0 ~ 59
};

function initCustomDatePicker() {
  const modal = $('customDatePickerDialog');
  const dateInput = $('dtNativeDateInput');
  const hourInput = $('dtInputHour');
  const minInput = $('dtInputMinute');

  function pad(n) { return String(n).padStart(2, '0'); }

  function syncStateToInputs() {
    if (dateInput) dateInput.value = dtState.dateStr;
    if (hourInput) hourInput.value = pad(dtState.hour);
    if (minInput) minInput.value = pad(dtState.minute);
    updateDtPreview();
  }

  // 1. 빠른 날짜 버튼 (오늘, 내일, 모레, 1주일 뒤)
  const quickDateBtns = document.querySelectorAll('#dtQuickDateGroup .dt-pill');
  quickDateBtns.forEach(btn => {
    btn.onclick = () => {
      quickDateBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const days = parseInt(btn.dataset.days, 10) || 0;
      const targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      dtState.dateStr = formatYmd(targetDate);
      syncStateToInputs();
    };
  });

  // 2. 달력 날짜 직접 변경 이벤트
  if (dateInput) {
    dateInput.onchange = () => {
      if (!dateInput.value) return;
      dtState.dateStr = dateInput.value;
      quickDateBtns.forEach(b => b.classList.remove('active'));
      updateDtPreview();
    };
  }

  // 3. 시간 (Hour 0~23) 조작
  if (hourInput) {
    hourInput.onchange = () => {
      let val = parseInt(hourInput.value, 10);
      if (isNaN(val)) val = 12;
      val = Math.max(0, Math.min(23, val));
      dtState.hour = val;
      hourInput.value = pad(val);
      updateDtPreview();
    };
  }
  $('hourStepDown').onclick = () => {
    dtState.hour = (dtState.hour + 23) % 24;
    hourInput.value = pad(dtState.hour);
    updateDtPreview();
  };
  $('hourStepUp').onclick = () => {
    dtState.hour = (dtState.hour + 1) % 24;
    hourInput.value = pad(dtState.hour);
    updateDtPreview();
  };

  // 4. 분 (Minute 0~59) 조작 (1분 단위 자유 조절)
  if (minInput) {
    minInput.onchange = () => {
      let val = parseInt(minInput.value, 10);
      if (isNaN(val)) val = 0;
      val = Math.max(0, Math.min(59, val));
      dtState.minute = val;
      minInput.value = pad(val);
      updateDtPreview();
    };
  }
  $('minStepDown').onclick = () => {
    dtState.minute = (dtState.minute + 59) % 60;
    minInput.value = pad(dtState.minute);
    updateDtPreview();
  };
  $('minStepUp').onclick = () => {
    dtState.minute = (dtState.minute + 1) % 60;
    minInput.value = pad(dtState.minute);
    updateDtPreview();
  };

  // 5. 빠른 시간 간편 맞춤
  const quickTimeBtns = document.querySelectorAll('#dtQuickTimeGroup .dt-pill');
  quickTimeBtns.forEach(btn => {
    btn.onclick = () => {
      const q = btn.dataset.quick;
      const now = new Date();
      if (q === 'now') {
        dtState.dateStr = formatYmd(now);
        dtState.hour = now.getHours();
        dtState.minute = now.getMinutes();
      } else if (q === 'plus1') {
        const plus1 = new Date(Date.now() + 1 * 60 * 60 * 1000);
        dtState.hour = plus1.getHours();
      } else if (q === 'plus2') {
        const plus2 = new Date(Date.now() + 2 * 60 * 60 * 1000);
        dtState.hour = plus2.getHours();
      } else if (q === 'plus4') {
        const plus4 = new Date(Date.now() + 4 * 60 * 60 * 1000);
        dtState.hour = plus4.getHours();
      } else if (q === 'min00') {
        dtState.minute = 0;
      } else if (q === 'min30') {
        dtState.minute = 30;
      }
      syncStateToInputs();
    };
  });

  // 트리거 버튼 클릭 시 모달 열기
  $('depositBtn').onclick = () => openDtModal('deposit');
  $('pickupBtn').onclick = () => openDtModal('pickup');
  $('closeDtPickerBtn').onclick = () => modal.close();

  // [선택 완료] 버튼 클릭 시
  $('dtApplyBtn').onclick = () => {
    const finalDate = getSelectedDateObj();
    const iso = formatIsoDateTime(finalDate);
    const kor = formatKoreanDateTime(finalDate);

    if (activeDtTarget === 'deposit') {
      $('deposit').value = iso;
      $('depositDisplay').textContent = kor;
    } else {
      $('pickup').value = iso;
      $('pickupDisplay').textContent = kor;
    }
    modal.close();
  };
}

function openDtModal(target) {
  activeDtTarget = target;
  $('dtPickerModalTitle').textContent = target === 'deposit' ? '📅 짐 맡길 시각 선택' : '🕒 짐 찾을 시각 선택';

  const curVal = $(target).value;
  const base = curVal ? new Date(curVal) : new Date();

  dtState.dateStr = formatYmd(base);
  dtState.hour = base.getHours();
  dtState.minute = base.getMinutes();

  const dateInput = $('dtNativeDateInput');
  const hourInput = $('dtInputHour');
  const minInput = $('dtInputMinute');

  function pad(n) { return String(n).padStart(2, '0'); }

  if (dateInput) dateInput.value = dtState.dateStr;
  if (hourInput) hourInput.value = pad(dtState.hour);
  if (minInput) minInput.value = pad(dtState.minute);

  // 오늘 날짜와 일치 여부에 따라 오늘 칩 활성화
  const isToday = dtState.dateStr === formatYmd(new Date());
  document.querySelectorAll('#dtQuickDateGroup .dt-pill').forEach((btn, idx) => {
    btn.classList.toggle('active', isToday && idx === 0);
  });

  updateDtPreview();
  $('customDatePickerDialog').showModal();
}

function getSelectedDateObj() {
  const parts = dtState.dateStr.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = (parts[1] || 1) - 1;
  const day = parts[2] || new Date().getDate();
  return new Date(year, month, day, dtState.hour, dtState.minute, 0, 0);
}

function updateDtPreview() {
  const d = getSelectedDateObj();
  const previewEl = $('dtPreviewText');
  if (previewEl) {
    previewEl.textContent = formatKoreanDateTime(d);
  }
}

function setCurrentTimes() {
  const now = new Date();
  $('deposit').value = formatIsoDateTime(now);
  $('depositDisplay').textContent = formatKoreanDateTime(now);

  const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  $('pickup').value = formatIsoDateTime(later);
  $('pickupDisplay').textContent = formatKoreanDateTime(later);
}

$('nowTimeBtn').onclick = () => {
  setCurrentTimes();
};

function formatMinutes(min) {
  if (min === null || min === undefined) return '-';
  const m = Math.round(Number(min) || 0);
  if (m < 60) return `${m}<em>분</em>`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}<em>시간</em>`;
  return `${h}<em>시간</em> ${rem}<em>분</em>`;
}

function formatMinutesText(min) {
  if (min === null || min === undefined) return '-';
  const m = Math.round(Number(min) || 0);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}시간`;
  return `${h}시간 ${rem}분`;
}

// -------------------------------------------------------------------
// 4. 모드 전환 (바로 맡기기 vs 일정에 맞추기)
// -------------------------------------------------------------------
let currentMode = 'route';

function setMode(value) {
  currentMode = value;
  const isRoute = value === 'route';
  $('routeFields').style.display = isRoute ? 'block' : 'none';
  $('priorityField').style.display = isRoute ? 'block' : 'none';

  $('nearTab').classList.toggle('active', !isRoute);
  $('nearTab').setAttribute('aria-selected', String(!isRoute));
  $('routeTab').classList.toggle('active', isRoute);
  $('routeTab').setAttribute('aria-selected', String(isRoute));

  $('searchText').textContent = isRoute ? '최적 보관함 추천받기' : '가까운 보관함 찾기';
  $('modeTitle').textContent = isRoute ? '찾으러 갈 때까지, 편하게.' : '일단, 짐부터 내려놓을까요?';
  $('modeDescription').textContent = isRoute ? '방문과 짐 회수 동선을 함께 비교해요.' : '출발지에서 가까운 보관함을 비교해요.';
}

$('nearTab').onclick = () => setMode('near');
$('routeTab').onclick = () => setMode('route');

// 짐 크기 선택 버튼
document.querySelectorAll('.size-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.size-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-pressed');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  };
});

// -------------------------------------------------------------------
// 5. 최근 경로 (실제 검색한 경로 자동 누적 및 최대 3개 적절 제한)
// -------------------------------------------------------------------
const RECENT_KEY = 'oneurui_jim_recent_routes';
const MAX_RECENT_ROUTES = 3; // 사용자가 요청한 적절한 갯수 제한 (화면 넘침 방지)

let currentCoords = null;

// 📍 현재 위치 GPS 버튼 핸들러
if ($('geoBtn')) {
  $('geoBtn').onclick = () => {
    if (!navigator.geolocation) {
      alert('사용하시는 브라우저가 위치 정보(GPS)를 지원하지 않습니다.');
      return;
    }
    const btn = $('geoBtn');
    btn.textContent = '📍 위치 수신 중...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      pos => {
        currentCoords = {
          x: pos.coords.longitude,
          y: pos.coords.latitude
        };
        btn.textContent = '📍 내 위치 확인됨 ✓';
        btn.disabled = false;
        btn.style.background = 'var(--primary)';
        btn.style.color = '#ffffff';

        // 출발 위치 필드에 현재 위치 반영
        setFieldValue('startSelect', '현재 위치 (GPS)');
      },
      err => {
        btn.textContent = '📍 현재 위치';
        btn.disabled = false;
        let msg = '위치 정보를 가져올 수 없습니다.';
        if (err.code === 1) msg = '브라우저 위치 정보 제공 권한이 차단되었습니다. 주소창 자물쇠 아이콘에서 위치 권한을 허용해주세요.';
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }
}

function loadRecentRoutes() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRecentRoute(start, visit, end, mode) {
  if (!start) return;
  const routes = loadRecentRoutes() || [
    { start: '서울역', visit: '성수', end: '서울역', mode: 'route' },
    { start: '부산역', visit: '해운대', end: '부산역', mode: 'route' },
    { start: '홍대입구', visit: '혜화', end: '홍대입구', mode: 'route' }
  ];

  const filtered = routes.filter(r => !(r.start === start && r.visit === (visit || '') && r.end === (end || start) && r.mode === mode));
  filtered.unshift({
    start,
    visit: visit || '',
    end: end || start,
    mode: mode || 'route',
    time: Date.now()
  });

  const trimmed = filtered.slice(0, MAX_RECENT_ROUTES);
  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  renderRecentChips();
}

function renderRecentChips() {
  const routes = loadRecentRoutes() || [
    { start: '서울역', visit: '성수', end: '서울역', mode: 'route' },
    { start: '부산역', visit: '해운대', end: '부산역', mode: 'route' },
    { start: '홍대입구', visit: '혜화', end: '홍대입구', mode: 'route' }
  ];

  const container = $('recentChips');
  if (!container) return;

  if (!routes.length) {
    container.innerHTML = '<span style="font-size:11.5px;color:var(--text-muted);padding:4px 0;">저장된 최근 경로가 없습니다.</span>';
    return;
  }

  container.innerHTML = routes.slice(0, MAX_RECENT_ROUTES).map(r => {
    const isNear = r.mode === 'near';
    const label = isNear ? `${esc(r.start)} (주변)` : `${esc(r.start)} → ${esc(r.visit || '목적지')} → ${esc(r.end || r.start)}`;
    return `
      <button type="button" class="recent-chip" data-start="${esc(r.start)}" data-visit="${esc(r.visit || '')}" data-end="${esc(r.end || r.start)}" data-mode="${r.mode || 'route'}">
        ${label}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.recent-chip').forEach(btn => {
    btn.onclick = () => {
      const s = btn.dataset.start;
      const v = btn.dataset.visit;
      const e = btn.dataset.end;
      const m = btn.dataset.mode || 'route';

      setFieldValue('startSelect', s);
      if (m === 'route') {
        setFieldValue('visitSelect', v);
        setFieldValue('endSelect', (e === s) ? 'SAME_AS_START' : e);
      }
      setMode(m);
      $('plannerForm').requestSubmit();
    };
  });
}

if ($('clearRecentBtn')) {
  $('clearRecentBtn').onclick = () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify([]));
    renderRecentChips();
  };
}

// -------------------------------------------------------------------
// 6. 지역 드롭다운 선택 시 추천 기본역 자동 세팅
// -------------------------------------------------------------------
$('regionSelect').addEventListener('change', () => {
  const reg = getFieldValue('regionSelect');
  if (reg === 'BUSAN') {
    setFieldValue('startSelect', '부산역');
    setFieldValue('visitSelect', '해운대');
  } else if (reg === 'DAEGU') {
    setFieldValue('startSelect', '반월당');
    setFieldValue('visitSelect', '서문시장');
  } else if (reg === 'DAEJEON') {
    setFieldValue('startSelect', '대전역');
    setFieldValue('visitSelect', '유성온천');
  } else if (reg === 'GWANGJU') {
    setFieldValue('startSelect', '광주송정역');
    setFieldValue('visitSelect', '문화전당');
  } else if (reg === 'AIRPORT') {
    setFieldValue('startSelect', '인천공항 제1여객터미널');
    setFieldValue('visitSelect', '홍대입구');
  } else if (reg === 'RAILWAY') {
    setFieldValue('startSelect', '동대구역');
    setFieldValue('visitSelect', '대전역');
  } else if (reg === 'SEOUL') {
    setFieldValue('startSelect', '서울역');
    setFieldValue('visitSelect', '성수');
  }
  updatePricesByRegion();
});

// -------------------------------------------------------------------
// 7. Web Crypto API (AES-GCM 256 + PBKDF2) 보안 금고 모듈
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
  const dot = document.querySelector('.vault-dot');
  const btn = $('openMyLockerBtn');

  if (payload) {
    const count = payload.count || 1;
    const countLabel = count > 1 ? ` · ${count}개` : '';
    if (dot) dot.classList.add('active');
    if (btn) btn.innerHTML = `<span class="vault-dot active"></span><span>📦 내 보관함 (${esc(payload.stationName)}${countLabel})</span>`;
    if (badge) {
      badge.style.display = 'inline-flex';
      badge.textContent = `🔒 ${payload.stationName}${countLabel} 보관 중`;
      badge.onclick = () => openVaultModal(payload.stationName, payload.location);
    }
  } else {
    if (dot) dot.classList.remove('active');
    if (btn) btn.innerHTML = `<span class="vault-dot"></span><span>📦 내 보관함 / 보안 티켓</span>`;
    if (badge) badge.style.display = 'none';
  }
}

// -------------------------------------------------------------------
// 8. 보안 모달 열기 및 렌더링 (다중 보관함 1~4개 각각 안전 저장 및 복호화)
// -------------------------------------------------------------------
window.openVaultModal = function(stationName, locationDesc, initialCount = 1) {
  const payload = getStoredPayload();
  const container = $('vaultContent');

  if (payload) {
    const savedCount = payload.count || 1;
    container.innerHTML = `
      <div style="background:#f3f6f1;border:1px solid #d4ded0;border-radius:12px;padding:18px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="color:var(--primary);font-size:13px;">🔒 암호화 안전 보관 중 (${savedCount}개 보관함)</strong>
          <span style="font-size:11px;color:var(--text-sub);">${new Date(payload.createdAt).toLocaleTimeString('ko-KR')}</span>
        </div>
        <div style="font-size:13px;margin-bottom:4px;"><strong>보관 역사:</strong> ${esc(payload.stationName)}</div>
        <div style="font-size:12px;color:var(--text-sub);margin-bottom:14px;"><strong>상세 위치:</strong> ${esc(payload.location || '역사 내 물품보관소')}</div>

        <div id="unlockedView" style="display:none;background:#fff;border:1px solid #b7cebf;border-radius:10px;padding:14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2ebe0;">
            <strong style="color:var(--primary);font-size:12.5px;">✓ PIN 인증 완료 (복호화 성공)</strong>
            <button type="button" id="toggleMaskBtn" style="background:none;border:0;color:var(--primary);font-size:11.5px;font-weight:700;cursor:pointer;text-decoration:underline;">비밀번호 보기</button>
          </div>
          <div id="unlockedSlotsList" class="unlocked-lockers-list"></div>
        </div>

        <form id="unlockForm">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:6px;">본인 확인 PIN 번호 입력</label>
          <div style="display:flex;gap:8px;">
            <input id="unlockPinInput" type="password" maxlength="6" placeholder="PIN 4~6자리" style="flex:1;background:#fff;border:1px solid var(--border);color:var(--text-main);padding:10px;border-radius:8px;text-align:center;font-weight:700;letter-spacing:4px;" required>
            <button type="submit" class="ticket-action-btn" style="padding:10px 18px;">잠금 해제</button>
          </div>
          <p id="unlockError" style="color:var(--danger-text);font-size:11px;margin:6px 0 0;"></p>
        </form>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <span style="font-size:12px;color:var(--text-sub);">짐을 모두 찾으셨나요?</span>
        <button type="button" class="ticket-action-btn" id="triggerShredBtn" style="background:#b83d2c;">짐 회수 완료 및 기록 삭제</button>
      </div>
    `;

    let decryptedData = null;
    let isMasked = true;

    function renderUnlockedSlots() {
      if (!decryptedData) return;
      const listEl = $('unlockedSlotsList');
      const rawLockers = decryptedData.lockers || [
        { id: 1, lockerNo: decryptedData.lockerNo || '-', passcode: decryptedData.passcode || '----' }
      ];

      listEl.innerHTML = rawLockers.map((item, idx) => `
        <div class="unlocked-slot-card">
          <div class="unlocked-slot-info">
            <span class="unlocked-slot-title">📦 보관함 #${idx + 1}</span>
            <span class="unlocked-slot-no">${esc(item.lockerNo || (idx + 1) + '번')}</span>
          </div>
          <div class="unlocked-slot-pass">
            <div class="unlocked-slot-pass-label">비밀번호</div>
            <div class="unlocked-slot-pass-val" data-idx="${idx}">
              ${isMasked ? '••••••' : esc(item.passcode)}
            </div>
          </div>
        </div>
      `).join('');
    }

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
        decryptedData = JSON.parse(new TextDecoder().decode(dec));

        $('unlockForm').style.display = 'none';
        $('unlockedView').style.display = 'block';
        renderUnlockedSlots();
      } catch (err) {
        $('unlockError').textContent = 'PIN 번호가 일치하지 않습니다.';
      }
    };

    const maskBtn = $('toggleMaskBtn');
    if (maskBtn) {
      maskBtn.onclick = () => {
        if (!decryptedData) return;
        isMasked = !isMasked;
        maskBtn.textContent = isMasked ? '비밀번호 보기' : '비밀번호 숨기기';
        renderUnlockedSlots();
      };
    }

    $('triggerShredBtn').onclick = async () => {
      const digest = await sha256(JSON.stringify(payload) + Date.now());
      const noise = buf2b64(window.crypto.getRandomValues(new Uint8Array(128)));
      localStorage.setItem(VAULT_STORAGE_KEY, noise);
      localStorage.removeItem(VAULT_STORAGE_KEY);
      updateVaultBadge();
      $('vaultDialog').close();

      const shredCount = payload.count || 1;
      $('receiptContent').innerHTML = `
        <div style="background:#f4f6f1;border:1px solid #d4ded0;border-radius:12px;padding:16px;font-size:12px;line-height:1.8;">
          <div>• <strong>이용 역사:</strong> ${esc(payload.stationName)}</div>
          <div>• <strong>회수 보관함:</strong> 총 ${shredCount}개 사물함 회수 완료</div>
          <div>• <strong>회수 일시:</strong> ${new Date().toLocaleString('ko-KR')}</div>
          <div>• <strong>기기 내 보관 데이터:</strong> <span style="color:var(--primary);font-weight:700;">영구 소거 완료 (기록 없음)</span></div>
          <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #c9d4c4;font-size:10px;color:var(--text-muted);font-family:monospace;">
            SHA-256 Digest: ${digest}
          </div>
        </div>
      `;
      $('receiptDialog').showModal();
    };

  } else {
    // 신규 티켓 발권 모달: 보관함 개수(1~4개) 선택 및 슬롯별 입력 폼
    const defaultStation = stationName || getFieldValue('startSelect') || '서울역';
    const defaultLocation = locationDesc || '역사 내 물품보관소';
    let currentLockerCount = initialCount || 1;

    function renderLockerInputs(count) {
      const slotsContainer = $('lockerSlotsContainer');
      if (!slotsContainer) return;

      let slotsHtml = '';
      for (let i = 1; i <= count; i++) {
        const isMulti = count > 1;
        slotsHtml += `
          <div class="locker-slot-card">
            ${isMulti ? `
              <div class="locker-slot-header">
                <span class="locker-slot-tag">📦 보관함 #${i}</span>
                <span style="font-size:11px;color:var(--text-muted);">${i}번째 락커 정보</span>
              </div>
            ` : ''}
            <div class="locker-inputs-grid">
              <div class="locker-input-field">
                <label for="inpLockerNo_${i}">${isMulti ? `#${i} 사물함 번호` : '사물함 번호'}</label>
                <input id="inpLockerNo_${i}" name="lockerNo_${i}" placeholder="예: ${13 + i}번" required>
              </div>
              <div class="locker-input-field">
                <label for="inpPasscode_${i}">${isMulti ? `#${i} 비밀번호` : '사물함 비밀번호'}</label>
                <input id="inpPasscode_${i}" name="passcode_${i}" placeholder="예: 7294" required>
              </div>
            </div>
          </div>
        `;
      }
      slotsContainer.innerHTML = slotsHtml;
    }

    container.innerHTML = `
      <form id="newTicketForm">
        <div style="margin-bottom:14px;">
          <label class="field-label" for="inpStation">보관 역사 및 위치</label>
          <input id="inpStation" value="${esc(defaultStation)}" placeholder="예: 서울역 1호선, 홍대입구역 9번출구 등" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-weight:700;" required>
        </div>

        <!-- 보관함 개수 선택란 (1개, 2개, 3개, 4개) -->
        <div class="locker-count-group">
          <div class="locker-count-label">
            <span>사용한 보관함 개수</span>
            <span style="font-size:11px;color:var(--primary);font-weight:700;">개수별 번호·비밀번호 개별 저장</span>
          </div>
          <div class="locker-count-selector" id="vaultCountSelector">
            <button type="button" class="count-pill ${currentLockerCount === 1 ? 'active' : ''}" data-count="1">1개</button>
            <button type="button" class="count-pill ${currentLockerCount === 2 ? 'active' : ''}" data-count="2">2개</button>
            <button type="button" class="count-pill ${currentLockerCount === 3 ? 'active' : ''}" data-count="3">3개</button>
            <button type="button" class="count-pill ${currentLockerCount === 4 ? 'active' : ''}" data-count="4">4개</button>
          </div>
        </div>

        <!-- 동적 생성되는 사물함 번호 & 비밀번호 입력 슬롯들 -->
        <div id="lockerSlotsContainer" class="locker-slots-container"></div>

        <div style="margin-bottom:18px;">
          <label class="field-label" for="inpPin">열람 잠금용 PIN 번호 (4~6자리)</label>
          <input id="inpPin" type="password" maxlength="6" placeholder="숫자 4~6자리" style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-weight:700;text-align:center;letter-spacing:4px;" required>
          <small style="color:var(--text-muted);font-size:11px;display:block;margin-top:4px;">
            이 PIN으로 기기 내(Web Crypto API AES-256)에서만 암호화되며, 서버로 절대 전송되지 않습니다.
          </small>
        </div>

        <button type="submit" class="primary-btn" style="justify-content:center;width:100%;">기기 내 안전하게 저장하기</button>
      </form>
    `;

    // 보관함 슬롯 초기 렌더링
    renderLockerInputs(currentLockerCount);

    // 개수 변경 버튼 이벤트
    const pills = container.querySelectorAll('.count-pill');
    pills.forEach(pill => {
      pill.onclick = () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentLockerCount = parseInt(pill.dataset.count, 10) || 1;
        renderLockerInputs(currentLockerCount);
      };
    });

    $('newTicketForm').onsubmit = async e => {
      e.preventDefault();
      const stName = $('inpStation').value.trim() || defaultStation;
      const pin = $('inpPin').value.trim();

      if (pin.length < 4) {
        alert('PIN 번호는 최소 4자리 이상이어야 합니다.');
        return;
      }

      // 각 슬롯의 번호와 비밀번호 수집
      const lockers = [];
      for (let i = 1; i <= currentLockerCount; i++) {
        const noEl = $(`inpLockerNo_${i}`);
        const passEl = $(`inpPasscode_${i}`);
        const noVal = noEl ? noEl.value.trim() : '';
        const passVal = passEl ? passEl.value.trim() : '';

        if (!noVal || !passVal) {
          alert(`보관함 #${i}의 사물함 번호와 비밀번호를 모두 입력해주세요.`);
          return;
        }

        lockers.push({
          id: i,
          lockerNo: noVal,
          passcode: passVal
        });
      }

      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await derivePinKey(pin, salt);

      const plain = JSON.stringify({
        stationName: stName,
        locationDesc: defaultLocation,
        count: lockers.length,
        lockers,
        lockerNo: lockers[0].lockerNo,
        passcode: lockers[0].passcode
      });

      const cipherBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain));

      const payload = {
        stationName: stName,
        location: defaultLocation,
        count: lockers.length,
        cipherText: buf2b64(cipherBuf),
        iv: buf2b64(iv),
        salt: buf2b64(salt),
        createdAt: new Date().toISOString()
      };

      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(payload));
      updateVaultBadge();

      const lockerSummary = lockers.map(l => l.lockerNo).join(', ');
      alert(`[${stName}] 보관함 ${lockers.length}개(${lockerSummary}) 정보가 안전하게 암호화 보관되었습니다!\n언제든 상단 [내 보관함] 메뉴에서 PIN으로 확인하실 수 있습니다.`);
      $('vaultDialog').close();
    };
  }

  $('vaultDialog').showModal();
};

// -------------------------------------------------------------------
// 8-1. 헤더 모달 버튼(내 보관함, 고객센터, 기획 명세) 및 닫기 이벤트 바인딩
// -------------------------------------------------------------------
if ($('openMyLockerBtn')) $('openMyLockerBtn').onclick = () => openVaultModal();
if ($('closeVaultDialog')) $('closeVaultDialog').onclick = () => $('vaultDialog').close();
if ($('closeReceiptDialog')) $('closeReceiptDialog').onclick = () => $('receiptDialog').close();
if ($('receiptDoneBtn')) $('receiptDoneBtn').onclick = () => $('receiptDialog').close();

if ($('openPhoneBtn')) $('openPhoneBtn').onclick = () => $('phoneDialog').showModal();
if ($('closePhoneDialog')) $('closePhoneDialog').onclick = () => $('phoneDialog').close();

if ($('openSpecBtn')) $('openSpecBtn').onclick = () => $('specDialog').showModal();
if ($('closeSpecDialog')) $('closeSpecDialog').onclick = () => $('specDialog').close();

// 모달 바깥 어두운 배경(Backdrop) 클릭 시 닫기
['customDatePickerDialog', 'vaultDialog', 'receiptDialog', 'phoneDialog', 'specDialog'].forEach(id => {
  const dlg = $(id);
  if (dlg) {
    dlg.addEventListener('click', e => {
      if (e.target === dlg) dlg.close();
    });
  }
});

// -------------------------------------------------------------------
// 9. 검색 폼 제출 및 최적 결과 렌더링
// -------------------------------------------------------------------
$('plannerForm').onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector('.search-button');
  if (btn.disabled) return;

  const regionVal = getFieldValue('regionSelect');
  const startVal = getFieldValue('startSelect');
  const visitVal = (currentMode === 'route') ? getFieldValue('visitSelect') : '';
  let endVal = (currentMode === 'route') ? getFieldValue('endSelect') : startVal;
  if (endVal === 'SAME_AS_START' || !endVal) {
    endVal = startVal;
  }

  let priorityVal = getFieldValue('priority') || 'total';
  if (priorityVal.includes('짐') || priorityVal.includes('도보') || priorityVal.includes('무게')) {
    priorityVal = 'carry';
  } else if (priorityVal !== 'carry') {
    priorityVal = 'total';
  }

  const sizeVal = document.querySelector('.size-btn.active').dataset.size;
  const depositVal = $('deposit').value;
  const pickupVal = $('pickup').value;

  if (!startVal) {
    $('formError').textContent = '출발 위치를 입력하거나 선택해주세요.';
    return;
  }
  if (currentMode === 'route' && !visitVal) {
    $('formError').textContent = '목적지를 입력하거나 선택해주세요.';
    return;
  }
  if (new Date(pickupVal) <= new Date(depositVal)) {
    $('formError').textContent = '찾을 시각은 맡길 시각 이후로 선택해주세요.';
    return;
  }

  btn.disabled = true;
  $('searchText').textContent = '최적 경로 계산 중…';
  $('formError').textContent = '';

  const q = {
    start: startVal,
    visit: visitVal,
    end: endVal,
    region: regionVal,
    mode: currentMode,
    size: sizeVal,
    priority: priorityVal,
    deposit: depositVal,
    pickup: pickupVal
  };

  if (currentCoords && (startVal.includes('현재 위치') || startVal.includes('내 위치'))) {
    q.coords = currentCoords;
  }

  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || '조회 실패');

    saveRecentRoute(startVal, visitVal, endVal, currentMode);

    $('emptyGuide').style.display = 'none';
    const displayResults = (d.results || []).slice(0, 7);
    $('resultsCount').textContent = displayResults.length;

    $('summary').style.display = 'block';
    $('summary').innerHTML = `
      <strong>${esc(d.start.name)} 출발 → ${esc(d.visit ? d.visit.name : '목적지')} 일정</strong>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
        ${esc(d.note || '이동 편의성과 보관 가능성 상위 7개 보관함 추천 결과입니다.')}
      </div>
    `;

    $('cards').innerHTML = displayResults.length
      ? displayResults.map((l, index) => {
          const isBest = index === 0;
          const agencyContact = l.contact || {
            tel: l.name.includes('부산') ? '1544-5005' : '1577-1234',
            agency: l.name.includes('부산') ? '부산교통공사' : (l.name.includes('철도') ? '코레일' : '서울교통공사')
          };
          return `
            <article class="locker-card ${isBest ? 'selected' : ''}">
              <div class="card-top">
                <div class="locker-badge-icon">${isBest ? '★' : (index + 1)}</div>
                <div class="card-title">
                  <div class="card-tags">
                    <span class="tag ${isBest ? 'recommend' : ''}">${isBest ? '추천 1위' : '#' + (index + 1)}</span>
                    <span class="tag">${l.location.includes('안쪽') ? '개찰구 안쪽 여부 확인' : '출입구·개찰구 확인 필요'}</span>
                    <span class="tag" style="font-family:monospace;">${esc(l.id)}</span>
                  </div>
                  <h3>${esc(l.name)}</h3>
                  <p>${esc(l.location)}</p>
                </div>
              </div>

              ${l.curfewWarning ? `
                <div class="curfew-box">
                  <span style="font-size:16px;flex-shrink:0;">${l.curfewWarning.includes('⚠️') ? '⚠️' : '🚨'}</span>
                  <span>${esc(l.curfewWarning.replace(/^(?:🚨|⚠️)\s*/, ''))}</span>
                </div>
              ` : ''}

              <div class="metrics">
                <div class="metric">
                  <small>전체 이동시간</small>
                  <strong>${l.total === 0 && l.coordinatePrecision === 'station' ? '역내 이동' : formatMinutes(l.total)}</strong>
                  <small class="note">출발→보관→방문→회수</small>
                </div>
                <div class="metric">
                  <small>짐 들고 이동</small>
                  <strong style="color:var(--primary);">${l.carry === 0 && l.coordinatePrecision === 'station' ? '역내 이동' : formatMinutes(l.carry)}</strong>
                  <small class="note">실제 짐 부담 시간</small>
                </div>
                <div class="metric">
                  <small>실시간 빈자리</small>
                  <strong>${esc(l.available == null ? '미제공' : l.available + '칸')}</strong>
                  <small class="note">설치수량과 달라요</small>
                </div>
              </div>

              <div class="plan-b-card"><strong>설치수량(빈자리 아님):</strong> ${esc(l.capacityText || '미제공')}<br><small>자료 기준일: ${esc(l.referenceDate || '미제공')} · ${esc(l.source || '')} · ${l.coordinatePrecision === 'station' ? '역 대표 좌표 기준' : '시설 위치 기준'}</small></div>
              ${l.details?.length ? l.details.map(x => `
                <div style="font-size:12px;background:var(--surface-sub);padding:10px 14px;border-radius:8px;margin:8px 0;line-height:1.6;">
                  <strong>${esc(x.stlckKndNm)}</strong> · ${esc(x.utztnCrgExpln || '기본 요금')} (${esc(x.addCrgExpln || '')})<br>
                  <span style="color:var(--text-sub);font-size:11px;">규격: 가로 ${esc(x.stlckWdthLenExpln || '미제공')} × 높이 ${esc(x.stlckHgtExpln || '미제공')} × 깊이 ${esc(x.stlckDpthExpln || '미제공')}</span>
                </div>
              `).join('') : ''}

              <details style="font-size:12px;margin:10px 0;color:var(--text-sub);">
                <summary style="cursor:pointer;font-weight:700;color:var(--primary);">상세 이동 구간 확인</summary>
                <div style="margin-top:8px;padding-left:12px;border-left:2px solid #cbd6c7;line-height:1.7;">
                  ${l.legs.map((leg, i) => `
                    <div style="margin:4px 0;">
                      <strong>${['1. 출발지 → 보관함', '2. 보관함 → 목적지', '3. 목적지 → 보관함 회수', '4. 보관함 → 최종 목적지'][i]}:</strong>
                      ${leg ? formatMinutesText(leg.minutes) + ' (' + leg.steps.map(esc).join(' · ') + ')' : '-'}
                    </div>
                  `).join('')}
                </div>
              </details>

              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-top:14px;">
                <a href="tel:${agencyContact.tel}" class="card-phone-pill" title="클릭 시 전화 연결">
                  📞 문의: ${esc(agencyContact.tel)} (${esc(agencyContact.agency)})
                </a>
                <button type="button" class="ticket-action-btn" onclick="openVaultModal('${esc(l.name)}', '${esc(l.location)}')">
                  🔒 보관함 번호·비밀번호 안전 보관 (1~4개)
                </button>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="empty"><h3>조회된 보관함이 없습니다.</h3></div>';

  } catch (err) {
    $('formError').textContent = err.message;
    $('cards').innerHTML = `<div class="empty"><h3>검색 오류</h3><p>${esc(err.message)}</p></div>`;
  } finally {
    btn.disabled = false;
    $('searchText').textContent = (currentMode === 'route') ? '최적 보관함 추천받기' : '가까운 보관함 찾기';
  }
};

// -------------------------------------------------------------------
// 11. 초기 구동 실행
// -------------------------------------------------------------------
initCustomDropdowns();
initCustomDatePicker();
setCurrentTimes();
updatePricesByRegion();
renderRecentChips();
updateVaultBadge();


// Kakao keyword autocomplete. Requests go through the server; credentials stay server-side.
function attachPlaceSuggestions(input, select, wrap) {
  const list=document.createElement('div');list.className='place-suggestions';list.id=input.id+'Suggestions';list.setAttribute('role','listbox');list.hidden=true;wrap.appendChild(list);
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',list.id);input.setAttribute('aria-expanded','false');
  let results=[],active=-1,composing=false,timer=null,controller=null,version=0;
  function close(){clearTimeout(timer);controller?.abort();version++;list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
  function showPanel(html){list.innerHTML=html;list.hidden=false;input.setAttribute('aria-expanded','true');}
  function choose(i){const p=results[i];if(!p)return;input.value=p.name+' · '+p.address;input.dataset.placeId=p.id;close();select.dispatchEvent(new Event('change',{bubbles:true}));input.focus();}
  function highlight(){list.querySelectorAll('[role="option"]').forEach((e,i)=>{e.classList.toggle('active',i===active);e.setAttribute('aria-selected',String(i===active));});if(active>=0){input.setAttribute('aria-activedescendant',list.id+'-'+active);list.children[active]?.scrollIntoView({block:'nearest'});}}
  async function lookup(q,seq){const requestController=new AbortController();controller=requestController;const timeout=setTimeout(()=>requestController.abort('timeout'),10000);try{const r=await fetch('/api/places?q='+encodeURIComponent(q),{signal:requestController.signal});const d=await r.json();if(seq!==version)return;if(!r.ok)throw Error(d.error||'검색에 실패했어요.');results=d.places||[];active=-1;showPanel(results.length?results.map((p,i)=>'<button type="button" role="option" aria-selected="false" id="'+list.id+'-'+i+'" data-choice="'+i+'"><span class="suggestion-icon">⌕</span><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.address)+'</small></span><span class="suggestion-arrow">↖</span></button>').join(''):'<div class="suggestion-empty">일치하는 장소를 찾지 못했어요.<br><small>정확한 장소 이름이나 주소로 다시 입력해주세요.</small></div>');}catch(e){if(seq!==version)return;showPanel('<div class="suggestion-empty">'+esc(requestController.signal.aborted?'검색이 지연되고 있어요. 글자를 다시 입력해 주세요.':e.message)+'</div>');}finally{clearTimeout(timeout);}}
  function schedule(){clearTimeout(timer);controller?.abort();results=[];active=-1;input.removeAttribute('aria-activedescendant');const q=input.value.trim();const seq=++version;if(!q){close();return;}showPanel('<div class="suggestion-empty">장소 검색 중…</div>');timer=setTimeout(()=>lookup(q,seq),300);}
  input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;schedule();});input.addEventListener('input',()=>{delete input.dataset.placeId;schedule();});
  input.addEventListener('keydown',e=>{if(e.isComposing||composing)return;if(e.key==='Escape'){close();return;}if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!list.hidden&&results.length){e.preventDefault();active=e.key==='ArrowDown'?Math.min(active+1,results.length-1):Math.max(active-1,0);highlight();}else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(active);}else if(e.key==='Tab')close();});
  list.addEventListener('mousedown',e=>e.preventDefault());list.addEventListener('click',e=>{const b=e.target.closest('[data-choice]');if(b)choose(Number(b.dataset.choice));});input.addEventListener('blur',close);document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
}
