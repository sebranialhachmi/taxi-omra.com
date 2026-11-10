// Internal links inside the imported texts that point at URLs which never existed on this site.
const MAP = [
  [/(href=\\?["'])((?:https:\/\/taxi-omra\.com)?(?:\/(?:ar|en))?)\/fare-guide(?=["'#?])/g, "$2/guide/taxi-fares"],
  [/(href=\\?["'])((?:https:\/\/taxi-omra\.com)?(?:\/(?:ar|en))?)\/jeddah-airport-to-haram(?=["'#?])/g, "$2/blog/jeddah-airport-to-haram"],
];

const MOVED = [
  ["/p/airport-transfer", "/airport-transfers"],
  ["/p/hotel-transfer", "/services/hotel-transfer"],
  ["/p/corporate", "/services/corporate-transport"],
  ["/jeddah-airport-to-makkah-taxi", "/jeddah-to-makkah-taxi"],
  ["/makkah-to-jeddah-taxi", "/routes/makkah-to-jeddah"],
  ["/routes/makkah-to-madinah", "/makkah-to-madinah-taxi"],
  ["/routes/taif-to-makkah", "/taif-to-makkah-taxi"],
  ["/airports/airport-king-abdulaziz-international", "/jeddah-airport-taxi"],
  ["/airports/airport-transfer", "/airport-transfers"],
  ["/airports/king-abdulaziz-jed", "/jeddah-airport-taxi"],
  ["/airports/prince-mohammad-med", "/airports/airport-prince-mohammad-bin-abdulaziz"],
  ["/airports/airport-taif-tif", "/airports/airport-taif-international"],
];
for (const [from, to] of MOVED) {
  MAP.push([new RegExp(`(href=\\\\?["'])((?:https:\\/\\/taxi-omra\\.com)?(?:\\/(?:ar|en))?)${from.replace(/\//g, "\\/")}(?=["'#?])`, "g"), `$2${to}`]);
}

export function fixLinks(html) {
  if (typeof html !== "string") return html;
  let out = html;
  for (const [re, to] of MAP) out = out.replace(re, (_m, pre, base) => `${pre}${base}${to.replace("$2", "")}`);
  return out;
}
