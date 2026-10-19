const sports = document.querySelectorAll('.sport');
const summarySport = document.getElementById('summarySport');
const summaryDate = document.getElementById('summaryDate');
const summaryTime = document.getElementById('summaryTime');
const summaryCourt = document.getElementById('summaryCourt');
const summaryPrice = document.getElementById('summaryPrice');
const dateRow = document.getElementById('dateRow');
const slotsBox = document.getElementById('slots');
const monthLabel = document.getElementById('monthLabel');
const confirmBtn = document.getElementById('confirmBtn');
const modal = document.getElementById('bookingModal');
const toast = document.getElementById('toast');
const today = new Date(); today.setHours(0,0,0,0);
let weekOffset = 0, selectedDate = null, selectedTime = null;
const ptDay = ['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const times = ['07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
function formatDate(d){return new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'2-digit',month:'long'}).format(d).replace(/^./,c=>c.toUpperCase())}
function resetTime(){selectedTime=null;summaryTime.textContent='Selecione um horário';summaryCourt.textContent='A definir';summaryPrice.textContent='—';confirmBtn.disabled=true}
function renderDates(){
  dateRow.innerHTML=''; const start=new Date(today); start.setDate(today.getDate()+weekOffset*7);
  monthLabel.textContent=`${monthNames[start.getMonth()]} ${start.getFullYear()}`;
  for(let i=0;i<7;i++){const d=new Date(start);d.setDate(start.getDate()+i);const btn=document.createElement('button');btn.className='date-btn'+(i===0&&weekOffset===0?' today':'')+(selectedDate&&d.toDateString()===selectedDate.toDateString()?' selected':'');btn.innerHTML=`<span>${ptDay[d.getDay()]}</span><strong>${String(d.getDate()).padStart(2,'0')}</strong>`;btn.onclick=()=>{selectedDate=d;summaryDate.textContent=formatDate(d);resetTime();renderDates();renderSlots()};dateRow.appendChild(btn)}
}
function renderSlots(){
  slotsBox.innerHTML=''; const daySeed=selectedDate?selectedDate.getDate():today.getDate();
  times.forEach((time,i)=>{const btn=document.createElement('button');const busy=(i+daySeed)%5===0;btn.className='slot'+(busy?' busy':'')+(selectedTime===time?' selected':'');btn.textContent=time;btn.disabled=busy;btn.onclick=()=>{if(!selectedDate){selectedDate=new Date(today);summaryDate.textContent=formatDate(selectedDate);renderDates()}selectedTime=time;summaryTime.textContent=`${time} às ${String(Number(time.slice(0,2))+1).padStart(2,'0')}:00`;const court=(i%3)+1;summaryCourt.textContent=`Quadra ${court}`;summaryPrice.textContent=(Number(time.slice(0,2))>=17?'R$ 90':'R$ 70');confirmBtn.disabled=false;renderSlots()};slotsBox.appendChild(btn)})
}
sports.forEach(btn=>btn.addEventListener('click',()=>{sports.forEach(b=>b.classList.remove('active'));btn.classList.add('active');summarySport.textContent=btn.dataset.sport;showToast(`${btn.dataset.sport} selecionado`)}));
document.getElementById('changeSport').onclick=()=>document.getElementById('modalidades').scrollIntoView({behavior:'smooth'});
document.getElementById('prevWeek').onclick=()=>{if(weekOffset>0){weekOffset--;selectedDate=null;resetTime();renderDates();renderSlots()}};
document.getElementById('nextWeek').onclick=()=>{weekOffset++;selectedDate=null;resetTime();renderDates();renderSlots()};
confirmBtn.onclick=()=>{document.getElementById('modalDetails').textContent=`${summarySport.textContent} · ${summaryDate.textContent} · ${summaryTime.textContent} · ${summaryCourt.textContent}`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.getElementById('customerName').focus()};
function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true')}
document.querySelector('.modal-close').onclick=closeModal;document.querySelector('.modal-backdrop').onclick=closeModal;document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
document.getElementById('finishBtn').onclick=()=>{const name=document.getElementById('customerName').value.trim();const text=`Olá! ${name?`Meu nome é ${name}. `:''}Gostaria de confirmar: ${summarySport.textContent}, ${summaryDate.textContent}, ${summaryTime.textContent}, ${summaryCourt.textContent}.`;window.open(`https://wa.me/5500000000000?text=${encodeURIComponent(text)}`,'_blank')};
document.querySelector('.menu-btn').onclick=function(){const header=document.querySelector('.topbar');header.classList.toggle('menu-open');this.setAttribute('aria-expanded',header.classList.contains('menu-open'))};
renderDates();renderSlots();
