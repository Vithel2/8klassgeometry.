const {test}=require('node:test');const assert=require('node:assert/strict');
const G=require('../app/src/main/assets/questions.js');const lessons=require('../app/src/main/assets/content.js');
let seed=78491;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
test('All 10 lesson topics generate valid, unique choices with exactly one answer',()=>{
 assert.equal(lessons.length,10);
 for(const l of lessons)for(let i=0;i<200;i++){
  const q=G.makeQuestion(l.id,random);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(x=>x===q.answer).length,1);assert.ok(q.options.every(x=>typeof x==='string'?x.length>0:Number.isFinite(x)&&x>0));assert.ok(q.explain.length>30);
  if(l.id==='properties'){assert.equal(G.fmt(q.answer),q.answer);continue;}
  const v=q.q.match(/\d+/g).map(Number);let expected;
  switch(l.id){case 'rect':expected=2*(v[0]+v[1]);break;case 'para':expected=v[0]*v[1];break;case 'rhomb':case 'triangle':expected=v[0]*v[1]/2;break;case 'trap':expected=(v[0]+v[1])*v[2]/2;break;case 'heights':expected=v[2]*v[3]/v[0];break;case 'constructions':expected=q.q.includes('большее основание')?v[0]-2*v[1]:v[0]*3/4;break;case 'angles':expected=180-v[0];break;case 'segments':expected=q.q.includes('МЕЖДУ')?(v[1]-v[0])/2:q.q.includes('ВСЮ')?(v[1]+v[0])/2:v[1]/2;}
  assert.equal(q.answer,expected,q.q);
 }
});
test('Notebook examples and invalid calculator input',()=>{
 assert.equal(G.calculate('triangle',35,20,1),350);assert.equal(G.calculate('heights',35,25,20),28);assert.equal(G.calculate('heights',30,20,15),22.5);assert.equal(G.calculate('trap',6,18,4),48);assert.equal(G.calculate('rhomb',6,10,1),30);for(const bad of [0,-2,NaN,Infinity])assert.throws(()=>G.calculate('rect',bad,4,1));assert.equal(G.fmt(8.5),'8,5');
});
test('Notebook practice stays on the exact 15 / 5 / 45 example',()=>{
 const steps=G.notebookPractice();assert.deepEqual(steps.map(q=>q.answer),[45,5,10,5,5]);
 for(const q of steps){assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(q.answer));assert.ok(!q.explain.includes('√'));}
 for(let i=0;i<100;i++){const q=G.makeQuestion('constructions');assert.equal(q.answer,5);assert.match(q.q,/15 см/);assert.match(q.q,/высота 5 см/);assert.match(q.q,/45°/);assert.ok(!q.q.includes('DAEC'));}
});
test('Every property question has a readable unique correct option',()=>{
 const expected=['Прямоугольник, квадрат и равнобедренная трапеция','Ромб и квадрат','Прямоугольник и квадрат','Параллелограмм, прямоугольник, ромб и квадрат','Два основания','Перпендикулярны и делятся пополам','Боковые стороны и диагонали попарно равны','Квадрат'];
 expected.forEach((answer,i)=>{const q=G.propertyQuestion(i);assert.equal(q.answer,answer);assert.equal(new Set(q.options).size,4);assert.ok(q.options.includes(answer));assert.equal(G.fmt(answer),answer);});
});
