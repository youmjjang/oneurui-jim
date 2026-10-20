const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clock = s => s ? String(s).slice(0, 2) + ':' + String(s).slice(2, 4) : '24:00';

// -------------------------------------------------------------------
// 1. 커스텀 드롭다운 시스템 (항상 밑/아래 방향으로 펼쳐짐 보장)
// -------------------------------------------------------------------
function initCustomDropdowns() {
  document.querySelectorAll('.custom-select-wrap').forEach(wrap => {
    const select = wrap.querySelector('select');
    if (!select || wrap.querySelector('.custom-dropdown-panel')) return;

    // 네이티브 select는 폼 전송/상태 보존용으로 숨김
    select.classList.add('custom-select-native-hidden');

    // 기존의 정적 arrow 태그 제거 후 트리거 내부에 배치
    const existingArrow = wrap.querySelector('.custom-select-arrow');
    if (existingArrow) existingArrow.remove();

    // 커스텀 트리거 버튼 생성
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

    // 커스텀 드롭다운 목록 패널 (top: 100%로 무조건 아래 방향으로 전개)
    const panel = document.createElement('div');
    panel.className = 'custom-dropdown-panel';
    panel.setAttribute('role', 'listbox');

    const buildOptions = () => {
      let html = '';
      Array.from(select.children).forEach(child => {
        if (child.tagName === 'OPTGROUP') {
          html += `<div class="dropdown-optgroup-title">${esc(child.label)}</div>`;
          Array.from(child.children).forEach(opt => {
            const isSelected = opt.value === select.value;
            html += `<div class="dropdown-option ${isSelected ? 'selected' : ''}" data-value="${esc(opt.value)}">${esc(opt.textContent)}</div>`;
          });
        } else if (child.tagName === 'OPTION') {
          const isSelected = child.value === select.value;
          html += `<div class="dropdown-option ${isSelected ? 'selected' : ''}" data-value="${esc(child.value)}">${esc(child.textContent)}</div>`;
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

      // 다른 열린 드롭다운 일괄 닫기
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

    // 옵션 클릭 시 값 반영 및 네이티브 change 이벤트 발생
    panel.onclick = e => {
      const optEl = e.target.closest('.dropdown-option');
      if (!optEl) return;
      e.stopPropagation();

      const newVal = optEl.dataset.value;
      select.value = newVal;
      syncSelectWrap(wrap, select);
      wrap.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');

      select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    // 네이티브 select의 변경 이벤트 수신 시 UI 동기화
    select.addEventListener('change', () => {
      syncSelectWrap(wrap, select);
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
    if (select) syncSelectWrap(wrap, select);
  });
}

// 화면 외부 클릭 시 드롭다운 닫기
document.addEventListener('click', e => {
  if (!e.target.closest('.custom-select-wrap')) {
    document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// ESC 키 입력 시 닫기
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.custom-select-wrap.open').forEach(w => {
      w.classList.remove('open');
      w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  }
});

// -------------------------------------------------------------------
// 2. 직접 입력 토글 기능 (클릭 시 별도 입력창 노출 및 자동 포커스)
// -------------------------------------------------------------------
function initDirectInputToggles() {
  document.querySelectorAll('.direct-input-btn').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;
      const targetEl = $(targetId);
      if (!targetEl) return;

      const isVisible = targetEl.style.display !== 'none';
      if (isVisible) {
        targetEl.style.display = 'none';
        btn.classList.remove('active');
        btn.textContent = '직접 입력';
        const input = targetEl.querySelector('input');
        if (input) input.value = '';
      } else {
        targetEl.style.display = 'block';
        btn.classList.add('active');
        btn.textContent = '목록 선택';
        const input = targetEl.querySelector('input');
        if (input) {
          input.focus();
        }
      }
    };
  });
}

// -------------------------------------------------------------------
// 3. 시간 헬퍼 및 [현재 시각] 버튼
// -------------------------------------------------------------------
const formatLocalTime = d => {
  const pad = n => String(n).padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${Y}-${M}-${D}T${h}:${m}`;
};

function setCurrentTimes() {
  const now = new Date();
  $('deposit').value = formatLocalTime(now);
  const later = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  $('pickup').value = formatLocalTime(later);
}

// 초기화 시 현재 시각 설정
setCurrentTimes();

// [현재 시각] 버튼 클릭 시 실제로 사용 가능한 현재 시간 주입
$('nowTimeBtn').onclick = () => {
  setCurrentTimes();
};

// 소요 시간 표기 포맷터 (60분 이상 시 '1시간', 'X시간 XX분' 등 시간 단위로 변환)
function formatMinutes(min) {
  if (min === null || min === undefined) return '-';
  const m = Math.round(Number(min) || 0);
  if (m < 60) {
    return `${m}<em>분</em>`;
  }
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) {
    return `${h}<em>시간</em>`;
  }
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
// 2. 모드 전환 (바로 맡기기 vs 일정에 맞추기)
// -------------------------------------------------------------------
let currentMode = 'route';
let currentCoords = null;
$('locateBtn').onclick = () => {
  setMode('near');
  const status = $('locationStatus');
  if (!navigator.geolocation) {
    status.textContent = '이 브라우저에서는 위치를 확인할 수 없어요. 아래에서 역이나 장소를 선택해주세요.';
    return;
  }
  $('locateBtn').disabled = true;
  status.textContent = '현재 위치를 확인하고 있어요…';
  navigator.geolocation.getCurrentPosition(position => {
    currentCoords = { x: position.coords.longitude, y: position.coords.latitude };
    status.textContent = '현재 위치를 찾았어요. 선택한 짐 크기로 주변 보관함을 검색합니다.';
    $('locateBtn').disabled = false;
    $('plannerForm').requestSubmit();
  }, error => {
    currentCoords = null;
    $('locateBtn').disabled = false;
    status.textContent = error.code === 1
      ? '위치 권한이 꺼져 있어요. 아래에서 역이나 장소를 선택해 검색해주세요.'
      : '현재 위치를 확인하지 못했어요. 다시 시도하거나 아래에서 장소를 선택해주세요.';
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
};
['startSelect', 'startDirectInput'].forEach(id => $(id).addEventListener('change', () => {
  currentCoords = null;
  $('locationStatus').textContent = '선택한 장소를 기준으로 검색해요. 내 위치 버튼을 누르면 현재 위치로 바뀝니다.';
}));

function setMode(value) {
  currentMode = value;

  const isRoute = value === 'route';
  $('routeFields').style.display = isRoute ? 'block' : 'none';
  $('emptyGuide').querySelector('h3').textContent = isRoute ? '어디로 이동하시나요?' : '지금 가까운 곳부터 찾아보세요';
  $('emptyGuide').querySelector('p').textContent = isRoute ? '출발지와 목적지를 선택하면 회수 동선까지 비교해요.' : '내 위치 버튼을 누르거나 역·장소와 짐 크기를 선택해 검색하세요.';
  $('priorityField').style.display = isRoute ? 'block' : 'none';
  $('recentChips').parentElement.style.display = isRoute ? 'block' : 'none';
  $('deposit').closest('.form-group').style.display = isRoute ? 'block' : 'none';

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
$('exampleBtn').onclick = () => {
  currentCoords = null;
  setMode('near');
  $('startSelect').value = '서울역';
  $('startDirectInput').value = '';
  $('startDirectWrap').style.display = 'none';
  syncAllCustomSelects();
  $('locationStatus').textContent = '예시 미리보기 · 서울역 기준입니다. 실제 내 위치가 아닙니다.';
  $('plannerForm').requestSubmit();
};
let resultLockers = [];
let searchedOrigin = null;
let searchedMode = 'near';
let searchedVisit = null, searchedEnd = null;
let selectedMapIndex = null;
let map = null, pinLayer = null, walkingLine = null;
let mapPins = [];
let walkingRequest = null;
function initLockerMap() {
  if (!window.L) { $('mapStatus').textContent = '지도를 불러오지 못했어요. 아래 보관함 목록은 사용할 수 있어요.'; return; }
  map = L.map('lockerMap', { scrollWheelZoom: false }).setView([37.5562,126.9723],13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  pinLayer = L.layerGroup().addTo(map);
}
function clearWalking() {
  if (walkingRequest) walkingRequest.abort();
  walkingRequest = null;
  if (walkingLine) { map.removeLayer(walkingLine); walkingLine = null; }
  $('mapRouteStats').textContent = '';
  $('walkingSteps').hidden = true;
  $('drawWalkingRoute').disabled = false;
  $('drawWalkingRoute').textContent = '이 지도에서 도보 길찾기 →';
}
function showAllPins() {
  if (!map || !searchedOrigin) return;
  const points = [[Number(searchedOrigin.y),Number(searchedOrigin.x)],...resultLockers.map(l=>[l.coordinates.lat,l.coordinates.lng])];
  map.invalidateSize();
  map.fitBounds(points, {padding:[35,35],maxZoom:16});
}
function renderLockerMap() {
  if (!map) return;
  clearWalking();
  selectedMapIndex = null;
  $('mapSelection').hidden = true;
  $('itineraryPanel').hidden = true;
  pinLayer.clearLayers(); mapPins = [];
  L.circleMarker([Number(searchedOrigin.y),Number(searchedOrigin.x)],{radius:9,color:'#fff',weight:3,fillColor:'#3688e7',fillOpacity:1}).bindTooltip(esc(searchedOrigin.name),{permanent:true,direction:'top'}).addTo(pinLayer);
  resultLockers.forEach((l,i)=>{
    const marker = L.marker([l.coordinates.lat,l.coordinates.lng],{ icon:L.divIcon({className:'locker-pin-wrapper',html:'<span class="locker-pin">'+(i+1)+'</span>',iconSize:[32,38],iconAnchor:[16,35]}),title:l.name,keyboard:true });
    marker.bindTooltip(esc(l.name));
    marker.on('click',()=>selectMapLocker(i)); marker.addTo(pinLayer); mapPins.push(marker);
  });
  $('mapStatus').textContent = searchedOrigin.name+' 기준 · 보관함 '+resultLockers.length+'곳 · 숫자 핀을 눌러보세요.';
  showAllPins();
}
function selectMapLocker(index) {
  if (!map || !resultLockers[index]) return;
  clearWalking(); selectedMapIndex = index;
  const locker = resultLockers[index];
  $('mapSelection').hidden = false;
  $('mapLockerTag').textContent = '보관함 '+(index+1)+' · '+(locker.location.includes('개찰구 안')?'개찰구 안':'위치 안내 확인');
  $('mapLockerName').textContent = locker.name;
  $('mapLockerLocation').textContent = locker.location;
  $('drawWalkingRoute').hidden = searchedMode === 'route';
  $('itineraryPanel').hidden = searchedMode !== 'route';
  $('mapRoutingPrivacy').textContent = searchedMode === 'route' ? '대중교통 경로: 카카오맵 API · 점선은 도보, 실선은 탑승 구간입니다. 역 내부 층·출구 안내를 함께 확인해주세요.' : '길찾기를 누르면 출발·도착 좌표가 OSM 경로 서비스로 전달됩니다. 역 내부에서는 층·출구 안내를 확인해주세요.';
  if (searchedMode === 'route') {
    $('itineraryMetrics').innerHTML = '<span>전체 이동 <b>'+locker.total+'분</b></span><span>보관 우회 <b>+'+locker.detourMinutes+'분</b></span><span>짐 들고 이동 <b>'+locker.carry+'분</b></span><span>도보 <b>'+locker.walkingMinutes+'분</b></span><span>환승 합계 <b>'+locker.transfers+'회</b></span>';
    const titles=['출발 → 보관','보관 → 방문','방문 → 회수','회수 → 최종'];
    $('itineraryLegs').innerHTML='<button type="button" data-leg="all" class="active">전체 동선</button>'+locker.legs.map((leg,i)=>'<button type="button" data-leg="'+i+'">'+(i+1)+'. '+titles[i]+' · '+leg.minutes+'분</button>').join('');
    drawTransitLegs('all');
  }
  mapPins.forEach((pin,i)=>pin.setIcon(L.divIcon({className:'locker-pin-wrapper',html:'<span class="locker-pin '+(i===index?'active':'')+'">'+(i+1)+'</span>',iconSize:[32,38],iconAnchor:[16,35]})));
  const from = encodeURIComponent(searchedOrigin.name)+','+Number(searchedOrigin.y)+','+Number(searchedOrigin.x);
  const to = encodeURIComponent(locker.name)+','+locker.coordinates.lat+','+locker.coordinates.lng;
  $('mapExternalLink').href='https://map.kakao.com/link/by/'+(searchedMode === 'route'?'traffic':'walk')+'/'+from+'/'+to;
  if (searchedMode !== 'route') map.fitBounds([[Number(searchedOrigin.y),Number(searchedOrigin.x)],[locker.coordinates.lat,locker.coordinates.lng]],{padding:[45,45],maxZoom:17});
  document.querySelector('.locker-map-shell').scrollIntoView({behavior:'smooth',block:'start'});
}
function drawTransitLegs(which) {
  if (selectedMapIndex===null) return;
  if (walkingLine) map.removeLayer(walkingLine);
  const locker=resultLockers[selectedMapIndex];
  walkingLine=L.featureGroup().addTo(map);
  const colors=['#2768b0','#278657','#b56822','#8152a3'];
  const labels=['출발 → 보관함','보관함 → 방문지','방문지 → 보관함 회수','보관함 → 최종 목적지'];
  const selected=locker.legs.map((leg,index)=>({leg,index})).filter(({index})=>which==='all'||index===Number(which));
  $('itineraryDetail').innerHTML=selected.map(({leg,index})=>'<section class="transit-leg"><h4 style="color:'+colors[index]+'">'+(index+1)+'. '+labels[index]+' · '+leg.minutes+'분</h4>'+leg.segments.map(s=>'<div class="transit-step"><span class="transit-mode">'+(s.mode==='SUBWAY'?'지하철':s.mode==='BUS'?'버스':'도보')+'</span><div><strong>'+esc(s.guidance)+'</strong><small>'+esc(s.vehicles.join(' · '))+(s.stops.length?' · '+esc(s.stops[0])+' → '+esc(s.stops[s.stops.length-1]):'')+' · '+Math.ceil(s.seconds/60)+'분</small></div></div>').join('')+(leg.segments.length?'':'<p>같은 위치</p>')+'</section>').join('');
  let missingGeometry=false;
  selected.forEach(({leg,index})=>leg.segments.forEach(segment=>{
    if(segment.points.length<2){if(segment.seconds>0) missingGeometry=true;return;}
    L.polyline(segment.points.map(([lng,lat])=>[lat,lng]),{color:colors[index],weight:segment.mode==='WALKING'?4:6,dashArray:segment.mode==='WALKING'?'7 8':null,opacity:.8}).addTo(walkingLine);
  }));
  [[searchedVisit,'방문지'],[searchedEnd,'최종 목적지']].forEach(([p,label])=>{if(p)L.circleMarker([Number(p.y),Number(p.x)],{radius:6,color:'#c17839',fillColor:'#fff',fillOpacity:1,weight:3}).bindTooltip(esc(label+' · '+p.name),{permanent:false}).addTo(walkingLine);});
  const bounds=walkingLine.getBounds();
  if(bounds.isValid()) map.fitBounds(bounds,{padding:[40,40],maxZoom:17});
  $('mapRouteStats').textContent=(which==='all'?'전체 일정 · '+locker.total+'분':labels[Number(which)]+' · '+locker.legs[Number(which)].minutes+'분')+(missingGeometry?' · 일부 구간의 지도 선 정보가 없어요':'');
  $('itineraryLegs').querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.leg===String(which)));
}
$('itineraryLegs').onclick=e=>{const button=e.target.closest('[data-leg]');if(button) drawTransitLegs(button.dataset.leg);};
$('drawWalkingRoute').onclick = async () => {
  if (selectedMapIndex === null || walkingRequest) return;
  const locker = resultLockers[selectedMapIndex];
  const controller = new AbortController(); walkingRequest = controller;
  $('drawWalkingRoute').disabled = true;
  $('drawWalkingRoute').textContent = '도보 경로 찾는 중…';
  $('mapRouteStats').textContent = '실제 보행 경로를 불러오고 있어요.';
  try {
    const response = await fetch('/api/walking',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({start:{lat:Number(searchedOrigin.y),lng:Number(searchedOrigin.x)},end:locker.coordinates})});
    const route = await response.json();
    if (!response.ok) throw Error(route.error || '경로를 불러오지 못했어요.');
    if (controller.signal.aborted) return;
    walkingLine = L.geoJSON(route.geometry,{style:{color:'#235e42',weight:6,opacity:.9}}).addTo(map);
    map.fitBounds(walkingLine.getBounds(),{padding:[35,35],maxZoom:17});
    $('mapRouteStats').textContent = '도보 약 '+route.minutes+'분 · '+(route.distance<1000?Math.round(route.distance)+'m':(route.distance/1000).toFixed(1)+'km');
    const turns = {'left':'왼쪽','right':'오른쪽','slight left':'왼쪽 방향','slight right':'오른쪽 방향','straight':'직진','sharp left':'왼쪽으로 크게','sharp right':'오른쪽으로 크게','uturn':'돌아가기'};
    $('walkingStepList').innerHTML=route.steps.map(step=>'<li>'+esc(step.type==='arrive'?'보관함 주변 도착':step.type==='depart'?'출발':(turns[step.modifier]||'계속 이동'))+(step.name?' · '+esc(step.name):'')+(step.distance>0?' · '+Math.round(step.distance)+'m':'')+'</li>').join('');
    $('walkingSteps').hidden = false;
    $('drawWalkingRoute').textContent = '도보 경로 다시 찾기';
  } catch(error) {
    if (error.name==='AbortError') return;
    $('mapRouteStats').textContent=error.message;
    $('drawWalkingRoute').textContent='다시 길찾기';
  } finally {
    if (walkingRequest===controller) { walkingRequest=null; $('drawWalkingRoute').disabled=false; }
  }
};
$('clearMapRoute').onclick=clearWalking;
$('showAllPins').onclick=showAllPins;
$('cards').addEventListener('click',e=>{const button=e.target.closest('[data-directions]');if(button) selectMapLocker(Number(button.dataset.directions));});
initLockerMap();

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
// 3. 최근 경로 (Recent Routes) 관리
// -------------------------------------------------------------------
const RECENT_KEY = 'oneurui_jim_recent_routes';

function loadRecentRoutes() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveRecentRoute(start, visit, end) {
  const routes = loadRecentRoutes() || [
    { start: '서울역', visit: '성수', end: '서울역' },
    { start: '부산역', visit: '해운대', end: '부산역' },
    { start: '홍대입구', visit: '혜화', end: '홍대입구' }
  ];

  // 중복 제거 후 맨 앞에 추가
  const filtered = routes.filter(r => !(r.start === start && r.visit === visit && r.end === end));
  filtered.unshift({ start, visit, end });
  const trimmed = filtered.slice(0, 4);

  localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  renderRecentChips();
}

function renderRecentChips() {
  const routes = loadRecentRoutes() || [
    { start: '서울역', visit: '성수', end: '서울역' },
    { start: '부산역', visit: '해운대', end: '부산역' },
    { start: '홍대입구', visit: '혜화', end: '홍대입구' }
  ];

  const container = $('recentChips');
  container.innerHTML = routes.map(r => `
    <button type="button" class="recent-chip" data-start="${r.start}" data-visit="${r.visit}" data-end="${r.end}">
      ${r.start} → ${r.visit} → ${r.end}
    </button>
  `).join('');

  container.querySelectorAll('.recent-chip').forEach(btn => {
    btn.onclick = () => {
      const s = btn.dataset.start;
      const v = btn.dataset.visit;
      const e = btn.dataset.end;

      // 직접 입력 창 열려있으면 초기화
      document.querySelectorAll('.direct-input-wrap').forEach(w => {
        w.style.display = 'none';
        const inp = w.querySelector('input');
        if (inp) inp.value = '';
      });
      document.querySelectorAll('.direct-input-btn').forEach(b => {
        b.classList.remove('active');
        b.textContent = '직접 입력';
      });

      $('startSelect').value = s;
      $('visitSelect').value = v;
      $('endSelect').value = (e === s) ? 'SAME_AS_START' : e;

      syncAllCustomSelects();

      setMode('route');
      $('plannerForm').requestSubmit();
    };
  });
}

renderRecentChips();

// -------------------------------------------------------------------
// 4. 지역 드롭다운 연동 필터링 (스마트 자동 스크롤)
// -------------------------------------------------------------------
$('regionSelect').onchange = e => {
  const reg = e.target.value;
  if (reg === 'BUSAN') {
    $('startSelect').value = '부산역';
    $('visitSelect').value = '해운대';
  } else if (reg === 'RAILWAY') {
    $('startSelect').value = '동대구역';
    $('visitSelect').value = '대전역';
  } else if (reg === 'SEOUL') {
    $('startSelect').value = '서울역';
    $('visitSelect').value = '성수';
  }
  syncAllCustomSelects();
};

// -------------------------------------------------------------------
// 5. Web Crypto API (AES-GCM 256 + PBKDF2) 보안 금고 모듈
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
      badge.style.display = 'inline-flex';
      badge.textContent = `🔒 ${payload.stationName} 보관 중`;
      badge.onclick = () => openVaultModal(payload.stationName, payload.location);
    } else {
      badge.style.display = 'none';
    }
  }
}
updateVaultBadge();

// -------------------------------------------------------------------
// 6. 보안 모달 열기 및 렌더링
// -------------------------------------------------------------------
window.openVaultModal = function(stationName, locationDesc) {
  const payload = getStoredPayload();
  const container = $('vaultContent');

  if (payload) {
    // 이미 암호화 티켓이 있는 경우 -> 잠금 해제 화면
    container.innerHTML = `
      <div style="background:#f3f6f1;border:1px solid #d4ded0;border-radius:12px;padding:18px;margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <strong style="color:var(--primary);font-size:13px;">🔒 암호화 안전 보관 중</strong>
          <span style="font-size:11px;color:var(--text-sub);">${new Date(payload.createdAt).toLocaleTimeString('ko-KR')}</span>
        </div>
        <div style="font-size:13px;margin-bottom:4px;"><strong>보관 역사:</strong> ${payload.stationName}</div>
        <div style="font-size:12px;color:var(--text-sub);margin-bottom:14px;"><strong>위치:</strong> ${payload.location}</div>

        <div id="unlockedView" style="display:none;background:#fff;border:1px solid #b7cebf;border-radius:10px;padding:14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="color:var(--primary);font-size:12px;">PIN 인증 완료</strong>
            <button type="button" id="toggleMaskBtn" style="background:none;border:0;color:var(--text-sub);font-size:11px;cursor:pointer;text-decoration:underline;">비밀번호 보기</button>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <small style="color:var(--text-muted);display:block;font-size:11px;">사물함 번호</small>
              <h4 id="viewLockerNo" style="margin:2px 0 0;font-size:18px;font-weight:800;"></h4>
            </div>
            <div>
              <small style="color:var(--text-muted);display:block;font-size:11px;">사물함 비밀번호</small>
              <h4 id="viewPasscode" style="margin:2px 0 0;font-size:18px;font-weight:800;color:var(--accent);">••••••</h4>
            </div>
          </div>
        </div>

        <form id="unlockForm">
          <label style="display:block;font-size:12px;font-weight:700;color:var(--text-main);margin-bottom:6px;">본인 PIN 번호 입력</label>
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
        $('viewLockerNo').textContent = decryptedData.lockerNo;
        $('viewPasscode').textContent = '••••••';
      } catch {
        $('unlockError').textContent = 'PIN 번호가 일치하지 않습니다.';
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
      // Crypto-Shredding 실행
      const digest = await sha256(JSON.stringify(payload) + Date.now());
      const noise = buf2b64(window.crypto.getRandomValues(new Uint8Array(128)));
      localStorage.setItem(VAULT_STORAGE_KEY, noise);
      localStorage.removeItem(VAULT_STORAGE_KEY);
      updateVaultBadge();
      $('vaultDialog').close();

      $('receiptContent').innerHTML = `
        <div style="background:#f4f6f1;border:1px solid #d4ded0;border-radius:12px;padding:16px;font-size:12px;line-height:1.8;">
          <div>• <strong>이용 역사:</strong> ${payload.stationName}</div>
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
    // 신규 티켓 생성 폼
    container.innerHTML = `
      <form id="newTicketForm">
        <div style="background:#f3f6f1;padding:12px 14px;border-radius:10px;margin-bottom:14px;font-size:12px;">
          선택 보관소: <strong>${stationName}</strong> (${locationDesc})
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div>
            <label class="field-label">사물함 번호</label>
            <input id="inpLockerNo" placeholder="예: 14번" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-weight:700;" required>
          </div>
          <div>
            <label class="field-label">사물함 비밀번호</label>
            <input id="inpPasscode" placeholder="예: 7294" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-weight:700;" required>
          </div>
        </div>

        <div style="margin-bottom:18px;">
          <label class="field-label">열람 잠금용 PIN 번호 (4~6자리)</label>
          <input id="inpPin" type="password" maxlength="6" placeholder="숫자 4~6자리" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-weight:700;text-align:center;letter-spacing:4px;" required>
          <small style="color:var(--text-muted);font-size:11px;display:block;margin-top:4px;">
            이 PIN으로 기기 내에서만 암호화되며, 다른 사람에게 노출되지 않습니다.
          </small>
        </div>

        <button type="submit" class="primary-btn" style="justify-content:center;">안전하게 저장하기</button>
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
      alert('비밀번호가 기기에 안전하게 저장되었습니다!');
      $('vaultDialog').close();
    };
  }

  $('vaultDialog').showModal();
};

$('closeVaultDialog').onclick = () => $('vaultDialog').close();
$('closeReceiptDialog').onclick = () => $('receiptDialog').close();
$('receiptDoneBtn').onclick = () => $('receiptDialog').close();

// 기획 명세 모달
$('openSpecBtn').onclick = () => $('specDialog').showModal();
$('closeSpecDialog').onclick = () => $('specDialog').close();

// -------------------------------------------------------------------
// 7. 검색 폼 제출 및 최적 결과 렌더링
// -------------------------------------------------------------------
$('plannerForm').onsubmit = async e => {
  e.preventDefault();
  const btn = document.querySelector('.search-button');
  if (btn.disabled) return;

  const regionVal = ($('regionDirectWrap')?.style.display !== 'none' && $('regionDirectInput')?.value.trim())
    ? $('regionDirectInput').value.trim()
    : $('regionSelect').value;

  const startVal = ($('startDirectWrap')?.style.display !== 'none' && $('startDirectInput')?.value.trim())
    ? $('startDirectInput').value.trim()
    : $('startSelect').value;

  const visitVal = ($('visitDirectWrap')?.style.display !== 'none' && $('visitDirectInput')?.value.trim())
    ? $('visitDirectInput').value.trim()
    : $('visitSelect').value;

  const endValRaw = ($('endDirectWrap')?.style.display !== 'none' && $('endDirectInput')?.value.trim())
    ? $('endDirectInput').value.trim()
    : $('endSelect').value;
  const endVal = (endValRaw === 'SAME_AS_START') ? startVal : endValRaw;

  let priorityVal = $('priority').value;
  if ($('priorityDirectWrap')?.style.display !== 'none' && $('priorityDirectInput')?.value.trim()) {
    const customP = $('priorityDirectInput').value.trim();
    if (customP.includes('짐') || customP.includes('도보') || customP.includes('무게')) {
      priorityVal = 'carry';
    } else {
      priorityVal = 'total';
    }
  }

  const sizeVal = document.querySelector('.size-btn.active').dataset.size;
  const depositVal = $('deposit').value;
  const pickupVal = $('pickup').value;

  if (currentMode === 'route' && new Date(pickupVal) <= new Date(depositVal)) {
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
    pickup: currentMode === 'route' ? pickupVal : null,
    ...(currentCoords ? { coords: currentCoords } : {})
  };

  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(q)
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error || '조회 실패');

    // 최근 경로 저장
    if (currentMode === 'route') {
      saveRecentRoute(startVal, visitVal, endVal);
    }

    $('emptyGuide').style.display = 'none';
    const displayResults = (d.results || []).slice(0, 7);
    resultLockers = displayResults;
    searchedOrigin = d.start;
    searchedMode = q.mode; searchedVisit = d.visit; searchedEnd = d.end;
    renderLockerMap();
    $('journeyGuide').style.display = 'none';
    $('resultsCount').textContent = displayResults.length;

    $('summary').style.display = 'block';
    $('summary').innerHTML = `
      <strong>${currentMode === 'near' ? esc(d.start.name) + '에서 가까운 보관함' : esc(d.start.name) + ' 출발 → ' + esc(d.visit?.name || '목적지') + ' 일정'}</strong>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">
        ${esc(d.note || '보관함 추천 결과입니다.')} ${d.excludedCount ? esc('실제 경로 확인 불가 '+d.excludedCount+'곳 제외') : ''}
      </div>
    `;

    $('cards').innerHTML = displayResults.length
      ? displayResults.map((l, index) => {
          const isBest = index === 0;
          return `
            <article class="locker-card ${isBest ? 'selected' : ''}">
              <div class="card-top">
                <div class="locker-badge-icon">${isBest ? '★' : (index + 1)}</div>
                <div class="card-title">
                  <div class="card-tags">
                    <span class="tag ${isBest ? 'recommend' : ''}">${isBest ? '추천 1위' : '#' + (index + 1)}</span>
                    <span class="tag">${l.location.includes('개찰구 안') ? '개찰구 안쪽' : '개찰구 밖 대합실'}</span>
                    <span class="tag" style="font-family:monospace;">${esc(l.id)}</span>
                  </div>
                  <h3>${esc(l.name)}</h3>
                  <p>${esc(l.location)}</p>
                </div>
              </div>

              ${l.routeVerified ? '<div class="verified-route">지하철·도보 실제 경로 확인 · 보관 없는 이동 '+l.baselineTotal+'분 대비 우회 +'+l.detourMinutes+'분 · 환승 합계 '+l.transfers+'회</div>' : ''}
              ${l.curfewWarning ? `
                <div class="curfew-box">
                  <span>🚨</span>
                  <span>${esc(l.curfewWarning)}</span>
                </div>
              ` : ''}

              <div class="metrics">
                <div class="metric">
                  <small>${currentMode === 'near' ? '예상 도보시간' : '전체 이동시간'}</small>
                  <strong>${formatMinutes(currentMode === 'near' ? l.walkMinutes : l.total)}</strong>
                  <small class="note">${currentMode === 'near' ? '직선거리 기반 추정 · 실제 경로와 다를 수 있어요' : '출발→보관→방문→회수→최종'}</small>
                </div>
                <div class="metric">
                  <small>${currentMode === 'near' ? '출발 위치와 거리' : '짐 들고 이동'}</small>
                  <strong style="color:var(--primary);">${currentMode === 'near' ? esc(l.km < 1 ? Math.round(l.km * 1000) + 'm' : l.km.toFixed(1) + 'km') : formatMinutes(l.carry)}</strong>
                  <small class="note">${currentMode === 'near' ? '직선거리 · 가까운 순' : '실제 짐 부담 시간'}</small>
                </div>
                <div class="metric">
                  <small>${l.asOf === '공공데이터 공식 설치수량 기준' ? '설치 칸수' : '이용 가능 칸수'}</small>
                  <strong>${esc(l.available === null ? '-' : l.available + '칸')}</strong>
                  <small class="note">${l.asOf === '공공데이터 공식 설치수량 기준' ? '실시간 빈칸 정보는 없어요' : '현장 상황과 다를 수 있어요'}</small>
                </div>
              </div>

              <div class="plan-b-card">
                <strong>만차 대비 대안:</strong> ${esc(l.planB?.name || '인근 보관소')} · ${esc(l.planB?.tip || '현장 안내')}
              </div>

              ${l.details?.length ? l.details.map(x => `
                <div style="font-size:12px;background:var(--surface-sub);padding:10px 14px;border-radius:8px;margin:8px 0;line-height:1.6;">
                  <strong>${esc(x.stlckKndNm)}</strong> · ${esc(x.utztnCrgExpln || '기본 요금')} (${esc(x.addCrgExpln || '')})<br>
                  <span style="color:var(--text-sub);font-size:11px;">규격: 가로 ${esc(x.stlckWdthLenExpln || '450mm')} × 높이 ${esc(x.stlckHgtExpln || '600mm')} × 깊이 ${esc(x.stlckDpthExpln || '500mm')}</span>
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

              <div class="result-actions"><button type="button" class="primary-btn directions-button" data-directions="${index}">${l.routeVerified ? '전체 지하철·회수 동선 보기' : '지도에서 길찾기'}</button>
                <button type="button" class="ticket-action-btn" onclick="openVaultModal('${esc(l.name)}', '${esc(l.location)}')">
                  🔒 번호·비밀번호 저장
                </button>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="empty"><h3>조회된 보관함이 없습니다.</h3></div>';
    document.querySelector('.results-area').scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (err) {
    $('formError').textContent = err.message;
    $('cards').innerHTML = `<div class="empty"><h3>검색 오류</h3><p>${esc(err.message)}</p></div>`;
  } finally {
    btn.disabled = false;
    $('searchText').textContent = (currentMode === 'route') ? '최적 보관함 추천받기' : '가까운 보관함 찾기';
  }
};

// -------------------------------------------------------------------
// 8. 초기 시스템 구동 (커스텀 드롭다운 및 직접 입력 토글 시스템)
// -------------------------------------------------------------------
initCustomDropdowns();
initDirectInputToggles();

setMode('near');
