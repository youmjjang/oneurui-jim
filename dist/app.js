const $=id=>document.getElementById(id);
function mode(value){const route=value==='route';$('routeFields').hidden=!route;$('priorityField').hidden=!route;for(const [id,on] of [['nearTab',!route],['routeTab',route]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-selected',String(on));}$('searchText').textContent=route?'내 일정에 맞는 보관함 찾기':'가까운 보관함 찾기';$('modeTitle').textContent=route?'찾으러 갈 때까지, 편하게.':'일단, 짐부터 내려놓을까요?';$('modeDescription').textContent=route?'방문과 짐 회수 동선을 함께 비교해요.':'출발지에서 가까운 보관함을 비교해요.';}
$('nearTab').onclick=()=>mode('near');$('routeTab').onclick=()=>mode('route');
document.querySelectorAll('[data-size]').forEach(b=>b.onclick=()=>document.querySelectorAll('[data-size]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));}));
$('plannerForm').onsubmit=e=>{e.preventDefault();$('formError').textContent='보관함 데이터와 경로 검색을 연결 중이에요. 연결 후 검색할 수 있어요.';};
$('sizeHelp').onclick=()=>{$('formError').textContent='보관함별 실제 규격은 데이터 연결 후 안내해요.';};
$('compareButton').hidden=true;document.querySelector('.sort-row').hidden=true;
$('resultCaption').textContent='';$('cards').innerHTML='<div class="empty"><h3>보관함 정보를 준비하고 있어요</h3><p>공공데이터 연결 후 실제 보관함을 안내할게요.</p></div>';
const local=d=>new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);const now=new Date();$('deposit').value=local(now);$('pickup').value=local(new Date(now.getTime()+2*3600000));mode('near');
