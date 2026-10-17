// Chiffres des descriptions : police lisible, pastille colorée selon la ressource
// (Compute cyan, Scale rouge, Data violet, $ ambre). Styles : styles/fx.css.

const NUMBER = "[+\\-−]?\\d+(?:[.,]\\d+)?";
const PATTERN = new RegExp(
  "(\\d+×\\d+)" + // 1 : dimensions (5×5)
  "|(" + NUMBER + ")\\s*(Compute|Data|Scale|\\$|◆)" + // 2-3 : nombre + ressource
  "|(Compute|Data|Scale)\\s*(×\\s*\\d+(?:[.,]\\d+)?)" + // 4-5 : ressource ×N
  "|(×\\s*\\d+(?:[.,]\\d+)?)" + // 6 : multiplicateur seul
  "|(" + NUMBER + "\\s*%?)", // 7 : autre nombre
  "g",
);
const RESOURCE_CLASS = { Compute: "c", Data: "d", Scale: "s", $: "b", "◆": "d" };

export function FX(text) {
  if (typeof text !== "string" || !/\d/.test(text)) return text;
  const out = [];
  const re = new RegExp(PATTERN.source, "g");
  let last = 0;
  let key = 0;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    let className;
    if (m[1] || m[7]) className = "fx fx-n";
    else if (m[3]) className = "fx fx-p fx-" + RESOURCE_CLASS[m[3]];
    else if (m[4]) className = "fx fx-p fx-" + RESOURCE_CLASS[m[4]];
    else className = "fx fx-p fx-x";
    out.push(
      <span key={key++} className={className}>
        {m[0].replace(/\s+/g, " ")}
      </span>,
    );
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
