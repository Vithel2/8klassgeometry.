const { test } = require("node:test"),
  assert = require("node:assert/strict");
const G = require("../app/src/main/assets/questions.js"),
  E = require("../app/src/main/assets/engine.js"),
  L = require("../app/src/main/assets/content.js");
let seed = 78491;
const r = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
test("All 24 topics: finite results, distinct options, consistent answer and feasible heights", () => {
  assert.equal(L.length, 24);
  for (const l of L)
    for (let i = 0; i < 300; i++) {
      const q = E.question(l.id, r, true);
      assert.ok(q.q && q.explain);
      assert.equal(new Set(q.options).size, ["logic","notebook"].includes(l.id)&&q.answer===0||l.id==="logic" ? 2 : 4);
      if (typeof q.answer === "string") {
        assert.ok(q.options.includes(q.answer));
        continue;
      }
      assert.ok(q.fields.length);
      for (const f of q.fields) {
        assert.ok(Number.isFinite(f.answer) && (f.answer > 0 || (["logic","notebook"].includes(l.id) && f.answer === 0)));
        assert.ok(E.matches(String(f.answer), f.answer));
        assert.ok(E.matches(f.answer.toFixed(2).replace(".", ","), f.answer));
      }
      assert.ok(q.options.some((x) => E.matches(String(x), q.answer)));
      if (l.id === "heights") {
        const v = q.q.match(/\d+/g).map(Number);
        assert.ok(v[3] <= v[0], q.q);
        assert.ok(q.answer <= v[1], q.q);
        assert.equal(q.answer, (v[2] * v[3]) / v[0]);
      }
      if (l.id === "constructions") {
        const v = q.q.match(/\d+/g).map(Number);
        assert.equal(q.answer, v[0] - 2 * v[1]);
        assert.ok(v[0] > 2 * v[1]);
      }
    }
});
test("Notebook: all exact answers and distinctions", () => {
  assert.equal(E.evaluate("15*22/2"), 165);
  assert.equal(E.evaluate("6*14/2"), 42);
  assert.equal(E.evaluate("104/4"), 26);
  assert.equal(E.evaluate("104-104/4"), 78);
  assert.equal(E.evaluate("15-5-5"), 5);
  assert.equal(E.evaluate("35*20/2"), 350);
  assert.equal(E.evaluate("2*350/25"), 28);
  assert.equal(E.evaluate("(3+17)/2"), 10);
  assert.equal(E.evaluate("3/2"), 1.5);
  assert.equal(E.evaluate("17/2"), 8.5);
  assert.equal(E.evaluate("(17-3)/2"), 7);
  const text = L.map((x) => x.example).join(" ");
  for (const v of ["165", "42", "104", "78", "350", "28", "8,5"])
    assert.ok(text.includes(v));
});
test("Pythagoras, roots, rounding, parser rejects code and invalid arithmetic", () => {
  assert.equal(E.evaluate("√(3²+4²)"), 5);
  assert.equal(E.evaluate("√(13²-5²)"), 12);
  assert.equal(E.evaluate("√(10²-6²)"), 8);
  assert.equal(E.evaluate("(2,5+1.5)*2²"), 16);
  assert.equal(E.evaluate("-2²"), -4);
  assert.equal(E.evaluate("sqrt(9)+2"), 5);
  assert.ok(E.matches("√(2)", Math.sqrt(2)));
  assert.ok(E.matches("1,41", Math.sqrt(2)));
  assert.ok(!E.matches("1.4", Math.sqrt(2)));
  for (const [s, msg] of [
    ["1/0", "Деление"],
    ["√(-4)", "Отрицательное"],
    ["1+", "Неверное"],
    ["(1+2", "скобка"],
    ["globalThis.x=1", "Неверное"],
  ])
    assert.throws(() => E.evaluate(s), new RegExp(msg));
});
test("New numbers on repeat", () => {
  for (const id of L.filter((l) => l.id !== "properties").map((l) => l.id)) {
    assert.ok(
      new Set(Array.from({ length: 30 }, () => E.question(id, r).q)).size > 1,
      id,
    );
  }
});

test("Independently recompute every generated numeric answer", () => {
  for (const l of L.filter((l) => l.id !== "properties"))
    for (let i = 0; i < 200; i++) {
      const q = E.question(l.id, r),
        v = q.q
          .match(/\d+(?:[.,]\d+)?/g)
          .map((x) => Number(x.replace(",", ".")));
      let expected;
      switch (l.id) {
        case "notebook":
          expected = q.q.includes('Существуют') ? 0 : q.q.startsWith('Гипотенуза') ? Math.sqrt(v[0]**2-v[1]**2) : Math.hypot(v[0],v[1]); break;
        case "hypheight": expected=v[0]*Math.sqrt(v[1]**2-v[0]**2)/v[1]; break;
        case "cosine": expected=v[1]/v[0];break;
        case "logic": expected=q.q.includes('¬A ∨ ¬B')?Number(!v[0]||!v[1]):q.q.includes('A ∧ B')?Number(v[0]&&v[1]):q.q.includes('A ∨ B')?Number(v[0]||v[1]):1-v[0];break;
        case "rect":
          expected = 2 * (v[0] + v[1]);
          break;
        case "para":
          expected = v[0] * v[1];
          break;
        case "rhomb":
        case "triangle":
        case "rightarea":
          expected = (v[0] * v[1]) / 2;
          break;
        case "trap":
          expected = ((v[0] + v[1]) * v[2]) / 2;
          break;
        case "heights":
          expected = (v[1] * v[3]) / v[0];
          break;
        case "constructions":
          expected = v[0] - 2 * v[1];
          break;
        case "angles":
          expected = 180 - v[0];
          break;
        case "segments":
          expected = q.q.includes("МЕЖДУ")
            ? (v[1] - v[0]) / 2
            : q.q.includes("ВСЮ")
              ? (v[0] + v[1]) / 2
              : v[1] / 2;
          break;
        case "part":
          expected = v[0] * 0.75;
          break;
        case "pythc":
        case "diagonal":
          expected = Math.sqrt(v[0] ** 2 + v[1] ** 2);
          break;
        case "pytha":
        case "pythb":
          expected = Math.sqrt(v[0] ** 2 - v[1] ** 2);
          break;
        case "triangles":
          expected = (180 - v[0]) / 2;
          break;
        case "midtriangle":
          expected = v[0] / 2;
          break;
        case "similar":
          expected = v[1] * v[0] ** 2;
          break;
        case "units":
          expected = v[0] * 10000;
          break;
        default:
          throw Error(l.id);
      }
      assert.ok(
        Math.abs(expected - q.answer) < 1e-9,
        q.q + " " + expected + " != " + q.answer,
      );
    }
});
test('New notebook examples: exact roots, height, area, impossible triangle and logic',()=>{
 const examples=[Math.sqrt(232),29,4,Math.sqrt(72),0];
 examples.forEach((expected,i)=>{let calls=0;const q=E.question('notebook',()=>calls++<3?0:(i+.1)/5);assert.ok(Math.abs(q.answer-expected)<1e-12);assert.ok(q.options.some(v=>E.matches(String(v),expected)));});
 const height=E.question('hypheight',()=>0,true);
 assert.deepEqual(height.fields.map(f=>f.answer),[300/13,60,750]);
 assert.ok(E.matches('1500/65',height.answer));assert.ok(E.matches('23,08',height.answer));assert.ok(!E.matches('23',height.answer));
 assert.ok(E.matches('2*√(58)',Math.sqrt(232)));assert.ok(E.matches('6*√(2)',Math.sqrt(72)));
 for(let A=0;A<2;A++)for(let B=0;B<2;B++)for(let op=0;op<4;op++){
  const seq=[0,0,0,(A+.1)/2,(B+.1)/2,(op+.1)/4];let i=0;
  const q=E.question('logic',()=>seq[i++]);assert.equal(q.answer,[Number(!A||!B),A&B,A|B,1-A][op]);assert.deepEqual(q.options,[0,1]);
 }
});
