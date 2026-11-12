const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:2});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:8123');
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/home.png',fullPage:true});
assert.equal(await page.locator('h1').first().textContent(),'Геометрия — понятно.');
await page.click('#newLesson');assert.equal(await page.locator('h1').textContent(),'Вспомогательные построения');
assert.equal(await page.locator('text=5,25 см²').count(),1);
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/lesson.png',fullPage:true});
await page.click('#learned');await page.reload();await page.click('[data-nav="lessons"]');assert.equal(await page.locator('.lesson').count(),9);assert.match(await page.locator('[data-lesson="constructions"]').textContent(),/✓/);
await page.click('#theme');await page.reload();assert.ok(await page.locator('body').evaluate(el=>el.classList.contains('dark')));
await page.waitForTimeout(450);await page.screenshot({path:'artifacts/dark.png',fullPage:true});
await page.click('[data-nav="practice"]');await page.selectOption('#topic','constructions');await page.click('#go');
for(let i=0;i<5;i++){const answer=await page.evaluate(()=>session.questions[session.index].answer);const options=await page.evaluate(()=>session.questions[session.index].options);await page.click(`[data-answer="${options.indexOf(answer)}"]`);await page.click('#next');}
assert.match(await page.locator('h1').textContent(),/5 из 5/);
await page.click('[data-nav="formulas"]');await page.selectOption('#calcType','trap');await page.fill('#ca','5');await page.fill('#cb','15');await page.fill('#ch','5');await page.click('#calc');assert.match(await page.locator('#result').textContent(),/= 50/);
await page.click('[data-nav="home"]');await page.click('#exam');
for(let i=0;i<10;i++){await page.locator('[data-answer]').first().click();await page.click('#next');}assert.match(await page.locator('h1').textContent(),/из 10/);
await page.emulateMedia({reducedMotion:'reduce'});await page.click('[data-nav="lessons"]');assert.equal(await page.locator('.lesson').first().evaluate(e=>getComputedStyle(e).animationName),'none');
for(const width of [320,390,768]){await page.setViewportSize({width,height:844});for(const tab of ['home','lessons','practice','formulas']){await page.click(`[data-nav="${tab}"]`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width} ${tab}`);}}
assert.deepEqual(errors,[]);await browser.close();console.log('UI passed: navigation, new lesson, progress/theme persistence, practice, exam, calculator, reduced motion, 320–768px layouts.');
})().catch(e=>{console.error(e);process.exit(1)});
