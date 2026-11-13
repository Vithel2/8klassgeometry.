"use strict";
const $ = (s) => document.querySelector(s),
  app = $("#app"),
  G = Geometry,
  E = Engine;
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
let store = {
  seen: [],
  total: 0,
  correct: 0,
  errors: [],
  best: 0,
  history: [],
};
try {
  const p = JSON.parse(localStorage.getItem("geometry8"));
  if (
    p &&
    Array.isArray(p.seen) &&
    Array.isArray(p.errors) &&
    Number.isFinite(p.total) &&
    Number.isFinite(p.correct)
  )
    store = { ...store, ...p };
} catch {}
let settings = {
  theme: "system",
  accent: "blue",
  size: "normal",
  glass: "medium",
  motion: true,
  haptic: true,
  icon: "Angle",
};
try {
  settings = {
    ...settings,
    theme: localStorage.getItem("geometry8-theme") || "system",
    ...JSON.parse(localStorage.getItem("geometry8-settings") || "{}"),
  };
} catch {}
let current = "home",
  session = null,
  clock = null,
  dialogAction = null,
  focusBefore = null,
  cardIndex = 0;
const title = (id) => LESSONS.find((l) => l.id === id)?.title || id;
function save() {
  try {
    localStorage.setItem("geometry8", JSON.stringify(store));
    if (session)
      localStorage.setItem("geometry8-active", JSON.stringify(session));
    else localStorage.removeItem("geometry8-active");
  } catch {}
}
function applySettings() {
  const dark =
    settings.theme === "dark" ||
    (settings.theme === "system" &&
      matchMedia("(prefers-color-scheme:dark)").matches);
  document.body.classList.toggle("dark", dark);
  document.body.dataset.accent = settings.accent;
  document.body.dataset.size = settings.size;
  document.body.dataset.glass = settings.glass;
  document.body.classList.toggle("still", !settings.motion);
  if (window.AndroidTheme) AndroidTheme.setDarkMode(dark);
  try {
    localStorage.setItem("geometry8-settings", JSON.stringify(settings));
  } catch {}
}
matchMedia("(prefers-color-scheme:dark)").addEventListener(
  "change",
  applySettings,
);
function vibrate() {
  if (settings.haptic && window.AndroidTheme?.haptic) AndroidTheme.haptic();
}
function showDialog(
  text,
  action,
  positive = "Выйти",
  negative = "Продолжить решать",
) {
  closeCalculator();
  focusBefore = document.activeElement;
  $("#dialogText").textContent = text;
  $("#dialogYes").textContent = positive;
  $("#dialogNo").textContent = negative;
  dialogAction = action;
  $("#dialog").hidden = false;
  $("#dialogNo").focus();
}
function closeDialog() {
  $("#dialog").hidden = true;
  dialogAction = null;
  focusBefore?.focus?.();
}
$("#dialogNo").onclick = closeDialog;
$("#dialogYes").onclick = () => {
  const fn = dialogAction;
  closeDialog();
  fn?.();
};
function navigate(page) {
  if (session) {
    showDialog(
      "Выйти из занятия? Принятые ответы и записанное решение сохранятся.",
      () => endSession(true, page),
    );
    return;
  }
  render(page);
}
function render(page) {
  clearInterval(clock);
  clock = null;
  current = page;
  document.querySelectorAll("[data-nav]").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === page);
    b.setAttribute("aria-current", b.dataset.nav === page ? "page" : "false");
  });
  (
    ({ home, lessons, practice, formulas, settings: settingsPage })[page] ||
    home
  )();
  window.scrollTo(0, 0);
}
function home() {
  app.innerHTML = `<div class="tag">ГЕОМЕТРИЯ • 8 КЛАСС · 2.0</div><h1>Всё становится<br>понятнее.</h1><p class="muted">Правило, схема, пять шагов — и ты умеешь решать.</p><section class="hero"><div class="tag">ТВОЙ ТЕМП. ТВОИ ОТКРЫТИЯ.</div><h2>От первого рисунка<br>до уверенного ответа</h2><p>20 тем, примеры из тетради и новые задачи. Всё работает без интернета.</p><button id="start" class="primary">Открыть темы ↗</button></section><div class="grid"><section class="card"><div class="stat">${store.seen.length}<small>/${LESSONS.length}</small></div><span class="muted">тем изучено</span></section><section class="card"><div class="stat">${store.total ? Math.round((100 * store.correct) / store.total) : 0}%</div><span class="muted">верно · ${store.total} ответов</span></section></div><section class="card"><span class="tag">ПРАКТИКА БЕЗ СПЕШКИ</span><h2>Попробуй самостоятельно</h2><p>Запиши ответ и свой ход решения. Сравни с образцом.</p><div class="buttons"><button id="self">Решать</button><button class="secondary" id="errors">Ошибки · ${store.errors.length}</button></div></section><section class="card"><h2>Пробный тест</h2><p>10 задач за 15 минут. Разбор после завершения.</p><button id="exam">Начать тест</button></section><button class="secondary" id="history">История · ${store.history.length}</button><details class="card"><summary>Пять шагов решения</summary><ol><li>Что дано?</li><li>Что найти?</li><li>Какая формула подходит и почему?</li><li>Подставь числа и вычисли.</li><li>Проверь ответ, единицы и смысл.</li></ol></details>`;
  $("#start").onclick = () => render("lessons");
  $("#self").onclick = () => startSession("self");
  $("#errors").onclick = errors;
  $("#exam").onclick = () => startSession("exam");
  $("#history").onclick = history;
}
function lessons() {
  app.innerHTML = `<div class="tag">БИБЛИОТЕКА ЗНАНИЙ</div><h1>От рисунка к решению</h1><label for="search">Поиск по темам и формулам</label><input id="search" type="search" placeholder="Например, Пифагор или высота"><div id="lessonList"></div>`;
  const update = () => {
    $("#lessonList").innerHTML =
      LESSONS.filter((l) =>
        (l.title + " " + l.text + " " + l.formula)
          .toLowerCase()
          .includes($("#search").value.toLowerCase()),
      )
        .map(
          (l) =>
            `<button class="lesson" data-lesson="${l.id}"><span class="lesson-icon">${store.seen.includes(l.id) ? "✓" : "∠"}</span><span class="lesson-copy">${l.title}<small>${l.sub}</small></span><span>›</span></button>`,
        )
        .join("") || "<p>Тем не найдено.</p>";
    document
      .querySelectorAll("[data-lesson]")
      .forEach((b) => (b.onclick = () => lesson(b.dataset.lesson)));
  };
  $("#search").oninput = update;
  update();
}
function lesson(id) {
  const l = LESSONS.find((x) => x.id === id);
  app.innerHTML = `<button id="back" class="secondary">← Все темы</button><h1>${l.title}</h1><p class="muted">${l.sub}</p><section class="card">${fig(l.figure)}<p class="muted">Обозначения на схеме. Рисунок не в масштабе.</p><div class="formula">${l.formula}</div><p>${l.text}</p></section><section class="card"><span class="tag">РАЗБОР ПО ШАГАМ</span><p>${l.example}</p></section>${id === "properties" ? propertiesTable() : ""}<aside class="warning"><b>Частая ошибка</b><p>${l.trap}</p></aside><div class="buttons"><button id="train">Тренироваться</button><button id="learned" class="secondary">${store.seen.includes(id) ? "✓ Изучено" : "Отметить изученным"}</button></div>`;
  $("#back").onclick = lessons;
  $("#learned").onclick = () => {
    store.seen = store.seen.includes(id)
      ? store.seen.filter((x) => x !== id)
      : [...store.seen, id];
    save();
    lesson(id);
  };
  $("#train").onclick = () =>
    startSession(id === "properties" ? "warm" : "self", id);
  window.scrollTo(0, 0);
}
function practice() {
  app.innerHTML = `<div class="tag">ЗНАНИЯ СТАНОВЯТСЯ НАВЫКОМ</div><h1>Твоя практика</h1><section class="card"><label for="topic">Тема</label><select id="topic"><option value="all">Все числовые темы</option>${LESSONS.map((l) => `<option value="${l.id}">${l.title}</option>`).join("")}</select><label for="mode">Режим</label><select id="mode"><option value="warm">Разминка · варианты ответа</option><option value="self">Самостоятельно · ввод ответа</option><option value="hard">Сложные · несколько шагов</option></select><p class="muted">5 задач. В самостоятельном и сложном режимах ответ и ход решения вводишь сам. Числовые результаты проверяются автоматически; доказательства — сравни с образцом.</p><button id="go">Начать</button><p id="modeMessage" role="status"></p></section><section class="card"><h2>Пробный тест</h2><p>10 задач без вариантов за 15 минут. Калькулятор доступен. Разбор в конце.</p><button id="exam">Начать тест</button></section>`;
  $("#go").onclick = () => {
    if ($("#topic").value === "properties" && $("#mode").value !== "warm") {
      $("#modeMessage").textContent =
        "Для устных свойств выбери разминку. Числовые темы доступны во всех режимах.";
      return;
    }
    startSession($("#mode").value, $("#topic").value);
  };
  $("#exam").onclick = () => startSession("exam");
}
function makeNewQuestion(topic, mode, i) {
  const hardPool = [
    "pythc",
    "diagonal",
    "rightarea",
    "heights",
    "part",
    "segments",
    "trap",
    "similar",
  ];
  const pool = LESSONS.map((x) => x.id).filter((x) => x !== "properties");
  const id =
    topic === "all"
      ? mode === "hard"
        ? i === 0
          ? ["pythc", "diagonal", "rightarea"][Math.floor(Math.random() * 3)]
          : i === 1
            ? "heights"
            : i === 2
              ? "part"
              : i === 3
                ? "segments"
                : hardPool[Math.floor(Math.random() * hardPool.length)]
        : pool[Math.floor(Math.random() * pool.length)]
      : topic;
  return E.question(id, Math.random, mode === "hard");
}
function startSession(mode, topic = "all") {
  clearInterval(clock);
  current = "practice";
  document.querySelectorAll("[data-nav]").forEach((b) => {
    b.classList.toggle("active", b.dataset.nav === "practice");
    b.setAttribute(
      "aria-current",
      b.dataset.nav === "practice" ? "page" : "false",
    );
  });
  const questions = Array.from({ length: mode === "exam" ? 10 : 5 }, (_, i) =>
    makeNewQuestion(topic, mode, i),
  );
  session = {
    mode,
    topic,
    questions,
    index: 0,
    answers: [],
    drafts: {},
    started: Date.now(),
    deadline: Date.now() + 900000,
  };
  save();
  showQuestion();
  startClock();
}
function startClock() {
  clearInterval(clock);
  clock = null;
  if (session?.mode === "exam") clock = setInterval(tick, 250);
}
function tick() {
  if (!session || session.mode !== "exam") return;
  const left = Math.max(0, Math.ceil((session.deadline - Date.now()) / 1000));
  if ($("#timer"))
    $("#timer").textContent =
      `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  if (!left) {
    closeCalculator();
    closeDialog();
    endSession(false);
  }
}
function showQuestion() {
  const s = session,
    q = s.questions[s.index],
    manual = s.mode !== "warm";
  const draft = s.drafts[s.index] || { values: [], solution: "" };
  app.innerHTML = `<div class="row"><span class="tag">${{ warm: "РАЗМИНКА", self: "САМОСТОЯТЕЛЬНО", hard: "СЛОЖНЫЕ ЗАДАЧИ", exam: "ПРОБНЫЙ ТЕСТ" }[s.mode]}</span>${s.mode === "exam" ? '<b id="timer">15:00</b>' : ""}<button class="secondary" id="exit">Выйти</button></div><h2>Задача ${s.index + 1} из ${s.questions.length}</h2><progress value="${s.index}" max="${s.questions.length}" aria-label="Прогресс"></progress><section class="card"><p class="muted">${title(q.topic)}</p><h2>${q.q}</h2>${["part", "constructions"].includes(q.topic) ? fig(q.topic === "part" ? "part" : "construction") : ""}${manual ? `<p class="muted">Дробные ответы округли до сотых. Можно вводить запятую, точку и точные выражения, например √(2) или 3*√(2).</p>${(q.fields || []).map((f, i) => `<label for="answer${i}">${f.label} (${f.unit})</label><input id="answer${i}" data-result="${i}" inputmode="text" autocomplete="off" value="${esc(draft.values[i] || "")}">`).join("")}<label for="solution">Моё решение</label><textarea id="solution" rows="4" placeholder="Дано → найти → формула → подстановка → проверка">${esc(draft.solution)}</textarea><p class="muted">Проверка чисел не проверяет доказательство. Твой текст сохранится рядом с образцом.</p><button id="submit">Принять ответ</button>` : q.options.map((v, i) => `<button class="answer" data-answer="${i}">${G.fmt(v)} ${q.unit}</button>`).join("")}<button class="secondary" id="calculator">Калькулятор</button><div id="feedback" role="status"></div></section>`;
  $("#exit").onclick = () => navigate("practice");
  $("#calculator").onclick = openCalculator;
  if (manual) {
    const draftSave = () => {
      s.drafts[s.index] = {
        values: [...document.querySelectorAll("[data-result]")].map(
          (e) => e.value,
        ),
        solution: $("#solution").value,
      };
      save();
    };
    document
      .querySelectorAll("[data-result],#solution")
      .forEach((el) => (el.oninput = draftSave));
    $("#submit").onclick = () => {
      const values = [...document.querySelectorAll("[data-result]")].map(
        (e) => e.value,
      );
      if (values.some((v) => !v.trim())) {
        $("#feedback").textContent = "Заполни все числовые результаты.";
        return;
      }
      accept(values, $("#solution").value);
    };
  } else
    document
      .querySelectorAll("[data-answer]")
      .forEach(
        (b) =>
          (b.onclick = () =>
            accept([String(q.options[+b.dataset.answer])], "")),
      );
  if (s.answers[s.index]) showAccepted();
  tick();
  window.scrollTo(0, 0);
}
function accept(values, solution) {
  const s = session;
  if (!s || s.answers[s.index]) return;
  if (s.mode === "exam" && Date.now() >= s.deadline) {
    endSession(false);
    return;
  }
  const q = s.questions[s.index],
    checks = q.fields
      ? q.fields.map((f, i) => E.matches(values[i], f.answer))
      : [values[0] === String(q.answer)],
    ok = checks.every(Boolean);
  s.answers[s.index] = { values, solution, checks, ok };
  store.total++;
  if (ok) store.correct++;
  else store.errors.unshift({ ...q, chosen: values, solution });
  store.errors = store.errors.slice(0, 40);
  vibrate();
  save();
  showAccepted();
}
function showAccepted() {
  const s = session,
    q = s.questions[s.index],
    a = s.answers[s.index];
  document
    .querySelectorAll("[data-answer],[data-result],#solution,#submit")
    .forEach((el) => (el.disabled = true));
  $("#feedback").innerHTML =
    `<div class="feedback">${s.mode === "exam" ? "Ответ принят. Разбор после завершения." : `<b>${a.ok ? "Верно!" : "Разберём вместе"}</b>${a.checks.map((ok, i) => `<p>${q.fields?.[i]?.label || "Ответ"}: ${ok ? "✓" : "○"} ${esc(a.values[i])}${!ok ? ` → ${G.fmt(q.fields?.[i]?.answer ?? q.answer)}` : ""}</p>`).join("")}<p>${q.explain}</p>`}<button id="next">${s.index === s.questions.length - 1 ? "Завершить" : "Следующая задача →"}</button></div>`;
  $("#next").onclick = () => {
    if (s.index === s.questions.length - 1) endSession(false);
    else {
      s.index++;
      save();
      showQuestion();
    }
  };
}
function endSession(aborted, page) {
  if (!session) return;
  const s = session;
  session = null;
  clearInterval(clock);
  clock = null;
  closeCalculator();
  closeDialog();
  const item = {
    ...s,
    ended: Date.now(),
    aborted,
    score: s.answers.filter((a) => a?.ok).length,
  };
  store.history.unshift(item);
  store.history = store.history.slice(0, 40);
  if (s.mode === "exam" && !aborted)
    store.best = Math.max(store.best, item.score);
  save();
  if (aborted) render(page || "practice");
  else showAttempt(item);
}
function showAttempt(s) {
  app.innerHTML = `<span class="tag">${s.aborted ? "ЗАНЯТИЕ ПРЕРВАНО" : "ЗАНЯТИЕ ЗАВЕРШЕНО"}</span><h1>${s.score} из ${s.questions.length} верно</h1><p>Принято ответов: ${s.answers.filter(Boolean).length}. ${new Date(s.ended).toLocaleString("ru")}</p><button id="again">К тренировкам</button>${s.questions
    .map((q, i) => {
      const a = s.answers[i],
        d = s.drafts?.[i];
      return `<details class="card"><summary>${a?.ok ? "✓" : "○"} ${q.q}</summary><p>Твои ответы: ${esc(a?.values.join("; ") || d?.values.join("; ") || "не даны")}</p><h3>Моё решение</h3><p class="written">${esc(a?.solution || d?.solution || "Не записано")}</p><h3>Образец</h3><p>${q.explain}</p><p class="muted">Ход доказательства автоматически не оценивался.</p></details>`;
    })
    .join("")}`;
  $("#again").onclick = () => render("practice");
  window.scrollTo(0, 0);
}
function history() {
  app.innerHTML =
    '<h1>История попыток</h1><p class="muted">Последние 40 занятий. Прерванные тоже сохраняются.</p>' +
    store.history
      .map(
        (s, i) =>
          `<button class="lesson" data-history="${i}">${new Date(s.ended).toLocaleDateString("ru")} · ${s.score}/${s.questions.length} · ${s.aborted ? "прервано" : "завершено"}</button>`,
      )
      .join("");
  document
    .querySelectorAll("[data-history]")
    .forEach(
      (b) => (b.onclick = () => showAttempt(store.history[+b.dataset.history])),
    );
}
function errors() {
  app.innerHTML =
    "<h1>Работа над ошибками</h1><p>Повтори правило и реши похожую задачу с новыми числами.</p>" +
    (store.errors.length
      ? store.errors
          .map(
            (q, i) =>
              `<section class="card"><h3>${q.q}</h3><p>Твой ответ: ${esc(Array.isArray(q.chosen) ? q.chosen.join("; ") : q.chosen)}</p><p class="written">${esc(q.solution || "")}</p><p>${q.explain}</p><button data-retry="${i}">Похожая задача</button></section>`,
          )
          .join("")
      : "<p>Ошибок пока нет.</p>");
  document.querySelectorAll("[data-retry]").forEach((b) => {
    b.onclick = () => {
      const id = store.errors[+b.dataset.retry].topic;
      startSession(id === "properties" ? "warm" : "self", id);
    };
  });
}
function formulas() {
  const l = LESSONS[cardIndex % LESSONS.length];
  app.innerHTML = `<div class="tag">КАРТОЧКИ ДЛЯ ПОВТОРЕНИЯ</div><h1>Формулы в памяти</h1><section class="card flash"><span class="badge">${(cardIndex % LESSONS.length) + 1} / ${LESSONS.length}</span><h2>${l.title}</h2><p>Вспомни формулу, затем переверни карточку.</p><div id="formulaAnswer" hidden><div class="formula">${l.formula}</div><p>${l.text}</p></div><div class="buttons"><button id="flip">Показать</button><button id="nextCard" class="secondary">Дальше →</button></div></section><button id="calculator">Обычный калькулятор</button><details class="card"><summary>Все формулы</summary>${LESSONS.map((x) => `<h3>${x.title}</h3><div class="formula">${x.formula}</div>`).join("")}</details>${formulaHelperHtml()}`;
  $("#flip").onclick = () => {
    $("#formulaAnswer").hidden = !$("#formulaAnswer").hidden;
    $("#flip").textContent = $("#formulaAnswer").hidden ? "Показать" : "Скрыть";
  };
  $("#nextCard").onclick = () => {
    cardIndex++;
    formulas();
  };
  $("#calculator").onclick = openCalculator;
  wireFormulaHelper();
}
function settingsPage() {
  app.innerHTML = `<div class="tag">ТВОЁ ПРОСТРАНСТВО</div><h1>Настройки</h1><section class="card">${[
    [
      "theme",
      "Тема",
      [
        ["system", "Системная"],
        ["light", "Светлая"],
        ["dark", "Тёмная"],
      ],
    ],
    [
      "accent",
      "Цвет акцента",
      [
        ["blue", "Сапфир"],
        ["purple", "Аметист"],
        ["green", "Нефрит"],
        ["orange", "Янтарь"],
      ],
    ],
    [
      "size",
      "Размер текста",
      [
        ["normal", "Обычный"],
        ["large", "Крупный"],
        ["huge", "Очень крупный"],
      ],
    ],
    [
      "glass",
      "Стеклянные эффекты",
      [
        ["medium", "Мягкие"],
        ["strong", "Выраженные"],
        ["off", "Облегчённо · без размытия"],
      ],
    ],
    [
      "icon",
      "Значок приложения",
      [
        ["Angle", "Угол"],
        ["Triangle", "Прямоугольный треугольник"],
        ["Diamond", "Ромб"],
      ],
    ],
  ]
    .map(
      ([id, label, opts]) =>
        `<label for="${id}">${label}</label><select id="${id}" data-setting="${id}">${opts.map(([v, t]) => `<option value="${v}" ${settings[id] === v ? "selected" : ""}>${t}</option>`).join("")}</select>`,
    )
    .join(
      "",
    )}<label class="check"><input id="motion" type="checkbox" ${settings.motion ? "checked" : ""}> Анимации</label><p class="muted">Системное уменьшение движения учитывается всегда.</p><label class="check"><input id="haptic" type="checkbox" ${settings.haptic ? "checked" : ""}> Тактильный отклик при ответе</label><p class="muted">Смена значка и тактильный отклик доступны в Android-приложении.</p><p id="iconStatus" role="status"></p></section><section class="card"><h2>Прогресс на этом устройстве</h2><p>Настройки, ответы и решения сохраняются после закрытия. Старый прогресс версии 1.2 переносится автоматически при обновлении с совместимой подписью.</p><button id="reset" class="secondary">Сбросить прогресс</button></section><section class="card"><h2>О приложении</h2><p>Геометрия • 8 класс<br><b>Версия 2.0 · сборка 4</b></p><p>20 тем. Без интернета, аккаунта, рекламы и покупок. Числовая проверка не заменяет проверку доказательства учителем.</p></section>`;
  document.querySelectorAll("[data-setting]").forEach(
    (el) =>
      (el.onchange = () => {
        if (el.id === "icon") {
          if (window.AndroidTheme?.setIcon) {
            AndroidTheme.setIcon(el.value);
            $("#iconStatus").textContent =
              "Значок изменён. Лаунчер может обновить его с небольшой задержкой.";
          } else {
            $("#iconStatus").textContent =
              "Смена значка работает в установленном Android-приложении.";
          }
        }
        settings[el.dataset.setting] = el.value;
        applySettings();
      }),
  );
  ["motion", "haptic"].forEach(
    (id) =>
      ($("#" + id).onchange = () => {
        settings[id] = $("#" + id).checked;
        applySettings();
      }),
  );
  $("#reset").onclick = () =>
    showDialog(
      "Удалить изученные темы, ответы и историю? Настройки останутся.",
      () => {
        store = {
          seen: [],
          total: 0,
          correct: 0,
          errors: [],
          best: 0,
          history: [],
        };
        save();
        settingsPage();
      },
      "Удалить прогресс",
      "Отмена",
    );
}
function openCalculator() {
  focusBefore = document.activeElement;
  $("#calcOverlay").hidden = false;
  $("#expression").focus();
}
function closeCalculator() {
  if (!$("#calcOverlay").hidden) {
    $("#calcOverlay").hidden = true;
    focusBefore?.focus?.();
  }
}
$("#calcClose").onclick = closeCalculator;
$("#calcRun").onclick = () => {
  try {
    $("#calcResult").textContent = G.fmt(E.evaluate($("#expression").value));
  } catch (e) {
    $("#calcResult").textContent = e.message;
  }
};
$("#expression").onkeydown = (e) => {
  if (e.key === "Enter") $("#calcRun").click();
};
document.querySelectorAll("[data-key]").forEach(
  (b) =>
    (b.onclick = () => {
      const el = $("#expression"),
        key = b.dataset.key;
      if (key === "C") el.value = "";
      else if (key === "⌫") el.value = el.value.slice(0, -1);
      else el.value += key;
      el.focus();
    }),
);
document
  .querySelectorAll("[data-nav]")
  .forEach((b) => (b.onclick = () => navigate(b.dataset.nav)));
window.handleAndroidBack = () => {
  if (!$("#dialog").hidden) {
    closeDialog();
    return true;
  }
  if (!$("#calcOverlay").hidden) {
    closeCalculator();
    return true;
  }
  if (session) {
    navigate("practice");
    return true;
  }
  if ($("#back")) {
    lessons();
    return true;
  }
  if (current !== "home") {
    render("home");
    return true;
  }
  return false;
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.handleAndroidBack();
  const overlay = !$("#dialog").hidden
    ? $("#dialog")
    : !$("#calcOverlay").hidden
      ? $("#calcOverlay")
      : null;
  if (e.key === "Tab" && overlay) {
    const els = [...overlay.querySelectorAll("button,input")],
      first = els[0],
      last = els.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
});
window.addEventListener("pagehide", save);
document.addEventListener("visibilitychange", () => {
  save();
  if (!document.hidden) tick();
});
applySettings();
render("home");
try {
  const active = JSON.parse(localStorage.getItem("geometry8-active"));
  if (active?.questions?.length && active.index < active.questions.length) {
    session = active;
    current = "practice";
    showQuestion();
    startClock();
  }
} catch {}

// Formula substitution is available only in the reference section, never over a task.
function formulaHelperHtml() {
  return `<details class="card"><summary>Подстановка в формулу</summary><p class="muted">Сохранённый помощник для проверки собственной подстановки. Все длины в одинаковых единицах.</p><label for="calcType">Формула</label><select id="calcType"><option value="triangle">Площадь треугольника</option><option value="rect">Площадь прямоугольника</option><option value="rhomb">Площадь ромба по диагоналям</option><option value="trap">Площадь трапеции</option><option value="heights">Вторая высота</option></select><label id="la" for="ca">Основание a</label><input id="ca" inputmode="decimal"><label id="lb" for="cb">Высота h</label><input id="cb" inputmode="decimal"><div id="third" hidden><label id="lh" for="ch">Высота</label><input id="ch" inputmode="decimal"></div><button id="calc">Подставить и вычислить</button><p id="result" role="status"></p></details>`;
}
function wireFormulaHelper() {
  const labels = {
    triangle: ["Основание a", "Высота к основанию h"],
    rect: ["Сторона a", "Сторона b"],
    rhomb: ["Диагональ d₁", "Диагональ d₂"],
    trap: ["Основание a", "Основание b"],
    heights: ["Сторона с известной высотой", "Сторона с искомой высотой"],
  };
  $("#calcType").onchange = () => {
    const t = $("#calcType").value;
    $("#la").textContent = labels[t][0];
    $("#lb").textContent = labels[t][1];
    $("#third").hidden = !["trap", "heights"].includes(t);
    $("#result").textContent = "";
  };
  $("#calc").onclick = () => {
    try {
      const num = (id) => Number($(id).value.trim().replace(",", ".")),
        t = $("#calcType").value,
        a = num("#ca"),
        b = num("#cb"),
        h = ["trap", "heights"].includes(t) ? num("#ch") : 1,
        v = G.calculate(t, a, b, h);
      if (!Number.isFinite(v)) throw Error("Слишком большие числа");
      const expressions = {
        triangle: `${a} · ${b} / 2`,
        rect: `${a} · ${b}`,
        rhomb: `${a} · ${b} / 2`,
        trap: `(${a} + ${b}) · ${h} / 2`,
        heights: `${a} · ${h} / ${b}`,
      };
      $("#result").textContent =
        `${expressions[t]} = ${G.fmt(v)} ${t === "heights" ? "ед. длины" : "кв. ед."}`;
    } catch (e) {
      $("#result").textContent = e.message;
    }
  };
}
