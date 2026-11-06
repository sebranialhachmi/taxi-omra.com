// Generates content/seed/post_extras.json: extra, practical sections appended to existing articles.
// Facts here are general travel knowledge (distances/durations are approximate); no business claims beyond
// what the site already states (fixed fare per car, WhatsApp confirmation, pay on arrival, 24/7).
import { writeFileSync } from "node:fs";

const sec = (h, ps, list) =>
  `<h2>${h}</h2>${ps.map((p) => `<p>${p}</p>`).join("")}${list ? `<ul>${list.map((l) => `<li>${l}</li>`).join("")}</ul>` : ""}`;
const wrap = (id, html, note) => `<!--x1:${id}-->${html}<p><em>${note}</em></p>`;
const NOTE_AR = "آخر مراجعة لهذه المعلومات: نوفمبر 2026. المسافات والأوقات تقريبية وتتغير بحسب الازدحام والمواسم.";
const NOTE_EN = "Last reviewed: November 2026. Distances and times are approximate and change with traffic and season.";
const X = {};
const add = (slug, ar, en) => { X[slug] = { ar: wrap(slug, ar, NOTE_AR), en: wrap(slug, en, NOTE_EN) }; };

add("jeddah-airport-taxi-fare",
  sec("ما الذي يحدد أجرة التاكسي من مطار جدة؟", [
    "الأجرة بين المطار ووجهتك تتأثر بثلاثة أمور رئيسية: المسافة، وفئة السيارة، وعدد الركاب والحقائب. المشوار إلى فندق داخل جدة يختلف عن المشوار إلى مكة أو المدينة أو الطائف، وسيارة السيدان لثلاثة ركاب تختلف عن سيارة عائلية لسبعة ركاب مع حقائب كثيرة.",
    "الأهم أن تعرف الرقم قبل أن تركب لا بعد أن تصل. اطلب تأكيد السعر مكتوبًا في رسالة واتساب، وتأكد أنه سعر للسيارة كلها وليس لكل راكب، وأنه يشمل الرحلة كاملة بلا عداد."]) +
  sec("خطوات الحصول على سعر واضح قبل وصولك", [], [
    "أرسل مكان الاستلام (المطار ورقم الصالة إن عرفتها) ووجهتك واسم الفندق.",
    "اذكر عدد الركاب وعدد الحقائب، ومعك أطفال أو كبار سن أم لا.",
    "أرسل رقم الرحلة ووقت الوصول ليُتابَع موعد هبوط الطائرة.",
    "احتفظ برسالة تأكيد السعر والاسم الذي سيحمل لوحتك في صالة الوصول."]) +
  sec("أخطاء شائعة تجعل الرحلة أغلى أو أبطأ", [
    "الاتفاق الشفهي عند باب المطار دون رقم واضح، وانتظار الخروج إلى الرصيف قبل البحث عن سيارة، وحجز سيارة صغيرة لعائلة معها حقائب كثيرة ثم اضطرار الركاب لسيارتين. فكّر في حجمك الحقيقي قبل أن تحجز: ثلاثة ركاب مع حقائب متوسطة يناسبهم سيدان، وأكثر من ذلك يحتاج سيارة عائلية."]),
  sec("What decides a taxi fare from Jeddah Airport", [
    "Three things drive the fare: distance, car class, and the number of passengers and bags. A ride to a hotel inside Jeddah is priced differently from a ride to Makkah, Madinah or Taif, and a sedan for three people differs from a family car for seven with heavy luggage.",
    "What matters most is knowing the number before you get in, not after you arrive. Ask for the price in writing on WhatsApp and confirm it is per car, not per passenger, and covers the whole trip with no meter."]) +
  sec("How to get a clear price before you land", [], [
    "Send the pickup point (the airport and your terminal if you know it), your destination and the hotel name.",
    "Give the number of passengers and bags, and say whether you travel with children or elderly relatives.",
    "Send your flight number and arrival time so the landing can be tracked.",
    "Keep the price confirmation and the name that will be on the sign in the arrivals hall."]) +
  sec("Common mistakes that cost time or money", [
    "Agreeing verbally at the airport door with no clear number, waiting until you reach the kerb to look for a car, and booking a small car for a family with heavy luggage and then needing two cars. Think about your real size first: three passengers with medium bags fit a sedan; more than that needs a family car."]));

add("jeddah-airport-to-haram",
  sec("كم تستغرق الرحلة من مطار جدة إلى الحرم المكي؟", [
    "المسافة من مطار الملك عبدالعزيز إلى منطقة الحرم تتراوح بين خمسة وثمانين ومئة كيلومتر تقريبًا بحسب المسار ونقطة الانطلاق، وتستغرق عادة ما بين ساعة وساعة ونصف في الظروف المعتادة. تطول المدة في ليالي رمضان وأيام الجمعة وفي مواسم العمرة الذروة، خصوصًا عند الاقتراب من محيط الحرم.",
    "إذا كنت تخطط للوصول إلى الفندق قبل موعد صلاة أو قبل موعد طواف محدد، فأضف نصف ساعة إضافية فوق التقدير."]) +
  sec("نصائح قبل الركوب في رحلة عمرة", [], [
    "تأكد أن عنوان الفندق مكتوب بالعربية والإنجليزية ومعه اسم الحي أو أقرب معلم.",
    "قد تُغلق بعض الشوارع القريبة من الحرم وقت الذروة، فيُنزلك السائق في أقرب نقطة يمكن الوصول إليها، ثم تكمل مشيًا قصيرًا. اسأل عن ذلك عند الحجز.",
    "إن كنت ستحرم فجهّز لباس الإحرام قبل الوصول، وإن كنت قادمًا جوًا فاسأل شركة الطيران أو مرشدك عن موضع الإحرام قبل محاذاة الميقات.",
    "احتفظ بحقيبة صغيرة معك فيها المستندات والأدوية، ولا تضعها في صندوق السيارة."]) +
  sec("متى تغادر الفندق للعودة إلى المطار؟", [
    "لا تحسب الوقت من لحظة الخروج من الحرم. اترك على الأقل أربع ساعات قبل رحلة دولية بعد طواف الوداع، لأن الازدحام قرب الحرم وإجراءات المطار يستهلكان وقتًا. هذه القاعدة وحدها تمنع أغلب حالات تفويت الطائرة."]),
  sec("How long is the ride from Jeddah Airport to the Haram?", [
    "The distance from King Abdulaziz Airport to the Haram area is roughly 85 to 100 kilometres depending on the route and starting point, usually between one hour and an hour and a half in normal conditions. It takes longer on Ramadan nights, Fridays and peak Umrah periods, especially near the Haram itself.",
    "If you plan to reach your hotel before a prayer or a fixed tawaf time, add another half hour on top of the estimate."]) +
  sec("Tips before you get in for an Umrah trip", [], [
    "Have the hotel address written in Arabic and English, with the district or nearest landmark.",
    "Some streets near the Haram close at peak times, so the driver may drop you at the nearest reachable point and you walk a short way. Ask about this when booking.",
    "If you will enter ihram, prepare the clothes before arrival, and if you travel by air ask your airline or guide where to make the intention before the miqat is passed.",
    "Keep a small bag with documents and medicine with you instead of in the boot."]) +
  sec("When to leave the hotel for the airport", [
    "Do not count from the moment you leave the Haram. Leave at least four hours before an international flight after the farewell tawaf, because traffic near the Haram and airport procedures take time. This rule alone prevents most missed flights."]));

add("makkah-to-jeddah-airport-transfer",
  sec("كيف تخطط لرحلة العودة من مكة إلى مطار جدة؟", [
    "الخطأ الأشهر هو حساب وقت الطريق فقط. الواقع أن الرحلة تتكون من ثلاثة أجزاء: الخروج من محيط الحرم والفندق، والطريق السريع إلى جدة، ثم إجراءات المطار. الجزء الأول هو الأقل توقعًا في أوقات الذروة.",
    "للرحلات الدولية اترك أربع ساعات على الأقل بين لحظة انطلاق السيارة ووقت إقلاع الطائرة، وللرحلات الداخلية ثلاث ساعات. وإن كانت رحلتك فجرًا أو بعد منتصف الليل فتأكد من توفر السيارة في الوقت نفسه قبل اليوم بيوم."]) +
  sec("قائمة ما تتأكد منه قبل المغادرة", [], [
    "رقم الصالة في المطار حسب شركة الطيران، فمكان التنزيل يختلف.",
    "إتمام طواف الوداع قبل موعد السيارة بوقت كافٍ لا بالتزامن معه.",
    "شحن الهاتف وتفعيل الاتصال بالسائق عبر واتساب قبل الموعد بنصف ساعة.",
    "إخراج الحقائب من الغرفة وتسليم المفتاح مسبقًا حتى لا يتأخر الخروج."]),
  sec("Planning the return from Makkah to Jeddah Airport", [
    "The most common mistake is counting only the road time. The trip really has three parts: leaving the Haram area and hotel, the highway to Jeddah, then airport procedures. The first part is the least predictable at peak times.",
    "For international flights leave at least four hours between the car leaving and take-off, and three hours for domestic flights. If your flight is at dawn or after midnight, confirm the car for that exact time the day before."]) +
  sec("What to check before leaving", [], [
    "Your terminal at the airport, which depends on the airline, because the drop-off point differs.",
    "Finish the farewell tawaf well before the car arrives, not at the same time.",
    "Charge your phone and be reachable by WhatsApp half an hour before pickup.",
    "Bring bags out of the room and return the key early so the exit is not delayed."]));

add("airport-pickup-saudi",
  sec("كيف يتم الاستقبال في صالة الوصول؟", [
    "الاستقبال الجيد يبدأ قبل الهبوط: اسم الراكب كما في الجواز، ورقم الرحلة، ووقت الوصول، ورقم هاتف يعمل فور الهبوط. بعد الهبوط تمر بإجراءات الجوازات والحقائب، وهذه قد تستغرق من نصف ساعة إلى ساعتين حسب الازدحام، ولهذا من المهم أن يكون موعد الاستلام مرنًا ومرتبطًا بموعد الهبوط لا بساعة ثابتة.",
    "عند الخروج من صالة الوصول ابحث عن لوحة بها اسمك، وإن لم تجدها فراسل السائق على واتساب بدل التجول طويلًا بالحقائب."]) +
  sec("نصائح لأول زيارة", [], [
    "فعّل شريحة بيانات أو باقة تجوال قبل السفر حتى تتواصل فور الوصول.",
    "احتفظ بنسخة من حجز الفندق وعنوانه بالعربية.",
    "إذا تأخرت رحلتك فأخبر السائق مباشرة ولا تنتظر وصولك للمطار.",
    "اسأل عن مكان الانتظار المجاني وطريقة تمديده عند التأخير."]),
  sec("How arrivals pickup works", [
    "A good pickup starts before you land: the passenger name as in the passport, the flight number, arrival time and a phone number that works as soon as you land. After landing you pass immigration and baggage, which can take from half an hour to two hours depending on crowds, so pickup should be tied to the landing, not to a fixed clock time.",
    "When you leave the arrivals hall look for a sign with your name. If you cannot see it, message the driver on WhatsApp instead of wandering with your bags."]) +
  sec("Tips for a first visit", [], [
    "Activate a data plan or roaming before you travel so you are reachable on arrival.",
    "Keep a copy of the hotel booking and its address in Arabic.",
    "If your flight is delayed, tell the driver straight away rather than waiting until you reach the airport.",
    "Ask where the free waiting applies and how it is extended if you are delayed."]));

add("jeddah-to-makkah-transfer",
  sec("متى تتحرك من جدة إلى مكة لتتجنب الازدحام؟", [
    "المسافة بين وسط جدة ومكة نحو ثمانين كيلومترًا وتقطع غالبًا في ساعة تقريبًا، لكن الازدحام يغيّر ذلك. أسوأ الأوقات عادة قبيل صلاة الجمعة وفي ليالي رمضان وفي نهاية الأسبوع في مواسم العمرة. التحرك بعد الفجر أو في منتصف النهار أخف في الغالب.",
    "إذا كنت في عمرة قصيرة فتأكد من توقيت الطواف والسعي، واجعل السيارة تنتظرك أو احجز موعد العودة مسبقًا حتى لا تبحث عن سيارة وسط الزحام عند خروجك."]) +
  sec("ما الذي تسأل عنه عند الحجز؟", [], [
    "هل الأجرة للسيارة كلها وهل تشمل الانتظار؟",
    "نقطة النزول القريبة من فندقك أو من الحرم وهل هي قابلة للوصول بالسيارة.",
    "مدة الانتظار المسموحة إن كنت ستؤدي العمرة وتعود في اليوم نفسه.",
    "سعة السيارة للحقائب إذا كنت قادمًا من المطار ومعك أمتعة كبيرة."]),
  sec("When to leave Jeddah for Makkah to avoid congestion", [
    "The distance from central Jeddah to Makkah is about eighty kilometres and is usually covered in around an hour, but traffic changes that. The worst times are usually just before Friday prayer, on Ramadan nights and at weekends in Umrah season. Leaving after dawn or around midday is often lighter.",
    "On a short Umrah, check the timing of tawaf and sa'i, and either have the car wait or book the return in advance so you do not hunt for a car in the crowds when you come out."]) +
  sec("What to ask when booking", [], [
    "Is the fare for the whole car and does it include waiting?",
    "The drop-off point closest to your hotel or the Haram and whether cars can reach it.",
    "How long the car may wait if you perform Umrah and return the same day.",
    "Boot space for luggage if you are coming from the airport with large bags."]));

add("jeddah-airport-to-madinah-transfer",
  sec("الطريق من مطار جدة إلى المدينة المنورة بالسيارة", [
    "المسافة نحو أربعمئة وعشرين كيلومترًا وتستغرق عادة أربع إلى خمس ساعات حسب التوقف والازدحام، ويمكن أن تطول إذا توقفتم للصلاة أو للراحة. الرحلة طويلة، ولذلك تفرق جودة التخطيط فيها أكثر من الرحلات القصيرة.",
    "إذا كنت قادمًا من رحلة طويلة فإن الجلوس خمس ساعات إضافية متعب، فاسأل عن إمكانية التوقف للصلاة والراحة، وجهّز ماءً ووجبة خفيفة. كبار السن والأطفال يحتاجون توقفًا أكثر."]) +
  sec("بدائل تستحق المقارنة", [
    "يوجد قطار الحرمين السريع الذي يربط جدة ومكة والمدينة، وقد يكون أسرع على الطريق الكامل لكنه مرتبط بمحطات ومواعيد محددة، وتحتاج إلى نقل من المحطة إلى فندقك. السيارة الخاصة مناسبة حين يكون معك حقائب كثيرة أو عائلة، أو حين تريد الانتقال من باب إلى باب."]),
  sec("The road from Jeddah Airport to Madinah by car", [
    "The distance is about four hundred and twenty kilometres and usually takes four to five hours depending on stops and traffic, longer if you stop for prayer or rest. It is a long trip, so planning matters more than on short rides.",
    "If you are arriving from a long flight, five more hours seated is tiring. Ask about stops for prayer and rest and keep water and a light snack. Elderly travellers and children need more breaks."]) +
  sec("Alternatives worth comparing", [
    "The Haramain high-speed train links Jeddah, Makkah and Madinah and can be faster over the full route, but it depends on fixed stations and schedules and you need a transfer from the station to your hotel. A private car suits you when you have heavy luggage or a family, or want door to door."]));

add("umrah-transport-jeddah",
  sec("ما الذي تحتاج إلى تنسيقه في تنقلات العمرة انطلاقًا من جدة؟", [
    "أغلب المعتمرين يبدؤون برحلتهم من مطار جدة ثم ينتقلون إلى مكة، وبعدها قد يزورون المدينة أو يعودون إلى جدة للمغادرة. التنقل هنا ليس رحلة واحدة بل سلسلة ينبغي ربط مواعيدها: الوصول، ثم مكة، ثم المدينة إن وجدت، ثم العودة إلى المطار."]) +
  sec("تسلسل رحلة عمرة نموذجية", [], [
    "الوصول إلى مطار جدة واستقبال في صالة الوصول.",
    "الانتقال إلى فندق مكة ثم أداء العمرة.",
    "زيارة المدينة المنورة بالسيارة أو بالقطار إن رغبت.",
    "العودة إلى جدة قبل الرحلة الدولية بأربع ساعات على الأقل."]) +
  sec("نصيحة تنظيمية", [
    "اكتب جدول رحلتك كله ثم أرسله دفعة واحدة عند الحجز: التواريخ والمدن والفنادق وعدد الركاب. هكذا يتأكد لك السعر والتوفر مسبقًا ولا تفاجأ بتغيير الأسعار في موسم الذروة."]),
  sec("What to coordinate for Umrah transport starting in Jeddah", [
    "Most pilgrims start at Jeddah airport, move to Makkah, may then visit Madinah or return to Jeddah to leave. Transport here is not one trip but a chain whose times must connect: arrival, Makkah, Madinah if included, then back to the airport."]) +
  sec("The sequence of a typical Umrah trip", [], [
    "Arrive at Jeddah airport and be met in the arrivals hall.",
    "Move to your Makkah hotel and perform Umrah.",
    "Visit Madinah by car or by train if you wish.",
    "Return to Jeddah at least four hours before the international flight."]) +
  sec("A practical tip", [
    "Write your whole itinerary and send it in one message when booking: dates, cities, hotels and passenger count. That way price and availability are confirmed in advance and you are not surprised by peak-season changes."]));

add("umrah-transport-guide-2026",
  sec("كيف تختار وسيلة النقل المناسبة لرحلة العمرة؟", [
    "لا توجد وسيلة أفضل للجميع. القطار السريع بين مكة والمدينة وجدة مناسب لمن يسافر وحده أو بحقائب قليلة، والحافلات مناسبة للمجموعات الكبيرة، والسيارة الخاصة مناسبة للعائلات وكبار السن ولمن معه أمتعة كثيرة أو يريد التنقل من الباب إلى الباب."]) +
  sec("مقارنة سريعة", [], [
    "<strong>القطار:</strong> سريع بين المدن، لكن تحتاج إلى نقل من المحطة وإلى الالتزام بالمواعيد.",
    "<strong>الحافلة:</strong> اقتصادية للمجموعات، وأقل مرونة في التوقف والمواعيد.",
    "<strong>السيارة الخاصة:</strong> مرونة في الوقت والتوقف، ومريحة للعائلات والحقائب.",
    "<strong>مشاوير قصيرة داخل المدينة:</strong> الأفضل سيارة بسعر مؤكد مسبقًا."]) +
  sec("تصريح العمرة وتسجيل الرحلة", [
    "تُنظَّم العمرة عبر منصة نسك وتطبيقها، فتأكد من تصريحك وموعد دخولك قبل أن تحجز التنقلات، حتى تتوافق مواعيد الوصول والمغادرة مع تصريحك."]),
  sec("How to choose the right transport for an Umrah trip", [
    "No option is best for everyone. The high-speed train between Makkah, Madinah and Jeddah suits a solo traveller with few bags, buses suit large groups, and a private car suits families, elderly travellers, people with heavy luggage or those who want door to door."]) +
  sec("A quick comparison", [], [
    "<strong>Train:</strong> fast between cities, but you need a transfer from the station and must keep to the schedule.",
    "<strong>Bus:</strong> economical for groups, less flexible on stops and timing.",
    "<strong>Private car:</strong> flexible on time and stops, comfortable for families and luggage.",
    "<strong>Short city trips:</strong> best with a car whose price is confirmed beforehand."]) +
  sec("Umrah permit and trip registration", [
    "Umrah is organised through the Nusuk platform and app, so check your permit and entry time before booking transport so arrival and departure times match your permit."]));

add("taxi-jeddah-makkah-prices",
  sec("لماذا يختلف السعر من مصدر لآخر؟", [
    "ستجد في الإنترنت أرقامًا متفاوتة لرحلة جدة–مكة، والسبب أن المصادر تقصد أشياء مختلفة: بعضها من المطار وبعضها من وسط المدينة، وبعضها لسيارة اقتصادية وبعضها لسيارة عائلية أو فاخرة، وبعضها يشمل الانتظار والبعض لا.",
    "لذلك لا تقارن رقمًا بآخر قبل أن تتأكد من أربعة أمور: نقطة الانطلاق، فئة السيارة، هل السعر للسيارة كلها، وهل يشمل الانتظار."]) +
  sec("أسئلة تضعها أمام أي عرض سعر", [], [
    "هل هذا السعر نهائي أم يبدأ من؟",
    "هل يشمل المطار وانتظار الهبوط؟",
    "ما المبلغ إذا أضفنا محطة أو غيّرنا الفندق؟",
    "كيف ومتى أدفع؟"]) +
  sec("طريقتنا في التسعير", [
    "في تاكسي العمرة السعر ثابت للسيارة ويُؤكَّد على واتساب قبل الحجز، ويُدفع عند الوصول. ستجد جدول الأسعار الحالي في صفحة دليل الأسعار، وهو المرجع الذي نلتزم به."]),
  sec("Why prices differ from one source to another", [
    "You will find very different numbers for Jeddah to Makkah because sources mean different things: some from the airport and some from the city centre, some for an economy car and some for a family or luxury car, some include waiting and some do not.",
    "So do not compare one number with another until you check four things: the starting point, the car class, whether the price is for the whole car, and whether it includes waiting."]) +
  sec("Questions to ask about any quote", [], [
    "Is this price final or does it start from?",
    "Does it include the airport and waiting for the landing?",
    "What is the price if we add a stop or change the hotel?",
    "How and when do I pay?"]) +
  sec("How we price", [
    "At Umrah Taxi the fare is fixed per car and confirmed on WhatsApp before booking, paid on arrival. The current fare table is on the fares guide page and is the reference we stand by."]));

add("intercity-transfer-guide",
  sec("كيف تخطط لرحلة طويلة بين المدن المقدسة؟", [
    "الرحلات بين مكة والمدينة وجدة والطائف لها طابع مختلف عن مشاوير المدينة الواحدة: المسافة أطول، والتوقفات ضرورية، والتخطيط المسبق يوفر عليك الكثير. هذه قائمة تقريبية للمسافات والأوقات في الظروف المعتادة:"], [
    "جدة إلى مكة: نحو 80 كم، حوالي ساعة.",
    "مكة إلى المدينة: نحو 430 إلى 450 كم، حوالي أربع ساعات ونصف إلى خمس.",
    "جدة (المطار) إلى المدينة: نحو 420 كم، أربع إلى خمس ساعات.",
    "مكة إلى الطائف: نحو 90 كم عبر طريق الهدا، ساعة إلى ساعة وربع."]) +
  sec("قاعدة التوقف والراحة", [
    "في الرحلات الطويلة خطّط لتوقف واحد على الأقل للصلاة والراحة كل ساعتين إلى ثلاث، خصوصًا مع الأطفال وكبار السن. اتفق مع السائق على ذلك قبل الانطلاق كي لا يُحسب وقت التوقف خلافًا."]) +
  sec("الطائف: طريق جبلي", [
    "طريق الهدا إلى الطائف جبلي وقد يكون الجو أبرد وأكثر ضبابًا في بعض الفترات، وقد يُغلق مؤقتًا عند الضباب أو الأمطار فيُحوَّل المسار إلى طريق السيل (يضيف نحو 45 دقيقة). جهّز ملابس إضافية خفيفة، وتجنّب السفر ليلًا إن كانت الرؤية ضعيفة."]),
  sec("How to plan a long trip between the holy cities", [
    "Trips between Makkah, Madinah, Jeddah and Taif are different from single-city rides: the distance is longer, stops are necessary, and planning ahead saves a lot. Here are approximate distances and times in normal conditions:"], [
    "Jeddah to Makkah: about 80 km, around one hour.",
    "Makkah to Madinah: about 430 to 450 km, roughly four and a half to five hours.",
    "Jeddah airport to Madinah: about 420 km, four to five hours.",
    "Makkah to Taif: about 90 km via Al Hada road, one hour to an hour and a quarter."]) +
  sec("The rule for stops and rest", [
    "On long trips plan at least one stop for prayer and rest every two to three hours, especially with children and elderly passengers. Agree it with the driver before departure so stop time is not disputed."]) +
  sec("Taif: a mountain road", [
    "The Al Hada road to Taif is mountainous and can be cooler and foggier at times, and it may close temporarily in fog or rain, sending traffic to the Sail road (about 45 minutes longer). Bring extra light clothing and avoid travelling at night if visibility is poor."]));

add("madinah-to-makkah-transfer",
  sec("زيارة المدينة ثم الانتقال إلى مكة: ما يجب أن تعرفه", [
    "كثير من المعتمرين يزورون المدينة المنورة أولًا ثم ينتقلون إلى مكة. إذا كنت ستحرم قبل دخول مكة فإن أهل المدينة يحرمون عادة من ذي الحليفة (آبار علي) جنوب المدينة، ويمكن الاتفاق مع السائق على المرور بها والتوقف فيها لتغيير الملابس وأداء الصلاة قبل متابعة الطريق.",
    "الرحلة طويلة نحو أربعة ساعات ونصف إلى خمس، فاحجز موعدًا يتيح لك الوصول إلى مكة قبل أن تتعب، وتجنب الانطلاق بعد وجبة ثقيلة مباشرة."]) +
  sec("ماذا تجهّز قبل الانطلاق؟", [], [
    "اترك الغرفة قبل الموعد بساعة لتخرج الحقائب دون استعجال.",
    "جهّز لباس الإحرام وحقيبة صغيرة في المقعد الخلفي.",
    "اسأل عن مدة التوقف في ذي الحليفة وعن إمكانية الانتظار.",
    "تأكد من عنوان فندق مكة وأقرب نقطة نزول قريبة منه."]),
  sec("Visiting Madinah then moving to Makkah: what to know", [
    "Many pilgrims visit Madinah first and then travel to Makkah. If you will enter ihram before Makkah, people coming from Madinah usually do so at Dhul Hulayfah (Abyar Ali) south of the city, and you can agree with the driver to pass it and stop to change clothes and pray before continuing.",
    "The trip is long, about four and a half to five hours, so book a time that lets you reach Makkah before you are tired, and avoid leaving straight after a heavy meal."]) +
  sec("What to prepare before leaving", [], [
    "Leave the room an hour before the time so bags come out without rushing.",
    "Have the ihram clothes ready and a small bag on the back seat.",
    "Ask how long the stop at Dhul Hulayfah may be and whether the car can wait.",
    "Check your Makkah hotel address and the nearest drop-off point."]));

add("jeddah-to-taif-transfer",
  sec("رحلة جدة إلى الطائف: ما الذي يميّزها؟", [
    "تصعد الطريق من الساحل إلى الجبال، فيتغير الجو تدريجيًا ويصبح أبرد، خصوصًا مساءً وفي الشتاء. المسافة نحو 170 كيلومترًا، وتستغرق عادة قرابة ساعتين إلى ساعتين ونصف.",
    "وجهات الزوار المعتادة هناك: الهدا والشفا، وسوق عكاظ، وقصر شبرا، والمزارع، وموسم الورد الطائفي الذي يكون عادة في الربيع."]) +
  sec("رحلة اليوم الواحد أم المبيت؟", [
    "يختار كثيرون زيارة الطائف في يوم واحد من جدة أو مكة. في هذه الحالة اتفق مع السائق على مدة الانتظار ومحطات التوقف مسبقًا، وجهّز ملابس إضافية خفيفة. أما إن كنت ستبيت فاحجز العودة بموعد واضح."]),
  sec("The Jeddah to Taif trip: what is different", [
    "The road climbs from the coast to the mountains, so the weather gradually gets cooler, especially in the evening and in winter. The distance is about 170 km, usually taking about two to two and a half hours.",
    "Typical visitor destinations there are Al Hada and Al Shafa, Souq Okaz, Shubra Palace, the farms, and the Taif rose season which is usually in spring."]) +
  sec("A day trip or an overnight stay", [
    "Many visit Taif in one day from Jeddah or Makkah. In that case agree the waiting time and stops with the driver beforehand and bring extra light clothing. If you will stay overnight, book the return for a clear time."]));

add("taif-to-makkah-transfer",
  sec("الطريق من الطائف إلى مكة", [
    "النزول من الطائف إلى مكة يمر بمنعطفات جبلية على طريق الهدا، وقد يقابلك ضباب في بعض الأوقات. يستغرق الطريق عادة ما بين ساعة وساعة وربع. يُغلق طريق الهدا أحيانًا مؤقتًا بسبب الضباب أو الأمطار، وفي هذه الحالة يُسلك طريق السيل ويضيف نحو 45 دقيقة بحسب بعض المصادر. وللإحرام من ميقات قرن المنازل موضعان: وادي محرم على طريق الهدا (نحو 76 كم من الحرم)، ومسجد السيل الكبير على طريق السيل (نحو 80 كم). فاتفق مع السائق على الموضع الذي تريده قبل الانطلاق، واسأل عن الحكم الشرعي في حالتك."]) +
  sec("قبل أن تنطلق", [], [
    "ارتدِ ملابس مناسبة لأن الجو في الطائف أبرد من مكة.",
    "حدد نقطة النزول القريبة من فندقك أو من الحرم.",
    "إن كنت ستؤدي العمرة وتعود فاتفق على مدة الانتظار."]),
  sec("The road from Taif to Makkah", [
    "The descent from Taif to Makkah has mountain bends on the Al Hada road, and there may be fog at times. It usually takes between one hour and an hour and a quarter. The Al Hada road is sometimes closed temporarily by fog or rain, in which case the Sail road is used and adds about 45 minutes according to some sources. The Qarn al-Manazil miqat has two places: Wadi Muhrim on the Al Hada road (about 76 km from the Haram) and the As-Sayl Al-Kabir mosque on the Sail road (about 80 km). Agree with the driver which place you want before setting off, and ask about the ruling for your case."]) +
  sec("Before you set off", [], [
    "Dress appropriately because Taif is cooler than Makkah.",
    "Decide the drop-off point nearest your hotel or the Haram.",
    "If you will perform Umrah and return, agree the waiting time."]));

add("makkah-to-madinah-transfer",
  sec("كيف تجعل رحلة مكة–المدينة مريحة؟", [
    "الرحلة نحو أربع ساعات ونصف إلى خمس، لذلك تُحدث التفاصيل الصغيرة فرقًا كبيرًا: موعد الانطلاق، ومدة التوقف، وحجم السيارة، وترتيب الحقائب. اتفق على نقطة الاستلام والفندق المقصود في المدينة قبل الرحلة بيوم.",
    "إن كان معك مسنّون أو أطفال فاطلب توقفًا في منتصف الطريق، وإن كنت ستصل في وقت صلاة فاسأل عن الموعد المناسب للتوقف."]) +
  sec("الاختيار بين السيارة والقطار", [
    "القطار السريع يربط مكة والمدينة ويصل أسرع في كثير من الحالات، لكنه يتطلب الوصول إلى المحطة والالتزام بالمواعيد ثم نقلًا من المحطة. السيارة الخاصة تعطيك الباب إلى الباب والمرونة في التوقف، وهي الأنسب للعائلات والحقائب الكثيرة."]),
  sec("How to make the Makkah to Madinah trip comfortable", [
    "The trip takes about four and a half to five hours, so small details matter: departure time, stop length, car size and bag arrangement. Agree the pickup point and your Madinah hotel the day before.",
    "With elderly passengers or children ask for a stop in the middle, and if you will arrive at prayer time ask about the best moment to stop."]) +
  sec("Choosing between car and train", [
    "The high-speed train links Makkah and Madinah and is faster in many cases, but you must reach the station, keep to the timetable, then transfer from the station. A private car gives door to door and flexibility on stops, and suits families and heavy luggage best."]));

add("madinah-airport-to-haram-transfer",
  sec("من مطار المدينة إلى محيط المسجد النبوي", [
    "المسافة بين مطار الأمير محمد بن عبدالعزيز والمنطقة المركزية نحو عشرين كيلومترًا (تتراوح التقديرات بين 15 و25 بحسب نقطة الوصول)، وتستغرق عادة ما بين عشرين وثلاثين دقيقة. غير أن مواسم الزيارة قد تزيد الوقت، كما أن بعض الشوارع القريبة من المسجد النبوي تُغلق وقت الصلوات.",
    "اطلب من السائق النزول عند أقرب نقطة تصل إليها السيارة من فندقك، وتأكد من مكان باب الفندق قبل أن تصل."]) +
  sec("نصائح للوصول الأول", [], [
    "احتفظ بعنوان الفندق ورقم الهاتف مكتوبين.",
    "إن وصلت قبل موعد الدخول إلى الغرفة فاسأل الفندق عن حفظ الحقائب.",
    "اضبط وقت الاستلام بعد خروجك من المطار لا قبله."]),
  sec("From Madinah Airport to the Prophet's Mosque area", [
    "The distance from Prince Mohammad bin Abdulaziz Airport to the central area is about twenty kilometres (estimates range from 15 to 25 depending on the drop-off point), usually taking between twenty and thirty minutes. Visiting seasons can add time, and some streets near the Prophet's Mosque close around prayer times.",
    "Ask the driver to stop at the nearest point the car can reach from your hotel and know where your hotel entrance is before you arrive."]) +
  sec("Tips for a first arrival", [], [
    "Keep the hotel address and phone number written down.",
    "If you arrive before room check-in, ask the hotel to hold your bags.",
    "Set pickup time from when you leave the airport, not before."]));

add("madinah-ziyarat-trips",
  sec("ترتيب جولة مزارات المدينة المنورة", [
    "المزارات المعتادة في المدينة تضم مسجد قباء، ومسجد القبلتين، وجبل أحد وشهداءه، ومنطقة الخندق (المساجد السبعة)، ومزارع التمور. جولة كاملة تستغرق عادة من ثلاث إلى أربع ساعات بحسب التوقفات والازدحام.",
    "لتحصل على أفضل استفادة اطلب بداية الجولة بعد صلاة الفجر أو بعد العصر، فالأجواء أهدأ والحرارة أخف. وتأكد من مواعيد فتح المساجد وأوقات الصلاة قبل التوقف."]) +
  sec("نصائح للمزارات", [], [
    "ارتدِ حذاءً مريحًا لأنك ستمشي في بعض المواقع.",
    "خذ ماءً وغطاء رأس في الصيف.",
    "اتفق على مدة الانتظار عند كل موقع قبل الانطلاق.",
    "اطلب من السائق أن يعرّفك على الموقع باختصار إن كان يعرفه."]),
  sec("Planning a Madinah ziyarat tour", [
    "The usual sites in Madinah include Quba Mosque, Masjid al-Qiblatayn, Mount Uhud and the martyrs' cemetery, the Khandaq area (the Seven Mosques), and the date farms. A full tour usually takes three to four hours depending on stops and traffic.",
    "To get the most from it ask to start after Fajr or after Asr, when it is calmer and cooler. Check mosque opening times and prayer times before stopping."]) +
  sec("Tips for the sites", [], [
    "Wear comfortable shoes because you will walk at some sites.",
    "Carry water and a head covering in summer.",
    "Agree the waiting time at each site before you start.",
    "Ask the driver to give a brief introduction to each site if they know it."]));

add("makkah-ziyarat-trips",
  sec("جولة المزارات في مكة المكرمة", [
    "من المواقع التي يزورها الناس في مكة: جبل النور وغار حراء، وجبل ثور، ومسجد عائشة في التنعيم الذي يحرم منه المقيمون في مكة، والمشاعر المقدسة (منى ومزدلفة وعرفات) خارج موسم الحج. تستغرق الجولة نصف يوم إلى يوم بحسب عدد المواقع.",
    "بعض هذه المواقع يتطلب صعودًا طويلًا مشيًا، فاسأل عن مدى ملاءمتها لكبار السن واتخذ قرارك قبل الحجز."]) +
  sec("نصائح لجولة مكة", [], [
    "تجنب التنقل وقت الذروة في ساعات الصلاة القريبة من الحرم.",
    "خذ ماءً وغطاء رأس وحذاءً مريحًا.",
    "تحقق من قواعد الدخول والتصاريح في الأماكن المحددة قبل الذهاب.",
    "حدد مواقع الجولة مسبقًا حتى لا تُطيل السيارة الانتظار."]),
  sec("A ziyarat tour of Makkah", [
    "Sites people visit in Makkah include Jabal al-Nour and Hira cave, Jabal Thawr, Aisha Mosque at Tan'im where Makkah residents enter ihram for Umrah, and the holy sites (Mina, Muzdalifah and Arafat) outside the Hajj season. A tour takes half a day to a full day depending on the number of sites.",
    "Some of these sites involve a long climb on foot, so ask whether they suit elderly visitors and decide before booking."]) +
  sec("Tips for a Makkah tour", [], [
    "Avoid moving at peak prayer times near the Haram.",
    "Carry water, a head covering and comfortable shoes.",
    "Check entry rules and permits for specific places before going.",
    "Decide the sites beforehand so the car does not wait unnecessarily."]));

writeFileSync(new URL("../seed/post_extras.json", import.meta.url), JSON.stringify(X));
console.log(Object.keys(X).length, "extras written");
