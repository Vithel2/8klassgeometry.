/* Генератор хранит вместе условие, ответ и математический разбор. */
(function(root){
const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*100)/100).replace('.',',');
function makeQuestion(topic,random=Math.random){
 const n=(a,b)=>a+Math.floor(random()*(b-a+1));
 let q,answer,explain,unit='';const a=n(3,12),b=a+n(2,10),h=n(2,10);
 switch(topic){
 case 'rect':
  q=`Прямоугольник: стороны ${a} и ${b} см. Найди периметр.`;answer=2*(a+b);unit='см';explain=`P = 2(a + b) = 2 · (${a} + ${b}) = ${answer} см. Площадь считали бы умножением сторон.`;break;
 case 'para':
  q=`Параллелограмм: основание ${b} см, высота к нему ${h} см. Найди площадь.`;answer=b*h;unit='см²';explain=`S = a · h = ${b} · ${h} = ${answer} см². Не делим на 2: это не треугольник.`;break;
 case 'rhomb':
  q=`Диагонали ромба ${a} и ${b} см. Найди площадь.`;answer=a*b/2;unit='см²';explain=`S = d₁ · d₂ / 2 = ${a} · ${b} / 2 = ${fmt(answer)} см². Не забудь деление на 2.`;break;
 case 'trap':
  q=`Основания трапеции ${a} и ${b} см, высота ${h} см. Найди площадь.`;answer=(a+b)*h/2;unit='см²';explain=`Средняя линия m = (${a} + ${b}) / 2 = ${fmt((a+b)/2)} см. S = m · h = ${fmt(answer)} см².`;break;
 case 'segments':{
  const type=n(0,2);
  if(type===0){q=`Основания трапеции ${a} и ${b} см. Одна диагональ делит среднюю линию на два отрезка. Найди больший.`;answer=b/2;explain=`Больший отрезок = половина большего основания: ${b} / 2 = ${fmt(answer)} см. Вся средняя линия равна ${fmt((a+b)/2)} см.`;}
  else if(type===1){q=`Основания трапеции ${a} и ${b} см. Найди отрезок средней линии МЕЖДУ ДВУМЯ диагоналями.`;answer=(b-a)/2;explain=`Для двух диагоналей берём полуразность оснований: (${b} − ${a}) / 2 = ${fmt(answer)} см.`;}
  else{q=`Основания трапеции ${a} и ${b} см. Найди ВСЮ среднюю линию.`;answer=(a+b)/2;explain=`m = (a + b) / 2 = (${a} + ${b}) / 2 = ${fmt(answer)} см.`;}unit='см';break;
 }
 case 'triangle':
  q=`У треугольника основание ${b} см, высота к нему ${h} см. Найди площадь.`;answer=b*h/2;unit='см²';explain=`S = a · h / 2 = ${b} · ${h} / 2 = ${fmt(answer)} см².`;break;
 case 'heights':{
  const x=n(2,5),y=x+n(1,3),k=n(2,5);const short=x*5,long=y*5,H=x*k;
  q=`Стороны треугольника ${short} и ${long} см. Высота к стороне ${long} см равна ${H} см. Найди высоту к стороне ${short} см.`;
  answer=y*k;unit='см';explain=`Одна площадь: ${long} · ${H} / 2 = ${long*H/2} см². Искомая высота: 2S / ${short} = ${long} · ${H} / ${short} = ${answer} см. К меньшей стороне высота больше.`;break;
 }
 case 'angles':{
  const v=n(4,14)*10;q=`Один угол параллелограмма ${v}°. Чему равен СОСЕДНИЙ угол?`;answer=180-v;unit='°';explain=`Соседние углы дают 180°: 180 − ${v} = ${answer}°. Противоположный угол равен ${v}°.`;break;
 }
 default: throw new Error('Unknown topic: '+topic);
 }
 const values=new Set([answer]);
 for(const v of [answer*2,answer/2,answer+2,answer+5,Math.abs(answer-3),answer+10]){if(v>0)values.add(v);if(values.size===4)break;}
 const options=Array.from(values);
 for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]];}
 return {topic,q,answer,explain,unit,options};
}
function calculate(type,a,b,h){
 if(![a,b].every(x=>Number.isFinite(x)&&x>0)||!Number.isFinite(h)||h<=0)throw new Error('Введи положительные числа.');
 switch(type){case 'triangle':return a*b/2;case 'rect':return a*b;case 'rhomb':return a*b/2;case 'trap':return (a+b)*h/2;case 'heights':return a*h/b;default:throw new Error('Неизвестная формула');}
}
root.Geometry={makeQuestion,fmt,calculate};
if(typeof module!=='undefined')module.exports=root.Geometry;
})(typeof window!=='undefined'?window:globalThis);
