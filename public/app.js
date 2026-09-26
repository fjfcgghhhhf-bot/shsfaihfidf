const $=id=>document.getElementById(id);let identity=null,state=null,connected=false,pending=false,shownCode=null;
const events=new EventSource('/events');
events.addEventListener('identity',e=>{identity=JSON.parse(e.data).id;connected=true;pending=false;$('connection').textContent='Связь установлена';});
events.onerror=()=>{connected=false;$('connection').textContent='Восстанавливаем связь…';$('pulse').disabled=true;};
events.onmessage=e=>{state=JSON.parse(e.data);render();};
function render(){const s=state;const member=s.playing;const active=s.phase==='active';const count=Math.max(1,Math.ceil((s.signal-s.now)/1000));
 $('stage').textContent=s.round?'ЭТАП '+String(s.round).padStart(2,'0')+' / 06':'ОЖИДАНИЕ ЭКИПАЖА';$('position').textContent=member?'ВЫ / '+String(s.slot).padStart(2,'0'):'НА СВЯЗИ / '+s.online;
 document.querySelectorAll('.steps i').forEach((el,i)=>el.classList.toggle('done',s.phase==='won'||i<s.round-1));
 $('pulse').disabled=!connected||!member||s.pressed||pending||!['active','countdown'].includes(s.phase);$('pulse').classList.toggle('ready',active&&member&&!s.pressed);
 let label='ОЖИДАНИЕ',dial=s.crew+'<span>/5</span>',help='ИГРОКОВ НА СВЯЗИ',title=s.message,detail='Игра начнётся автоматически, когда подключатся пятеро.';
 if(s.phase==='countdown'){label='ПРИГОТОВЬТЕСЬ';dial=count;help='ДО ОБЩЕГО СИГНАЛА';detail='Раннее нажатие сбросит все этапы.';}
 if(active){label=s.pressed?'ПРИНЯТО':'СИГНАЛ';dial=s.pressed?'✓':'ЖМИ';help=s.hits+' / 5 НАЖАЛИ';title=s.pressed?'Ждём остальных':'Нажмите сейчас';detail='Все пятеро должны нажать с разницей не больше секунды.';}
 if(s.phase==='failed'){label='СБОЙ';dial='↺';help='ПРОГРЕСС СБРОШЕН';detail='Новая попытка через '+Math.max(0,Math.ceil((s.deadline-s.now)/1000))+' сек.';}
 if(s.phase==='won'){label='ГОТОВО';dial='6<span>/6</span>';help='ЭТАПОВ ПРОЙДЕНО';detail=(s.code?'Ваш код ниже. Успейте сохранить его.':member?'В этот раз коды получили другие участники.':'Экипаж завершил игру.')+' Новая игра через '+Math.max(0,Math.ceil((s.deadline-s.now)/1000))+' сек.';}
 if(!member&&s.phase!=='waiting'){title='Следующий экипаж';detail='Игра уже идёт. Вы автоматически присоединитесь, когда освободится место.';}
 $('button-label').textContent=label;$('dial').innerHTML=dial;$('button-help').textContent=help;$('status').textContent=title;$('detail').textContent=detail;
 $('reward').hidden=!s.code;$('code').textContent=s.code||'';if(shownCode!==s.code){shownCode=s.code;$('copy-status').textContent='';}
 $('crew').innerHTML=Array.from({length:5},(_,i)=>'<span class="'+(i<s.crew?'online':'')+'">'+String(i+1).padStart(2,'0')+'</span>').join('');
}
async function press(){if(!state||$('pulse').disabled)return;pending=true;render();try{const response=await fetch('/press',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:identity,round:state.round})});if(!response.ok)throw Error();}catch{$('connection').textContent='Нажатие не отправлено. Попробуйте ещё раз.';}finally{pending=false;render();}}
$('pulse').addEventListener('click',press);
$('copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.code);$('copy-status').textContent='Код скопирован';}catch{$('copy-status').textContent='Выделите код и скопируйте вручную.';}});
