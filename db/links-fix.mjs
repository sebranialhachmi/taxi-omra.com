// Internal links inside the imported texts that point at URLs which never existed on this site.
const MAP = [
  [/(href=\\?["'])((?:https:\/\/taxi-omra\.com)?(?:\/(?:ar|en))?)\/fare-guide(?=["'#?])/g, "$2/guide/taxi-fares"],
  [/(href=\\?["'])((?:https:\/\/taxi-omra\.com)?(?:\/(?:ar|en))?)\/jeddah-airport-to-haram(?=["'#?])/g, "$2/blog/jeddah-airport-to-haram"],
];

export function fixLinks(html) {
  if (typeof html !== "string") return html;
  let out = html;
  for (const [re, to] of MAP) out = out.replace(re, (_m, pre, base) => `${pre}${base}${to.replace("$2", "")}`);
  return out;
}
