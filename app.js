const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

const rail=$('#rail');
const scrim=$('#scrim');
function menu(open){
  if(!rail||!scrim) return;
  rail.classList.toggle('open',open);
  scrim.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
}
$('#menuOpen')?.addEventListener('click',()=>menu(true));
$('#menuClose')?.addEventListener('click',()=>menu(false));
scrim?.addEventListener('click',()=>menu(false));
$$('.rail nav a').forEach(link=>link.addEventListener('click',()=>menu(false)));

function setClock(){
  const clock=$('#clock');
  if(!clock) return;
  const time=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/New_York',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).format(new Date());
  clock.textContent=`${time} ET`;
}
setClock();
setInterval(setClock,1000);

const toast=$('#toast');
let toastTimer;
function notify(message){
  if(!toast) return;
  toast.textContent=message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.remove('show'),2500);
}


$$('details').forEach(item=>item.addEventListener('toggle',()=>{
  if(item.open) $$('details').filter(other=>other!==item).forEach(other=>other.open=false);
}));

$$('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
  $$('[data-preview]').forEach(item=>item.classList.toggle('active',item===button));
  const preview=$('#mintPreview');
  if(preview) preview.src=button.dataset.preview;
}));

const canvas=$('#swarm');
if(canvas){
  const ctx=canvas.getContext('2d');
  let width=0,height=0,dpr=1,nodes=[],wave=0;
  const mouse={x:0,y:0,active:false};

  function spawnAt(nx,ny,energized=false){
    const scale=energized?1.5:.45+Math.random()*.85;
    nodes.push({x:nx*width,y:ny*height,vx:(Math.random()-.5)*.18,vy:(Math.random()-.5)*.18,s:scale,phase:Math.random()*6.28,role:Math.floor(Math.random()*4),energy:energized?1:Math.random()*.35});
  }
  function resize(){
    const box=canvas.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,2);
    width=box.width;height=box.height;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    if(!nodes.length) for(let i=0;i<34;i++) spawnAt(.35+Math.random()*.65,Math.random());
  }
  function organism(node){
    const unit=3.5*node.s,x=Math.round(node.x/unit)*unit,y=Math.round(node.y/unit)*unit;
    ctx.save();ctx.translate(x,y);ctx.globalAlpha=.5+node.energy*.5;ctx.fillStyle='#f2f4eb';
    const rect=(a,b,c,d)=>ctx.fillRect(Math.round(a*unit),Math.round(b*unit),Math.round(c*unit),Math.round(d*unit));
    if(node.role===0){rect(-3,-3,6,6);rect(-4,-2,1,3);rect(3,-2,1,3);rect(-2,3,1,2);rect(1,3,1,2)}
    else if(node.role===1){rect(-3,-3,6,6);rect(-5,-1,2,2);rect(3,-1,2,2);rect(-1,-5,2,2);rect(-1,3,2,2)}
    else if(node.role===2){rect(-3,-4,6,7);rect(-4,-1,1,2);rect(3,-1,1,2);rect(-3,3,2,1);rect(1,3,2,1);rect(-2,-5,1,1);rect(1,-5,1,1)}
    else{rect(-3,-3,6,6);rect(-5,-2,2,4);rect(3,-2,2,4);rect(-2,3,1,2);rect(1,3,1,2);rect(-1,-5,2,2)}
    ctx.fillStyle='#070806';rect(-2,-2,4,4);ctx.fillStyle='#c6f700';rect(-1.35,-.6,.7,.8);rect(.65,-.6,.7,.8);
    if(node.energy>.55){ctx.strokeStyle=`rgba(198,247,0,${node.energy*.5})`;ctx.lineWidth=1;ctx.strokeRect(-5*unit,-5*unit,10*unit,10*unit)}
    ctx.restore();
  }
  function emitPulse(){
    wave=1;nodes.forEach((node,index)=>setTimeout(()=>node.energy=1,index*12));
    const state=$('#swarmState');if(state) state.textContent='PULSING';
    setTimeout(()=>{if(state) state.textContent='CONCEPT SIMULATION'},1300);
  }
  function addSignal(){
    const feed=$('#feed');if(!feed) return;
    const messages=['NEIGHBOR SIGNAL DETECTED','MEMORY CANDIDATE COMPARED','MINORITY SIGNAL PRESERVED','CLUSTER PATTERN FORMED'];
    const row=document.createElement('div');
    row.innerHTML=`<time>SIM</time><b>LOCAL SIGNAL</b><p>${messages[Math.floor(Math.random()*messages.length)]}</p><span>TEST</span>`;
    feed.prepend(row);while(feed.children.length>4) feed.lastElementChild.remove();
    notify('CONCEPT SIGNAL INJECTED');
  }
  function frame(){
    ctx.clearRect(0,0,width,height);
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i];a.phase+=.006;a.x+=a.vx+Math.sin(a.phase)*.018;a.y+=a.vy+Math.cos(a.phase*.8)*.018;
      if(mouse.active){const dx=mouse.x-a.x,dy=mouse.y-a.y,dist=Math.hypot(dx,dy)||1;if(dist<190){a.vx+=dx/dist*.0015;a.vy+=dy/dist*.0015}}
      a.vx*=.998;a.vy*=.998;if(a.x<-50)a.x=width+45;if(a.x>width+50)a.x=-45;if(a.y<-50)a.y=height+45;if(a.y>height+50)a.y=-45;a.energy*=.997;
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j],dx=b.x-a.x,dy=b.y-a.y,distance=Math.hypot(dx,dy);
        if(distance<145){const alpha=(1-distance/145)*(.08+(a.energy+b.energy)*.12);ctx.strokeStyle=`rgba(198,247,0,${alpha})`;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(distance<72){a.vx-=dx*.000001;b.vx+=dx*.000001}}
      }
    }
    nodes.forEach(organism);
    if(wave>0){ctx.strokeStyle=`rgba(198,247,0,${wave*.5})`;ctx.lineWidth=1;ctx.strokeRect(width/2-width*(1-wave)/2,height/2-height*(1-wave)/2,width*(1-wave),height*(1-wave));wave-=.018}
    requestAnimationFrame(frame);
  }

  $('#feedPulse')?.addEventListener('click',()=>{addSignal();emitPulse()});
  $('#pulseBtn')?.addEventListener('click',()=>{addSignal();emitPulse()});
  canvas.addEventListener('pointermove',event=>{const box=canvas.getBoundingClientRect();mouse.x=event.clientX-box.left;mouse.y=event.clientY-box.top;mouse.active=true});
  canvas.addEventListener('pointerleave',()=>mouse.active=false);
  canvas.addEventListener('click',event=>{const box=canvas.getBoundingClientRect();spawnAt((event.clientX-box.left)/box.width,(event.clientY-box.top)/box.height,true);emitPulse()});
  new ResizeObserver(resize).observe(canvas);requestAnimationFrame(frame);
}

if(location.hash==='#mint') setTimeout(()=>document.querySelector('#mint')?.scrollIntoView(),500);

