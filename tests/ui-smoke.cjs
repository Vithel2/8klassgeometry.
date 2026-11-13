const { chromium } = require("playwright"),
  assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.BASE_URL || "http://127.0.0.1:8123");
  const nav = async (id) => page.click(`[data-nav="${id}"]`),
    go = async (mode = "self", topic = "triangle") => {
      await nav("practice");
      await page.selectOption("#mode", mode);
      await page.selectOption("#topic", topic);
      await page.click("#go");
    };
  await nav("lessons");
  assert.equal(await page.locator(".lesson").count(), 20);
  await page.fill("#search", "Пифагор");
  assert.equal(await page.locator(".lesson").count(), 3);
  await page.locator(".lesson").first().click();
  await page.click("#learned");
  await page.reload();
  await nav("lessons");
  assert.match(await page.locator('[data-lesson="pythc"]').textContent(), /✓/);
  await go();
  assert.equal(await page.locator("[data-answer]").count(), 0);
  await page.fill("#solution", "Моё <решение> & проверка");
  await page.fill("#answer0", "1,5");
  await page.click("#calculator");
  await page.fill("#expression", "√(3²+4²)");
  await page.click("#calcRun");
  assert.equal(await page.locator("#calcResult").textContent(), "5");
  await page.click("#calcClose");
  await page.reload();
  assert.equal(
    await page.locator("#solution").inputValue(),
    "Моё <решение> & проверка",
  );
  await page.click("#submit");
  const before = await page.evaluate(() => store.total);
  await page.click("#exit");
  assert.ok(await page.locator("#dialog").isVisible());
  await page.click("#dialogNo");
  assert.equal(await page.locator("#next").count(), 1);
  await page.click("#exit");
  await page.click("#dialogYes");
  assert.equal(await page.locator("#go").count(), 1);
  assert.equal(await page.evaluate(() => store.total), before);
  assert.equal(await page.evaluate(() => clock), null);
  // Exit before any answer, switch section, native Back, and cancel.
  await go("warm");
  await nav("settings");
  await page.click("#dialogNo");
  assert.equal(await page.locator("[data-answer]").count(), 4);
  assert.equal(await page.evaluate(() => handleAndroidBack()), true);
  await page.click("#dialogYes");
  assert.equal(await page.locator("#go").count(), 1);
  await go("hard", "pythc");
  assert.equal(await page.locator("[data-result]").count(), 2);
  const vals = await page.evaluate(() =>
    session.questions[0].fields.map((f) => String(f.answer)),
  );
  for (let i = 0; i < vals.length; i++) await page.fill("#answer" + i, vals[i]);
  await page.fill("#solution", "Квадраты, корень, площадь");
  await page.click("#submit");
  assert.match(await page.locator("#feedback").textContent(), /Верно/);
  await nav("home");
  await page.click("#dialogYes");
  await nav("settings");
  await page.selectOption("#theme", "dark");
  await page.selectOption("#size", "huge");
  await page.selectOption("#glass", "off");
  await page.selectOption("#accent", "green");
  await page.uncheck("#motion");
  await page.reload();
  assert.ok(await page.locator("body.dark").count());
  assert.equal(await page.locator("body").getAttribute("data-size"), "huge");
  await nav("settings");
  await page.click("#reset");
  await page.click("#dialogNo");
  assert.ok(await page.evaluate(() => store.total > 0));
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    for (const tab of ["home", "lessons", "practice", "formulas", "settings"]) {
      await nav(tab);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${width} ${tab}`,
      );
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await nav("practice");
  await page.click("#exam");
  await page.fill("#answer0", "2");
  await page.fill("#solution", "Черновик в тесте");
  await page.click("#calculator");
  await page.evaluate(() => {
    session.deadline = Date.now() - 1;
    tick();
  });
  assert.equal(await page.locator("#calcOverlay").isVisible(), false);
  assert.equal(await page.evaluate(() => clock), null);
  assert.match(await page.locator("h1").textContent(), /из 10/);
  assert.equal(
    await page.evaluate(() => store.history[0].drafts[0].solution),
    "Черновик в тесте",
  );
  await nav("home");
  await page.click("#history");
  await page.locator("[data-history]").first().click();
  await page.locator("summary").first().click();
  assert.match(
    await page.locator(".written").first().textContent(),
    /Черновик/,
  );
  await nav("practice");
  await page.click("#exam");
  await page.click("#exit");
  await page.click("#dialogYes");
  assert.equal(await page.evaluate(() => clock), null);
  assert.equal(await page.locator(".overlay:visible").count(), 0);
  await nav("settings");
  await page.selectOption("#size", "normal");
  await page.selectOption("#glass", "medium");
  await page.check("#motion");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await nav("home");
  assert.equal(
    await page
      .locator("main")
      .evaluate((e) => getComputedStyle(e).animationName),
    "none",
  );
  await page.screenshot({ path: "artifacts/home-dark.png", fullPage: true });
  await nav("settings");
  await page.selectOption("#theme", "light");
  await nav("lessons");
  await page.locator('[data-lesson="part"]').click();
  await page.screenshot({
    path: "artifacts/notebook-part.png",
    fullPage: true,
  });
  // All completed answers count once, including a full exam.
  await nav("lessons");
  await page.locator('[data-lesson="properties"]').click();
  await page.click("#train");
  assert.equal(await page.locator("[data-answer]").count(), 4);
  await page.click("#exit");
  await page.click("#dialogYes");
  await go("warm", "rect");
  const countBefore = await page.evaluate(() => store.total);
  for (let i = 0; i < 5; i++) {
    const index = await page.evaluate(() =>
      session.questions[session.index].options.findIndex(
        (x) => x === session.questions[session.index].answer,
      ),
    );
    await page.click(`[data-answer="${index}"]`);
    await page.click("#next");
  }
  assert.equal(await page.evaluate(() => store.total), countBefore + 5);
  assert.equal(await page.evaluate(() => store.history[0].score), 5);
  await go("hard", "rect");
  const rv = await page.evaluate(() =>
    session.questions[0].fields.map((f) => String(f.answer)),
  );
  assert.equal(rv.length, 3);
  for (let i = 0; i < 3; i++)
    await page.fill("#answer" + i, i === 1 ? "0" : rv[i]);
  await page.click("#submit");
  assert.deepEqual(await page.evaluate(() => session.answers[0].checks), [
    true,
    false,
    true,
  ]);
  await page.click("#exit");
  await page.click("#dialogYes");
  await page.click("#exam");
  for (let i = 0; i < 10; i++) {
    const values = await page.evaluate(() =>
      session.questions[session.index].fields.map((f) => String(f.answer)),
    );
    for (let j = 0; j < values.length; j++)
      await page.fill("#answer" + j, values[j]);
    await page.click("#submit");
    assert.equal(
      (await page.locator("#feedback").textContent()).includes("Верно!"),
      false,
    );
    await page.click("#next");
  }
  assert.equal(await page.evaluate(() => store.history[0].score), 10);
  assert.equal(await page.evaluate(() => clock), null);
  await nav("practice");
  await page.click("#exam");
  await page.click("#exit");
  await page.evaluate(() => {
    session.deadline = Date.now() - 1;
    tick();
  });
  assert.equal(await page.locator("#dialog").isVisible(), false);
  assert.equal(await page.evaluate(() => clock), null);
  await nav("formulas");
  await page.getByText("Подстановка в формулу", { exact: true }).click();
  await page.selectOption("#calcType", "trap");
  await page.fill("#ca", "5");
  await page.fill("#cb", "15");
  await page.fill("#ch", "5");
  await page.click("#calc");
  assert.match(await page.locator("#result").textContent(), /= 50/);
  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(() => {
    localStorage.setItem(
      "geometry8",
      JSON.stringify({
        seen: ["rect"],
        total: 7,
        correct: 5,
        errors: [],
        best: 0,
      }),
    );
    localStorage.setItem("geometry8-theme", "dark");
  });
  const legacy = await legacyContext.newPage();
  await legacy.goto(process.env.BASE_URL || "http://127.0.0.1:8123");
  assert.equal(await legacy.evaluate(() => store.total), 7);
  assert.equal(await legacy.evaluate(() => store.correct), 5);
  assert.deepEqual(await legacy.evaluate(() => store.seen), ["rect"]);
  assert.equal(await legacy.locator("body.dark").count(), 1);
  await legacyContext.close();
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "UI PASS: 20 topics, search, progress, all modes, multi-result check, draft restore, calculator, exit/cancel/native Back, timer over overlays, history, settings persistence, 320–768px + huge type, reduced motion.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
