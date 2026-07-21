import type { UiLocaleCode } from '../ui/ui-locale.service';

interface LocalizedLabel {
  readonly ar: string;
  readonly ur: string;
}

const CATEGORY_LABELS: Readonly<Record<string, LocalizedLabel>> = {
  ethics: { ar: 'الأخلاق والسلوك', ur: 'اخلاق و کردار' },
  worship: { ar: 'العبادة والروحانية', ur: 'عبادت و روحانیت' },
  history: { ar: 'القصص والتاريخ', ur: 'قصص و تاریخ' },
  'social-financial': { ar: 'الاجتماعي والمالي', ur: 'سماجی و مالی' },
  family: { ar: 'الأسرة والمجتمع', ur: 'خاندان و معاشرہ' },
  life: { ar: 'الحياة والعافية', ur: 'زندگی و عافیت' },
};

const THEME_LABELS: Readonly<
  Record<string, LocalizedLabel & { readonly descriptionAr: string; readonly descriptionUr: string }>
> = {
  patience: {
    ar: 'الصبر',
    ur: 'صبر',
    descriptionAr: 'الصبر والثبات والتوكل على الله في الشدة والخسارة والابتلاء.',
    descriptionUr: 'صبر، استقامت، اور مشکل، نقصان اور آزمائش میں اللہ پر بھروسہ۔',
  },
  gratitude: {
    ar: 'الشكر',
    ur: 'شکر',
    descriptionAr: 'الشكر، تذكّر النعم، وتحويل الحمد إلى عبادة ثابتة.',
    descriptionUr: 'شکر، نعمتوں کا خیال، اور شکرگزاری کو پختہ عبادت بنانا۔',
  },
  'honesty-truth': {
    ar: 'الصدق والأمانة',
    ur: 'سچائی و امانت',
    descriptionAr: 'الصدق، حفظ العهود، عدل الكلام، والثبات على الحق.',
    descriptionUr: 'سچائی، وعدے نبھانا، منصفانہ بات، اور حق پر ڈٹے رہنا۔',
  },
  forgiveness: {
    ar: 'العفو والمغفرة',
    ur: 'معافی',
    descriptionAr: 'العفو عن الناس، كظم الغيظ، وطلب رحمة الله لأنفسنا.',
    descriptionUr: 'لوگوں کو معاف کرنا، غصہ روکنا، اور اپنے لیے اللہ کی رحمت مانگنا۔',
  },
  humility: {
    ar: 'التواضع',
    ur: 'عاجزی',
    descriptionAr: 'اللين، اجتناب الكبر، والمشي هونًا على الأرض.',
    descriptionUr: 'نرمی، تکبر سے بچنا، اور زمین پر عاجزی سے چلنا۔',
  },
  'prayer-salah': {
    ar: 'الصلاة',
    ur: 'نماز',
    descriptionAr: 'المحافظة على الصلاة وجعل العبادة محور اليوم.',
    descriptionUr: 'نماز کی پابندی اور عبادت کو روزمرہ زندگی کا سہارا بنانا۔',
  },
  'repentance-tawbah': {
    ar: 'التوبة',
    ur: 'توبہ',
    descriptionAr: 'التوبة والرجوع إلى الله والأمل في مغفرته الواسعة.',
    descriptionUr: 'توبہ، اللہ کی طرف رجوع، اور اس کی وسیع مغفرت کی امید۔',
  },
  'remembrance-dhikr': {
    ar: 'ذكر الله',
    ur: 'ذکرِ الٰہی',
    descriptionAr: 'الذكر وطمأنينة القلوب بذكر الله طوال اليوم.',
    descriptionUr: 'ذکر، اور دن بھر اللہ کو یاد کر کے دلوں کا سکون۔',
  },
  'prophet-stories': {
    ar: 'قصص الأنبياء',
    ur: 'انبیاء کے قصے',
    descriptionAr: 'مقاطع من السور التي تسرد سير الأنبياء.',
    descriptionUr: 'ان سورتوں کے آغاز جو انبیاء کی زندگی بیان کرتی ہیں۔',
  },
  'finance-trade': {
    ar: 'المال والتجارة',
    ur: 'مال و تجارت',
    descriptionAr: 'التجارة العادلة والدين والعقود وتحريم الكسب الحرام.',
    descriptionUr: 'منصفانہ تجارت، قرض، معاہدے، اور ناجائز کمائی کی ممانعت۔',
  },
  'charity-zakat': {
    ar: 'الصدقة والزكاة',
    ur: 'صدقہ و زکوٰۃ',
    descriptionAr: 'الإنفاق في سبيل الله، إعانة المحتاج، وتطهير المال.',
    descriptionUr: 'اللہ کی راہ میں خرچ، نیاز مندوں کی مدد، اور مال کی پاکیزگی۔',
  },
  justice: {
    ar: 'العدل',
    ur: 'عدل',
    descriptionAr: 'الاستقامة والعدل والشهادة ولو على النفس.',
    descriptionUr: 'راستی، انصاف، اور اپنے خلاف بھی گواہی دینا۔',
  },
  parents: {
    ar: 'الوالدان',
    ur: 'والدین',
    descriptionAr: 'برّ الوالدين والإحسان إليهما والدعاء لهما بالرحمة.',
    descriptionUr: 'والدین کا احترام، ان سے حسن سلوک، اور ان کے لیے دعا۔',
  },
  marriage: {
    ar: 'الزواج والزوجان',
    ur: 'نکاح و میاں بیوی',
    descriptionAr: 'السكن بين الزوجين والرحمة وبناء بيت صالح.',
    descriptionUr: 'میاں بیوی میں سکون، رحمت، اور نیک گھر کی بنیاد۔',
  },
  neighbors: {
    ar: 'الجيران والأقارب',
    ur: 'پڑوسی و رشتہ دار',
    descriptionAr: 'حسن معاملة الجيران والأقارب والمجتمع.',
    descriptionUr: 'پڑوسیوں، رشتہ داروں اور معاشرے سے حسنِ سلوک۔',
  },
  'hope-anxiety': {
    ar: 'الأمل والفرج',
    ur: 'امید و آسانی',
    descriptionAr: 'الفرج بعد الشدة، التوكل، والشجاعة عند القلق.',
    descriptionUr: 'تنگی کے بعد آسانی، اللہ پر بھروسہ، اور بے چینی میں ہمت۔',
  },
  'death-afterlife': {
    ar: 'الموت والآخرة',
    ur: 'موت و آخرت',
    descriptionAr: 'حقيقة الموت والحساب والاستعداد لما بعده.',
    descriptionUr: 'موت کی حقیقت، حساب، اور آخرت کی تیاری۔',
  },
  knowledge: {
    ar: 'العلم والتعلم',
    ur: 'علم و سیکھنا',
    descriptionAr: 'طلب العلم النافع والتفكر والحكمة من الوحي.',
    descriptionUr: 'نفع بخش علم کی تلاش، غور و فکر، اور وحی سے حکمت۔',
  },
  'trust-tawakkul': {
    ar: 'التوكل على الله',
    ur: 'توکل علی اللہ',
    descriptionAr: 'التوكل بعد الأخذ بالأسباب وطمأنينة القلب.',
    descriptionUr: 'جائز اسباب کے بعد توکل، اور بے یقینی میں دل کا سکون۔',
  },
  'kindness-mercy': {
    ar: 'اللطف والرحمة',
    ur: 'نرمی و رحمت',
    descriptionAr: 'الرفق بالناس ولين الكلام والرحمة علامة الإيمان.',
    descriptionUr: 'لوگوں سے نرمی، نرم گفتگو، اور رحمت ایمان کی علامت۔',
  },
  'anger-self-control': {
    ar: 'الغضب وضبط النفس',
    ur: 'غصہ و ضبطِ نفس',
    descriptionAr: 'كظم الغيظ والعفو السريع واختيار الصبر على الاندفاع.',
    descriptionUr: 'غصہ روکنا، جلد معاف کرنا، اور جذبات پر صبر کو ترجیح دینا۔',
  },
  fasting: {
    ar: 'الصيام',
    ur: 'روزہ',
    descriptionAr: 'الصوم وغايته والانضباط الروحي في رمضان والنوافل.',
    descriptionUr: 'روزہ، اس کا مقصد، اور رمضان و نفلی روزوں کی روحانی تربیت۔',
  },
  'quran-recitation': {
    ar: 'تلاوة القرآن',
    ur: 'قرآن کی تلاوت',
    descriptionAr: 'التلاوة والتدبر والعمل بما يُتلى.',
    descriptionUr: 'تلاوت، کتاب پر غور، اور پڑھی ہوئی ہدایت پر عمل۔',
  },
  'dua-supplication': {
    ar: 'الدعاء',
    ur: 'دعا',
    descriptionAr: 'دعاء الله رجاءً وتواضعًا ومثابرة في الخلوة.',
    descriptionUr: 'امید، عاجزی اور لگاتار دعا کے ساتھ اللہ کو پکارنا۔',
  },
  'creation-nature': {
    ar: 'الخلق والآيات',
    ur: 'تخلیق و نشانیاں',
    descriptionAr: 'آيات في السماوات والأرض تهدي القلوب إلى الخالق.',
    descriptionUr: 'آسمان و زمین کی آیات جو دلوں کو خالق کی طرف موڑتی ہیں۔',
  },
  'orphans-weak': {
    ar: 'اليتامى والمحتاجون',
    ur: 'یتیم و ضرورت مند',
    descriptionAr: 'حماية الضعفاء والعدل معهم والإنفاق لمن لا سند لهم.',
    descriptionUr: 'کمزوروں کی حفاظت، منصفانہ سلوک، اور بے سہارا لوگوں پر خرچ۔',
  },
  hospitality: {
    ar: 'الضيافة والضيوف',
    ur: 'مہمان نوازی',
    descriptionAr: 'إكرام الضيف والكرم في البيت وحسن استقبال الزائر.',
    descriptionUr: 'مہمان کی عزت، گھر میں سخاوت، اور آنے والوں سے گرم جوشی۔',
  },
  children: {
    ar: 'الأبناء والتربية',
    ur: 'اولاد و تربیت',
    descriptionAr: 'تربية الأبناء بالتقوى والرفق والمسؤولية أمام الله.',
    descriptionUr: 'تقویٰ، نرمی اور اللہ کے سامنے ذمہ داری کے ساتھ اولاد کی تربیت۔',
  },
  'sustenance-rizq': {
    ar: 'الرزق والمعاش',
    ur: 'رزق و روزی',
    descriptionAr: 'الرزق من الله والكسب الحلال والشكر والقناعة.',
    descriptionUr: 'اللہ کی طرف سے رزق، حلال کمائی، شکر اور قناعت۔',
  },
  'health-healing': {
    ar: 'الصحة والشفاء',
    ur: 'صحت و شفا',
    descriptionAr: 'القرآن شفاء، وطلب العلاج مع التوكل والعناية بالبدن والروح.',
    descriptionUr: 'قرآن شفا ہے؛ توکل کے ساتھ علاج اور جسم و روح کی حفاظت۔',
  },
  'paradise-jannah': {
    ar: 'الجنة',
    ur: 'جنت',
    descriptionAr: 'الجنة والجنات والأنهار والثواب الباقي الذي وعد الله به الصالحين.',
    descriptionUr: 'جنت، باغات، نہریں، اور نیک لوگوں کے لیے اللہ کا دائمی انعام۔',
  },
};

/** Localized theme name; falls back to English `fallback`. */
export function localizedThemeName(id: string, fallback: string, locale: UiLocaleCode): string {
  if (locale === 'en') {
    return fallback;
  }
  const row = THEME_LABELS[id];
  if (!row) {
    return fallback;
  }
  return locale === 'ar' ? row.ar : row.ur;
}

/** Localized theme description; falls back to English `fallback`. */
export function localizedThemeDescription(
  id: string,
  fallback: string | undefined,
  locale: UiLocaleCode,
): string | undefined {
  if (locale === 'en') {
    return fallback;
  }
  const row = THEME_LABELS[id];
  if (!row) {
    return fallback;
  }
  return locale === 'ar' ? row.descriptionAr : row.descriptionUr;
}

/** Localized category name; falls back to English `fallback`. */
export function localizedCategoryName(id: string, fallback: string, locale: UiLocaleCode): string {
  if (locale === 'en') {
    return fallback;
  }
  const row = CATEGORY_LABELS[id];
  if (!row) {
    return fallback;
  }
  return locale === 'ar' ? row.ar : row.ur;
}
