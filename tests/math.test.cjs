const {test}=require('node:test');const assert=require('node:assert/strict');
const G=require('../app/src/main/assets/questions.js');const lessons=require('../app/src/main/assets/content.js');
let seed=78491;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
test('All 8 lesson topics generate valid, unique choices with exactly one answer',()=>{
 assert.equal(lessons.length,8);
 for(const l of lessons)for(let i=0;i<200;i++){
  const q=G.makeQuestion(l.id,random);assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);assert.equal(q.options.filter(x=>x===q.answer).length,1);assert.ok(q.options.every(x=>Number.isFinite(x)&&x>0));assert.ok(q.explain.length>30);
  const v=q.q.match(/\d+/g).map(Number);let expected;
  switch(l.id){case 'rect':expected=2*(v[0]+v[1]);break;case 'para':expected=v[0]*v[1];break;case 'rhomb':case 'triangle':expected=v[0]*v[1]/2;break;case 'trap':expected=(v[0]+v[1])*v[2]/2;break;case 'heights':expected=v[2]*v[3]/v[0];break;case 'angles':expected=180-v[0];break;case 'segments':expected=q.q.includes('МЕЖДУ')?(v[1]-v[0])/2:q.q.includes('ВСЮ')?(v[1]+v[0])/2:v[1]/2;}
  assert.equal(q.answer,expected,q.q);
 }
});
test('Notebook examples and invalid calculator input',()=>{
 assert.equal(G.calculate('triangle',35,20,1),350);assert.equal(G.calculate('heights',35,25,20),28);assert.equal(G.calculate('heights',30,20,15),22.5);assert.equal(G.calculate('trap',6,18,4),48);assert.equal(G.calculate('rhomb',6,10,1),30);for(const bad of [0,-2,NaN,Infinity])assert.throws(()=>G.calculate('rect',bad,4,1));assert.equal(G.fmt(8.5),'8,5');
});
