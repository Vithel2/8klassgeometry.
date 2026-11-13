/* Safe recursive descent arithmetic. No dynamic code execution. */
(function (root) {
  function evaluate(source) {
    const s = String(source)
      .replace(/,/g, ".")
      .replace(/[×·]/g, "*")
      .replace(/[−–]/g, "-")
      .replace(/÷/g, "/")
      .replace(/²/g, "^2")
      .replace(/sqrt/gi, "√")
      .replace(/\s/g, "");
    let i = 0;
    if (s.length > 240) throw Error("Слишком длинное выражение");
    const eat = (c) => (s[i] === c ? (i++, true) : false);
    function expression() {
      let v = term();
      while (i < s.length) {
        if (eat("+")) v += term();
        else if (eat("-")) v -= term();
        else break;
      }
      return v;
    }
    function term() {
      let v = unary();
      while (i < s.length) {
        if (eat("*")) v *= unary();
        else if (eat("/")) {
          const d = unary();
          if (d === 0) throw Error("Деление на ноль");
          v /= d;
        } else break;
      }
      return v;
    }
    function unary() {
      if (eat("+")) return unary();
      if (eat("-")) return -unary();
      return power();
    }
    function power() {
      let v = atom();
      if (eat("^")) v = Math.pow(v, unary());
      return v;
    }
    function atom() {
      if (eat("√")) {
        const v = atom();
        if (v < 0) throw Error("Отрицательное число под корнем");
        return Math.sqrt(v);
      }
      if (eat("(")) {
        const v = expression();
        if (!eat(")")) throw Error("Не закрыта скобка");
        return v;
      }
      const m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
      if (!m) throw Error("Неверное выражение");
      i += m[0].length;
      return Number(m[0]);
    }
    if (!s) throw Error("Введи выражение");
    const v = expression();
    if (i !== s.length || !Number.isFinite(v))
      throw Error("Неверное выражение");
    return v;
  }
  const old =
    root.Geometry ||
    (typeof require !== "undefined" ? require("./questions.js") : {});
  const n = (a, b, r) => a + Math.floor(r() * (b - a + 1));
  function question(topic, r = Math.random, hard = false) {
    let q,
      answer,
      explain,
      unit = "см",
      fields;
    const a = n(3, 12, r),
      b = n(4, 15, r),
      k = n(2, 5, r);
    switch (topic) {
      case "rightarea":
        q = `Катеты прямоугольного треугольника ${a} и ${b} см. Найди площадь.`;
        answer = (a * b) / 2;
        unit = "см²";
        explain = `Катеты перпендикулярны, поэтому это основание и высота. S = ${a} · ${b} / 2 = ${old.fmt(answer)} см². Проверка: удвоенная площадь ${a * b}.`;
        break;
      case "part": {
        const S = n(10, 50, r) * 4;
        q = `ABCD — параллелограмм площадью ${S} см². E — середина AB. Найди площадь трапеции DAEC.`;
        answer = (S * 3) / 4;
        unit = "см²";
        explain = `S(ABC) = ${S}/2. EB = AB/2, высота из C общая, поэтому EBC занимает четверть: ${S}/4 = ${S / 4}. DAEC = ${S} − ${S / 4} = ${answer} см². Проверка: ${S / 4} + ${answer} = ${S}.`;
        break;
      }
      case "pythc":
      case "diagonal": {
        q =
          topic === "diagonal"
            ? `Стороны прямоугольника ${a} и ${b} см. Найди диагональ.`
            : `Катеты a = ${a}, b = ${b} см. Найди гипотенузу c.`;
        answer = Math.hypot(a, b);
        explain = `Прямой угол позволяет применить Пифагора. Складываем: c² = ${a}² + ${b}² = ${a * a + b * b}. Извлекаем корень: c = √(${a * a + b * b}) ≈ ${old.fmt(answer)} см. Проверка: c больше каждого катета.`;
        break;
      }
      case "pytha":
      case "pythb": {
        const triples = [
            [3, 4, 5],
            [5, 12, 13],
            [6, 8, 10],
            [8, 15, 17],
            [7, 24, 25],
          ],
          t = triples[n(0, 4, r)],
          scale = n(1, 3, r),
          known = t[0] * scale,
          c = t[2] * scale;
        answer = t[1] * scale;
        q = `Прямоугольный треугольник: c = ${c} см, ${topic === "pytha" ? "b" : "a"} = ${known} см. Найди катет ${topic === "pytha" ? "a" : "b"}.`;
        explain = `Для катета вычитаем: ${c}² − ${known}² = ${answer * answer}. Затем корень: √${answer * answer} = ${answer} см. Проверка: ${known}² + ${answer}² = ${c}².`;
        break;
      }
      case "triangles": {
        const angle = n(2, 14, r) * 10;
        q = `Угол при вершине равнобедренного треугольника ${angle}°. Найди каждый угол при основании.`;
        answer = (180 - angle) / 2;
        unit = "°";
        explain = `Углы при основании равны. (180 − ${angle})/2 = ${answer}°. Проверка: ${answer} + ${answer} + ${angle} = 180°.`;
        break;
      }
      case "midtriangle":
        q = `Третья сторона треугольника ${a * 2} см. Найди параллельную ей среднюю линию.`;
        answer = a;
        explain = `Средняя линия соединяет середины сторон: ${a * 2}/2 = ${a} см. Проверка: удвоенная линия равна третьей стороне.`;
        break;
      case "similar":
        q = `У подобных фигур коэффициент длин от первой ко второй k = ${k}. Площадь первой ${a} см². Найди площадь второй.`;
        answer = a * k * k;
        unit = "см²";
        explain = `Площади относятся как k²: ${a} · ${k}² = ${answer} см². Проверка: отношение площадей ${k * k}.`;
        break;
      case "units":
        q = `Переведи ${a / 2} м² в см².`;
        answer = (a / 2) * 10000;
        unit = "см²";
        explain = `1 м = 100 см, значит 1 м² = 100² = 10 000 см². ${a / 2} · 10 000 = ${answer} см². Проверка: деление на 10 000 возвращает м².`;
        break;
      default: {
        const z = old.makeQuestion(topic, r);
        if (typeof z.answer === "number") {
          z.fields = [{ label: "Ответ", answer: z.answer, unit: z.unit }];
          z.explain =
            "Дано и найти указаны в условии. " +
            z.explain +
            " Проверь единицы и обратное вычисление.";
        }
        if (hard && z.fields) {
          const values = z.q
            .match(/\d+(?:[.,]\d+)?/g)
            .map((v) => Number(v.replace(",", ".")));
          let second;
          if (topic === "rect") {
            z.q += " Также найди площадь и диагональ.";
            z.fields.push(
              { label: "Площадь", answer: values[0] * values[1], unit: "см²" },
              {
                label: "Диагональ",
                answer: Math.hypot(values[0], values[1]),
                unit: "см",
              },
            );
            z.explain += ` S = ${values[0]} · ${values[1]} = ${old.fmt(z.fields[1].answer)} см²; d = √(${values[0]}² + ${values[1]}²) ≈ ${old.fmt(z.fields[2].answer)} см.`;
          } else if (topic === "heights") {
            z.q += " Также найди площадь треугольника.";
            second = {
              label: "Площадь",
              answer: (values[1] * values[3]) / 2,
              unit: "см²",
            };
          } else if (topic === "constructions") {
            z.q += " Также найди площадь трапеции.";
            second = {
              label: "Площадь",
              answer: ((values[0] + z.answer) * values[1]) / 2,
              unit: "см²",
            };
          } else if (topic === "trap") {
            z.q += " Также найди среднюю линию.";
            second = {
              label: "Средняя линия",
              answer: (values[0] + values[1]) / 2,
              unit: "см",
            };
          } else if (topic === "segments") {
            const H = n(2, 10, r);
            z.q += ` Также найди площадь этой трапеции, если высота ${H} см.`;
            second = {
              label: "Площадь",
              answer: ((values[0] + values[1]) * H) / 2,
              unit: "см²",
            };
          } else if (["para", "triangle", "rhomb"].includes(topic)) {
            const H = n(2, 8, r);
            z.q += ` Найди также основание равновеликого прямоугольника высотой ${H} см.`;
            second = {
              label: "Основание прямоугольника",
              answer: z.answer / H,
              unit: "см",
            };
          }
          if (second) {
            z.fields.push(second);
            z.explain += ` Второй результат (${second.label}): ${old.fmt(second.answer)} ${second.unit}. Для площади используй правило темы; для основания равновеликого прямоугольника — S / h.`;
          }
        }
        return z;
      }
    }
    fields = [{ label: "Ответ", answer, unit }];
    if (hard && ["pythc", "diagonal", "rightarea"].includes(topic)) {
      q += ` Также найди ${topic === "rightarea" ? "гипотенузу" : "площадь треугольника с этими катетами"}.`;
      fields.push({
        label: topic === "rightarea" ? "Гипотенуза" : "Площадь треугольника",
        answer: topic === "rightarea" ? Math.hypot(a, b) : (a * b) / 2,
        unit: topic === "rightarea" ? "см" : "см²",
      });
      explain += ` Второй результат: ${topic === "rightarea" ? `√(${a * a + b * b})` : `${a} · ${b}/2`} = ${old.fmt(fields[1].answer)} ${fields[1].unit}.`;
    }
    const options = [answer, answer + 2, answer * 2, answer / 2].map(
      (x) => Math.round(x * 100) / 100,
    );
    while (new Set(options).size < 4) {
      options[options.findIndex((x, i) => options.indexOf(x) !== i)] += 3;
    }
    for (let i = 3; i > 0; i--) {
      const j = n(0, i, r);
      [options[i], options[j]] = [options[j], options[i]];
    }
    return { topic, q, answer, unit, explain, fields, options };
  }
  function matches(input, value) {
    try {
      return Math.abs(evaluate(input) - value) <= 0.00500001;
    } catch {
      return false;
    }
  }
  root.Engine = { evaluate, question, matches };
  if (typeof module !== "undefined") module.exports = root.Engine;
})(typeof window !== "undefined" ? window : globalThis);
