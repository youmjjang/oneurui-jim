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

if (['regionSelect', 'startSelect', 'visitSelect', 'endSelect'].includes(select.id)) {
      const initial = select.value === '__DIRECT_INPUT__' ? '' : select.value;
      select.hidden = true;
      select.required = false;
      wrap.classList.add('inline-direct-mode', 'station-search-wrap');
      wrap.querySelector('.custom-select-arrow')?.remove();
      const input = document.createElement('input');
      input.type = 'search';
      input.id = select.id + 'Search';
      input.className = 'custom-select-inline-input station-search-input';
      if (select.id === 'regionSelect') {
        input.placeholder = '목적지 검색 (예: 대전역, 서울식물원)';
        input.setAttribute('aria-label', '보관함을 찾을 목적지 검색');
        input.value = (initial === 'ALL' || initial === 'SEOUL') ? '' : initial;
      } else if (select.id === 'endSelect') {
        input.placeholder = '최종 목적지 검색 · 비우면 출발지로 돌아와요';
        input.setAttribute('aria-label', '최종 목적지 검색');
        input.value = initial === 'SAME_AS_START' ? '' : initial;
      } else {
        input.placeholder = '역 또는 장소 검색 (예: 성수역, 카페, 주소)';
        input.setAttribute('aria-label', select.id === 'startSelect' ? '출발지 검색' : '경유지 검색');
        input.value = initial === 'SAME_AS_START' ? '' : initial;
      }
      input.autocomplete = 'off';
      input.addEventListener('input', () => select.dispatchEvent(new Event('change', {bubbles:true})));
      wrap.appendChild(input);
      attachPlaceSuggestions(input, select, wrap);

      const lbl = document.querySelector('label[for="'+select.id+'"]');
      if (lbl) lbl.htmlFor = input.id;
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
    const field=wrap.querySelector('.station-search-input');field.value = val === 'SAME_AS_START' ? '' : val;for(const key of ['placeId','placeX','placeY','placeName','placeAddress'])delete field.dataset[key];
    sel.dispatchEvent(new Event('change', {bubbles:true}));
    return;
  }
  // 1. 일치하는 option 탐색 (정확한 value 일치 우선)
  let targetOption = Array.from(sel.options).find(o => o.value === val && o.value !== '__DIRECT_INPUT__');

  // 2. 완화된 정규화 매칭 (예: '반월당역' -> '반월당', '서울역(철도)' -> '서울역', '금남로4가역' -> '금남로')
  if (!targetOption && typeof val === 'string') {
    const clean = val.replace(/\(.*\)/, '').replace(/역$/, '').trim();
    if (clean) {
      targetOption = Array.from(sel.options).find(o => {
        if (o.value === '__DIRECT_INPUT__') return false;
        const optClean = o.value.replace(/\(.*\)/, '').replace(/역$/, '').trim();
        return optClean === clean || o.value.includes(clean) || o.textContent.includes(clean);
      });
    }
  }

  if (targetOption) {
    wrap.classList.remove('inline-direct-mode');
    sel.value = targetOption.value;
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

function updatePricesByRegion() { if($('regionPriceNotice')) $('regionPriceNotice').textContent='시설별 원본 요금 안내 ℹ️'; }

// -------------------------------------------------------------------
// 3. 맞춤 포레스트 그린 날짜 & 시각 피커 시스템 (Chromium 블루 원천 제거)
// -------------------------------------------------------------------
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];


function formatKoreanDateTimeHtml(dateObj) {
  const Y = dateObj.getFullYear();
  const M = dateObj.getMonth() + 1;
  const D = dateObj.getDate();
  const w = WEEKDAYS[dateObj.getDay()];
  const h = dateObj.getHours();
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? '오후' : '오전';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return '<span class="dt-date-part">' + Y + '. ' + M + '. ' + D + ' (' + w + ')</span><span class="dt-time-part">' + ampm + ' ' + String(displayH).padStart(2, '0') + ':' + m + '</span>';
}

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

    if (activeDtTarget === 'deposit') {
      $('deposit').value = iso;
      $('depositDisplay').innerHTML = formatKoreanDateTimeHtml(finalDate);

      // 맡길 시각이 찾을 시각보다 늦거나 같아지면 찾을 시각을 맡길 시각 + 4시간으로 자동 연동
      const curPickupStr = $('pickup').value;
      const curPickup = curPickupStr ? new Date(curPickupStr) : null;
      if (!curPickup || curPickup <= finalDate) {
        const autoPickup = new Date(finalDate.getTime() + 4 * 60 * 60 * 1000);
        $('pickup').value = formatIsoDateTime(autoPickup);
        $('pickupDisplay').innerHTML = formatKoreanDateTimeHtml(autoPickup);
      }
    } else {
      $('pickup').value = iso;
      $('pickupDisplay').innerHTML = formatKoreanDateTimeHtml(finalDate);

      // 찾을 시각이 맡길 시각보다 앞서면 맡길 시각을 찾을 시각 - 4시간으로 자동 연동
      const curDepositStr = $('deposit').value;
      const curDeposit = curDepositStr ? new Date(curDepositStr) : null;
      if (curDeposit && curDeposit >= finalDate) {
        const autoDeposit = new Date(finalDate.getTime() - 4 * 60 * 60 * 1000);
        $('deposit').value = formatIsoDateTime(autoDeposit);
        $('depositDisplay').innerHTML = formatKoreanDateTimeHtml(autoDeposit);
      }
    }
    modal.close();
  };
}

function openDtModal(target) {
  activeDtTarget = target;
  $('dtPickerModalTitle').textContent = target === 'deposit' ? '🕒 짐 맡길 시각 선택' : '🕒 짐 찾을 시각 선택';

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
  $('depositDisplay').innerHTML = formatKoreanDateTimeHtml(now);

  const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  $('pickup').value = formatIsoDateTime(later);
  $('pickupDisplay').innerHTML = formatKoreanDateTimeHtml(later);
}

$('nowTimeBtn').onclick = () => {
  setCurrentTimes();
};

function formatMinutes(min) {
  if (min === null || min === undefined) return '-';
  const m = Math.round(Number(min) || 0);
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h}시간`;
  return `${h}시간 ${rem}분`;
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
  if($('regionGroup')) $('regionGroup').hidden = isRoute;
  $('modeDescription').textContent = isRoute ? '출발지 → 경유지 → 최종 목적지 일정에 맞춰 짐 보관·회수 동선을 비교해요.' : '목적지 주변 보관함을 찾고, 출발지부터 이동시간을 비교해요.';
}

$('nearTab').onclick = () => setMode('near');
$('routeTab').onclick = () => setMode('route');

// 짐 크기 선택 버튼 제거됨

// -------------------------------------------------------------------
// 5. 최근 경로 (실제 검색한 경로 자동 누적 및 최대 3개 적절 제한)
// -------------------------------------------------------------------
const RECENT_KEY = 'oneurui_jim_recent_routes';
const MAX_RECENT_ROUTES = 3; // 사용자가 요청한 적절한 갯수 제한 (화면 넘침 방지)

let currentCoords = null;
let nearestDetectedStation = null;

// -------------------------------------------------------------------
// 전국 짐 보관소 공공데이터 기반 최인접 역사 탐색
// -------------------------------------------------------------------
const LOCKER_STATIONS = [
  { station: '서울역', line: '1호선', region: '수도권(서울)', lat: 37.5562, lng: 126.9723, total: 96 },
  { station: '용산', line: '1호선', region: '수도권(서울)', lat: 37.5298, lng: 126.9647, total: 68 },
  { station: '청량리', line: '1호선', region: '수도권(서울)', lat: 37.5804, lng: 127.0459, total: 17 },
  { station: '제기동', line: '1호선', region: '수도권(서울)', lat: 37.5784, lng: 127.0359, total: 9 },
  { station: '동대문', line: '1호선', region: '수도권(서울)', lat: 37.572, lng: 127.0119, total: 25 },
  { station: '시청', line: '1호선', region: '수도권(서울)', lat: 37.5657, lng: 126.9772, total: 42 },
  { station: '종로3가', line: '1호선', region: '수도권(서울)', lat: 37.5716, lng: 126.9918, total: 66 },
  { station: '홍대입구', line: '2호선', region: '수도권(서울)', lat: 37.5575, lng: 126.9244, total: 58 },
  { station: '강남', line: '2호선', region: '수도권(서울)', lat: 37.4979, lng: 127.0276, total: 72 },
  { station: '성수', line: '2호선', region: '수도권(서울)', lat: 37.5446, lng: 127.0559, total: 44 },
  { station: '잠실', line: '2호선', region: '수도권(서울)', lat: 37.5133, lng: 127.1001, total: 76 },
  { station: '을지로입구', line: '2호선', region: '수도권(서울)', lat: 37.5661, lng: 126.9827, total: 60 },
  { station: '건대입구', line: '2호선', region: '수도권(서울)', lat: 37.5404, lng: 127.0692, total: 50 },
  { station: '신촌', line: '2호선', region: '수도권(서울)', lat: 37.5552, lng: 126.9368, total: 50 },
  { station: '합정', line: '2호선', region: '수도권(서울)', lat: 37.5495, lng: 126.9137, total: 56 },
  { station: '신도림', line: '2호선', region: '수도권(서울)', lat: 37.5088, lng: 126.8913, total: 76 },
  { station: '사당', line: '2호선', region: '수도권(서울)', lat: 37.4765, lng: 126.9816, total: 72 },
  { station: '고속터미널', line: '3호선', region: '수도권(서울)', lat: 37.5049, lng: 127.0049, total: 86 },
  { station: '교대', line: '3호선', region: '수도권(서울)', lat: 37.4934, lng: 127.0142, total: 50 },
  { station: '명동', line: '4호선', region: '수도권(서울)', lat: 37.5609, lng: 126.9863, total: 60 },
  { station: '동대문역사문화공원', line: '4호선', region: '수도권(서울)', lat: 37.5656, lng: 127.009, total: 70 },
  { station: '혜화', line: '4호선', region: '수도권(서울)', lat: 37.5823, lng: 127.0018, total: 42 },
  { station: '여의도', line: '5호선', region: '수도권(서울)', lat: 37.5216, lng: 126.9242, total: 70 },
  { station: '이태원', line: '6호선', region: '수도권(서울)', lat: 37.5345, lng: 126.9946, total: 42 },
  { station: '부산역', line: '부산1호선', region: '영남권(부산)', lat: 35.1152, lng: 129.0422, total: 80 },
  { station: '서면', line: '부산1·2호선', region: '영남권(부산)', lat: 35.1578, lng: 129.0593, total: 95 },
  { station: '해운대', line: '부산2호선', region: '영남권(부산)', lat: 35.1631, lng: 129.1585, total: 70 },
  { station: '광안', line: '부산2호선', region: '영남권(부산)', lat: 35.1579, lng: 129.1132, total: 40 },
  { station: '남포', line: '부산1호선', region: '영남권(부산)', lat: 35.0979, lng: 129.0348, total: 55 },
  { station: '센텀시티', line: '부산2호선', region: '영남권(부산)', lat: 35.1689, lng: 129.1317, total: 60 },
  { station: '사상', line: '부산2호선', region: '영남권(부산)', lat: 35.1627, lng: 128.9856, total: 50 },
  { station: '서울역(철도)', line: 'KTX/경부선', region: '전국(KTX/철도)', lat: 37.5547, lng: 126.9707, total: 110 },
  { station: '용산역(철도)', line: 'KTX/호남선', region: '전국(KTX/철도)', lat: 37.5298, lng: 126.9647, total: 85 },
  { station: '대전역', line: 'KTX/경부선', region: '전국(KTX/철도)', lat: 36.3323, lng: 127.4342, total: 60 },
  { station: '동대구역', line: 'KTX/경부선', region: '전국(KTX/철도)', lat: 35.8799, lng: 128.6285, total: 90 },
  { station: '부산역(철도)', line: 'KTX/경부선', region: '전국(KTX/철도)', lat: 35.1152, lng: 129.0422, total: 105 },
  { station: '광주송정역', line: 'KTX/호남선', region: '전국(KTX/철도)', lat: 35.1375, lng: 126.7915, total: 45 },
  { station: '수서역', line: 'SRT/수서고속', region: '전국(KTX/철도)', lat: 37.4878, lng: 127.1017, total: 75 },
  { station: '반월당역', line: '대구1·2호선', region: '대구·경북', lat: 35.8655, lng: 128.5934, total: 48 },
  { station: '중앙로역', line: '대구1호선', region: '대구·경북', lat: 35.8698, lng: 128.5942, total: 28 },
  { station: '동대구역(도시철도)', line: '대구1호선', region: '대구·경북', lat: 35.8778, lng: 128.6285, total: 36 },
  { station: '서문시장역', line: '대구3호선', region: '대구·경북', lat: 35.8694, lng: 128.5815, total: 20 },
  { station: '대전역(도시철도)', line: '대전1호선', region: '대전·충청', lat: 36.3315, lng: 127.4332, total: 32 },
  { station: '유성온천역', line: '대전1호선', region: '대전·충청', lat: 36.3537, lng: 127.3414, total: 22 },
  { station: '서대전네거리역', line: '대전1호선', region: '대전·충청', lat: 36.3228, lng: 127.4121, total: 20 },
  { station: '정부청사역', line: '대전1호선', region: '대전·충청', lat: 36.3575, lng: 127.3814, total: 24 },
  { station: '광주송정역(도시철도)', line: '광주1호선', region: '광주·호남', lat: 35.1378, lng: 126.7915, total: 28 },
  { station: '문화전당역', line: '광주1호선', region: '광주·호남', lat: 35.1469, lng: 126.9197, total: 24 },
  { station: '금남로4가역', line: '광주1호선', region: '광주·호남', lat: 35.1501, lng: 126.9135, total: 20 },
  { station: '상무역', line: '광주1호선', region: '광주·호남', lat: 35.1504, lng: 126.8529, total: 24 },
  { station: '인천공항 제1여객터미널', line: '공항철도', region: '전국 공항', lat: 37.4485, lng: 126.4528, total: 72 },
  { station: '인천공항 제2여객터미널', line: '공항철도', region: '전국 공항', lat: 37.4687, lng: 126.4332, total: 56 },
  { station: '김포공항', line: '5·9호선/공항철도', region: '전국 공항', lat: 37.5623, lng: 126.8013, total: 48 },
  { station: '김해공항', line: '부산김해경전철', region: '전국 공항', lat: 35.1732, lng: 128.9464, total: 36 },
  { station: '제주국제공항', line: '제주공항셔틀', region: '전국 공항', lat: 33.5065, lng: 126.493, total: 44 },
  { station: '오송역', line: '경부·호남선', region: '전국(KTX/철도)', lat: 36.6202, lng: 127.3268, total: 28 },
  { station: '천안아산역', line: '경부고속선', region: '전국(KTX/철도)', lat: 36.7946, lng: 127.1045, total: 32 },
  { station: '익산역', line: '호남·전라선', region: '전국(KTX/철도)', lat: 35.9404, lng: 126.9464, total: 24 },
  { station: '강릉역', line: '강릉선', region: '전국(KTX/철도)', lat: 37.7644, lng: 128.8996, total: 36 },
  { station: '여수엑스포역', line: '전라선', region: '전국(KTX/철도)', lat: 34.7528, lng: 127.7458, total: 26 },
  { station: '순천역', line: '전라·경전선', region: '전국(KTX/철도)', lat: 34.9458, lng: 127.5034, total: 22 }
];

function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let cachedLockerStations = null;
async function getLockerStations() {
  if (cachedLockerStations && cachedLockerStations.length > 0) return cachedLockerStations;
  try {
    const res = await fetch('/data/전국_통합_물품보관함_공공데이터.json');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        cachedLockerStations = json.data;
        return cachedLockerStations;
      }
    }
  } catch (e) {
    // network fallback to built-in LOCKER_STATIONS
  }
  return LOCKER_STATIONS;
}

// 📍 현재 위치 GPS 버튼 핸들러 (현재 위치에서 가장 가까운 짐 보관소 역사 자동 반영)
if ($('geoBtn')) {
  $('geoBtn').onclick = () => {
    if (!navigator.geolocation) {
      alert('사용하시는 브라우저가 위치 정보(GPS)를 지원하지 않습니다.');
      return;
    }
    const btn = $('geoBtn');
    const originalText = '📍 현재 위치';
    btn.textContent = '📍 위치 수신 중...';
    btn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        currentCoords = { x: userLng, y: userLat };

        // 1. 전국 짐 보관소 공공데이터에서 현재 위치와 최단 거리 역사 탐색
        const stations = await getLockerStations();
        let nearest = null;
        let minDistance = Infinity;

        for (const st of stations) {
          if (!st.lat || !st.lng) continue;
          const dist = calculateHaversineDistance(userLat, userLng, Number(st.lat), Number(st.lng));
          if (dist < minDistance) {
            minDistance = dist;
            nearest = { ...st, distanceKm: dist };
          }
        }

        if (nearest) {
          nearestDetectedStation = nearest;
          const distText = minDistance < 1
            ? `${Math.round(minDistance * 1000)}m`
            : `${minDistance.toFixed(1)}km`;

          // 역사 명칭 정리 (예: '서울역(철도)' -> '서울역', '반월당역' -> '반월당')
          const stationName = nearest.station.replace(/\(.*\)/, '').replace(/역$/, '').trim();
          const stationDisplayName = stationName + (stationName.endsWith('공항') ? '' : '역');

          // 2. 출발 위치에 가장 가까운 보관소 역사 자동 반영
          setFieldValue('startSelect', nearest.station);

          // 3. 해당 역사의 권역으로 자동 전환 및 지역 요금 연동
          if (nearest.region) {
            const regionCodeMap = {
              '수도권(서울)': 'SEOUL',
              '영남권(부산)': 'BUSAN',
              '대구·경북': 'DAEGU',
              '대전·충청': 'DAEJEON',
              '광주·호남': 'GWANGJU',
              '전국 공항': 'AIRPORT',
              '전국(공항)': 'AIRPORT',
              '전국(KTX/철도)': 'RAILWAY',
              '전국 KTX·철도': 'RAILWAY'
            };
            const mappedRegion = regionCodeMap[nearest.region];
            if (mappedRegion) {
              setFieldValue('regionSelect', mappedRegion);
              updatePricesByRegion();
            }
          }

          // 4. UI 피드백: 버튼 텍스트 및 안내 뱃지 갱신
          btn.textContent = `📍 ${stationDisplayName} (${distText})`;
          btn.disabled = false;
          btn.style.background = 'var(--primary)';
          btn.style.color = '#ffffff';

          let badge = $('geoNearestBadge');
          if (!badge) {
            badge = document.createElement('div');
            badge.id = 'geoNearestBadge';
            badge.className = 'geo-nearest-badge';
            const wrap = $('startSelect')?.closest('.form-group');
            if (wrap) wrap.appendChild(badge);
          }
          if (badge) {
            badge.style.display = 'flex';
            badge.innerHTML = `<span>📍 현재 위치에서 가장 가까운 보관소: <strong>${esc(stationDisplayName)}</strong> (${esc(nearest.line || '')}, 약 ${esc(distText)} 거리)</span>`;
          }
        } else {
          // 보관소 목록 매칭 실패 시 일반 GPS 반영 Fallback
          btn.textContent = '📍 내 위치 확인됨 ✓';
          btn.disabled = false;
          btn.style.background = 'var(--primary)';
          btn.style.color = '#ffffff';
          setFieldValue('startSelect', '현재 위치 (GPS)');
        }
      },
      err => {
        btn.textContent = originalText;
        btn.disabled = false;
        let msg = '위치 정보를 가져올 수 없습니다.';
        if (err.code === 1) {
          msg = '브라우저 위치 정보 제공 권한이 차단되었습니다. 주소창 좌측 자물쇠/설정 아이콘에서 위치 권한을 허용해주세요.';
        } else if (err.code === 2) {
          msg = '네트워크 또는 GPS 신호가 약해 위치를 확인할 수 없습니다.';
        } else if (err.code === 3) {
          msg = '위치 정보 수신 시간이 초과되었습니다. 다시 시도해주세요.';
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  };
}

// 사용자가 출발 위치를 수동 변경하면 GPS 안내 뱃지 및 버튼 복귀
if ($('startSelect')) {
  $('startSelect').addEventListener('change', () => {
    const badge = $('geoNearestBadge');
    if (badge && badge.style.display !== 'none' && nearestDetectedStation) {
      const curVal = getFieldValue('startSelect');
      const baseStation = nearestDetectedStation.station.replace(/\(.*\)/, '').replace(/역$/, '').trim();
      if (!curVal.includes(baseStation)) {
        badge.style.display = 'none';
        currentCoords = null;
        nearestDetectedStation = null;
        if ($('geoBtn')) {
          $('geoBtn').textContent = '📍 현재 위치';
          $('geoBtn').style.background = '';
          $('geoBtn').style.color = '';
        }
      }
    }
  });
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

function saveRecentRoute(start, visit, end, mode, selectedPlaces) {
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
    selectedPlaces: selectedPlaces || {},
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
      <button type="button" class="recent-chip" data-places="${esc(JSON.stringify(r.selectedPlaces || {}))}" data-start="${esc(r.start)}" data-visit="${esc(r.visit || '')}" data-end="${esc(r.end || r.start)}" data-mode="${r.mode || 'route'}">
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
      const places=JSON.parse(btn.dataset.places||'{}');
      for(const [key,id] of [['start','startSelectSearch'],['visit','visitSelectSearch'],['end','endSelectSearch'],['region','regionSelectSearch']]){const p=places[key],f=$(id);if(p&&f){f.dataset.placeId='saved';f.dataset.placeName=p.name;f.dataset.placeAddress=p.address;f.dataset.placeX=p.x;f.dataset.placeY=p.y;}}
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
  if ($('regionSelectSearch')) return;
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
if ($('regionPriceNotice')) $('regionPriceNotice').onclick = () => $('facilityFeeDialog').showModal();
if ($('closeFacilityFeeBtn')) $('closeFacilityFeeBtn').onclick = () => $('facilityFeeDialog').close();
if ($('confirmFacilityFeeBtn')) $('confirmFacilityFeeBtn').onclick = () => $('facilityFeeDialog').close();

document.addEventListener('click', e => {
  if (e.target.closest('#closeFacilityFeeBtn') || e.target.closest('#confirmFacilityFeeBtn')) {
    const dlg = document.getElementById('facilityFeeDialog');
    if (dlg && typeof dlg.close === 'function') {
      dlg.close();
    }
  }
});

if ($('openPhoneBtn')) $('openPhoneBtn').onclick = () => $('phoneDialog').showModal();
if ($('closePhoneDialog')) $('closePhoneDialog').onclick = () => $('phoneDialog').close();


// 모달 바깥 어두운 배경(Backdrop) 클릭 시 닫기
['customDatePickerDialog', 'vaultDialog', 'receiptDialog', 'phoneDialog', 'capacityDialog', 'routeTimeDialog', 'facilityFeeDialog'].forEach(id => {
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

  const sizeVal = 'M';
  const depositVal = $('deposit').value;
  const pickupVal = $('pickup').value;

  if (!startVal) {
    $('formError').textContent = '출발지를 입력하거나 선택해주세요.';
    return;
  }
  if (currentMode === 'route' && !visitVal) {
    $('formError').textContent = '경유지(짐 없이 들를 곳)를 입력하거나 선택해주세요.';
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

  q.selectedPlaces={};
  for(const [key,id] of [['start','startSelectSearch'],['visit','visitSelectSearch'],['end','endSelectSearch'],['region','regionSelectSearch']]){const field=$(id);if(field?.dataset.placeId)q.selectedPlaces[key]={name:field.dataset.placeName,address:field.dataset.placeAddress,x:field.dataset.placeX,y:field.dataset.placeY};}
  if(!getFieldValue('endSelect')||getFieldValue('endSelect')==='SAME_AS_START')q.selectedPlaces.end=q.selectedPlaces.start;
  if (currentCoords && !q.selectedPlaces.start) {
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

    saveRecentRoute(startVal, visitVal, endVal, currentMode, q.selectedPlaces);

    $('emptyGuide').style.display = 'none';
    const displayResults = (d.results || []).slice(0, 7);
    $('resultsCount').textContent = displayResults.length;

    $('summary').style.display = 'block';
    $('summary').innerHTML = currentMode === 'near' ? '<strong>'+esc(d.start.name)+' 출발 → '+esc(d.nearDestination?.name || d.start.name)+' 주변 보관함</strong>' : `
      <strong>${esc(d.start.name)} 출발 → ${esc(d.visit ? d.visit.name : '목적지')} ${d.end && d.end.name !== d.start.name ? '→ ' + esc(d.end.name) : ''} 일정</strong>
    `;

    $('cards').innerHTML = displayResults.length
      ? displayResults.map((l, index) => {
          const isBest = l.rank === 1;
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
                    <span class="tag ${isBest ? 'recommend' : ''}">${l.rank ? '추천 ' + l.rank + '위' : '경로 확인 필요'}</span>
                    ${l.isPublicFacility ? `<span class="tag" style="background:#fef3c7;color:#92400e;font-weight:700;">🏛️ 지자체 공영</span>` : ''}
                    <span class="tag">${l.location.includes('안쪽') ? '개찰구 안쪽 여부 확인' : '출입구·개찰구 확인 필요'}</span>
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
                  <small>${l.estimated ? '도보 추정 포함' : '전체 이동시간'}</small>
                  <div class="metric-value">
                    <button type="button" class="route-time-button" data-route="${esc(JSON.stringify({name:l.name,total:l.total,mode:currentMode,legs:l.legs||[]}))}" aria-label="전체 이동시간 상세 구간 보기">${l.total === 0 && l.coordinatePrecision === 'station' ? '역내 이동' : formatMinutes(l.total)}</button>
                  </div>
                  <small class="note capacity-hint">이동 구간 보기 ›</small>
                </div>
                <div class="metric">
                  <small>짐 들고 이동</small>
                  <div class="metric-value">
                    <strong class="metric-carry-value">${l.carry === 0 && l.coordinatePrecision === 'station' ? '역내 이동' : (l.carry != null ? '총 ' + formatMinutes(l.carry) : '-')}</strong>
                  </div>
                  <small class="note">실제 짐 부담 시간</small>
                </div>
                <div class="metric">
                  <small>설치수량</small>
                  <div class="metric-value">
                    <button type="button" class="capacity-button" data-capacity="${esc(l.capacityText || '미제공')}" data-location="${esc(l.location || '')}" aria-label="설치수량 및 크기별 수량 보기">${capacitySummary(l.capacityText)}</button>
                  </div>
                  <small class="note capacity-hint">크기별 보기 ›</small>
                </div>
              </div>

              
              
              ${l.details?.length ? l.details.map(x => `
                <div style="font-size:12px;background:var(--surface-sub);padding:10px 14px;border-radius:8px;margin:8px 0;line-height:1.6;">
                  <strong>${esc(x.stlckKndNm)}</strong> · ${esc(x.utztnCrgExpln || '기본 요금')}${x.addCrgExpln ? ` (${esc(x.addCrgExpln)})` : ''}
                </div>
              `).join('') : ''}



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
      : `
        <div class="empty" style="padding:40px 20px;text-align:center;background:var(--surface);border:1px dashed var(--border);border-radius:20px;margin-top:16px;">
          <div style="font-size:38px;margin-bottom:12px;">🧳</div>
          <h3 style="font-size:17px;font-weight:700;margin-bottom:8px;color:var(--text-main);">주변 반경 내 보관함을 찾지 못했어요</h3>
          <p style="font-size:13.5px;color:var(--text-sub);line-height:1.6;margin-bottom:18px;max-width:380px;margin-inline:auto;">
            공식 철도 및 지자체 공영 보관함이 없는 지역일 수 있어요.<br>
            근처 주요 KTX/기차역이나 지하철역 이름으로 다시 검색해보세요!
          </p>
          <a href="https://map.kakao.com/link/search/${encodeURIComponent((d.start?.name || '') + ' 물품보관함')}" 
             target="_blank" rel="noopener noreferrer" 
             style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:var(--surface-muted);border:1px solid var(--border);border-radius:10px;font-size:13px;font-weight:600;color:var(--text-main);text-decoration:none;transition:all 0.15s ease;">
            <span>📍 카카오맵에서 '${esc(d.start?.name || '현재 위치')}' 주변 보관함 검색</span>
            <span>↗</span>
          </a>
        </div>
      `;

    // 결과 렌더링 후 추천 보관함 영역으로 부드럽게 자동 스크롤
    setTimeout(() => {
      const resultsSection = document.querySelector('.results-area');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);

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
  let results=[],active=-1,composing=false,timer=null,controller=null,version=0,selecting=false,press=null,lastQuery='';
  function close(){clearTimeout(timer);controller?.abort();version++;list.hidden=true;input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');active=-1;}
  function showPanel(html){list.innerHTML=html;list.hidden=false;input.setAttribute('aria-expanded','true');}
  function choose(i){const p=typeof i==='object'?i:results[i];if(!p||selecting)return;selecting=true;close();input.blur();setTimeout(()=>{input.value=p.name+' · '+p.address;input.dataset.placeId=p.id;input.dataset.placeX=p.x;input.dataset.placeY=p.y;input.dataset.placeName=p.name;input.dataset.placeAddress=p.address;composing=false;select.dispatchEvent(new Event('change',{bubbles:true}));input.focus();selecting=false;},80);}
  function highlight(){list.querySelectorAll('[role="option"]').forEach((e,i)=>{e.classList.toggle('active',i===active);e.setAttribute('aria-selected',String(i===active));});if(active>=0){input.setAttribute('aria-activedescendant',list.id+'-'+active);list.children[active]?.scrollIntoView({block:'nearest'});}}
  async function lookup(q,seq){const requestController=new AbortController();controller=requestController;const timeout=setTimeout(()=>requestController.abort('timeout'),10000);try{const r=await fetch('/api/places?q='+encodeURIComponent(q),{signal:requestController.signal});const d=await r.json();if(seq!==version)return;if(!r.ok)throw Error(d.error||'검색에 실패했어요.');results=d.places||[];active=-1;showPanel(results.length?results.map((p,i)=>'<button type="button" role="option" aria-selected="false" id="'+list.id+'-'+i+'" data-choice="'+i+'"><span class="suggestion-icon">⌕</span><span><strong>'+esc(p.name)+'</strong><small>'+esc(p.address)+'</small></span><span class="suggestion-arrow">↖</span></button>').join(''):'<div class="suggestion-empty">일치하는 장소를 찾지 못했어요.<br><small>정확한 장소 이름이나 주소로 다시 입력해주세요.</small></div>');}catch(e){if(seq!==version)return;showPanel('<div class="suggestion-empty">'+esc(requestController.signal.aborted?'검색이 지연되고 있어요. 글자를 다시 입력해 주세요.':e.message)+'</div>');}finally{clearTimeout(timeout);}}
  function schedule(){if(selecting||press)return;const value=input.value.trim();if(value===lastQuery&&!list.hidden&&results.length)return;lastQuery=value;clearTimeout(timer);controller?.abort();results=[];active=-1;input.removeAttribute('aria-activedescendant');const q=input.value.trim();const seq=++version;if(!q){close();return;}showPanel('<div class="suggestion-empty">장소 검색 중…</div>');timer=setTimeout(()=>lookup(q,seq),300);}
  input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;if(!selecting)schedule();});input.addEventListener('input',()=>{if(selecting)return;delete input.dataset.placeId;delete input.dataset.placeX;delete input.dataset.placeY;delete input.dataset.placeName;delete input.dataset.placeAddress;schedule();});
  input.addEventListener('keydown',e=>{if(e.isComposing||composing)return;if(e.key==='Escape'){close();return;}if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!list.hidden&&results.length){e.preventDefault();active=e.key==='ArrowDown'?Math.min(active+1,results.length-1):Math.max(active-1,0);highlight();}else if(e.key==='Enter'&&!list.hidden&&active>=0){e.preventDefault();choose(active);}else if(e.key==='Tab')close();});
  list.addEventListener('pointerdown',e=>{const row=e.target.closest('[data-choice]');if(!row)return;clearTimeout(timer);controller?.abort();version++;press={id:Number(row.dataset.choice),place:results[Number(row.dataset.choice)],x:e.clientX,y:e.clientY};if(e.pointerType==='mouse')e.preventDefault();e.stopPropagation();});
  list.addEventListener('pointerup',e=>{const row=e.target.closest('[data-choice]');const saved=press;press=null;if(!saved||!row||Number(row.dataset.choice)!==saved.id)return;if(Math.hypot(e.clientX-saved.x,e.clientY-saved.y)>8)return;e.preventDefault();e.stopPropagation();choose(saved.place);});
  list.addEventListener('pointercancel',()=>{press=null;});
  list.addEventListener('mousedown',e=>{if(e.target.closest('[data-choice]'))e.preventDefault();});
  list.addEventListener('click',e=>{e.stopPropagation();if(!list.hidden&&!selecting){const row=e.target.closest('[data-choice]');if(row)choose(Number(row.dataset.choice));}});
  input.addEventListener('blur',e=>{if(e.relatedTarget&&wrap.contains(e.relatedTarget))return;setTimeout(()=>{if(!press&&!selecting&&!wrap.contains(document.activeElement))close();},150);});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))close();});
}
function capacityParts(text){
 const parts=[];const re=/(특대형|특대|대형|중형|소형|기타|대|중|소)\s*[:：]?\s*(\d[\d,]*)\s*(?:개|칸)?/g;
 for(const m of String(text||'').matchAll(re))parts.push({size:m[1].replace('형',''),count:Number(m[2].replaceAll(',',''))});
 return parts;
}
function capacitySummary(text){const parts=capacityParts(text);if(parts.length)return parts.reduce((n,p)=>n+p.count,0)+'칸';const m=String(text||'').match(/^\s*(\d[\d,]*)\s*(?:칸|개)\s*$/);return m?Number(m[1].replaceAll(',',''))+'칸':'미제공';}
document.addEventListener('click',e=>{
 const button=e.target.closest('.capacity-button');if(!button)return;
 let dialog=document.getElementById('capacityDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='capacityDialog';document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
 const parts=capacityParts(button.dataset.capacity);
 dialog.setAttribute('aria-label','크기별 보관함 설치수량');
 dialog.innerHTML='<div class="dialog-scroll-wrap capacity-content"><div class="dialog-heading"><h2>📦 크기별 설치수량</h2><button type="button" class="close-btn" aria-label="닫기">×</button></div><p class="capacity-location">'+esc(button.dataset.location)+'</p><div class="capacity-total">전체 설치수량 <strong>'+capacitySummary(button.dataset.capacity)+'</strong></div><div class="capacity-size-cards">'+(parts.length?parts.map(p=>'<div class="capacity-size-card"><span class="capacity-size-tag">'+esc(p.size)+'형</span><strong>'+p.count+'<small>칸</small></strong></div>').join(''):'<p>크기별 수량이 제공되지 않았어요.</p>')+'</div><p class="capacity-footnote">설치된 보관함 수예요. 현재 이용 가능한 빈자리 수와는 달라요.</p></div>';
 dialog.querySelector('.close-btn').onclick=()=>dialog.close();dialog.showModal();
});

document.addEventListener('click',e=>{
 const button=e.target.closest('.route-time-button');if(!button)return;
 const route=JSON.parse(button.dataset.route);let dialog=document.getElementById('routeTimeDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='routeTimeDialog';dialog.setAttribute('aria-label','상세 이동 구간');document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});}
 const labels=route.mode==='near'?['출발지 → 보관함에 맡기기','보관함 → 목적지 (짐 없이 이동)']:['출발지 → 보관함','보관함 → 경유지','경유지 → 보관함 회수','보관함 → 최종 목적지'];
 dialog.innerHTML='<div class="dialog-scroll-wrap"><div class="dialog-heading"><h2 style="font-size:18px;margin:0;">🚶 상세 이동 구간</h2><button type="button" class="close-btn" aria-label="닫기">×</button></div><p class="capacity-location">'+esc(route.name)+'</p><div class="capacity-total">전체 이동시간 <strong>'+formatMinutesText(route.total)+'</strong></div><div class="route-segments">'+route.legs.map((leg,i)=>'<section class="route-segment"><div><span class="route-step-number">'+(i+1)+'</span><strong>'+labels[i]+'</strong></div><b>'+ (Number.isFinite(leg?.minutes)?formatMinutesText(leg.minutes):'조회 실패')+'</b><p>'+ (Number.isFinite(leg?.minutes)?(leg.steps||[]).map(esc).join(' · '):esc(leg?.error||'경로를 불러오지 못했어요'))+'</p></section>').join('')+'</div><p class="capacity-footnote">조회 시점의 경로 기준이며, 역 안에서 실제 보관함까지 이동하는 시간은 다를 수 있어요.</p></div>';
 dialog.querySelector('.close-btn').onclick=()=>dialog.close();dialog.showModal();
});

// Departure first, then the destination used to select nearby lockers.
{const group=$('startSelect')?.closest('.form-group'),target=$('regionGroup');if(group&&target)group.after(target);}
