const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8123');
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/home.png',fullPage:true});
assert.equal(await page.locator('h1').first().textContent(),'Геометрия — понятно.');
await page.click('#properties');assert.equal(await page.locator('table').count(),1);assert.match(await page.locator('h1').textContent(),/Свойства фигур/);await page.click('[data-nav="home"]');
await page.click('#newLesson');assert.equal(await page.locator('h1').textContent(),'Равнобедренная трапеция · как в тетради');
assert.match(await page.locator('.formula').textContent(),/15 − 5 − 5 = 5/);
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/lesson.png',fullPage:true});
await page.click('#learned');await page.reload();await page.click('[data-nav="lessons"]');assert.equal(await page.locator('.lesson').count(),10);assert.match(await page.locator('[data-lesson="constructions"]').textContent(),/✓/);
await page.click('#theme');await page.reload();assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/dark.png',fullPage:true});
await page.click('[data-nav="practice"]');await page.selectOption('#topic','constructions');await page.click('#go');
for(let i=0;i<5;i++){const answer=await page.evaluate(()=>session.questions[session.index].answer);const options=await page.evaluate(()=>session.questions[session.index].options);await page.click(`[data-answer="${options.indexOf(answer)}"]`);await page.click('#next');}
assert.match(await page.locator('h1').textContent(),/5 из 5/);
// Reproduce the Android failure: a missing dialog handler used to return false.
await page.evaluate(()=>window.confirm=()=>false);
for(const answered of [false,true]){await page.click('[data-nav="practice"]');await page.click('#go');if(answered)await page.locator('[data-answer]').first().click();const before=await page.evaluate(()=>store.total);await page.click('#exit');assert.equal(await page.locator('#go').count(),1);assert.equal(await page.evaluate(()=>session),null);assert.equal(await page.evaluate(()=>store.total),before);}
await page.click('#exam');await page.click('[data-nav="home"]');assert.equal(await page.locator('#start').count(),1);assert.equal(await page.evaluate(()=>clock),null);
await page.click('[data-nav="practice"]');await page.click('#go');assert.equal(await page.evaluate(()=>window.handleAndroidBack()),true);assert.equal(await page.locator('#go').count(),1);
await page.selectOption('#topic','properties');await page.click('#go');assert.match(await page.locator('.answer').first().textContent(),/[А-Яа-я]/);assert.ok(!(await page.locator('main').textContent()).includes('NaN'));await page.click('#exit');
await page.click('[data-nav="home"]');await page.waitForTimeout(500);
const first=await page.locator('[data-nav="home"]').boundingBox(),last=await page.locator('[data-nav="formulas"]').boundingBox();
await page.mouse.move(first.x+first.width/2,first.y+20);await page.mouse.down();await page.mouse.move(last.x+last.width/2,last.y+20,{steps:14});await page.mouse.up();await page.waitForTimeout(700);
assert.equal(await page.locator('[data-nav="formulas"]').getAttribute('aria-current'),'page');
const lens=await page.locator('.glass-lens').boundingBox();assert.ok(Math.abs(lens.x-last.x)<3);assert.equal(await page.locator('.glass-lens').count(),1);
await page.click('[data-nav="formulas"]');await page.selectOption('#calcType','trap');await page.fill('#ca','5');await page.fill('#cb','15');await page.fill('#ch','5');await page.click('#calc');assert.match(await page.locator('#result').textContent(),/= 50/);
await page.click('[data-nav="home"]');await page.click('#exam');
for(let i=0;i<10;i++){await page.locator('[data-answer]').first().click();await page.click('#next');}assert.match(await page.locator('h1').textContent(),/из 10/);
await page.emulateMedia({reducedMotion:'reduce'});await page.click('[data-nav="lessons"]');assert.equal(await page.locator('.lesson').first().evaluate(e=>getComputedStyle(e).animationName),'none');
for(const width of [320,390,768]){await page.setViewportSize({width,height:844});for(const tab of ['home','lessons','practice','formulas']){await page.click(`[data-nav="${tab}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${tab}`);}}
assert.deepEqual(errors,[]);await browser.close();console.log('UI passed: navigation, new lesson, progress/theme persistence, practice, exam, calculator, reduced motion, 320–768px layouts.');
})().catch(e=>{console.error(e);process.exit(1)});
