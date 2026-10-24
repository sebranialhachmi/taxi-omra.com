// Generates substantive, page-specific supporting content for CMS detail pages
// (routes, services, cities, airports). CMS bodies are often short, which made
// these pages look thin to search engines (soft 404). Every section below is
// derived from the page's own data so the output stays unique per URL.

export type Locale = "ar" | "en";

export interface DetailPageData {
  slug: string;
  page_type: string;
  title_ar: string;
  title_en: string;
  subtitle_ar: string | null;
  subtitle_en: string | null;
  body_ar: string | null;
  body_en: string | null;
}

export interface FactRow {
  label: string;
  value: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PageSections {
  intro: string[];
  facts: FactRow[];
  included: string[];
  steps: string[];
  faq: FaqItem[];
  headings: {
    overview: string;
    facts: string;
    included: string;
    steps: string;
    faq: string;
  };
}

function num(re: RegExp, s: string | null | undefined): string | null {
  if (!s) return null;
  const m = s.match(re);
  return m ? m[1] : null;
}

/** Split "A to B Taxi Transfer" / "A إلى B" into endpoints when possible. */
function endpoints(title: string, locale: Locale): { from: string; to: string } | null {
  const sep = locale === "ar" ? /\s+إلى\s+/ : /\s+to\s+/i;
  const cleaned = title
    .replace(/\s*(Taxi Transfer|Taxi|تاكسي|توصيل)\s*$/i, "")
    .trim();
  const parts = cleaned.split(sep);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return { from: parts[0].trim(), to: parts[1].trim() };
  }
  return null;
}

export function buildPageSections(page: DetailPageData, locale: Locale): PageSections {
  const ar = locale === "ar";
  const title = ar ? page.title_ar : page.title_en;
  
  const en = page.subtitle_en ?? "";

  const distance = num(/(\d+)\s*km/i, en);
  const minutes = num(/approx\s*(\d+)\s*minutes/i, en);
  const price = num(/SAR\s*(\d+)/i, en);
  const pair = endpoints(ar ? page.title_ar : page.title_en, locale);

  const brand = ar ? "تاكسي العمرة" : "Umrah Taxi Saudi";
  const type = page.page_type;

  // ---------- Intro paragraphs ----------
  const intro: string[] = [];
  if (type === "route_page" && pair) {
    intro.push(
      ar
        ? `خدمة نقل خاصة بسائق محترف من ${pair.from} إلى ${pair.to}. يتم تحديد السعر مسبقاً قبل انطلاق الرحلة، بدون عدّاد وبدون رسوم مفاجئة، ويشمل السعر السيارة كاملة لك ولمرافقيك وأمتعتك.`
        : `A private, chauffeur-driven transfer from ${pair.from} to ${pair.to}. The fare is agreed before departure — no meter, no surprise charges — and covers the whole vehicle for you, your companions and your luggage.`,
    );
    intro.push(
      ar
        ? `${distance ? `تبلغ مسافة الطريق نحو ${distance} كم ` : ""}${minutes ? `وتستغرق الرحلة قرابة ${minutes} دقيقة حسب حالة الطريق ونقاط التفتيش. ` : ""}يمكن ترتيب الرحلة في أي وقت من اليوم، بما في ذلك الرحلات الليلية والوصول المتأخر، مع إمكانية التوقف القصير عند الحاجة.`
        : `${distance ? `The drive covers roughly ${distance} km ` : ""}${minutes ? `and takes about ${minutes} minutes depending on traffic and checkpoints. ` : ""}Transfers can be arranged at any hour, including overnight departures and late arrivals, with short comfort stops on request.`,
    );
    intro.push(
      ar
        ? `نخدم الحجاج والمعتمرين والعائلات ورجال الأعمال، ونوفّر مقاعد أطفال عند الطلب وسيارات بسعات مختلفة تبدأ من سيارة السيدان وحتى الميني باص للمجموعات الكبيرة.`
        : `We serve Umrah and Hajj pilgrims, families and business travellers, with child seats on request and vehicle sizes ranging from a private sedan to a minibus for larger groups.`,
    );
  } else if (type === "airport") {
    intro.push(
      ar
        ? `${title} — استقبال داخل صالة الوصول مع لوحة باسمك، ومتابعة لرقم الرحلة حتى في حال التأخير، ثم التوجّه مباشرة إلى وجهتك دون انتظار في طوابير سيارات الأجرة.`
        : `${title}. Your driver meets you inside the arrivals hall with a name board, tracks your flight number in case of delay, and takes you straight to your destination without queuing for a street taxi.`,
    );
    intro.push(
      ar
        ? `يشمل السعر وقت انتظار مجاني بعد هبوط الطائرة، والمساعدة في حمل الأمتعة، ومياه مجانية داخل السيارة. يمكنك أيضاً حجز رحلة المغادرة مسبقاً لضمان الوصول للمطار في الوقت المناسب.`
        : `The fare includes free waiting time after landing, luggage assistance and complimentary water on board. Departure transfers can be booked in advance so you reach the terminal with time to spare.`,
    );
  } else if (type === "city") {
    intro.push(
      ar
        ? `نوفّر في ${title} خدمة نقل خاصة بسائق على مدار الساعة: تنقلات داخل المدينة، ونقل من وإلى المطار، ورحلات بين المدن بأسعار ثابتة متفق عليها مسبقاً.`
        : `In ${title} we operate a 24/7 private chauffeur service: journeys within the city, airport transfers, and intercity trips at fixed fares agreed in advance.`,
    );
    intro.push(
      ar
        ? `يمكنك حجز رحلة فردية أو استئجار سيارة بسائق بالساعة أو ليوم كامل، مع سائقين يعرفون طرق المدينة وفنادقها ومواقعها الرئيسية.`
        : `Book a single journey, or hire a car with driver by the hour or for a full day, with drivers who know the city's roads, hotels and main landmarks.`,
    );
  } else {
    intro.push(
      ar
        ? `${title}: خدمة منظّمة بأسعار ثابتة وسائقين محترفين وسيارات حديثة نظيفة، مع تأكيد فوري للحجز عبر واتساب أو الهاتف.`
        : `${title}: an organised service with fixed pricing, professional drivers and clean modern vehicles, confirmed instantly over WhatsApp or by phone.`,
    );
    intro.push(
      ar
        ? `نعمل على مدار الساعة طوال أيام الأسبوع، ويمكن تعديل موعد الرحلة أو إلغاؤها مسبقاً دون تعقيد.`
        : `We operate around the clock, seven days a week, and bookings can be rescheduled or cancelled in advance without hassle.`,
    );
  }
  // The page hero renders the subtitle and each page renders its own CMS body,
  // so neither is repeated inside the generated overview.

  // ---------- Facts ----------
  const facts: FactRow[] = [];
  if (pair) {
    facts.push({ label: ar ? "نقطة الانطلاق" : "Pickup", value: pair.from });
    facts.push({ label: ar ? "الوجهة" : "Drop-off", value: pair.to });
  }
  if (distance) facts.push({ label: ar ? "المسافة" : "Distance", value: `${distance} km` });
  if (minutes)
    facts.push({
      label: ar ? "مدة الرحلة التقريبية" : "Approx. duration",
      value: ar ? `${minutes} دقيقة` : `${minutes} minutes`,
    });
  if (price)
    facts.push({
      label: ar ? "السعر يبدأ من" : "Fare from",
      value: ar ? `${price} ريال` : `SAR ${price}`,
    });
  facts.push({
    label: ar ? "نوع الخدمة" : "Service type",
    value: ar ? "سيارة خاصة بسائق" : "Private car with driver",
  });
  facts.push({
    label: ar ? "التوفر" : "Availability",
    value: ar ? "٢٤ ساعة / ٧ أيام" : "24/7, including holidays",
  });

  // ---------- Included ----------
  const included = ar
    ? [
        "سائق محترف يتحدث العربية والإنجليزية",
        "سيارة خاصة كاملة لك ولمرافقيك",
        "سعر ثابت متفق عليه قبل الرحلة",
        "مساعدة في حمل الأمتعة ومياه مجانية",
        "متابعة الرحلة وتأكيد فوري عبر واتساب",
        "مقعد أطفال عند الطلب دون رسوم إضافية",
      ]
    : [
        "Professional driver speaking Arabic and English",
        "The entire private vehicle for your party",
        "Fixed fare agreed before the journey starts",
        "Luggage assistance and complimentary water",
        "Instant confirmation and follow-up on WhatsApp",
        "Child seat on request at no extra cost",
      ];

  // ---------- Steps ----------
  const steps = ar
    ? [
        "أرسل لنا تفاصيل الرحلة: التاريخ والوقت ونقطة الانطلاق والوجهة وعدد الركاب.",
        "نؤكد السعر النهائي ونوع السيارة المناسب لعدد الركاب والأمتعة.",
        "تصلك بيانات السائق ورقم السيارة قبل موعد الرحلة.",
        "يصل السائق في الوقت المحدد، والدفع نقداً أو تحويلاً بعد الوصول.",
      ]
    : [
        "Send us the trip details: date, time, pickup point, destination and number of passengers.",
        "We confirm the final fare and the vehicle that fits your group and luggage.",
        "You receive the driver's details and the car number before pickup.",
        "The driver arrives on time; pay in cash or by transfer on completion.",
      ];

  // ---------- FAQ ----------
  const faq: FaqItem[] = [];
  if (pair) {
    faq.push({
      q: ar
        ? `كم تكلفة التاكسي من ${pair.from} إلى ${pair.to}؟`
        : `How much is a taxi from ${pair.from} to ${pair.to}?`,
      a: price
        ? ar
          ? `تبدأ الأسعار من ${price} ريال سعودي للسيارة الخاصة، ويختلف السعر حسب نوع السيارة وعدد الركاب والأمتعة. السعر ثابت ويُتفق عليه قبل الانطلاق.`
          : `Fares start from SAR ${price} for a private car. The final price depends on the vehicle class, passenger count and luggage, and is fixed before departure.`
        : ar
          ? `يتم تحديد السعر مسبقاً حسب نوع السيارة وعدد الركاب، ويمكنك طلب عرض السعر عبر واتساب خلال دقائق.`
          : `The fare is quoted in advance based on vehicle class and passenger count; request a quote on WhatsApp and we reply within minutes.`,
    });
    faq.push({
      q: ar
        ? `كم تستغرق الرحلة من ${pair.from} إلى ${pair.to}؟`
        : `How long does the journey from ${pair.from} to ${pair.to} take?`,
      a:
        minutes || distance
          ? ar
            ? `تستغرق الرحلة نحو ${minutes ?? "—"} دقيقة لمسافة تقارب ${distance ?? "—"} كم، وقد تزيد قليلاً في أوقات الذروة أو مواسم الحج والعمرة.`
            : `The trip takes around ${minutes ?? "—"} minutes over roughly ${distance ?? "—"} km, and may run slightly longer during peak hours or the Hajj and Umrah seasons.`
          : ar
            ? `تعتمد المدة على حالة الطريق ونقاط التفتيش، ويخبرك السائق بالتوقيت المتوقع قبل الانطلاق.`
            : `Duration depends on traffic and checkpoints; your driver confirms the expected timing before departure.`,
    });
  } else {
    faq.push({
      q: ar ? `كيف أحجز ${title}؟` : `How do I book ${title}?`,
      a: ar
        ? `أرسل تفاصيل رحلتك عبر واتساب أو اتصل بنا مباشرة، وستحصل على السعر النهائي وتأكيد الحجز خلال دقائق.`
        : `Send your trip details on WhatsApp or call us directly; you receive the final fare and a booking confirmation within minutes.`,
    });
    faq.push({
      q: ar ? "هل الأسعار ثابتة؟" : "Are the fares fixed?",
      a: ar
        ? `نعم، السعر يُتفق عليه قبل الرحلة ولا يتغير بسبب الازدحام أو المسار، ولا نستخدم العدّاد.`
        : `Yes. The price is agreed before the trip and does not change with traffic or routing — we do not use a meter.`,
    });
  }
  faq.push({
    q: ar ? "هل الخدمة متاحة ليلاً؟" : "Is the service available at night?",
    a: ar
      ? `نعم، الخدمة متاحة على مدار ٢٤ ساعة طوال أيام الأسبوع، بما في ذلك الرحلات المبكرة والوصول المتأخر.`
      : `Yes, we operate 24 hours a day, seven days a week, including very early departures and late-night arrivals.`,
  });
  faq.push({
    q: ar ? "ما أنواع السيارات المتاحة؟" : "What vehicles are available?",
    a: ar
      ? `سيارات سيدان (حتى ٣ ركاب)، ودفع رباعي/GMC (حتى ٦ ركاب)، وهايس أو ميني باص للمجموعات والعائلات الكبيرة مع مساحة واسعة للأمتعة.`
      : `Sedans for up to 3 passengers, SUV/GMC for up to 6, and Hiace or minibus options for larger families and groups with generous luggage space.`,
  });
  faq.push({
    q: ar ? "كيف يتم الدفع؟" : "How is payment handled?",
    a: ar
      ? `يمكنك الدفع نقداً للسائق أو عبر التحويل البنكي بعد إتمام الرحلة، ولا نطلب دفعة مقدمة في الحجوزات العادية.`
      : `Pay the driver in cash or by bank transfer after the journey. No prepayment is required for standard bookings.`,
  });

  return {
    intro,
    facts,
    included,
    steps,
    faq,
    headings: {
      overview: ar ? "نظرة عامة على الخدمة" : "Service overview",
      facts: ar ? "تفاصيل الرحلة" : "Trip details",
      included: ar ? "ما الذي يشمله السعر" : "What is included",
      steps: ar ? "كيف تحجز خطوة بخطوة" : "How to book, step by step",
      faq: ar ? "أسئلة شائعة" : "Frequently asked questions",
    },
  };
}

/** FAQPage JSON-LD built from the same generated questions. */
export function faqJsonLdFor(page: DetailPageData, locale: Locale) {
  const { faq } = buildPageSections(page, locale);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
