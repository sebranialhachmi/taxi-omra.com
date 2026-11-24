// The business has no commercial registration or transport licence yet, so the texts must not call the
// company or its drivers "licensed" (or the vehicles "insured"). Statements about third parties (licensed
// Hajj groups, airport metered taxis, advice to avoid unlicensed cars) stay.
const RULES = [
  // company-level claims
  [/Are your drivers licensed and the vehicles insured\?/g, "Who will be driving me?"],
  [/Yes, we are a fully licensed Saudi transport company\. All our vehicles are modern, regularly inspected, and fully insured\. Our drivers are experienced professionals/g, "Our drivers are experienced professionals"],
  [/\bpremier (<strong>)?licensed Saudi transport company\b/g, "premier $1transport service"],
  [/(Professional Driver:(?:<\/strong>)?) Licensed, experienced, and/g, "$1 Experienced and"],
  [/\bfully licensed Saudi transport company\b/g, "transport service"],
  [/\bmodern, regularly inspected, and fully insured\b/g, "modern and well kept"],
  [/<strong>Fuel and Insurance:<\/strong>/g, "<strong>Fuel:</strong>"],
  [/Fuel, insurance, and professional licensed driver\./g, "Fuel and a professional driver."],
  // drivers (English)
  [/\bFully licensed drivers\b/g, "Professional drivers"],
  [/\bProfessional Driver: Licensed, experienced, and\b/g, "Professional Driver: Experienced and"],
  [/\bLicensed Drivers:/g, "Professional Drivers:"],
  [/\bLicensed, courteous chauffeurs\b/g, "Courteous chauffeurs"],
  [/\bProfessional, licensed, and /g, "Professional, "],
  [/\bProfessional, licensed, route-knowledgeable\b/g, "Professional, route-knowledgeable"],
  [/\bProfessional, licensed /g, "Professional, "],
  [/\bprofessional licensed (driver|drivers|chauffeurs?)\b/gi, "professional $1"],
  [/\bProfessional licensed (driver|drivers)\b/g, "Professional $1"],
  [/\bProfessional, licensed driver\b/g, "Professional driver"],
  [/\bvetted, licensed, and\b/g, "vetted, and"],
  [/\bvetted, licensed,/g, "vetted,"],
  [/\blicensed, vetted\b/g, "vetted"],
  [/\blicensed, (professional|bilingual|experienced)\b/g, "$1"],
  [/\blicensed professionals\b/g, "professionals"],
  [/\blicensed, and (English)/g, "and $1"],
  [/\bare licensed, bilingual, and\b/g, "are bilingual and"],
  [/\bare licensed, bilingual\b/g, "are bilingual"],
  [/\blicensed (drivers|driver|chauffeurs|chauffeur)\b/gi, (m, w) => `professional ${w}`],
  // drivers (Arabic)
  [/محترفون، مرخصون،/g, "محترفون،"],
  [/محترف ومرخص/g, "محترف"],
  [/مرخصون وموثقون/g, "محترفون وموثقون"],
  [/مرخصون/g, "محترفون"],
  [/مرخصين/g, "محترفين"],
];

export function neutralClaims(html) {
  if (typeof html !== "string") return html;
  let out = html;
  for (const [re, to] of RULES) out = out.replace(re, to);
  return out;
}
