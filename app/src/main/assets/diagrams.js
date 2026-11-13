function fig(type) {
  let shape = "M55 125 L110 30 L245 125 Z",
    extra =
      '<path d="M110 30V125M110 115h10v10" stroke-dasharray="4 4"/><text x="116" y="85">h</text><text x="150" y="147">a</text>';
  if (type === "construction") {
    shape = "M35 130L115 50H195L275 130Z";
    extra =
      '<path d="M115 50V130M195 50V130" stroke-dasharray="5 4"/><path d="M115 119h11v11M195 119h11v11"/><text x="120" y="92">h</text><text x="145" y="42">b</text><text x="135" y="153">B</text><text x="56" y="121">45°</text><text x="225" y="121">45°</text>';
  }
  if (type === "part") {
    shape = "M40 130L85 30H260L215 130Z";
    extra =
      '<path d="M62.5 80L260 30"/><path d="M40 130L62.5 80L260 30L215 130Z" fill="currentColor" fill-opacity=".16"/><text x="24" y="146">A</text><text x="66" y="22">B</text><text x="265" y="33">C</text><text x="216" y="149">D</text><text x="43" y="80">E</text><text x="80" y="105">AE = EB</text>';
  }
  if (type === "heights") {
    shape = "M35 135H260L131.4 6.4Z";
    extra =
      '<path d="M131.4 6.4V135M260 135L116 27" stroke-dasharray="4 3"/><path d="M131.4 125h10v10M110 35L118 41L124 33"/><text x="136" y="100">20</text><text x="195" y="65">28</text><text x="140" y="155">35</text><text x="62" y="70">25</text>';
  }
  if (type === "right") {
    shape = "M55 30V130H245Z";
    extra =
      '<path d="M55 118h12v12"/><text x="28" y="85">a</text><text x="145" y="150">b</text><text x="165" y="70">c</text>';
  }
  if (type === "midtriangle") {
    extra =
      '<path d="M82.5 77.5H177.5"/><text x="118" y="70">m</text><text x="145" y="150">a</text>';
  }
  if (type === "similar") {
    shape = "M30 125V55L100 125ZM155 125V20L260 125Z";
    extra = '<text x="35" y="150">1</text><text x="195" y="150">k</text>';
  }
  if (type === "units") {
    shape = "M80 25H190V135H80Z";
    extra =
      '<path d="M135 25V135M80 80H190"/><text x="100" y="18">1 м</text><text x="100" y="156">1 м²</text>';
  }
  if (type === "rect") {
    shape = "M55 125V30H245V125Z";
    extra =
      '<path d="M55 30L245 125M245 30L55 125" opacity=".3"/><path d="M55 113h12v12"/><text x="140" y="147">a</text><text x="35" y="80">b</text>';
  }
  if (type === "para") {
    shape = "M40 125L90 30H260L210 125Z";
    extra =
      '<path d="M90 30V125M90 115h10v10" stroke-dasharray="4 4"/><text x="95" y="85">h</text><text x="140" y="147">a</text>';
  }
  if (type === "rhomb") {
    shape = "M40 78L150 15L260 78L150 140Z";
    extra =
      '<path d="M40 78H260M150 15V140" stroke-dasharray="5 4"/><text x="190" y="72">d₁</text><text x="155" y="48">d₂</text>';
  }
  if (type === "trap" || type === "segments") {
    shape = "M35 130L95 25H205L265 130Z";
    extra =
      '<path d="M65 77.5H235" stroke="#d98123"/><text x="140" y="18">a</text><text x="140" y="150">b</text><text x="217" y="72">m</text>';
    if (type === "segments")
      extra +=
        '<path d="M35 130L205 25M265 130L95 25" stroke-dasharray="5 4"/>';
    else
      extra +=
        '<path d="M95 25V130M95 120h10v10" stroke-dasharray="4 3"/><text x="100" y="110">h</text>';
  }
  return `<svg viewBox="0 0 300 160" role="img" aria-label="${type === "segments" ? "Диагональ делит среднюю линию трапеции" : "Схема фигуры и обозначения"}; рисунок не в масштабе"><g fill="none" stroke="currentColor" stroke-width="2.5"><path d="${shape}"/>${extra}</g></svg>`;
}
function propertiesTable() {
  return `<section class="card"><h2>Быстрое сравнение</h2><div class="table-scroll"><table><thead><tr><th>Фигура</th><th>Диагонали равны</th><th>Все стороны равны</th><th>Все углы равны</th><th>Пары параллельных сторон</th></tr></thead><tbody>${[
    ["Параллелограмм", "Не всегда", "Не всегда", "Не всегда", "2"],
    ["Прямоугольник", "Да", "Не всегда", "Да, по 90°", "2"],
    ["Ромб", "Не всегда", "Да", "Не всегда", "2"],
    ["Квадрат", "Да", "Да", "Да, по 90°", "2"],
    ["Трапеция", "Не всегда", "Нет", "Нет", "1"],
    ["Равнобедренная трапеция", "Да", "Нет", "Нет", "1"],
  ]
    .map(
      (row) =>
        `<tr>${row.map((cell, i) => (i ? `<td>${cell}</td>` : `<th scope="row">${cell}</th>`)).join("")}</tr>`,
    )
    .join(
      "",
    )}</tbody></table></div><p class="muted">«Не всегда» значит: свойство бывает у частного случая, но не у любой фигуры этого типа. Таблицу можно прокрутить вбок.</p></section>`;
}
