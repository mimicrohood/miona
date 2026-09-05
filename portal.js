const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

const page=document.body.dataset.page;
$$('[data-page]').forEach(link=>{
  if(link.dataset.page===page) link.classList.add('active');
});

const menuButton=$('#menuButton');
const nav=$('#siteNav');
if(menuButton&&nav){
  menuButton.addEventListener('click',()=>{
    const open=nav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded',String(open));
  });
}

function setClock(){
  const clock=$('#clock');
  if(!clock) return;
  const time=new Intl.DateTimeFormat('en-US',{
    timeZone:'America/New_York',
    hour:'2-digit',
    minute:'2-digit',
    second:'2-digit',
    hourCycle:'h23'
  }).format(new Date());
  clock.textContent=`${time} ET`;
}
setClock();
setInterval(setClock,1000);


$('.accordion-trigger').forEach(trigger=>{
  trigger.addEventListener('click',()=>{
    const panel=document.getElementById(trigger.getAttribute('aria-controls'));
    const expanded=trigger.getAttribute('aria-expanded')==='true';
    trigger.setAttribute('aria-expanded',String(!expanded));
    if(panel) panel.hidden=expanded;
  });
});

const fieldGrid=$('#fieldGrid');
if(fieldGrid){
  const TOTAL=4096;
  const PAGE_SIZE=24;
  const roles=['OBSERVER','BUILDER','CRITIC','KEEPER'];
  const bodies=['COMPACT','TALL','WIDE','STACKED','ROUND','ARMORED','SPLIT','CORE'];
  const search=$('#fieldSearch');
  const prev=$('#fieldPrev');
  const next=$('#fieldNext');
  const jump=$('#fieldJump');
  const pageLabel=$('#fieldPages');
  const pageStatus=$('#fieldPageStatus');
  const countLabel=$('#fieldCount');
  const roleButtons=$$('[data-role]');
  const initialPage=Number.parseInt(new URLSearchParams(location.search).get('page')||'1',10);
  let currentPage=Number.isFinite(initialPage)&&initialPage>0?initialPage:1;
  let activeRole='ALL';

  const pad=id=>String(id).padStart(4,'0');
  const roleFor=id=>roles[(id*7)%roles.length];
  const bodyFor=id=>bodies[((id-1)>>3)&7];

  function matchingIds(){
    const query=(search?.value||'').trim().replace(/^#/, '');
    const numeric=/^\d+$/.test(query)?query:'';
    return Array.from({length:TOTAL},(_,index)=>index+1).filter(id=>{
      const roleMatch=activeRole==='ALL'||roleFor(id)===activeRole;
      const searchMatch=!query||(numeric?String(id).includes(numeric):roleFor(id).includes(query.toUpperCase())||bodyFor(id).includes(query.toUpperCase()));
      return roleMatch&&searchMatch;
    });
  }

  function render(){
    const ids=matchingIds();
    const pageCount=Math.max(1,Math.ceil(ids.length/PAGE_SIZE));
    currentPage=Math.min(Math.max(1,currentPage),pageCount);
    const visible=ids.slice((currentPage-1)*PAGE_SIZE,currentPage*PAGE_SIZE);

    fieldGrid.innerHTML=visible.length?visible.map(id=>{
      const number=pad(id);
      return `<a class="life-tile" href="collection/images/${number}.svg" target="_blank" rel="noopener" aria-label="Open MIONA #${number}">
        <div class="tile-art"><img src="collection/images/${number}.svg" alt="MIONA #${number}" loading="lazy"></div>
        <div class="tile-copy"><strong>MIONA #${number}</strong><span>${roleFor(id)} · ${bodyFor(id)}</span></div>
      </a>`;
    }).join(''):'<p class="empty-field">NO MATCHING NFTS</p>';

    if(pageLabel) pageLabel.textContent=`${currentPage} / ${pageCount}`;
    if(pageStatus) pageStatus.textContent=`PAGE ${currentPage} / ${pageCount}`;
    if(countLabel) countLabel.textContent=`${ids.length.toLocaleString('en-US')} NFTS`;
    if(jump){jump.value=String(currentPage);jump.max=String(pageCount);}
    if(prev) prev.disabled=currentPage<=1;
    if(next) next.disabled=currentPage>=pageCount;

    const url=new URL(location.href);
    if(currentPage===1) url.searchParams.delete('page');
    else url.searchParams.set('page',String(currentPage));
    history.replaceState(null,'',url);
  }

  prev?.addEventListener('click',()=>{currentPage--;render();fieldGrid.scrollIntoView({behavior:'smooth',block:'start'});});
  next?.addEventListener('click',()=>{currentPage++;render();fieldGrid.scrollIntoView({behavior:'smooth',block:'start'});});
  jump?.addEventListener('change',()=>{currentPage=Number.parseInt(jump.value||'1',10)||1;render();fieldGrid.scrollIntoView({behavior:'smooth',block:'start'});});
  search?.addEventListener('input',()=>{currentPage=1;render();});
  roleButtons.forEach(button=>button.addEventListener('click',()=>{
    activeRole=button.dataset.role||'ALL';
    currentPage=1;
    roleButtons.forEach(item=>item.classList.toggle('active',item===button));
    render();
  }));

  render();
}



