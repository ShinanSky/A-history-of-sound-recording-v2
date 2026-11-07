'use strict';
(() => {
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const pages=$$('.page'), book=$('#book'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0, busy=false, photoIndex=0, tapeSeconds=0, tapeSide='A', tapeRunning=false;
const safeStore={get:k=>{try{return localStorage.getItem(k)}catch{return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}};
const setText=(id,t)=>{$(id).textContent=t};
function updateNav(){
 setText('#pageNumber',String(current+1).padStart(2,'0'));setText('#pageTitle',pages[current].dataset.title);
 $('#prevButton').disabled=current===0;$('#nextButton').disabled=current===pages.length-1;
 $$('#pageDots button').forEach((b,i)=>{b.setAttribute('aria-current',String(i===current));b.title=`${i+1} / ${pages[i].dataset.title}`});
 $$('#contentsList button').forEach((b,i)=>b.setAttribute('aria-current',String(i===current)));
 setText('#pageAnnouncement',`第 ${current+1} 页，共 ${pages.length} 页：${pages[current].dataset.title}`);
}
async function go(target){
 if(busy||target<0||target>=pages.length||target===current)return;
 busy=true; const old=pages[current], next=pages[target], direction=target>current?1:-1;
 if(old.contains(document.activeElement))document.activeElement.blur();
 next.scrollTop=0;next.inert=false;next.classList.add('entering');old.inert=true;
 if(!reduced.matches){
  old.classList.add('leaving');book.classList.add('turning');
  const options={duration:820,easing:'cubic-bezier(.25,.65,.2,1)',fill:'both'};
  const a=old.animate([{opacity:1,transform:'translateX(0) rotateY(0deg)',transformOrigin:direction>0?'left center':'right center',filter:'brightness(1)'},{opacity:0,transform:`translateX(${-direction*10}%) rotateY(${-direction*23}deg)`,transformOrigin:direction>0?'left center':'right center',filter:'brightness(.88)'}],options);
  const b=next.animate([{opacity:0,transform:`translateX(${direction*14}%) rotateY(${direction*13}deg)`,transformOrigin:direction>0?'right center':'left center'},{opacity:1,transform:'translateX(0) rotateY(0deg)',transformOrigin:direction>0?'right center':'left center'}],options);
  await Promise.all([a.finished,b.finished]).catch(()=>{});a.cancel();b.cancel();
 }
 old.classList.remove('active','leaving');next.classList.remove('entering');next.classList.add('active');current=target;book.classList.remove('turning');busy=false;updateNav();
 history.replaceState(null,'',`#page-${current+1}`);
}
pages.forEach((p,i)=>{
 const b=document.createElement('button');b.setAttribute('aria-label',`第 ${i+1} 页：${p.dataset.title}`);b.addEventListener('click',()=>go(i));$('#pageDots').append(b);
 const item=document.createElement('button');const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');item.append(n,document.createTextNode(p.dataset.title));item.addEventListener('click',()=>{$('#contentsDialog').close();go(i)});$('#contentsList').append(item);
});
$('#prevButton').onclick=()=>go(current-1);$('#nextButton').onclick=()=>go(current+1);
$('#startButton').onclick=()=>go(1);$('#restartButton').onclick=()=>go(0);$('#home').onclick=()=>go(0);
function showDialog(id){const d=$(id);if(!d.open)d.showModal();d.scrollTop=0}
$('#menuToggle').onclick=()=>showDialog('#contentsDialog');$('#musicToggle').onclick=()=>showDialog('#audioDialog');
$$('dialog').forEach(d=>{d.querySelector('.close-dialog').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}});d.addEventListener('close',()=>{$('#menuToggle').setAttribute('aria-expanded','false');$('#musicToggle').setAttribute('aria-expanded','false')});});
$('#contentsDialog').addEventListener('toggle',e=>$('#menuToggle').setAttribute('aria-expanded',String(e.newState==='open')));
$('#audioDialog').addEventListener('toggle',e=>$('#musicToggle').setAttribute('aria-expanded',String(e.newState==='open')));
const anyDialog=()=>!!document.querySelector('dialog[open]');
document.addEventListener('keydown',e=>{
 if(anyDialog()){if($('#galleryDialog').open&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setPhoto(photoIndex+(e.key==='ArrowRight'?1:-1))}return}
 if(e.target.closest('input,textarea,[role=tablist]'))return;
 if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(current+1)}
 if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(current-1)}
 if(e.key==='Home'){e.preventDefault();go(0)}if(e.key==='End'){e.preventDefault();go(pages.length-1)}
});
let touchStart=null;
book.addEventListener('touchstart',e=>{if(e.target.closest('button,input,label')||anyDialog())return;const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY,at:Date.now(),scroll:pages[current].scrollTop}}, {passive:true});
book.addEventListener('touchend',e=>{if(!touchStart)return;const s=touchStart;touchStart=null;const t=e.changedTouches[0],dx=t.clientX-s.x,dy=t.clientY-s.y,p=pages[current];if(Date.now()-s.at>700)return;
 if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.4){go(current+(dx<0?1:-1));return}
 const overflow=p.scrollHeight>p.clientHeight+8;
 if(!overflow&&Math.abs(dy)>70&&Math.abs(dy)>Math.abs(dx)*1.4)go(current+(dy<0?1:-1));
}, {passive:true});
$$('[data-read]').forEach(b=>b.onclick=()=>{
 const c=archiveContent[b.dataset.read];setText('#readingEyebrow',c.eyebrow);setText('#readingTitle',c.title);$('#readingBody').replaceChildren();
 c.paragraphs.forEach(t=>{const p=document.createElement('p');p.textContent=t;$('#readingBody').append(p)});
 if(c.exhibit){const h=document.createElement('h3');h.textContent=`展品介绍 · ${c.exhibit}`;const p=document.createElement('p');p.textContent=c.exhibitText;$('#readingBody').append(h,p)}
 if(c.note){const n=document.createElement('aside');n.textContent=c.note;$('#readingBody').append(n)}
 if(b.dataset.read==='meter'){const b2=document.createElement('button');b2.className='pill outline';b2.textContent='查看馆藏仪表照片 ↗';b2.onclick=()=>{$('#readingDialog').close();setPhoto(2);showDialog('#galleryDialog')};$('#readingBody').append(b2)}
 showDialog('#readingDialog');
});
function setPhoto(i){photoIndex=(i+archivePhotos.length)%archivePhotos.length;const p=archivePhotos[photoIndex];$('#galleryImage').src=`assets/${p.file}.jpg`;$('#galleryImage').alt=p.title;setText('#galleryTitle',p.title);setText('#galleryCaption',p.caption);setText('#galleryCount',`${String(photoIndex+1).padStart(2,'0')} / 07`)}
$$('[data-photo]').forEach(b=>b.onclick=()=>{setPhoto(Number(b.dataset.photo));showDialog('#galleryDialog')});$('#galleryButton').onclick=()=>{setPhoto(0);showDialog('#galleryDialog')};$('#photoPrev').onclick=()=>setPhoto(photoIndex-1);$('#photoNext').onclick=()=>setPhoto(photoIndex+1);
$('#needleButton').onclick=()=>{const on=$('.groove-stage').classList.toggle('is-playing');$('#needleButton').setAttribute('aria-pressed',String(on));$('#needleButton').innerHTML=on?'<span>Ⅱ</span> 抬起唱针':'<span>▶</span> 放下唱针';setText('#needleStatus',on?'唱针循迹 · 沟槽带动振动':'亲手开启聆听的仪式')};
for(let i=0;i<=30;i++){const angle=(-156+i*4.4)*Math.PI/180,x1=210+180*Math.cos(angle),y1=207+180*Math.sin(angle),x2=210+(i%5===0?166:172)*Math.cos(angle),y2=207+(i%5===0?166:172)*Math.sin(angle);const l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);$('#meterTicks').append(l)}
$('#levelInput').addEventListener('input',e=>setText('#levelOutput',`${e.target.value}%`));
let visualFrame=0;
function visualLoop(t){if(current===3){const base=Number($('#levelInput').value);const sway=reduced.matches?0:Math.sin(t*.004)*3+Math.sin(t*.009)*1.5;$('#vuNeedle').style.transform=`rotate(${-18+(base/100)*100+sway}deg)`}if(current===5&&!reduced.matches&&visualFrame++%3===0)drawMix(t*.0008);requestAnimationFrame(visualLoop)}requestAnimationFrame(visualLoop);
$('#tapePlay').onclick=()=>{tapeRunning=!tapeRunning;$('.tape-stage').classList.toggle('running',tapeRunning);$('#tapePlay').setAttribute('aria-pressed',String(tapeRunning));setText('#tapePlay',tapeRunning?'Ⅱ 暂停运转':'▶ 运转磁带')};
$('#flipTape').onclick=async()=>{const cassette=$('#cassette');$('#flipTape').disabled=true;const a=cassette.animate([{transform:'rotateY(0deg)'},{transform:'rotateY(90deg)'}],{duration:reduced.matches?1:220,fill:'forwards'});await a.finished;tapeSide=tapeSide==='A'?'B':'A';setText('#sideLabel',tapeSide);setText('#tapeSong',tapeSide==='A'?'把声音，带在身边。':'让记忆，继续流转。');setText('#flipTape',`翻转至 ${tapeSide==='A'?'B':'A'} 面 ↻`);setText('#tapeMessage',tapeSide==='A'?'A 面 · 记录与携带 / 轻薄的磁带，承载连续的模拟信号。':'B 面 · 剪辑与流转 / 转动的带轴，让声音沿时间线展开。');tapeSeconds=0;setText('#tapeTime','00:00');a.cancel();await cassette.animate([{transform:'rotateY(-90deg)'},{transform:'rotateY(0deg)'}],{duration:reduced.matches?1:220}).finished;$('#flipTape').disabled=false};
setInterval(()=>{if(!tapeRunning||current!==4||document.hidden)return;tapeSeconds++;setText('#tapeTime',`${String(Math.floor(tapeSeconds/60)).padStart(2,'0')}:${String(tapeSeconds%60).padStart(2,'0')}`)},1000);
function drawMix(phase=0){const values=[1,2,3].map(i=>Number($(`#fader${i}`).value)/100);let d='';for(let x=0;x<=480;x+=3){const y=67.5+Math.sin(x*.023+phase)*values[0]*27+Math.sin(x*.069+phase*1.2)*values[1]*18+Math.sin(x*.16+phase*.7)*values[2]*9;d+=`${x===0?'M':'L'}${x},${y.toFixed(2)}`;}$('#mixWave').setAttribute('d',d);setText('#mixReadout',`${Math.round(values.reduce((a,b)=>a+b,0)/3*100)}%`)}
$$('.channel input').forEach(input=>input.addEventListener('input',()=>{input.nextElementSibling.textContent=input.value;drawMix()}));drawMix();
const nodes=[['01 / 编码','声音，变成一串数字。','采样与量化把连续的声波表示为离散数据。声音不再只与某一张唱片或某一盘磁带绑定。'],['02 / 存储','云的背后，仍有实体。','服务器与存储设备承载数据，光纤连接远方，电力与冷却维持运转。可见的介质隐退，物质基础依然存在。'],['03 / 唤醒','一次点击，重新遇见回声。','算法帮助查找，网络完成传输，终端把数据还原为可聆听的声音。随时唤醒的记忆，依赖整条技术链路。']];
$$('[data-node]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.node);$$('[data-node]').forEach((n,j)=>{n.classList.toggle('selected',i===j);n.setAttribute('aria-pressed',String(i===j))});setText('#nodeNumber',nodes[i][0]);setText('#nodeTitle',nodes[i][1]);setText('#nodeText',nodes[i][2])});
const eras=[['◎','触摸 / 占有 / 磨损','声音，住在手中的物件里。','沟槽的深浅、唱针的触碰、唱片的划痕，共同构成有重量的听觉记忆。保存声音，也意味着照料一件实体。'],['▣','磁化 / 携带 / 剪辑','一份记忆，开始轻盈流动。','磁粉记录信号，轻薄的带身缩小了声音的行囊。剪辑与复制扩展传播，实体仍然存在，却更便于携带。'],['✧','编码 / 共享 / 依赖','触不可及，却又随时在场。','文件可以跨越设备与空间，聆听从占有一件物品，走向访问一段数据。记忆更易共享，也依赖平台、网络与基础设施。']];
function changeEra(i,focus=false){$$('[data-era-tab]').forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;if(i===j&&focus)b.focus()});$('#eraPanel').setAttribute('aria-labelledby',`era-tab-${i}`);['#eraSymbol','#eraKeyword','#eraHeading','#eraText'].forEach((id,j)=>setText(id,eras[i][j]));if(!reduced.matches)$('#eraPanel').animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:300})}
$$('[data-era-tab]').forEach(b=>{b.onclick=()=>changeEra(Number(b.dataset.eraTab));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=Number(b.dataset.eraTab);changeEra(e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3,true)}})});
const audio=$('#backgroundAudio');let audioReady=false,localURL=null;
const savedVolume=Number(safeStore.get('sound-archive-volume')??35);audio.volume=Number.isFinite(savedVolume)?Math.max(0,Math.min(1,savedVolume/100)):.35;$('#volumeInput').value=audio.volume*100;setText('#volumeOutput',`${Math.round(audio.volume*100)}%`);
function audioUI(){const playing=!audio.paused;document.body.classList.toggle('music-on',playing);setText('#audioPlay',playing?'Ⅱ 暂停音乐':'▶ 播放音乐');setText('#musicLabel',playing?'音乐播放中':'背景音乐');$('#audioPlay').setAttribute('aria-pressed',String(playing));safeStore.set('sound-archive-music',playing?'on':'off')}
$('#audioPlay').onclick=async()=>{if(!audioReady)return;if(audio.paused){try{await audio.play();setText('#audioStatus','背景音乐将伴随整部展册循环播放。')}catch{setText('#audioStatus','暂时无法播放，请重新选择可用的音频文件。')}}else audio.pause();audioUI()};
audio.addEventListener('play',audioUI);audio.addEventListener('pause',audioUI);audio.addEventListener('error',()=>{audioReady=false;$('#audioPlay').disabled=true;setText('#audioStatus','音频无法载入，请选择可用的本地音频。');audioUI()});
$('#volumeInput').addEventListener('input',e=>{audio.volume=e.target.value/100;setText('#volumeOutput',`${e.target.value}%`);safeStore.set('sound-archive-volume',e.target.value)});
$('#audioFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;audio.pause();if(localURL)URL.revokeObjectURL(localURL);localURL=URL.createObjectURL(f);audio.src=localURL;audioReady=true;$('#audioPlay').disabled=false;setText('#audioStatus',`已选择：${f.name}。此音频仅用于本次浏览。`);try{await audio.play()}catch{setText('#audioStatus','音频已选择，点击“播放音乐”开始。')}audioUI()});
// A stable root filename lets a later audio.mp3 drop-in work without any code changes.
if(location.protocol!=='file:')fetch('audio.mp3',{method:'HEAD',cache:'no-store'}).then(r=>{const type=r.headers.get('content-type')||'';if(r.ok&&!type.includes('text/html')){audio.src='audio.mp3';audioReady=true;$('#audioPlay').disabled=false;setText('#audioStatus','背景音乐已就绪，点击播放后将贯穿所有页面。')}}).catch(()=>{});
const hashMatch=location.hash.match(/^#page-(\d+)$/);if(hashMatch){const n=Number(hashMatch[1])-1;if(n>=0&&n<pages.length){pages[0].classList.remove('active');pages[0].inert=true;current=n;pages[current].classList.add('active');pages[current].inert=false}}updateNav();
})();
