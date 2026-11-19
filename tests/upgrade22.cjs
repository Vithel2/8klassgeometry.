const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:390,height:844}});
await context.addInitScript(()=>{window.__taps=0;window.AndroidTheme={setDarkMode(){},setIcon(){},haptic(){window.__taps++}}});
const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(process.env.BASE_URL||'http://127.0.0.1:8123');
const nav=async id=>p.click(`[data-nav="${id}"]`);
await p.click('#configure');assert.equal(await p.evaluate(()=>__taps),1);
assert.equal(await p.locator('#topic option[value="logic"]').count(),0);
await p.click('[data-count="100"]');await p.reload();await nav('practice');assert.equal(await p.locator('#questionCount').inputValue(),'100');
for(const bad of ['0','101','2.5','']){await p.fill('#questionCount',bad);await p.click('#go');assert.equal(await p.evaluate(()=>session),null);}
await p.fill('#questionCount','1');await p.selectOption('#mode','self');await p.selectOption('#topic','triangle');await p.click('#go');assert.equal(await p.evaluate(()=>session.questions.length),1);
await p.fill('#answer0',await p.evaluate(()=>String(session.questions[0].answer)));await p.click('#submit');await p.click('#next');assert.match(await p.locator('h1').textContent(),/1 из 1/);await p.click('#again');
await p.click('[data-count="100"]');await p.selectOption('#mode','self');await p.selectOption('#topic','triangle');await p.click('#go');assert.equal(await p.evaluate(()=>session.questions.length),100);
for(let i=0;i<100;i++){
 assert.equal(await p.evaluate(()=>session.index),i);
 if(i===55){await p.reload();assert.equal(await p.evaluate(()=>session.questions.length),100);assert.equal(await p.evaluate(()=>session.index),55);}
 await p.fill('#answer0',await p.evaluate(()=>String(session.questions[session.index].answer)));
 if(i===0)await p.fill('#solution','Основание умножить на высоту, разделить на два.');
 await p.click('#submit');await p.click('#next');
 if(i===4)assert.equal(await p.locator('progress').getAttribute('max'),'100');
}
assert.match(await p.locator('h1').textContent(),/100 из 100/);assert.equal(await p.evaluate(()=>store.history[0].answers.length),100);assert.equal(await p.evaluate(()=>store.total),101);
await p.reload();assert.equal(await p.evaluate(()=>store.history[0].score),100);await nav('home');await p.click('#history');await p.locator('[data-history]').first().click();await p.click('#repeat');assert.equal(await p.evaluate(()=>session.questions.length),100);await p.click('#exit');await p.click('#dialogYes');
await nav('settings');await p.click('[data-count="25"]');await p.uncheck('#haptic');await p.waitForTimeout(80);let taps=await p.evaluate(()=>__taps);await p.click('#testHaptic');assert.equal(await p.evaluate(()=>__taps),taps);
await p.check('#haptic');await p.waitForTimeout(80);taps=await p.evaluate(()=>__taps);await p.click('#testHaptic');assert.equal(await p.evaluate(()=>__taps),taps+1);
await p.uncheck('#motion');await nav('home');await p.waitForTimeout(80);assert.equal(await p.evaluate(()=>settings.questionCount),25);await p.click('#self');assert.equal(await p.evaluate(()=>session.questions.length),25);await p.click('#exit');await p.click('#dialogYes');await nav('settings');await p.check('#motion');await nav('home');
await p.waitForTimeout(600);const from=await p.locator('[data-nav="home"]').boundingBox(),to=await p.locator('[data-nav="formulas"]').boundingBox();await p.mouse.move(from.x+from.width/2,from.y+20);await p.mouse.down();await p.mouse.move(to.x+to.width/2,to.y+20,{steps:18});await p.mouse.up();await p.waitForTimeout(800);assert.equal(await p.locator('[data-nav="formulas"]').getAttribute('aria-current'),'page');assert.equal(await p.locator('.nav-lens').count(),1);assert.equal(await p.locator('[data-nav]').count(),5);
await p.emulateMedia({reducedMotion:'reduce'});await nav('lessons');assert.ok(await p.locator('.nav-lens').evaluate(el=>el.getAnimations().length===0));
await nav('settings');await p.selectOption('#theme','dark');await nav('home');await p.screenshot({path:'artifacts/home22-dark.png',fullPage:true});await p.emulateMedia({reducedMotion:'no-preference'});
await nav('settings');await p.selectOption('#theme','light');await nav('home');await p.screenshot({path:'artifacts/home22-light.png',fullPage:true});
for(const width of [320,390,768]){await p.setViewportSize({width,height:844});for(const tab of ['home','practice','settings']){await nav(tab);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width} ${tab}`);}}
const migrated=await browser.newContext();await migrated.addInitScript(()=>{localStorage.setItem('geometry8',JSON.stringify({seen:['rect','logic'],errors:[{topic:'logic'}],history:[{topic:'logic',questions:[{topic:'logic'}]}],total:7,correct:5,best:0}));localStorage.setItem('geometry8-active',JSON.stringify({topic:'logic',index:0,questions:[{topic:'logic'}]}));});const old=await migrated.newPage();await old.goto(process.env.BASE_URL||'http://127.0.0.1:8123');assert.deepEqual(await old.evaluate(()=>store.seen),['rect']);assert.equal(await old.evaluate(()=>store.errors.length),0);assert.equal(await old.evaluate(()=>store.history.length),0);assert.equal(await old.evaluate(()=>session),null);assert.equal(await old.evaluate(()=>localStorage.getItem('geometry8-active')),null);assert.ok(!(await old.locator('main').textContent()).includes('истинности'));
assert.deepEqual(errors,[]);await browser.close();console.log('Upgrade22 PASS: 1/100 bounds, full 100-answer session and reload, repeat, count persistence, click haptics on/off, drag capsule, reduced motion, removal of logic and 320–768px layouts.');
})().catch(e=>{console.error(e);process.exit(1)});
