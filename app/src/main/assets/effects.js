/* One moving capsule reveals the accent colour, like the supplied reference. */
(()=>{
 const rail=document.querySelector('nav'),tabs=[...rail.querySelectorAll('[data-nav]')];
 const lens=document.createElement('div'),track=document.createElement('div');
 lens.className='nav-lens';lens.setAttribute('aria-hidden','true');track.className='lens-track';lens.append(track);rail.prepend(lens);
 const mirrors=tabs.map(b=>{const c=b.cloneNode(true);c.removeAttribute('data-nav');c.removeAttribute('aria-current');c.className='lens-tab';c.disabled=true;c.tabIndex=-1;track.append(c);return c;});
 let x=0,target=0,width=0,v=0,frame=0,last=0,gesture=null,suppress=false,lastHaptic=-1000,selected=-1;
 const reduced=()=>!settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function tap(){if(performance.now()-lastHaptic<55)return;lastHaptic=performance.now();vibrate();}
 function paint(stretch=1){lens.style.width=width+'px';lens.style.transform=`translate3d(${x}px,0,0) scaleX(${stretch})`;track.style.transform=`translate3d(${-x}px,0,0) scaleX(${1/stretch})`;lens.style.setProperty('--glint',(50+Math.max(-35,Math.min(35,v)))+'%');}
 function step(t){if(reduced()){x=target;v=0;frame=0;paint();return;}const dt=Math.min((t-last)/16.67||1,2);last=t;v+=(target-x)*.115*dt;v*=Math.pow(.68,dt);x+=v*dt;paint(1+Math.min(Math.abs(v)*.008,.17));if(Math.abs(target-x)>.04||Math.abs(v)>.04)frame=requestAnimationFrame(step);else{x=target;v=0;frame=0;paint();}}
 function aim(to){target=to;if(reduced()){cancelAnimationFrame(frame);frame=0;x=target;v=0;paint();}else if(!frame){last=performance.now();frame=requestAnimationFrame(step);}}
 window.syncGlass=()=>{const b=tabs.find(b=>b.classList.contains('active'))||tabs[0];const i=tabs.indexOf(b);if(i!==selected){selected=i;if(!reduced())mirrors[i].querySelector('svg').animate([{transform:'scale(.7)'},{transform:'scale(1.13)',offset:.65},{transform:'scale(1)'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});}width=b.offsetWidth;track.style.width=rail.clientWidth+'px';mirrors.forEach((m,i)=>{m.style.left=tabs[i].offsetLeft+'px';m.style.top=(tabs[i].offsetTop-6)+'px';m.style.width=tabs[i].offsetWidth+'px';m.style.height=tabs[i].offsetHeight+'px';});aim(b.offsetLeft);};
 new MutationObserver(records=>{if(records.some(r=>tabs.includes(r.target)))window.syncGlass();}).observe(rail,{subtree:true,attributes:true,attributeFilter:['class']});
 new ResizeObserver(()=>window.syncGlass()).observe(rail);
 rail.addEventListener('pointerdown',e=>{if(e.button!==0||!e.target.closest('[data-nav]'))return;gesture={id:e.pointerId,start:e.clientX,origin:x,moved:false,index:tabs.findIndex(b=>b.classList.contains('active'))};});
 rail.addEventListener('pointermove',e=>{if(!gesture||e.pointerId!==gesture.id)return;const dx=e.clientX-gesture.start;if(Math.abs(dx)>6&&!gesture.moved){gesture.moved=true;rail.setPointerCapture(e.pointerId);}if(gesture.moved){e.preventDefault();aim(Math.max(tabs[0].offsetLeft,Math.min(tabs.at(-1).offsetLeft,gesture.origin+dx)));const i=tabs.reduce((best,b,j)=>Math.abs(b.offsetLeft-target)<Math.abs(tabs[best].offsetLeft-target)?j:best,0);if(i!==gesture.index){tap();gesture.index=i;}}});
 function end(e,cancel){if(!gesture||e.pointerId!==gesture.id)return;const g=gesture;gesture=null;if(rail.hasPointerCapture(e.pointerId))rail.releasePointerCapture(e.pointerId);if(g.moved){suppress=true;setTimeout(()=>suppress=false,0);if(!cancel)navigate(tabs[g.index].dataset.nav);}window.syncGlass();}
 rail.addEventListener('pointerup',e=>end(e,false));rail.addEventListener('pointercancel',e=>end(e,true));rail.addEventListener('click',e=>{if(suppress){e.preventDefault();e.stopImmediatePropagation();}},true);
 const release=b=>{if(!b)return;b.classList.remove('is-pressed');if(!reduced()&&b.isConnected&&!rail.contains(b))b.animate([{transform:'scale(.955)'},{transform:'scale(1.025)',offset:.55},{transform:'scale(1)'}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)'});};
 let pressed=null;
 document.addEventListener('pointerdown',e=>{const b=e.target.closest('button');if(!b||b.disabled||e.button!==0)return;tap();pressed=b;if(reduced()||rail.contains(b))return;const r=b.getBoundingClientRect();b.style.setProperty('--touch-x',(e.clientX-r.left)+'px');b.style.setProperty('--touch-y',(e.clientY-r.top)+'px');b.classList.add('is-pressed');},true);
 document.addEventListener('pointerup',()=>{release(pressed);pressed=null;},true);
 document.addEventListener('pointercancel',()=>{pressed?.classList.remove('is-pressed');pressed=null;},true);
 window.addEventListener('blur',()=>{pressed?.classList.remove('is-pressed');pressed=null;});
 document.addEventListener('click',e=>{if(e.detail===0&&e.isTrusted){const b=e.target.closest('button');if(b&&!b.disabled){tap();release(b);}}},true);
 window.syncGlass();
})();
