/* A single glass lens follows taps and horizontal drags with a damped spring. */
(()=>{
 const rail=document.querySelector('nav'),tabs=[...rail.querySelectorAll('[data-nav]')];
 const lens=document.createElement('div');lens.className='glass-lens';lens.setAttribute('aria-hidden','true');rail.prepend(lens);
 let x=0,target=0,width=0,velocity=0,frame=0,last=0,gesture=null,suppressClick=false;
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function paint(stretch=1){lens.style.width=width+'px';lens.style.transform=`translate3d(${x}px,0,0) scale(${stretch},${1-(stretch-1)*.4})`;lens.style.setProperty('--glint',Math.min(90,Math.max(10,50+velocity*2))+'%');}
 function step(now){const dt=Math.min((now-last)/16.67||1,2);last=now;velocity+=(target-x)*.12*dt;velocity*=Math.pow(.66,dt);x+=velocity*dt;paint(1+Math.min(Math.abs(velocity)*.007,.13));if(Math.abs(target-x)>.05||Math.abs(velocity)>.05)frame=requestAnimationFrame(step);else{x=target;velocity=0;frame=0;paint();}}
 function aim(value){target=value;if(reduced()){cancelAnimationFrame(frame);frame=0;x=target;velocity=0;paint();}else if(!frame){last=performance.now();frame=requestAnimationFrame(step);}}
 function position(tab){return tab.offsetLeft;}
 window.syncGlass=()=>{const active=tabs.find(b=>b.classList.contains('active'))||tabs[0];width=active.offsetWidth;tabs.forEach(b=>b.setAttribute('aria-current',b===active?'page':'false'));aim(position(active));};
 rail.addEventListener('pointerdown',e=>{if(e.button!==0)return;const tab=e.target.closest('[data-nav]');if(!tab)return;gesture={id:e.pointerId,start:e.clientX,origin:x,moved:false};});
 rail.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const delta=e.clientX-gesture.start;if(Math.abs(delta)>6&&!gesture.moved){gesture.moved=true;rail.setPointerCapture(e.pointerId);rail.classList.add('dragging');}if(gesture.moved){e.preventDefault();aim(Math.max(position(tabs[0]),Math.min(position(tabs.at(-1)),gesture.origin+delta)));}});
 function end(e,cancelled){if(!gesture||e.pointerId!==gesture.id)return;const dragged=gesture.moved;gesture=null;rail.classList.remove('dragging');if(rail.hasPointerCapture(e.pointerId))rail.releasePointerCapture(e.pointerId);if(dragged){suppressClick=true;setTimeout(()=>suppressClick=false,0);if(!cancelled){const tab=tabs.reduce((a,b)=>Math.abs(position(a)-target)<Math.abs(position(b)-target)?a:b);nav(tab.dataset.nav);}}window.syncGlass();}
 rail.addEventListener('pointerup',e=>end(e,false));rail.addEventListener('pointercancel',e=>end(e,true));
 rail.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 new ResizeObserver(()=>window.syncGlass()).observe(rail);window.syncGlass();
})();
