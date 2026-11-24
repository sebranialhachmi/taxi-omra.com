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

// Service claims the owner could not confirm as stated: Wi-Fi in cars (none), bottled water (sometimes),
// a fixed 60 minutes of free waiting (depends on the agreement made at booking).
const SERVICE_RULES = [
  // Wi-Fi: drop FAQ blocks, table rows and list fragments
  [/<h3>Is Wi-Fi available in the vehicles\?<\/h3>\s*<p>[\s\S]*?<\/p>\s*/g, ""],
  [/<h3>هل تتوفر خدمة الواي فاي في السيارات؟<\/h3>\s*<p>[\s\S]*?<\/p>\s*/g, ""],
  [/<tr>\s*<td>Wi-Fi Service<\/td>\s*<td>[\s\S]*?<\/td>\s*<\/tr>\s*/g, ""],
  [/<tr>\s*<td>خدمة الواي فاي<\/td>\s*<td>[\s\S]*?<\/td>\s*<\/tr>\s*/g, ""],
  [/نظام تكييف ممتاز وخدمة الواي فاي \(حسب توفرها في السيارة\)\./g, "نظام تكييف ممتاز."],
  // water
  [/Complimentary bottled water for (?:your comfort|the long journey)\./g, "Water on board when available."],
  [/مياه شرب باردة ومناديل معقمة داخل المركبة\./g, "مياه شرب عند التوفر."],
  [/توفير مياه شرب باردة وخدمة إنترنت \(حسب التوفر\)/g, "توفير مياه شرب (حسب التوفر)"],
  // free waiting time: agreed at booking
  [/Sixty minutes of free waiting starts after landing/g, "The free waiting time agreed at booking starts after landing"],
  [/(?:sixty|60) minutes of free waiting starts? (?:at|after) (landing|touchdown)/gi, "the free waiting time agreed at booking starts after $1"],
  [/Free waiting is 60 minutes from actual landing/g, "Free waiting is as agreed at booking, counted from actual landing"],
  [/(?:sixty|60) minutes of free waiting( time)?/gi, "free waiting time as agreed at booking"],
  [/(?:sixty|60) min(?:ute)?s? free wait(?:ing)?( time)?/gi, "free waiting as agreed"],
  [/الانتظار المجاني 60 دقيقة من الهبوط الفعلي/g, "الانتظار المجاني حسب الاتفاق عند الحجز ويُحسب من الهبوط الفعلي"],
  [/انتظار مجاني لمدة 60 دقيقة/g, "انتظار مجاني حسب الاتفاق عند الحجز"],
  [/(?:60|٦٠|ستين|ستون) دقيقة (?:انتظار )?مجانية?/g, "انتظار مجاني حسب الاتفاق عند الحجز"],
  [/60 دقيقة انتظار مجانية تبدأ/g, "الانتظار المجاني حسب الاتفاق يبدأ"],
  [/(?:Complimentary|Free) Waiting Time:\s*(?:Up to )?(?:60|sixty) minutes(?: of complimentary waiting)?/g, "Free Waiting Time: as agreed at booking,"],
  [/(Complimentary|Free) Waiting Time:(<\/strong>)?\s*(?:Enjoy |Up to )?(?:60|sixty) minutes(?: of complimentary waiting(?: time)?)?/g, "Free Waiting Time:$2 as agreed at booking,"],
  [/The 60-minute free waiting period begins/g, "The free waiting period agreed at booking begins"],
  [/[Yy]our 60-minute free waiting period starts/g, "Your agreed free waiting period starts"],
  [/a 60-minute complimentary waiting window/g, "a free waiting window agreed at booking"],
  [/فترة انتظار مجانية مدتها 60 دقيقة/g, "فترة انتظار مجانية حسب الاتفاق"],
  [/خدمة انتظار مجانية لمدة 60 دقيقة/g, "خدمة انتظار مجاني حسب الاتفاق عند الحجز"],
  [/60 Minutes Waiting Time:/g, "Waiting Time:"],
  [/ and 15 minutes for hotel pickups/g, " and for hotel pickups"],
  [/، مقعد طفل\.\.\./g, "..."],
  [/, child seat\.\.\./g, "..."],
  [/و15 دقيقة عند الفنادق/g, "وعند الفنادق"],
  [/a complimentary 60-minute waiting period/g, "free waiting time agreed at booking"],
  [/your 60-minute free waiting (time|window)/g, "your agreed free waiting $1"],
  [/an? (?:generous )?60-minute free waiting (grace period|policy)/g, "a free waiting $1 agreed at booking"],
  [/What if I need more than the 60 free minutes after landing\?/g, "What if I need more than the free waiting time after landing?"],
  [/The first 60 minutes are free and start from the actual landing time/g, "The free waiting time agreed at booking starts from the actual landing time"],
  [/your 60 free minutes start from touchdown/g, "your free waiting time starts from touchdown"],
  [/the 60 free minutes/g, "the free waiting time"],
  [/60 free minutes/g, "free waiting time"],
  [/الدقائق الستون الأولى مجانية وتبدأ من الهبوط الفعلي/g, "مدة الانتظار المجاني المتفق عليها تبدأ من الهبوط الفعلي"],
  [/ثم تبدأ الدقائق الستون المجانية من لحظة الهبوط/g, "ثم تبدأ مدة الانتظار المجاني من لحظة الهبوط"],
  [/نوفر ساعة كاملة \(60 دقيقة\) انتظار مجاني/g, "نوفر انتظارًا مجانيًا حسب الاتفاق عند الحجز"],
  [/مجاناً لمدة تصل إلى 60 دقيقة/g, "مجاناً لمدة يُتفق عليها عند الحجز"],
  [/ننتظر وصولك لمدة 60 دقيقة كاملة بعد هبوط الطائرة/g, "ننتظر وصولك بعد هبوط الطائرة خلال مدة الانتظار المجاني المتفق عليها"],
  [/فترة انتظار مجانية تصل إلى 60 دقيقة/g, "فترة انتظار مجانية حسب الاتفاق"],
  [/السائق سينتظرك لمدة 60 دقيقة مجاناً/g, "السائق سينتظرك مجاناً حسب المدة المتفق عليها"],
  [/انتظار مجاني 60 دقيقة/g, "انتظار مجاني حسب الاتفاق"],
];


// Child seats: the owner does not offer them, so every sentence, FAQ block, list item or table row that
// promises or discusses one is removed. A question sentence takes its answer with it.
const SEAT =
  "child[\\s-]?seats?|infant seats?|baby seats?|car seats?|booster seats?|مقعد(?:\\s|‑)?(?:ال)?(?:أطفال|طفل|للأطفال)|مقاعد(?:\\s|‑)?(?:ال)?(?:أطفال|للأطفال|الأمان)|كرسي(?:\\s)?(?:ال)?أطفال|كراسي(?:\\s)?(?:ال)?أطفال|مقعد الأمان";
const SEAT_RE = new RegExp(SEAT, "i");
const stripTags = (h) => h.replace(/<[^>]+>/g, " ");
const NOT_END = (tag) => `(?:(?!<\\/${tag}>)[\\s\\S])*?`;

function dropSentences(inner) {
  const parts = inner.split(/(?<=[.!؟?])\s+/);
  const out = [];
  for (let i = 0; i < parts.length; i++) {
    if (!SEAT_RE.test(stripTags(parts[i]))) { out.push(parts[i]); continue; }
    // "special needs such as a child seat or a wheelchair": keep the sentence, drop only the seat
    if (/wheelchair|special|elderly|كرسي متحرك|احتياج|خاص|كبير سن|كبار السن/i.test(stripTags(parts[i])) && !/[؟?]\s*(<\/[a-z]+>)*$/i.test(parts[i].trim())) {
      const cleaned = parts[i]
        .replace(/(?:a )?child seat requests?,?\s*/gi, "")
        .replace(/(?:a |an |and |or |,\s*)*(?:child|infant|baby|booster) seats?(?:\s*(?:,|or|and))?\s*/gi, "")
        .replace(/such as wheelchair/gi, "such as a wheelchair")
        .replace(/:\s*(?:أو|،)\s+/g, ": ")
        .replace(/(?:(?:أو|،|و)\s*)?(?:مقعد|مقاعد|كرسي|كراسي)(?:\s|‑)?(?:ال)?(?:أطفال|طفل|للأطفال)(?:\s*(?:،|أو|و))?\s*/g, "");
      if (!SEAT_RE.test(stripTags(cleaned))) { out.push(cleaned); continue; }
    }
    if (/[؟?]\s*(<\/[a-z]+>)*$/i.test(parts[i].trim()) && i + 1 < parts.length) i++; // question + its answer
  }
  return out.join(" ");
}

export function stripChildSeats(html) {
  if (typeof html !== "string" || !SEAT_RE.test(html)) return html;
  let out = html;
  const heading = `<h[2-4][^>]*>${NOT_END("h[2-4]")}(?:${SEAT})${NOT_END("h[2-4]")}<\\/h[2-4]>\\s*(?:<p>(?:(?!<\\/p>)[\\s\\S])*<\\/p>)?\\s*`;
  out = out.replace(new RegExp(heading, "gi"), "");
  out = out.replace(new RegExp(`<li>${NOT_END("li")}(?:${SEAT})${NOT_END("li")}<\\/li>\\s*`, "gi"), "");
  out = out.replace(new RegExp(`<tr>${NOT_END("tr")}(?:${SEAT})${NOT_END("tr")}<\\/tr>\\s*`, "gi"), "");
  out = out.replace(/<p>((?:(?!<\/p>)[\s\S])*)<\/p>/g, (m, inner) => {
    if (!SEAT_RE.test(stripTags(inner))) return m;
    const kept = dropSentences(inner).trim();
    return kept ? `<p>${kept}</p>` : "";
  });
  if (SEAT_RE.test(stripTags(out)) && !/<[a-z]/i.test(out)) out = dropSentences(out); // plain strings (meta fields)
  return out.replace(/\n{3,}/g, "\n\n");
}

export function neutralClaims(html) {
  if (typeof html !== "string") return html;
  let out = html;
  for (const [re, to] of RULES) out = out.replace(re, to);
  for (const [re, to] of SERVICE_RULES) out = out.replace(re, to);
  return stripChildSeats(out);
}
