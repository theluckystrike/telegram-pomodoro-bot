// Static-text localization for FocusBot. Session content that carries dynamic numbers
// (minutes, clock times, @handles) is built with {vars} substitution; group-facing plain
// text (the "Session done: @a @b @c" line) stays English so it reads the same to everyone
// in the chat regardless of who reads it, matching the fleet's split/habit convention.

export const LANGS = ["en", "ru", "es", "pt", "id", "de", "tr", "uk", "fa", "ar", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export type Key =
  | "help"
  | "start"
  | "soloStart"
  | "groupStart"
  | "notesProOnly"
  | "invalidLength"
  | "confirmStartFocus"
  | "sessionCancelled"
  | "dailyCapReached"
  | "alreadyActive"
  | "joinBtn"
  | "stopBtn"
  | "joined"
  | "joinClosed"
  | "nothingToStop"
  | "onlyInitiator"
  | "stoppedText"
  | "statsText"
  | "proGroupInfo"
  | "proRunPrivate"
  | "alreadyPro"
  | "proThanks"
  | "doneSolo"
  | "breakStart"
  | "breakOver"
  | "sessionDoneGroup"
  | "weeklyReportTitle"
  | "weeklyReportBody"
  | "btn_unlockPro"
  | "btn_openBot"
  | "btn_start25"
  | "btn_yes"
  | "btn_no"
  | "btn_shareBot"
  | "btn_break"
  | "btn_again"
  | "app_title"
  | "app_start"
  | "app_stop"
  | "app_running"
  | "app_minutes"
  | "app_loading"
  | "app_moreApps"
  | "app_shareChat"
  | "app_shareStory"
  | "app_storyText"
  | "app_shareFail"
  | "app_errNoInit"
  | "app_errExpired"
  | "app_errBadSig"
  | "app_unlockPro"
  | "app_proOneTime"
  | "app_proMonthly"
  | "app_payDone"
  | "app_payCancelled"
  | "app_payFailed";

/** ctx.from.language_code -> first two letters -> known table language, else "en". */
export function resolveLang(code?: string | null): Lang {
  const c = (code ?? "").slice(0, 2).toLowerCase();
  return (LANGS as readonly string[]).includes(c) ? (c as Lang) : "en";
}

/** Look up `key` for `lang` (falling back to English), substituting `{name}` tokens from `vars`. */
export function t(lang: string | undefined | null, key: Key, vars?: Record<string, string | number>): string {
  const l: Lang = (LANGS as readonly string[]).includes(lang ?? "") ? (lang as Lang) : "en";
  let s = TABLE[key][l] ?? TABLE[key].en;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const TABLE: Record<Key, Record<Lang, string>> = {
  help: {
    en: "🍅 *FocusBot* runs focus timers, right inside Telegram.\n\n`/focus` — 25 min (default)\n`/focus 15` or `/focus 50` — other free presets\n`/focus stats` — today, this week, streak, best day\n`/tz +2` — your UTC offset\n\nIn a group, `/focus 25` starts a shared session — tap {btn} within 2 minutes.\n\nFree: presets only, {cap} sessions/day. Pro: any length 1-180 min, unlimited sessions, session notes, weekly report — /pro",
    ru: "🍅 *FocusBot* запускает таймеры фокуса прямо в Telegram.\n\n`/focus` — 25 мин (по умолчанию)\n`/focus 15` или `/focus 50` — другие бесплатные варианты\n`/focus stats` — сегодня, неделя, серия, лучший день\n`/tz +2` — ваше смещение UTC\n\nВ группе `/focus 25` запускает общую сессию — нажмите {btn} в течение 2 минут.\n\nБесплатно: только пресеты, {cap} сессий/день. Pro: любая длительность 1-180 мин, без ограничений, заметки к сессии, недельный отчёт — /pro",
    es: "🍅 *FocusBot* ejecuta temporizadores de enfoque dentro de Telegram.\n\n`/focus` — 25 min (por defecto)\n`/focus 15` o `/focus 50` — otras opciones gratis\n`/focus stats` — hoy, esta semana, racha, mejor día\n`/tz +2` — tu desfase UTC\n\nEn un grupo, `/focus 25` inicia una sesión compartida — toca {btn} en 2 minutos.\n\nGratis: solo presets, {cap} sesiones/día. Pro: cualquier duración 1-180 min, ilimitado, notas de sesión, informe semanal — /pro",
    pt: "🍅 *FocusBot* roda temporizadores de foco dentro do Telegram.\n\n`/focus` — 25 min (padrão)\n`/focus 15` ou `/focus 50` — outras opções grátis\n`/focus stats` — hoje, esta semana, sequência, melhor dia\n`/tz +2` — seu fuso UTC\n\nEm um grupo, `/focus 25` inicia uma sessão compartilhada — toque {btn} em 2 minutos.\n\nGrátis: só presets, {cap} sessões/dia. Pro: qualquer duração 1-180 min, ilimitado, notas de sessão, relatório semanal — /pro",
    id: "🍅 *FocusBot* menjalankan timer fokus langsung di Telegram.\n\n`/focus` — 25 menit (default)\n`/focus 15` atau `/focus 50` — preset gratis lainnya\n`/focus stats` — hari ini, minggu ini, streak, hari terbaik\n`/tz +2` — offset UTC kamu\n\nDi grup, `/focus 25` memulai sesi bersama — tap {btn} dalam 2 menit.\n\nGratis: preset saja, {cap} sesi/hari. Pro: durasi berapa pun 1-180 menit, tanpa batas, catatan sesi, laporan mingguan — /pro",
    de: "🍅 *FocusBot* startet Fokus-Timer direkt in Telegram.\n\n`/focus` — 25 Min (Standard)\n`/focus 15` oder `/focus 50` — weitere kostenlose Voreinstellungen\n`/focus stats` — heute, diese Woche, Serie, bester Tag\n`/tz +2` — deine UTC-Verschiebung\n\nIn einer Gruppe startet `/focus 25` eine gemeinsame Sitzung — tippe {btn} innerhalb von 2 Minuten.\n\nKostenlos: nur Voreinstellungen, {cap} Sitzungen/Tag. Pro: jede Länge 1-180 Min, unbegrenzt, Sitzungsnotizen, Wochenbericht — /pro",
    tr: "🍅 *FocusBot* Telegram içinde odak zamanlayıcıları çalıştırır.\n\n`/focus` — 25 dk (varsayılan)\n`/focus 15` veya `/focus 50` — diğer ücretsiz seçenekler\n`/focus stats` — bugün, bu hafta, seri, en iyi gün\n`/tz +2` — UTC farkın\n\nBir grupta `/focus 25` ortak bir oturum başlatır — 2 dakika içinde {btn} düğmesine dokun.\n\nÜcretsiz: sadece hazır seçenekler, günde {cap} oturum. Pro: 1-180 dk arası her uzunluk, sınırsız, oturum notları, haftalık rapor — /pro",
    uk: "🍅 *FocusBot* запускає таймери фокусу прямо в Telegram.\n\n`/focus` — 25 хв (за замовчуванням)\n`/focus 15` або `/focus 50` — інші безкоштовні варіанти\n`/focus stats` — сьогодні, тиждень, серія, найкращий день\n`/tz +2` — ваше зміщення UTC\n\nУ групі `/focus 25` запускає спільну сесію — натисніть {btn} протягом 2 хвилин.\n\nБезкоштовно: лише пресети, {cap} сесій/день. Pro: будь-яка тривалість 1-180 хв, без обмежень, нотатки сесії, тижневий звіт — /pro",
    fa: "🍅 *FocusBot* تایمرهای تمرکز را داخل تلگرام اجرا می‌کند.\n\n`/focus` — ۲۵ دقیقه (پیش‌فرض)\n`/focus 15` یا `/focus 50` — گزینه‌های رایگان دیگر\n`/focus stats` — امروز، این هفته، رکورد پیاپی، بهترین روز\n`/tz +2` — اختلاف زمانی UTC شما\n\nدر گروه، `/focus 25` یک جلسه مشترک شروع می‌کند — ظرف ۲ دقیقه روی {btn} بزنید.\n\nرایگان: فقط گزینه‌های ثابت، {cap} جلسه در روز. Pro: هر مدت ۱ تا ۱۸۰ دقیقه، نامحدود، یادداشت جلسه، گزارش هفتگی — /pro",
    ar: "🍅 *FocusBot* يشغّل مؤقتات التركيز داخل تيليجرام.\n\n`/focus` — 25 دقيقة (افتراضي)\n`/focus 15` أو `/focus 50` — خيارات مجانية أخرى\n`/focus stats` — اليوم، هذا الأسبوع، السلسلة، أفضل يوم\n`/tz +2` — فارق التوقيت UTC الخاص بك\n\nفي مجموعة، `/focus 25` يبدأ جلسة مشتركة — اضغط {btn} خلال دقيقتين.\n\nمجانًا: الخيارات الثابتة فقط، {cap} جلسات/يوم. Pro: أي مدة 1-180 دقيقة، غير محدود، ملاحظات الجلسة، تقرير أسبوعي — /pro",
    hi: "🍅 *FocusBot* टेलीग्राम के अंदर ही फोकस टाइमर चलाता है।\n\n`/focus` — 25 मिनट (डिफ़ॉल्ट)\n`/focus 15` या `/focus 50` — अन्य मुफ़्त विकल्प\n`/focus stats` — आज, इस हफ़्ते, स्ट्रीक, सबसे अच्छा दिन\n`/tz +2` — आपका UTC ऑफ़सेट\n\nग्रुप में, `/focus 25` एक साझा सेशन शुरू करता है — 2 मिनट के अंदर {btn} दबाएं।\n\nमुफ़्त: केवल प्रीसेट, {cap} सेशन/दिन। Pro: 1-180 मिनट कोई भी लंबाई, असीमित, सेशन नोट्स, साप्ताहिक रिपोर्ट — /pro",
  },
  start: {
    en: "🍅 A focus timer that lives in your chat.\nTap below for 25 focused minutes — I'll ping you when it's up.\nIn a group, `/focus 25` starts a shared session.\nFree: {cap} sessions/day, presets only · /help",
    ru: "🍅 Таймер фокуса прямо в вашем чате.\nНажмите ниже — 25 минут фокуса, я напишу, когда время выйдет.\nВ группе `/focus 25` запускает общую сессию.\nБесплатно: {cap} сессий/день, только фиксированные варианты · /help",
    es: "🍅 Un temporizador de enfoque que vive en tu chat.\nToca abajo para 25 minutos de enfoque — te aviso cuando terminen.\nEn un grupo, `/focus 25` inicia una sesión compartida.\nGratis: {cap} sesiones/día, solo duraciones fijas · /help",
    pt: "🍅 Um temporizador de foco que vive no seu chat.\nToque abaixo para 25 minutos de foco — te aviso quando acabar.\nEm um grupo, `/focus 25` inicia uma sessão compartilhada.\nGrátis: {cap} sessões/dia, só durações fixas · /help",
    id: "🍅 Timer fokus yang hidup di chatmu.\nTap di bawah untuk 25 menit fokus — aku beri tahu saat waktunya habis.\nDi grup, `/focus 25` memulai sesi bersama.\nGratis: {cap} sesi/hari, durasi tetap saja · /help",
    de: "🍅 Ein Fokus-Timer, der in deinem Chat lebt.\nTippe unten für 25 fokussierte Minuten — ich melde mich, wenn die Zeit um ist.\nIn einer Gruppe startet `/focus 25` eine gemeinsame Sitzung.\nKostenlos: {cap} Sitzungen/Tag, nur Voreinstellungen · /help",
    tr: "🍅 Sohbetinde yaşayan bir odak zamanlayıcısı.\nAşağıya dokun, 25 dakika odaklan — süre bitince haber veririm.\nBir grupta `/focus 25` ortak bir oturum başlatır.\nÜcretsiz: günde {cap} oturum, sadece hazır seçenekler · /help",
    uk: "🍅 Таймер фокусу прямо у вашому чаті.\nНатисніть нижче — 25 хвилин фокусу, я напишу, коли час вийде.\nУ групі `/focus 25` запускає спільну сесію.\nБезкоштовно: {cap} сесій/день, лише фіксовані варіанти · /help",
    fa: "🍅 تایمر تمرکزی که در چت شما زندگی می‌کند.\nپایین را بزنید برای ۲۵ دقیقه تمرکز — وقتی تمام شد خبرتان می‌کنم.\nدر گروه، `/focus 25` یک جلسه مشترک شروع می‌کند.\nرایگان: {cap} جلسه در روز، فقط گزینه‌های ثابت · /help",
    ar: "🍅 مؤقت تركيز يعيش في محادثتك.\nاضغط أدناه لـ 25 دقيقة تركيز — سأخبرك عند الانتهاء.\nفي مجموعة، `/focus 25` يبدأ جلسة مشتركة.\nمجانًا: {cap} جلسات/يوم، الخيارات الثابتة فقط · /help",
    hi: "🍅 एक फोकस टाइमर जो आपकी चैट में रहता है।\nनीचे टैप करें, 25 मिनट फोकस के लिए — समय पूरा होने पर बताऊंगा।\nग्रुप में, `/focus 25` एक साझा सेशन शुरू करता है।\nमुफ़्त: {cap} सेशन/दिन, केवल प्रीसेट · /help",
  },
  soloStart: {
    en: "🍅 Focus for {minutes} min — ends {end}",
    ru: "🍅 Фокус на {minutes} мин — до {end}",
    es: "🍅 Enfoque de {minutes} min — termina {end}",
    pt: "🍅 Foco por {minutes} min — termina {end}",
    id: "🍅 Fokus {minutes} menit — selesai {end}",
    de: "🍅 Fokus für {minutes} Min — endet {end}",
    tr: "🍅 {minutes} dk odak — bitiş {end}",
    uk: "🍅 Фокус на {minutes} хв — до {end}",
    fa: "🍅 تمرکز به مدت {minutes} دقیقه — پایان {end}",
    ar: "🍅 تركيز لمدة {minutes} دقيقة — ينتهي {end}",
    hi: "🍅 {minutes} मिनट फोकस — समाप्त {end}",
  },
  groupStart: {
    en: "🍅 Group focus for {minutes} min — ends {end}\nTap {btn} within 2 minutes.",
    ru: "🍅 Групповой фокус на {minutes} мин — до {end}\nНажмите {btn} в течение 2 минут.",
    es: "🍅 Enfoque grupal de {minutes} min — termina {end}\nToca {btn} en 2 minutos.",
    pt: "🍅 Foco em grupo por {minutes} min — termina {end}\nToque {btn} em até 2 minutos.",
    id: "🍅 Fokus grup {minutes} menit — selesai {end}\nTap {btn} dalam 2 menit.",
    de: "🍅 Gruppenfokus für {minutes} Min — endet {end}\nTippe {btn} innerhalb von 2 Minuten.",
    tr: "🍅 Grup odak {minutes} dk — bitiş {end}\n2 dakika içinde {btn} düğmesine dokun.",
    uk: "🍅 Груповий фокус на {minutes} хв — до {end}\nНатисніть {btn} протягом 2 хвилин.",
    fa: "🍅 تمرکز گروهی به مدت {minutes} دقیقه — پایان {end}\nظرف ۲ دقیقه روی {btn} بزنید.",
    ar: "🍅 تركيز جماعي لمدة {minutes} دقيقة — ينتهي {end}\nاضغط {btn} خلال دقيقتين.",
    hi: "🍅 ग्रुप फोकस {minutes} मिनट — समाप्त {end}\n2 मिनट के अंदर {btn} दबाएं।",
  },
  notesProOnly: {
    en: "📝 Session notes are a Pro feature — /pro",
    ru: "📝 Заметки к сессии доступны в Pro — /pro",
    es: "📝 Las notas de sesión son una función Pro — /pro",
    pt: "📝 Notas de sessão são um recurso Pro — /pro",
    id: "📝 Catatan sesi adalah fitur Pro — /pro",
    de: "📝 Sitzungsnotizen sind eine Pro-Funktion — /pro",
    tr: "📝 Oturum notları bir Pro özelliğidir — /pro",
    uk: "📝 Нотатки сесії доступні в Pro — /pro",
    fa: "📝 یادداشت جلسه یک ویژگی Pro است — /pro",
    ar: "📝 ملاحظات الجلسة ميزة Pro — /pro",
    hi: "📝 सेशन नोट्स एक Pro सुविधा है — /pro",
  },
  invalidLength: {
    en: "Free lengths: {presets} min. Pro: any length 1-180 min, one-time {stars} ⭐.",
    ru: "Бесплатные варианты: {presets} мин. Pro: любая длительность 1-180 мин, разово {stars} ⭐.",
    es: "Duraciones gratis: {presets} min. Pro: cualquier duración 1-180 min, pago único {stars} ⭐.",
    pt: "Durações grátis: {presets} min. Pro: qualquer duração 1-180 min, pagamento único {stars} ⭐.",
    id: "Durasi gratis: {presets} menit. Pro: durasi berapa pun 1-180 menit, sekali bayar {stars} ⭐.",
    de: "Kostenlose Längen: {presets} Min. Pro: jede Länge 1-180 Min, einmalig {stars} ⭐.",
    tr: "Ücretsiz süreler: {presets} dk. Pro: 1-180 dk arası her uzunluk, tek seferlik {stars} ⭐.",
    uk: "Безкоштовні варіанти: {presets} хв. Pro: будь-яка тривалість 1-180 хв, разово {stars} ⭐.",
    fa: "مدت‌های رایگان: {presets} دقیقه. Pro: هر مدت ۱ تا ۱۸۰ دقیقه، پرداخت یک‌باره {stars} ⭐.",
    ar: "المدد المجانية: {presets} دقيقة. Pro: أي مدة 1-180 دقيقة، دفعة واحدة {stars} ⭐.",
    hi: "मुफ़्त लंबाई: {presets} मिनट। Pro: 1-180 मिनट कोई भी लंबाई, एकमुश्त {stars} ⭐।",
  },
  confirmStartFocus: {
    en: "Start a {minutes}-minute focus session?",
    ru: "Начать сессию фокуса на {minutes} мин?",
    es: "¿Iniciar una sesión de enfoque de {minutes} minutos?",
    pt: "Iniciar uma sessão de foco de {minutes} minutos?",
    id: "Mulai sesi fokus {minutes} menit?",
    de: "Fokus-Sitzung über {minutes} Minuten starten?",
    tr: "{minutes} dakikalık bir odak seansı başlatılsın mı?",
    uk: "Почати сесію фокусу на {minutes} хв?",
    fa: "یک جلسه تمرکز {minutes} دقیقه‌ای شروع شود؟",
    ar: "هل تبدأ جلسة تركيز مدتها {minutes} دقيقة؟",
    hi: "{minutes} मिनट का फ़ोकस सेशन शुरू करें?",
  },
  sessionCancelled: {
    en: "Okay, not starting a session.",
    ru: "Хорошо, сессия не запущена.",
    es: "Vale, no se inicia la sesión.",
    pt: "Ok, sessão não iniciada.",
    id: "Oke, sesi tidak dimulai.",
    de: "Okay, keine Sitzung gestartet.",
    tr: "Tamam, seans başlatılmadı.",
    uk: "Гаразд, сесію не розпочато.",
    fa: "باشه، جلسه‌ای شروع نشد.",
    ar: "حسنًا، لن تبدأ الجلسة.",
    hi: "ठीक है, सेशन शुरू नहीं किया गया।",
  },
  dailyCapReached: {
    en: "Free plan holds {cap} sessions/day. Pro is unlimited, one-time {stars} ⭐.",
    ru: "Бесплатный план — {cap} сессий/день. Pro без ограничений, разово {stars} ⭐.",
    es: "El plan gratis permite {cap} sesiones/día. Pro es ilimitado, pago único {stars} ⭐.",
    pt: "O plano grátis permite {cap} sessões/dia. Pro é ilimitado, pagamento único {stars} ⭐.",
    id: "Paket gratis {cap} sesi/hari. Pro tanpa batas, sekali bayar {stars} ⭐.",
    de: "Kostenloser Plan: {cap} Sitzungen/Tag. Pro ist unbegrenzt, einmalig {stars} ⭐.",
    tr: "Ücretsiz plan günde {cap} oturum. Pro sınırsızdır, tek seferlik {stars} ⭐.",
    uk: "Безкоштовний план — {cap} сесій/день. Pro без обмежень, разово {stars} ⭐.",
    fa: "پلن رایگان {cap} جلسه در روز دارد. Pro نامحدود است، پرداخت یک‌باره {stars} ⭐.",
    ar: "الخطة المجانية {cap} جلسات/يوم. Pro غير محدود، دفعة واحدة {stars} ⭐.",
    hi: "मुफ़्त प्लान में {cap} सेशन/दिन। Pro असीमित है, एकमुश्त {stars} ⭐।",
  },
  alreadyActive: {
    en: "A session is already running in this chat.",
    ru: "В этом чате уже идёт сессия.",
    es: "Ya hay una sesión activa en este chat.",
    pt: "Já há uma sessão ativa neste chat.",
    id: "Sudah ada sesi berjalan di chat ini.",
    de: "In diesem Chat läuft bereits eine Sitzung.",
    tr: "Bu sohbette zaten bir oturum çalışıyor.",
    uk: "У цьому чаті вже триває сесія.",
    fa: "یک جلسه در این چت در حال اجراست.",
    ar: "توجد جلسة قيد التشغيل بالفعل في هذه المحادثة.",
    hi: "इस चैट में पहले से एक सेशन चल रहा है।",
  },
  joinBtn: { en: "🙋 Join", ru: "🙋 Присоединиться", es: "🙋 Unirse", pt: "🙋 Entrar", id: "🙋 Gabung", de: "🙋 Beitreten", tr: "🙋 Katıl", uk: "🙋 Приєднатися", fa: "🙋 پیوستن", ar: "🙋 انضمام", hi: "🙋 जुड़ें" },
  stopBtn: { en: "⏹ Stop", ru: "⏹ Стоп", es: "⏹ Detener", pt: "⏹ Parar", id: "⏹ Stop", de: "⏹ Stopp", tr: "⏹ Durdur", uk: "⏹ Стоп", fa: "⏹ توقف", ar: "⏹ إيقاف", hi: "⏹ रोकें" },
  joined: {
    en: "Joined! 🍅", ru: "Вы присоединились! 🍅", es: "¡Te uniste! 🍅", pt: "Você entrou! 🍅", id: "Bergabung! 🍅",
    de: "Beigetreten! 🍅", tr: "Katıldın! 🍅", uk: "Приєдналися! 🍅", fa: "پیوستید! 🍅", ar: "تم الانضمام! 🍅", hi: "जुड़ गए! 🍅",
  },
  joinClosed: {
    en: "{btn} window closed (2 min).", ru: "Окно для {btn} закрыто (2 мин).", es: "Ventana para unirse cerrada (2 min).",
    pt: "Janela de entrada fechada (2 min).", id: "Jendela {btn} sudah tertutup (2 mnt).", de: "Beitrittsfenster geschlossen (2 Min).",
    tr: "Katılım süresi doldu (2 dk).", uk: "Вікно для {btn} закрито (2 хв).", fa: "زمان پیوستن تمام شد (۲ دقیقه).",
    ar: "انتهت مهلة الانضمام (دقيقتان).", hi: "जुड़ने की समयसीमा समाप्त (2 मिनट)।",
  },
  nothingToStop: {
    en: "Nothing to stop.", ru: "Нечего останавливать.", es: "Nada que detener.", pt: "Nada para parar.", id: "Tidak ada yang perlu dihentikan.",
    de: "Nichts zu stoppen.", tr: "Durdurulacak bir şey yok.", uk: "Нема чого зупиняти.", fa: "چیزی برای توقف نیست.", ar: "لا يوجد ما يمكن إيقافه.", hi: "रोकने के लिए कुछ नहीं है।",
  },
  onlyInitiator: {
    en: "Only who started it can stop it.", ru: "Остановить может только тот, кто начал.", es: "Solo quien la inició puede detenerla.",
    pt: "Só quem iniciou pode parar.", id: "Hanya yang memulai yang bisa menghentikan.", de: "Nur wer sie gestartet hat, kann sie stoppen.",
    tr: "Sadece başlatan durdurabilir.", uk: "Зупинити може лише той, хто почав.", fa: "فقط شروع‌کننده می‌تواند متوقف کند.",
    ar: "فقط من بدأها يمكنه إيقافها.", hi: "इसे केवल शुरू करने वाला ही रोक सकता है।",
  },
  stoppedText: {
    en: "⏹ Stopped.", ru: "⏹ Остановлено.", es: "⏹ Detenido.", pt: "⏹ Parado.", id: "⏹ Dihentikan.",
    de: "⏹ Gestoppt.", tr: "⏹ Durduruldu.", uk: "⏹ Зупинено.", fa: "⏹ متوقف شد.", ar: "⏹ تم الإيقاف.", hi: "⏹ रोका गया।",
  },
  statsText: {
    en: "📊 Today: {today} min\nThis week: {week} min\nStreak: {streak} day(s)\nBest day: {best} min",
    ru: "📊 Сегодня: {today} мин\nЗа неделю: {week} мин\nСерия: {streak} дн.\nЛучший день: {best} мин",
    es: "📊 Hoy: {today} min\nEsta semana: {week} min\nRacha: {streak} día(s)\nMejor día: {best} min",
    pt: "📊 Hoje: {today} min\nEsta semana: {week} min\nSequência: {streak} dia(s)\nMelhor dia: {best} min",
    id: "📊 Hari ini: {today} mnt\nMinggu ini: {week} mnt\nStreak: {streak} hari\nHari terbaik: {best} mnt",
    de: "📊 Heute: {today} Min\nDiese Woche: {week} Min\nSerie: {streak} Tag(e)\nBester Tag: {best} Min",
    tr: "📊 Bugün: {today} dk\nBu hafta: {week} dk\nSeri: {streak} gün\nEn iyi gün: {best} dk",
    uk: "📊 Сьогодні: {today} хв\nЗа тиждень: {week} хв\nСерія: {streak} дн.\nНайкращий день: {best} хв",
    fa: "📊 امروز: {today} دقیقه\nاین هفته: {week} دقیقه\nرکورد پیاپی: {streak} روز\nبهترین روز: {best} دقیقه",
    ar: "📊 اليوم: {today} دقيقة\nهذا الأسبوع: {week} دقيقة\nالسلسلة: {streak} يوم\nأفضل يوم: {best} دقيقة",
    hi: "📊 आज: {today} मिनट\nइस हफ़्ते: {week} मिनट\nस्ट्रीक: {streak} दिन\nसबसे अच्छा दिन: {best} मिनट",
  },
  proGroupInfo: {
    en: "Pro (per user): any length 1-180 min, unlimited sessions, notes, weekly report. One-time {stars} ⭐ in a private chat.",
    ru: "Pro (на пользователя): любая длительность 1-180 мин, без ограничений, заметки, недельный отчёт. Разово {stars} ⭐ в личном чате.",
    es: "Pro (por usuario): cualquier duración 1-180 min, ilimitado, notas, informe semanal. Pago único {stars} ⭐ en chat privado.",
    pt: "Pro (por usuário): qualquer duração 1-180 min, ilimitado, notas, relatório semanal. Pagamento único {stars} ⭐ em chat privado.",
    id: "Pro (per pengguna): durasi berapa pun 1-180 menit, tanpa batas, catatan, laporan mingguan. Sekali bayar {stars} ⭐ di chat pribadi.",
    de: "Pro (pro Nutzer): jede Länge 1-180 Min, unbegrenzt, Notizen, Wochenbericht. Einmalig {stars} ⭐ im privaten Chat.",
    tr: "Pro (kullanıcı başına): 1-180 dk arası her uzunluk, sınırsız, notlar, haftalık rapor. Özel sohbette tek seferlik {stars} ⭐.",
    uk: "Pro (на користувача): будь-яка тривалість 1-180 хв, без обмежень, нотатки, тижневий звіт. Разово {stars} ⭐ в приватному чаті.",
    fa: "Pro (برای هر کاربر): هر مدت ۱ تا ۱۸۰ دقیقه، نامحدود، یادداشت، گزارش هفتگی. پرداخت یک‌باره {stars} ⭐ در چت خصوصی.",
    ar: "Pro (لكل مستخدم): أي مدة 1-180 دقيقة، غير محدود، ملاحظات، تقرير أسبوعي. دفعة واحدة {stars} ⭐ في محادثة خاصة.",
    hi: "Pro (प्रति यूज़र): 1-180 मिनट कोई भी लंबाई, असीमित, नोट्स, साप्ताहिक रिपोर्ट। निजी चैट में एकमुश्त {stars} ⭐।",
  },
  proRunPrivate: {
    en: "Pro purchases happen in a private chat.",
    ru: "Покупка Pro доступна только в личном чате.",
    es: "Las compras de Pro se hacen en un chat privado.",
    pt: "Compras de Pro acontecem em chat privado.",
    id: "Pembelian Pro dilakukan di chat pribadi.",
    de: "Pro-Käufe erfolgen im privaten Chat.",
    tr: "Pro satın alma özel sohbette yapılır.",
    uk: "Покупка Pro доступна лише в приватному чаті.",
    fa: "خرید Pro در چت خصوصی انجام می‌شود.",
    ar: "تتم مشتريات Pro في محادثة خاصة.",
    hi: "Pro खरीदारी निजी चैट में होती है।",
  },
  alreadyPro: {
    en: "You already have Pro. Thank you.", ru: "У вас уже есть Pro. Спасибо.", es: "Ya tienes Pro. Gracias.",
    pt: "Você já tem Pro. Obrigado.", id: "Kamu sudah punya Pro. Terima kasih.", de: "Du hast bereits Pro. Danke.",
    tr: "Zaten Pro'sun. Teşekkürler.", uk: "У вас вже є Pro. Дякуємо.", fa: "شما قبلاً Pro دارید. متشکریم.",
    ar: "لديك بالفعل Pro. شكرًا لك.", hi: "आपके पास पहले से Pro है। धन्यवाद।",
  },
  proThanks: {
    en: "✅ Pro unlocked: any length, unlimited sessions, notes, weekly report.\n\n/more — more free tools",
    ru: "✅ Pro активирован: любая длительность, без ограничений, заметки, недельный отчёт.\n\n/more — другие бесплатные инструменты",
    es: "✅ Pro activado: cualquier duración, ilimitado, notas, informe semanal.\n\n/more — más herramientas gratis",
    pt: "✅ Pro ativado: qualquer duração, ilimitado, notas, relatório semanal.\n\n/more — mais ferramentas grátis",
    id: "✅ Pro aktif: durasi berapa pun, tanpa batas, catatan, laporan mingguan.\n\n/more — alat gratis lainnya",
    de: "✅ Pro freigeschaltet: jede Länge, unbegrenzt, Notizen, Wochenbericht.\n\n/more — weitere kostenlose Tools",
    tr: "✅ Pro açıldı: her uzunluk, sınırsız, notlar, haftalık rapor.\n\n/more — daha fazla ücretsiz araç",
    uk: "✅ Pro активовано: будь-яка тривалість, без обмежень, нотатки, тижневий звіт.\n\n/more — інші безкоштовні інструменти",
    fa: "✅ Pro فعال شد: هر مدت، نامحدود، یادداشت، گزارش هفتگی.\n\n/more — ابزارهای رایگان بیشتر",
    ar: "✅ تم تفعيل Pro: أي مدة، غير محدود، ملاحظات، تقرير أسبوعي.\n\n/more — أدوات مجانية أخرى",
    hi: "✅ Pro अनलॉक हुआ: कोई भी लंबाई, असीमित, नोट्स, साप्ताहिक रिपोर्ट।\n\n/more — और मुफ़्त टूल्स",
  },
  doneSolo: {
    en: "✅ {minutes} min done. Break {brk} min?", ru: "✅ {minutes} мин готово. Перерыв {brk} мин?", es: "✅ {minutes} min hechos. ¿Descanso de {brk} min?",
    pt: "✅ {minutes} min concluídos. Pausa de {brk} min?", id: "✅ {minutes} menit selesai. Istirahat {brk} menit?", de: "✅ {minutes} Min geschafft. Pause {brk} Min?",
    tr: "✅ {minutes} dk tamamlandı. {brk} dk mola?", uk: "✅ {minutes} хв виконано. Перерва {brk} хв?", fa: "✅ {minutes} دقیقه تمام شد. استراحت {brk} دقیقه؟",
    ar: "✅ اكتملت {minutes} دقيقة. استراحة {brk} دقيقة؟", hi: "✅ {minutes} मिनट पूरे हुए। {brk} मिनट का ब्रेक?",
  },
  breakStart: {
    en: "☕ Break for {minutes} min…", ru: "☕ Перерыв на {minutes} мин…", es: "☕ Descanso de {minutes} min…", pt: "☕ Pausa de {minutes} min…",
    id: "☕ Istirahat {minutes} menit…", de: "☕ Pause für {minutes} Min…", tr: "☕ {minutes} dk mola…", uk: "☕ Перерва на {minutes} хв…",
    fa: "☕ استراحت به مدت {minutes} دقیقه…", ar: "☕ استراحة لمدة {minutes} دقيقة…", hi: "☕ {minutes} मिनट का ब्रेक…",
  },
  breakOver: {
    en: "Break's over. Ready to focus? 🍅", ru: "Перерыв окончен. Готовы к фокусу? 🍅", es: "El descanso terminó. ¿Listo para enfocarte? 🍅",
    pt: "A pausa acabou. Pronto para focar? 🍅", id: "Istirahat selesai. Siap fokus? 🍅", de: "Pause vorbei. Bereit für den Fokus? 🍅",
    tr: "Mola bitti. Odaklanmaya hazır mısın? 🍅", uk: "Перерва закінчилась. Готові фокусуватись? 🍅", fa: "استراحت تمام شد. آماده تمرکز هستید؟ 🍅",
    ar: "انتهت الاستراحة. هل أنت مستعد للتركيز؟ 🍅", hi: "ब्रेक खत्म हुआ। फोकस के लिए तैयार हैं? 🍅",
  },
  sessionDoneGroup: {
    en: "Session done: {handles} — {minutes} min each", ru: "Сессия завершена: {handles} — по {minutes} мин", es: "Sesión terminada: {handles} — {minutes} min cada uno",
    pt: "Sessão concluída: {handles} — {minutes} min cada", id: "Sesi selesai: {handles} — {minutes} menit masing-masing", de: "Sitzung beendet: {handles} — je {minutes} Min",
    tr: "Oturum bitti: {handles} — kişi başı {minutes} dk", uk: "Сесію завершено: {handles} — по {minutes} хв", fa: "جلسه تمام شد: {handles} — هر نفر {minutes} دقیقه",
    ar: "انتهت الجلسة: {handles} — {minutes} دقيقة لكل شخص", hi: "सेशन पूरा हुआ: {handles} — हर एक को {minutes} मिनट",
  },
  weeklyReportTitle: {
    en: "📊 Weekly focus report", ru: "📊 Недельный отчёт фокуса", es: "📊 Informe semanal de enfoque", pt: "📊 Relatório semanal de foco",
    id: "📊 Laporan fokus mingguan", de: "📊 Wöchentlicher Fokusbericht", tr: "📊 Haftalık odak raporu", uk: "📊 Тижневий звіт фокусу",
    fa: "📊 گزارش هفتگی تمرکز", ar: "📊 تقرير التركيز الأسبوعي", hi: "📊 साप्ताहिक फोकस रिपोर्ट",
  },
  weeklyReportBody: {
    en: "{week} min this week across {sessions} session(s). Current streak: {streak} day(s). Best day: {best} min.",
    ru: "{week} мин за неделю в {sessions} сессиях. Текущая серия: {streak} дн. Лучший день: {best} мин.",
    es: "{week} min esta semana en {sessions} sesión(es). Racha actual: {streak} día(s). Mejor día: {best} min.",
    pt: "{week} min esta semana em {sessions} sessão(ões). Sequência atual: {streak} dia(s). Melhor dia: {best} min.",
    id: "{week} mnt minggu ini dalam {sessions} sesi. Streak saat ini: {streak} hari. Hari terbaik: {best} mnt.",
    de: "{week} Min diese Woche in {sessions} Sitzung(en). Aktuelle Serie: {streak} Tag(e). Bester Tag: {best} Min.",
    tr: "Bu hafta {sessions} oturumda {week} dk. Güncel seri: {streak} gün. En iyi gün: {best} dk.",
    uk: "{week} хв за тиждень у {sessions} сесіях. Поточна серія: {streak} дн. Найкращий день: {best} хв.",
    fa: "{week} دقیقه این هفته در {sessions} جلسه. رکورد فعلی: {streak} روز. بهترین روز: {best} دقیقه.",
    ar: "{week} دقيقة هذا الأسبوع عبر {sessions} جلسة. السلسلة الحالية: {streak} يوم. أفضل يوم: {best} دقيقة.",
    hi: "इस हफ़्ते {sessions} सेशन में {week} मिनट। मौजूदा स्ट्रीक: {streak} दिन। सबसे अच्छा दिन: {best} मिनट।",
  },
  btn_unlockPro: {
    en: "🔓 Unlock Pro", ru: "🔓 Открыть Pro", es: "🔓 Desbloquear Pro", pt: "🔓 Desbloquear Pro", id: "🔓 Buka Pro",
    de: "🔓 Pro freischalten", tr: "🔓 Pro'yu Aç", uk: "🔓 Розблокувати Pro", fa: "🔓 باز کردن Pro", ar: "🔓 فتح Pro", hi: "🔓 Pro अनलॉक करें",
  },
  btn_openBot: {
    en: "🍅 Open FocusBot", ru: "🍅 Открыть FocusBot", es: "🍅 Abrir FocusBot", pt: "🍅 Abrir FocusBot", id: "🍅 Buka FocusBot",
    de: "🍅 FocusBot öffnen", tr: "🍅 FocusBot'u Aç", uk: "🍅 Відкрити FocusBot", fa: "🍅 باز کردن FocusBot", ar: "🍅 فتح FocusBot", hi: "🍅 FocusBot खोलें",
  },
  btn_start25: {
    en: "▶️ Start 25 min", ru: "▶️ Старт 25 мин", es: "▶️ Empezar 25 min", pt: "▶️ Começar 25 min", id: "▶️ Mulai 25 mnt",
    de: "▶️ Start 25 Min", tr: "▶️ 25 dk başla", uk: "▶️ Старт 25 хв", fa: "▶️ شروع ۲۵ دقیقه", ar: "▶️ ابدأ 25 دقيقة", hi: "▶️ 25 मिनट शुरू करें",
  },
  btn_yes: {
    en: "✅ Yes", ru: "✅ Да", es: "✅ Sí", pt: "✅ Sim", id: "✅ Ya",
    de: "✅ Ja", tr: "✅ Evet", uk: "✅ Так", fa: "✅ بله", ar: "✅ نعم", hi: "✅ हाँ",
  },
  btn_no: {
    en: "❌ No", ru: "❌ Нет", es: "❌ No", pt: "❌ Não", id: "❌ Tidak",
    de: "❌ Nein", tr: "❌ Hayır", uk: "❌ Ні", fa: "❌ خیر", ar: "❌ لا", hi: "❌ नहीं",
  },
  btn_shareBot: {
    en: "📣 Share this bot", ru: "📣 Поделиться ботом", es: "📣 Compartir bot", pt: "📣 Compartilhar bot", id: "📣 Bagikan bot ini",
    de: "📣 Bot teilen", tr: "📣 Botu paylaş", uk: "📣 Поділитися ботом", fa: "📣 اشتراک‌گذاری ربات", ar: "📣 شارك هذا البوت", hi: "📣 यह बॉट शेयर करें",
  },
  btn_break: {
    en: "☕ Break {minutes}", ru: "☕ Перерыв {minutes}", es: "☕ Descanso {minutes}", pt: "☕ Pausa {minutes}", id: "☕ Istirahat {minutes}",
    de: "☕ Pause {minutes}", tr: "☕ Mola {minutes}", uk: "☕ Перерва {minutes}", fa: "☕ استراحت {minutes}", ar: "☕ استراحة {minutes}", hi: "☕ ब्रेक {minutes}",
  },
  btn_again: {
    en: "🍅 Again", ru: "🍅 Ещё раз", es: "🍅 Otra vez", pt: "🍅 De novo", id: "🍅 Lagi",
    de: "🍅 Nochmal", tr: "🍅 Tekrar", uk: "🍅 Ще раз", fa: "🍅 دوباره", ar: "🍅 مرة أخرى", hi: "🍅 फिर से",
  },
  app_title: {
    en: "🍅 Focus", ru: "🍅 Фокус", es: "🍅 Enfoque", pt: "🍅 Foco", id: "🍅 Fokus",
    de: "🍅 Fokus", tr: "🍅 Odak", uk: "🍅 Фокус", fa: "🍅 تمرکز", ar: "🍅 التركيز", hi: "🍅 फोकस",
  },
  app_start: {
    en: "Today: {n} min", ru: "Сегодня: {n} мин", es: "Hoy: {n} min", pt: "Hoje: {n} min", id: "Hari ini: {n} mnt",
    de: "Heute: {n} Min", tr: "Bugün: {n} dk", uk: "Сьогодні: {n} хв", fa: "امروز: {n} دقیقه", ar: "اليوم: {n} دقيقة", hi: "आज: {n} मिनट",
  },
  app_stop: {
    en: "⏹ Stop", ru: "⏹ Стоп", es: "⏹ Detener", pt: "⏹ Parar", id: "⏹ Berhenti",
    de: "⏹ Stopp", tr: "⏹ Durdur", uk: "⏹ Стоп", fa: "⏹ توقف", ar: "⏹ إيقاف", hi: "⏹ रोकें",
  },
  app_running: {
    en: "{n} min focus", ru: "фокус {n} мин", es: "enfoque de {n} min", pt: "foco de {n} min", id: "fokus {n} mnt",
    de: "{n} Min Fokus", tr: "{n} dk odak", uk: "фокус {n} хв", fa: "{n} دقیقه تمرکز", ar: "تركيز {n} دقيقة", hi: "{n} मिनट फोकस",
  },
  app_minutes: {
    en: "{n} min", ru: "{n} мин", es: "{n} min", pt: "{n} min", id: "{n} mnt",
    de: "{n} Min", tr: "{n} dk", uk: "{n} хв", fa: "{n} دقیقه", ar: "{n} دقيقة", hi: "{n} मिनट",
  },
  app_loading: {
    en: "Loading…", ru: "Загрузка…", es: "Cargando…", pt: "Carregando…", id: "Memuat…",
    de: "Wird geladen…", tr: "Yükleniyor…", uk: "Завантаження…", fa: "در حال بارگذاری…", ar: "جارٍ التحميل…", hi: "लोड हो रहा है…",
  },
  app_moreApps: {
    en: "More apps", ru: "Другие приложения", es: "Más apps", pt: "Mais apps", id: "Aplikasi lain",
    de: "Mehr Apps", tr: "Diğer uygulamalar", uk: "Інші застосунки", fa: "برنامه‌های بیشتر", ar: "تطبيقات أخرى", hi: "और ऐप्स",
  },
  app_shareChat: {
    en: "💬 Share to a chat", ru: "💬 Отправить в чат", es: "💬 Compartir en chat", pt: "💬 Enviar no chat", id: "💬 Bagikan ke chat",
    de: "💬 In Chat teilen", tr: "💬 Sohbette paylaş", uk: "💬 Надіслати в чат", fa: "💬 ارسال به گفتگو", ar: "💬 مشاركة في محادثة", hi: "💬 चैट में भेजें",
  },
  app_shareStory: {
    en: "📣 Share to story", ru: "📣 В историю", es: "📣 A tu historia", pt: "📣 Nos stories", id: "📣 Bagikan ke story",
    de: "📣 Als Story teilen", tr: "📣 Hikâyede paylaş", uk: "📣 В історію", fa: "📣 اشتراک در استوری", ar: "📣 مشاركة في قصة", hi: "📣 स्टोरी में साझा करें",
  },
  app_storyText: {
    en: "Focus timers with real streaks, right inside Telegram.", ru: "Таймеры фокусировки с настоящими сериями — прямо в Telegram.", es: "Temporizadores de enfoque con rachas reales, dentro de Telegram.", pt: "Temporizadores de foco com sequências reais, dentro do Telegram.", id: "Timer fokus dengan rentetan asli, langsung di Telegram.",
    de: "Fokus-Timer mit echten Serien — direkt in Telegram.", tr: "Gerçek serilerle odak zamanlayıcıları, doğrudan Telegram'da.", uk: "Таймери фокусування зі справжніми серіями — прямо в Telegram.", fa: "تایمرهای تمرکز با زنجیره‌های واقعی، همین‌جا در تلگرام.", ar: "مؤقتات تركيز بسلاسل حقيقية، مباشرة داخل تيليجرام.", hi: "असली स्ट्रीक के साथ फोकस टाइमर, सीधे Telegram में।",
  },
  app_shareFail: {
    en: "Sharing is unavailable right now.", ru: "Поделиться сейчас не получилось.", es: "Ahora mismo no se puede compartir.", pt: "Não foi possível compartilhar agora.", id: "Berbagi sedang tidak tersedia.",
    de: "Teilen ist gerade nicht möglich.", tr: "Şu anda paylaşılamıyor.", uk: "Поділитися зараз не вдалося.", fa: "در حال حاضر اشتراک‌گذاری ممکن نیست.", ar: "المشاركة غير متاحة الآن.", hi: "अभी साझा नहीं किया जा सकता।",
  },
  app_errNoInit: {
    en: "Open this app from the bot — tap the menu button.", ru: "Откройте это приложение из бота — кнопка меню.", es: "Abre esta app desde el bot — toca el botón de menú.", pt: "Abra este app pelo bot — toque no botão de menu.", id: "Buka aplikasi ini dari bot — ketuk tombol menu.",
    de: "Öffne diese App über den Bot — tippe auf den Menü-Button.", tr: "Bu uygulamayı bottan aç — menü düğmesine dokun.", uk: "Відкрийте застосунок із бота — кнопка меню.", fa: "این برنامه را از داخل ربات باز کنید — دکمه منو.", ar: "افتح هذا التطبيق من البوت — زر القائمة.", hi: "यह ऐप बॉट से खोलें — मेनू बटन दबाएँ।",
  },
  app_errExpired: {
    en: "This session expired. Close and reopen the app.", ru: "Сессия истекла. Закройте и откройте приложение снова.", es: "La sesión caducó. Cierra y vuelve a abrir la app.", pt: "A sessão expirou. Feche e abra o app de novo.", id: "Sesi berakhir. Tutup lalu buka lagi aplikasinya.",
    de: "Sitzung abgelaufen. App schließen und neu öffnen.", tr: "Oturum doldu. Uygulamayı kapatıp yeniden aç.", uk: "Сесія завершилася. Закрийте й відкрийте застосунок.", fa: "نشست منقضی شد. برنامه را ببندید و دوباره باز کنید.", ar: "انتهت الجلسة. أغلق التطبيق ثم افتحه من جديد.", hi: "सेशन खत्म हो गया। ऐप बंद करके फिर खोलें।",
  },
  app_errBadSig: {
    en: "This link is not valid. Reopen the app from the bot.", ru: "Ссылка недействительна. Откройте приложение из бота.", es: "Este enlace no es válido. Abre la app desde el bot.", pt: "Este link não é válido. Abra o app pelo bot.", id: "Tautan ini tidak valid. Buka aplikasi dari bot.",
    de: "Dieser Link ist ungültig. Öffne die App über den Bot.", tr: "Bu bağlantı geçersiz. Uygulamayı bottan aç.", uk: "Посилання недійсне. Відкрийте застосунок із бота.", fa: "این پیوند معتبر نیست. برنامه را از ربات باز کنید.", ar: "هذا الرابط غير صالح. افتح التطبيق من البوت.", hi: "यह लिंक मान्य नहीं है। ऐप बॉट से खोलें।",
  },
  app_unlockPro: {
    en: "🔓 Unlock Pro", ru: "🔓 Открыть Pro", es: "🔓 Desbloquear Pro", pt: "🔓 Desbloquear Pro", id: "🔓 Buka Pro",
    de: "🔓 Pro freischalten", tr: "🔓 Pro'yu Aç", uk: "🔓 Розблокувати Pro", fa: "🔓 باز کردن Pro", ar: "🔓 فتح Pro", hi: "🔓 Pro अनलॉक करें",
  },
  app_proOneTime: {
    en: "One-time {n} ⭐", ru: "Разово {n} ⭐", es: "Pago único {n} ⭐", pt: "Único {n} ⭐", id: "Sekali bayar {n} ⭐",
    de: "Einmalig {n} ⭐", tr: "Tek seferlik {n} ⭐", uk: "Разово {n} ⭐", fa: "یک‌باره {n} ⭐", ar: "مرة واحدة {n} ⭐", hi: "एकमुश्त {n} ⭐",
  },
  app_proMonthly: {
    en: "Monthly {n} ⭐/mo", ru: "Ежемесячно {n} ⭐", es: "Mensual {n} ⭐/mes", pt: "Mensal {n} ⭐/mês", id: "Bulanan {n} ⭐/bln",
    de: "Monatlich {n} ⭐", tr: "Aylık {n} ⭐/ay", uk: "Щомісяця {n} ⭐", fa: "ماهانه {n} ⭐", ar: "شهريًا {n} ⭐", hi: "मासिक {n} ⭐",
  },
  app_payDone: {
    en: "✅ Pro unlocked. Thank you.", ru: "✅ Pro активирован. Спасибо.", es: "✅ Pro activado. Gracias.", pt: "✅ Pro ativado. Obrigado.", id: "✅ Pro aktif. Terima kasih.",
    de: "✅ Pro aktiviert. Danke.", tr: "✅ Pro açıldı. Teşekkürler.", uk: "✅ Pro активовано. Дякуємо.", fa: "✅ Pro فعال شد. سپاسگزاریم.", ar: "✅ تم تفعيل Pro. شكرًا لك.", hi: "✅ Pro चालू हो गया। धन्यवाद।",
  },
  app_payCancelled: {
    en: "Payment cancelled.", ru: "Оплата отменена.", es: "Pago cancelado.", pt: "Pagamento cancelado.", id: "Pembayaran dibatalkan.",
    de: "Zahlung abgebrochen.", tr: "Ödeme iptal edildi.", uk: "Оплату скасовано.", fa: "پرداخت لغو شد.", ar: "أُلغيت عملية الدفع.", hi: "भुगतान रद्द हुआ।",
  },
  app_payFailed: {
    en: "Payment failed. Please try again.", ru: "Оплата не прошла. Попробуйте ещё раз.", es: "El pago falló. Inténtalo de nuevo.", pt: "O pagamento falhou. Tente de novo.", id: "Pembayaran gagal. Coba lagi.",
    de: "Zahlung fehlgeschlagen. Bitte erneut versuchen.", tr: "Ödeme başarısız. Tekrar dene.", uk: "Оплата не пройшла. Спробуйте ще раз.", fa: "پرداخت ناموفق بود. دوباره تلاش کنید.", ar: "فشل الدفع. حاول مرة أخرى.", hi: "भुगतान विफल। फिर कोशिश करें।",
  },
};

/** The 11 language codes this bot ships, in table order. */
export const APP_LANGS: Lang[] = [...LANGS];

/** Every `app_*` key, for every language, as a plain object — the Mini App's embedded
 * `APP_I18N` dictionary. English fills any gap so a client lookup can never miss.
 * Both loops are bounded by the static table (11 languages x the app_* key set). */
export function appDict(): Record<string, Record<string, string>> {
  const keys = (Object.keys(TABLE) as Key[]).filter((k) => k.startsWith("app_"));
  const out: Record<string, Record<string, string>> = {};
  for (const l of LANGS) {
    const m: Record<string, string> = {};
    for (const k of keys) m[k] = TABLE[k][l] ?? TABLE[k].en;
    out[l] = m;
  }
  return out;
}
