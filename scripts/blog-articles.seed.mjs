const t = (en, ur, ar) => ({ en, ur, ar });

export const categories = [
  { id: 'quranic-stories', name: t('Quranic Stories', 'قرآنی کہانیاں', 'قصص قرآنية') },
  { id: 'prophets', name: t('Prophets', 'انبیاء', 'الأنبياء') },
  { id: 'companions', name: t('Companions', 'صحابہ', 'الصحابة') },
  { id: 'islamic-history', name: t('Islamic History', 'اسلامی تاریخ', 'التاريخ الإسلامي') },
  { id: 'islamic-beliefs', name: t('Islamic Beliefs', 'اسلامی عقائد', 'العقيدة الإسلامية') },
  { id: 'quranic-teachings', name: t('Quranic Teachings', 'قرآنی تعلیمات', 'التعاليم القرآنية') },
  { id: 'salah', name: t('Salah', 'نماز', 'الصلاة') },
  { id: 'sawm', name: t('Sawm', 'روزہ', 'الصيام') },
  { id: 'sunnah-hadith', name: t('Sunnah & Hadith', 'سنت و حدیث', 'السنة والحديث') },
  { id: 'tawhid', name: t('Tawhid', 'توحید', 'التوحيد') },
  { id: 'hajj', name: t('Hajj', 'حج', 'الحج') },
  { id: 'lifestyle', name: t('Lifestyle', 'اسلامی طرزِ زندگی', 'نمط الحياة الإسلامي') },
  { id: 'history', name: t('History', 'تاریخ', 'التاريخ') },
];

export const storyPosts = [];

export const topicArticles = [
  {
    id: 'what-does-allah-look-like',
    categoryId: 'tawhid',
    publishedAt: '2025-01-05',
    relatedSurah: 42,
    title: t('What Does Allah Look Like?', 'اللہ کیسا ہے؟', 'كيف يكون الله؟'),
    excerpt: t(
      'Islam teaches that Allah is unlike creation and cannot be imagined in physical form.',
      'اسلام سکھاتا ہے کہ اللہ مخلوق جیسا نہیں اور کسی جسمانی شکل میں تصور نہیں کیا جا سکتا۔',
      'يعلمنا الإسلام أن الله ليس كمثله شيء ولا يُتصوَّر بصورة جسدية.'
    ),
    paragraphs: [
      t(
        'The Quran states, "There is nothing like unto Him" (42:11). This verse closes the door to making images of Allah in the human mind. Allah sees, hears, and knows perfectly, but His attributes do not resemble created beings.',
        'قرآن کہتا ہے: "اس جیسی کوئی چیز نہیں" (الشوریٰ 11:42)۔ یہ آیت اللہ کی انسانی یا مادی تصویر بنانے سے روکتی ہے۔ اللہ سنتا، دیکھتا اور جانتا ہے، مگر اس کی صفات مخلوق جیسی نہیں۔',
        'قال الله تعالى: «ليس كمثله شيء» (الشورى: 11). هذه الآية تمنع تشبيه الله بخلقه. فالله سميع بصير عليم، لكن صفاته ليست كصفات المخلوقين.'
      ),
      t(
        'Believers focus on knowing Allah through His Names and revelation, not through imagination. In Jannah, the righteous will be honored with seeing Allah in a manner befitting His majesty, without asking "how."',
        'مومن اللہ کو اس کے اسماء الحسنیٰ اور وحی کے ذریعے پہچانتے ہیں، تخیّل کے ذریعے نہیں۔ جنت میں اہلِ ایمان کو اللہ کا دیدار نصیب ہوگا، مگر "کیسے" کا سوال نہیں کیا جاتا۔',
        'يعرف المؤمنون ربهم بأسمائه الحسنى ووحيه، لا بالخيال. وفي الجنة يكرم الله أهل الإيمان برؤيته على وجه يليق بجلاله بلا سؤال: كيف.'
      ),
    ],
    quote: {
      arabic: 'لَيْسَ كَمِثْلِهِ شَيْءٌ',
      ref: '42:11',
      en: '"There is nothing like unto Him."',
      ur: '"اس جیسی کوئی چیز نہیں۔"',
      ar: '«ليس كمثله شيء»',
    },
  },
  {
    id: 'kufi-hat-men-islam',
    categoryId: 'lifestyle',
    publishedAt: '2025-01-13',
    relatedSurah: undefined,
    title: t('Is Wearing a Kufi Required for Men?', 'کیا مردوں کے لیے ٹوپی لازمی ہے؟', 'هل لبس الكوفية واجب على الرجال؟'),
    excerpt: t(
      'A kufi is a respected tradition, but the core Sunnah is modesty and proper prayer etiquette.',
      'ٹوپی پہننا ایک قابلِ احترام روایت ہے، مگر اصل سنت حیا اور نماز کا ادب ہے۔',
      'لبس الكوفية عادة محترمة، لكن السنة الأصلية هي الستر وأدب الصلاة.'
    ),
    paragraphs: [
      t(
        'Many Muslims wear a kufi out of love for Islamic identity and reverence in worship. Scholars generally describe it as permissible and recommended in some cultures, but not a strict condition for salah.',
        'بہت سے مسلمان دینی شناخت اور عبادت کے ادب کے طور پر ٹوپی پہنتے ہیں۔ اہلِ علم کے نزدیک یہ جائز اور بعض ماحول میں مستحسن ہے، لیکن نماز کی شرط نہیں۔',
        'يلبس كثير من المسلمين الكوفية تعظيماً للشعائر وهو أمر جائز ومستحب في بعض الأعراف، لكنه ليس شرطاً لصحة الصلاة.'
      ),
      t(
        'If someone prays bareheaded, the prayer remains valid if the awrah is covered and humility is present. A believer should avoid judging others over clothing details and prioritize sincerity, cleanliness, and concentration.',
        'اگر کوئی شخص بغیر ٹوپی نماز پڑھے تو ستر ڈھکا ہو اور خشوع موجود ہو تو نماز درست ہے۔ لباس کے جزوی مسائل پر دوسروں کو جج کرنے کے بجائے اخلاص، پاکیزگی اور توجہ کو اہم رکھنا چاہیے۔',
        'تصح الصلاة بلا غطاء رأس إذا تحقق ستر العورة والخشوع. والأولى ترك التشدد في هذه الجزئيات والاهتمام بالإخلاص والطهارة وحضور القلب.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'what-is-itikaf',
    categoryId: 'sawm',
    publishedAt: '2025-01-21',
    relatedSurah: 2,
    title: t('What Is I\'tikaf?', 'اعتکاف کیا ہے؟', 'ما هو الاعتكاف؟'),
    excerpt: t(
      'I\'tikaf is retreating in the mosque for focused worship, especially in the last ten nights of Ramadan.',
      'اعتکاف مسجد میں ٹھہر کر یکسو عبادت کا نام ہے، خاص طور پر رمضان کے آخری عشرے میں۔',
      'الاعتكاف لزوم المسجد للتفرغ للعبادة، خاصة في العشر الأواخر من رمضان.'
    ),
    paragraphs: [
      t(
        'I\'tikaf means staying in the mosque with intention to worship Allah, cutting down distractions of daily life. The Prophet (peace be upon him) regularly observed i\'tikaf in Ramadan and encouraged seeking Laylat al-Qadr within those nights.',
        'اعتکاف کا مطلب نیت کے ساتھ مسجد میں قیام کر کے عبادت میں مشغول ہونا ہے۔ نبی کریم ﷺ رمضان میں باقاعدہ اعتکاف فرماتے اور انہی راتوں میں لیلۃ القدر تلاش کرنے کی ترغیب دیتے تھے۔',
        'الاعتكاف هو المكث في المسجد بنية العبادة وترك شواغل الدنيا. وقد داوم النبي ﷺ على الاعتكاف في رمضان وحث على التماس ليلة القدر.'
      ),
      t(
        'During i\'tikaf, a person increases Quran recitation, dhikr, dua, and reflection. It purifies priorities: the heart learns that nearness to Allah is a daily need, not only a seasonal emotion.',
        'اعتکاف میں قرآن، ذکر، دعا اور محاسبہ بڑھتا ہے۔ یہ عمل انسان کی ترجیحات درست کرتا ہے اور دل کو سکھاتا ہے کہ اللہ سے قربت وقتی جذبہ نہیں بلکہ مستقل ضرورت ہے۔',
        'في الاعتكاف يكثر العبد من القرآن والذكر والدعاء والمحاسبة. وهو مدرسة تربوية تعيد ترتيب الأولويات ليصبح القرب من الله حاجة دائمة.'
      ),
    ],
    quote: {
      arabic: 'وَلَا تُبَاشِرُوهُنَّ وَأَنْتُمْ عَاكِفُونَ فِي الْمَسَاجِدِ',
      ref: '2:187',
      en: '"And do not approach them while you are in retreat in the mosques."',
      ur: '"اور جب تم مسجدوں میں اعتکاف کیے ہوئے ہو تو (ازدواجی تعلق) نہ رکھو۔"',
      ar: '«ولا تباشروهن وأنتم عاكفون في المساجد»',
    },
  },
  {
    id: 'surah-hashr-last-3-ayat',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-01-29',
    relatedSurah: 59,
    title: t('Last 3 Verses of Surah Al-Hashr', 'سورۃ الحشر کی آخری تین آیات', 'آخر ثلاث آيات من سورة الحشر'),
    excerpt: t(
      'These verses gather profound Names of Allah and strengthen awe, trust, and remembrance.',
      'ان آیات میں اللہ کے جلیل القدر اسماء جمع ہیں جو دل میں خشیت اور یقین پیدا کرتے ہیں۔',
      'تجمع هذه الآيات أسماء عظيمة لله وتغرس الخشية واليقين.'
    ),
    paragraphs: [
      t(
        'The final verses of Surah Al-Hashr mention majestic Names like Al-Malik, Al-Quddus, As-Salam, and Al-Aziz. Reciting them reminds believers that true power, peace, and honor all belong to Allah alone.',
        'سورۃ الحشر کی آخری آیات میں الملک، القدوس، السلام اور العزیز جیسے عظیم اسماء آتے ہیں۔ ان کی تلاوت سے یاد رہتا ہے کہ اصل اقتدار، امن اور عزت صرف اللہ کے لیے ہے۔',
        'تختم سورة الحشر بأسماء جليلة مثل الملك والقدوس والسلام والعزيز. وتلاوتها تربي القلب على أن السيادة والطمأنينة والعزة لله وحده.'
      ),
      t(
        'Many Muslims recite these verses in daily adhkar for spiritual grounding. Their message is practical: worship with humility, avoid arrogance, and trust the wisdom of the Lord who knows the unseen and the seen.',
        'بہت سے مسلمان انہیں روزانہ اذکار میں پڑھتے ہیں۔ ان کا عملی پیغام یہ ہے کہ عاجزی کے ساتھ بندگی کرو، تکبر سے بچو، اور اس رب کی حکمت پر بھروسہ رکھو جو غیب و ظاہر کا جاننے والا ہے۔',
        'يقرأها المسلمون ضمن الأذكار لما فيها من تثبيت. ورسالتها عملية: تواضع في العبادة، وابتعد عن الكبر، وثق بحكمة العليم بالغيب والشهادة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'quran-10-94-doubt-certainty',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-02-06',
    relatedSurah: 10,
    title: t('Quran 10:94 - Doubt and Certainty', 'قرآن 10:94 — شک اور یقین', 'الآية 10:94 بين الشك واليقين'),
    excerpt: t(
      'This verse addresses opponents and confirms revelation, not uncertainty in the Prophet.',
      'یہ آیت نبی ﷺ کے شک کے لیے نہیں بلکہ منکرین پر حجت قائم کرنے کے لیے ہے۔',
      'هذه الآية ليست لإثبات شك عند النبي، بل لإقامة الحجة على المنكرين.'
    ),
    paragraphs: [
      t(
        'Some readers misunderstand 10:94 as if the Prophet (peace be upon him) doubted revelation. Classical tafsir explains that the wording is conditional and rhetorical, aimed at disbelievers who denied earlier scriptures and current revelation alike.',
        'بعض لوگ 10:94 کو غلط سمجھتے ہیں، جیسے نبی ﷺ کو وحی میں شک ہو۔ مفسرین نے واضح کیا کہ یہ اسلوبِ شرط بطور حجت ہے، اصل مخاطب منکرین ہیں۔',
        'يُسيء بعض الناس فهم قوله تعالى في 10:94. وبيّن المفسرون أنه أسلوب شرطي لإقامة الحجة على المكذبين، لا أنه شك من النبي ﷺ.'
      ),
      t(
        'The Prophet lived with complete certainty in his mission. For believers, the lesson is to study context in Quranic verses and rely on tafsir scholarship before drawing theological conclusions.',
        'نبی کریم ﷺ اپنے مشن پر کامل یقین رکھتے تھے۔ ہمارے لیے سبق یہ ہے کہ قرآنی آیات کو سیاق و سباق اور معتبر تفسیر کے ساتھ سمجھا جائے۔',
        'كان النبي ﷺ على يقين تام برسالته. والعبرة للمؤمن أن يفهم الآيات في سياقها ويرجع إلى التفسير الموثوق قبل بناء الأحكام العقدية.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'hafs-vs-warsh-quran',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-02-14',
    relatedSurah: undefined,
    title: t('Hafs vs Warsh: Are They Different Qurans?', 'حفص اور ورش: کیا یہ دو قرآن ہیں؟', 'حفص وورش: هل هما قرآنان مختلفان؟'),
    excerpt: t(
      'Hafs and Warsh are canonical recitation transmissions, not separate scriptures.',
      'حفص اور ورش قراءت کی معتبر روایات ہیں، الگ قرآن نہیں۔',
      'حفص وورش طريقان متواتران في القراءة، وليسَا قرآنين مختلفين.'
    ),
    paragraphs: [
      t(
        'The Quran was revealed with recitational flexibility and transmitted through trusted reciters. Hafs \'an Asim is common in many regions, while Warsh \'an Nafi is widespread in North and West Africa.',
        'قرآن قراءت کے تنوع کے ساتھ نازل ہوا اور معتبر قراء کے ذریعے منتقل ہوا۔ حفص عن عاصم بہت علاقوں میں عام ہے جبکہ ورش عن نافع شمالی اور مغربی افریقہ میں معروف ہے۔',
        'نزل القرآن بوجوه قرائية ونُقل بالأسانيد المتواترة. حفص عن عاصم شائع في بلدان كثيرة، وورش عن نافع مشهور في المغرب وإفريقيا الغربية.'
      ),
      t(
        'Differences are mostly in pronunciation, elongation, and limited wording variations that preserve the same message. This richness demonstrates preservation through multiple chains, not contradiction.',
        'فرق عموماً تلفظ، مدود اور چند لفظی وجوہ میں ہوتا ہے مگر معنی ایک ہی رہتا ہے۔ یہ اختلاف نہیں بلکہ حفاظتِ قرآن کی ایک مضبوط صورت ہے۔',
        'الفروق غالبها في الأداء وبعض الألفاظ المعتبرة التي لا تنقض المعنى. وهذا يدل على قوة الحفظ بالنقل المتعدد لا على التناقض.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'laylatul-jaiza',
    categoryId: 'sawm',
    publishedAt: '2025-02-22',
    relatedSurah: undefined,
    title: t('What Is Laylatul Jaiza?', 'لیلۃ الجائزہ کیا ہے؟', 'ما هي ليلة الجائزة؟'),
    excerpt: t(
      'Laylatul Jaiza refers to the night before Eid, celebrated as a time of gratitude and dua.',
      'لیلۃ الجائزہ عید سے پہلی رات کو کہا جاتا ہے جس میں شکر اور دعا کی تلقین ہے۔',
      'ليلة الجائزة هي ليلة العيد، وتُعظَّم بالشكر والدعاء.'
    ),
    paragraphs: [
      t(
        'In many Muslim traditions, the eve of Eid al-Fitr is called Laylatul Jaiza, the "night of reward," after a month of fasting and devotion. While specific narrations vary in authenticity, the spirit of gratitude is well-rooted.',
        'مسلم روایت میں عید الفطر سے پہلی رات کو لیلۃ الجائزہ کہا جاتا ہے، یعنی اجر کی رات۔ اگرچہ اس عنوان سے بعض روایات کی اسناد مختلف درجے کی ہیں، مگر شکر گزاری کا مفہوم مضبوط ہے۔',
        'تسمى ليلة عيد الفطر عند كثير من المسلمين "ليلة الجائزة" بعد شهر الصيام. ورغم اختلاف درجة بعض الروايات، فمعنى الشكر بعد الطاعة ثابت في الدين.'
      ),
      t(
        'A believer spends this night in takbir, istighfar, charity, and family reconciliation. The best celebration is to carry Ramadan\'s discipline into the rest of the year.',
        'اس رات تکبیر، استغفار، صدقہ اور باہمی صلح کا اہتمام کیا جاتا ہے۔ بہترین خوشی یہ ہے کہ رمضان کی تربیت کو پورے سال جاری رکھا جائے۔',
        'يحييها المؤمن بالتكبير والاستغفار والصدقة وصلة الرحم. وأعظم فرحة أن تستمر تربية رمضان بعد انقضائه.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'how-many-pages-quran',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-03-02',
    relatedSurah: undefined,
    title: t('How Many Pages Are in the Quran?', 'قرآن کے کتنے صفحات ہیں؟', 'كم عدد صفحات القرآن؟'),
    excerpt: t(
      'The common Madani mushaf has 604 pages, divided into 30 ajza for practical recitation.',
      'عام مدنی مصحف میں 604 صفحات ہوتے ہیں اور اسے 30 پاروں میں تقسیم کیا گیا ہے۔',
      'المصحف المدني الشائع يتكون من 604 صفحات مقسمة إلى 30 جزءاً.'
    ),
    paragraphs: [
      t(
        'Most printed copies today follow the Madani format with 604 pages. The Quran has 114 surahs and 30 juz, making daily recitation plans easier for students and families.',
        'آج کل زیادہ تر مطبوعہ نسخے مدنی ترتیب کے مطابق 604 صفحات پر مشتمل ہوتے ہیں۔ قرآن میں 114 سورتیں اور 30 پارے ہیں، جس سے روزانہ تلاوت کا معمول آسان بنتا ہے۔',
        'تعتمد المصاحف الشائعة اليوم طبعة المدينة ذات 604 صفحات. ويتكوّن القرآن من 114 سورة و30 جزءاً، مما يسهل خطط التلاوة اليومية.'
      ),
      t(
        'Page numbers can vary in smaller scripts or regional prints, but the revealed text is identical. What matters most is consistency: a little recitation every day builds deep connection.',
        'چھوٹے رسم الخط یا علاقائی طباعت میں صفحات کی گنتی بدل سکتی ہے، مگر متن وہی رہتا ہے۔ اصل اہمیت تسلسل کی ہے: روزانہ تھوڑی تلاوت بھی دل کو قرآن سے جوڑ دیتی ہے۔',
        'قد يختلف ترقيم الصفحات باختلاف الطباعة والخط، لكن النص واحد. والأهم المداومة؛ فالقليل اليومي يصنع صلة عميقة بالقرآن.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'what-is-tajweed',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-03-10',
    relatedSurah: 73,
    title: t('What Is Tajweed?', 'تجوید کیا ہے؟', 'ما هو التجويد؟'),
    excerpt: t(
      'Tajweed is reciting Quran with correct pronunciation, rights of letters, and proper rhythm.',
      'تجوید قرآن کو صحیح مخارج اور قواعد کے ساتھ پڑھنے کا علم ہے۔',
      'التجويد هو قراءة القرآن بإخراج الحروف من مخارجها وإعطائها حقوقها.'
    ),
    paragraphs: [
      t(
        'Tajweed preserves how the Quran was recited by the Prophet (peace be upon him). It includes rules of articulation, elongation, stopping, and letter qualities so the meaning is protected in recitation.',
        'تجوید وہ طریقہ ہے جس سے قرآن نبی ﷺ کی قراءت کے مطابق محفوظ رہتا ہے۔ اس میں مخارج، مدود، وقف اور حروف کی صفات شامل ہیں تاکہ معنی محفوظ رہیں۔',
        'يحفظ التجويد طريقة قراءة النبي ﷺ للقرآن. ويشمل المخارج والمدود والوقف وصفات الحروف لصيانة المعنى والأداء.'
      ),
      t(
        'Beginners should learn slowly with a qualified teacher, even if reading speed is low. Beautiful recitation is not only melody; it is accuracy, reverence, and understanding.',
        'ابتدائی طالب علم کو رفتار کم ہو تب بھی استاد کے ساتھ درست پڑھنا سیکھنا چاہیے۔ خوبصورت تلاوت صرف آواز نہیں بلکہ صحت، ادب اور فہم ہے۔',
        'ينبغي للمبتدئ التعلم على شيخ متقن ولو ببطء. فحسن التلاوة ليس نغماً فقط، بل صحة وأدب وفهم.'
      ),
    ],
    quote: {
      arabic: 'وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا',
      ref: '73:4',
      en: '"And recite the Quran with measured recitation."',
      ur: '"اور قرآن کو ٹھہر ٹھہر کر پڑھو۔"',
      ar: '«ورتل القرآن ترتيلا»',
    },
  },
  {
    id: 'al-qadha-wal-qadr',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-03-18',
    relatedSurah: 54,
    title: t('Al-Qadha wal-Qadr Explained', 'القضاء والقدر کی وضاحت', 'شرح القضاء والقدر'),
    excerpt: t(
      'Qadr means Allah\'s complete knowledge and decree, while humans still make accountable choices.',
      'قدر کا مطلب اللہ کا کامل علم اور فیصلہ ہے، جبکہ انسان اپنے انتخاب کا ذمہ دار رہتا ہے۔',
      'القدر هو علم الله السابق وتقديره، مع بقاء الإنسان مسؤولاً عن اختياره.'
    ),
    paragraphs: [
      t(
        'Belief in qadr is one pillar of iman: Allah knows everything before it occurs, writes it, wills it, and creates it. This belief gives stability in hardship because nothing escapes divine wisdom.',
        'قدر پر ایمان ارکانِ ایمان میں شامل ہے: اللہ ہر چیز کو پہلے سے جانتا، لکھتا، چاہتا اور پیدا کرتا ہے۔ یہ عقیدہ مصیبت میں دل کو سہارا دیتا ہے کہ کچھ بھی اللہ کی حکمت سے باہر نہیں۔',
        'الإيمان بالقدر ركن من أركان الإيمان: علم الله السابق وكتابته ومشيئته وخلقه لكل شيء. وهذا يورث الطمأنينة عند البلاء.'
      ),
      t(
        'At the same time, Islam affirms human responsibility. We choose, strive, repent, and answer for actions. Trusting qadr never means passivity; it means effort with surrender to Allah\'s final outcome.',
        'ساتھ ہی اسلام انسانی ذمہ داری کو ثابت کرتا ہے۔ ہم نیت کرتے، محنت کرتے، توبہ کرتے اور جواب دہ ہوتے ہیں۔ قدر پر ایمان سستی نہیں بلکہ کوشش کے ساتھ اللہ پر توکل ہے۔',
        'ومع ذلك يثبت الإسلام مسؤولية العبد عن أفعاله. فالإيمان بالقدر لا يعني الكسل، بل الأخذ بالأسباب ثم التسليم لحكم الله.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'how-to-perform-jummah-prayer',
    categoryId: 'salah',
    publishedAt: '2025-03-26',
    relatedSurah: 62,
    title: t('How to Perform Jumu\'ah Prayer', 'جمعہ کی نماز کیسے ادا کریں؟', 'كيف تؤدى صلاة الجمعة؟'),
    excerpt: t(
      'Jumu\'ah includes a sermon and two rak\'ahs prayed in congregation at the time of Dhuhr.',
      'نمازِ جمعہ میں خطبہ اور دو رکعت باجماعت ادا کی جاتی ہیں۔',
      'صلاة الجمعة تتضمن خطبتين وركعتين جماعة في وقت الظهر.'
    ),
    paragraphs: [
      t(
        'A Muslim prepares for Jumu\'ah with ghusl, clean clothing, perfume (for men), and early arrival. The khatib delivers two sermons separated by a brief sitting, then the imam leads two rak\'ahs aloud.',
        'جمعہ کے لیے غسل، پاکیزہ لباس، خوشبو (مردوں کے لیے) اور جلد مسجد پہنچنا مستحب ہے۔ خطیب دو خطبے دیتا ہے جن کے درمیان مختصر بیٹھنا ہوتا ہے، پھر امام دو رکعت بلند قراءت سے پڑھاتا ہے۔',
        'يستحب للجمعة الغسل ولبس أحسن الثياب والتبكير. ثم يخطب الخطيب خطبتين بينهما جلوس يسير، وبعده يصلي الإمام ركعتين جهريتين.'
      ),
      t(
        'Congregants should listen silently during khutbah and avoid distractions, including unnecessary phone use. Jumu\'ah is a weekly spiritual reset that combines knowledge, community, and worship.',
        'مقتدیوں کو خطبہ غور سے سننا چاہیے اور دورانِ خطبہ گفتگو یا موبائل سے اجتناب کرنا چاہیے۔ جمعہ ہفتہ وار روحانی تجدید ہے جس میں علم، اجتماع اور عبادت جمع ہوتے ہیں۔',
        'يجب الإنصات للخطبة وترك اللغو والانشغال. والجمعة تجديد إيماني أسبوعي يجمع بين العلم والجماعة والعبادة.'
      ),
    ],
    quote: {
      arabic: 'يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِنْ يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ',
      ref: '62:9',
      en: '"When the call is made for prayer on Friday, hasten to the remembrance of Allah."',
      ur: '"اے ایمان والو! جب جمعہ کے دن نماز کے لیے پکارا جائے تو اللہ کے ذکر کی طرف دوڑو۔"',
      ar: '«فاسعوا إلى ذكر الله»',
    },
  },
  {
    id: 'how-to-memorize-quran',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-04-03',
    relatedSurah: undefined,
    title: t('How to Memorize the Quran', 'قرآن حفظ کیسے کریں؟', 'كيف تحفظ القرآن؟'),
    excerpt: t(
      'Hifz succeeds through small daily portions, revision, tajweed, and sincere dua.',
      'حفظِ قرآن چھوٹے روزانہ حصے، دہرائی، تجوید اور دعا سے کامیاب ہوتا ہے۔',
      'ينجح حفظ القرآن بالقليل اليومي والمراجعة والتجويد والدعاء.'
    ),
    paragraphs: [
      t(
        'Start with a realistic schedule: even half a page daily is powerful if consistent. Read new lines repeatedly with tajweed, then recite from memory to a teacher or study partner.',
        'حفظ کے لیے حقیقت پسندانہ نظام بنائیں: آدھا صفحہ روزانہ بھی مسلسل ہو تو مؤثر ہے۔ نئی سطور تجوید کے ساتھ بار بار پڑھیں، پھر استاد یا ساتھی کو سنائیں۔',
        'ابدأ بخطة واقعية؛ نصف صفحة يومياً مع الاستمرار مؤثر جداً. كرر الوجه الجديد بالتجويد ثم سمعه للشيخ أو زميل الحفظ.'
      ),
      t(
        'Revision is more important than new memorization. Divide time between sabq (new), sabaq-para (recent), and old portions to prevent forgetting. Ask Allah for barakah in time and firmness in heart.',
        'دہرائی نئی سبق سے زیادہ اہم ہے۔ وقت کو سبق، منزل اور پرانے حصے میں بانٹیں تاکہ بھول نہ ہو۔ اللہ سے وقت میں برکت اور دل کی پختگی مانگیں۔',
        'المراجعة أهم من الجديد. قسّم وقتك بين الجديد والقريب والقديم لئلا يتفلت المحفوظ. واسأل الله الثبات والبركة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'what-is-sunnah-prayer',
    categoryId: 'salah',
    publishedAt: '2025-04-11',
    relatedSurah: undefined,
    title: t('What Is Sunnah Prayer?', 'سنت نماز کیا ہے؟', 'ما هي صلاة السنة؟'),
    excerpt: t(
      'Sunnah prayers are voluntary prayers linked to obligatory salah and prophetic practice.',
      'سنت نمازیں وہ نفل عبادات ہیں جو فرض نمازوں کے ساتھ نبی ﷺ سے ثابت ہیں۔',
      'صلاة السنة هي نوافل مرتبطة بالفرائض وثابتة عن النبي ﷺ.'
    ),
    paragraphs: [
      t(
        'Sunnah prayers include emphasized units before and after obligatory prayers, such as two before Fajr and others around Dhuhr, Maghrib, and Isha. They compensate shortcomings and increase love for worship.',
        'سنت نمازوں میں فرضوں سے پہلے اور بعد کی مؤکدہ رکعات شامل ہیں، جیسے فجر سے پہلے دو رکعت۔ یہ عبادت کی کمی پوری کرتی اور نماز سے محبت بڑھاتی ہیں۔',
        'تشمل السنن الرواتب ركعات مؤكدة قبل الفرائض وبعدها، كركعتي الفجر. وهي تجبر النقص في الفرض وتزيد تعلق القلب بالصلاة.'
      ),
      t(
        'A person should begin gradually and remain consistent. The Prophet loved deeds that were regular even if small, so steady Sunnah practice builds lifelong discipline.',
        'آدمی کو آہستہ آغاز کر کے مستقل مزاجی اختیار کرنی چاہیے۔ نبی ﷺ کو وہ عمل پسند تھا جو تھوڑا مگر مسلسل ہو؛ اسی سے دائمی تربیت بنتی ہے۔',
        'الأفضل التدرج مع الاستمرار؛ فقد أحب النبي ﷺ الأعمال الدائمة وإن قلت. والمواظبة على السنن تصنع انضباطاً إيمانياً طويلاً.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'what-is-nafl-prayer',
    categoryId: 'salah',
    publishedAt: '2025-04-19',
    relatedSurah: undefined,
    title: t('What Is Nafl Prayer?', 'نفل نماز کیا ہے؟', 'ما هي صلاة النفل؟'),
    excerpt: t(
      'Nafl prayer is extra voluntary worship beyond obligatory and Sunnah prayers.',
      'نفل نماز فرض اور سنت کے علاوہ اضافی اختیاری عبادت ہے۔',
      'صلاة النفل عبادة تطوعية زائدة على الفرض والسنة.'
    ),
    paragraphs: [
      t(
        'Nafl prayers can be offered at various times, including Duha, Tahajjud, and general extra rak\'ahs. They are not sinful to miss, yet they are a major means of drawing close to Allah.',
        'نفل نمازیں مختلف اوقات میں ادا کی جا سکتی ہیں، جیسے اشراق/ضحیٰ، تہجد یا عمومی اضافی رکعات۔ انہیں چھوڑنے پر گناہ نہیں، لیکن یہ قربِ الٰہی کا بڑا ذریعہ ہیں۔',
        'تصلى النوافل في أوقات متعددة مثل الضحى والتهجد وغيرها. ولا يأثم تاركها، لكنها من أعظم أبواب القرب إلى الله.'
      ),
      t(
        'Nafl softens the heart and repairs spiritual dryness. Even two extra rak\'ahs after making wudu or before sleep can transform a person\'s relationship with worship.',
        'نفل دل کو نرم کرتی اور روحانی خشکی دور کرتی ہے۔ صرف دو اضافی رکعتیں، مثلاً وضو کے بعد یا سونے سے پہلے، عبادت سے تعلق گہرا کر دیتی ہیں۔',
        'تليّن النوافل القلب وتجدد الإيمان. وركعتان يسيرتان بعد الوضوء أو قبل النوم قد تغيّران علاقة العبد بعبادته.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'quran-seven-ahruf',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-04-27',
    relatedSurah: undefined,
    title: t('What Are the Seven Ahruf?', 'قرآن کے سات احرف کیا ہیں؟', 'ما معنى الأحرف السبعة؟'),
    excerpt: t(
      'The seven ahruf refer to divinely allowed modes that eased recitation for Arab tribes.',
      'سات احرف سے مراد قراءت کی وہ وسعت ہے جو عرب قبائل کی آسانی کے لیے دی گئی۔',
      'الأحرف السبعة وجوه قرائية أذن الله بها تيسيراً على العرب.'
    ),
    paragraphs: [
      t(
        'Authentic hadith mention that the Quran was revealed on seven ahruf. Scholars explained this as a mercy allowing certain linguistic variations in pronunciation and expression among early Arab communities.',
        'صحیح احادیث میں آیا ہے کہ قرآن سات احرف پر نازل ہوا۔ اہلِ علم نے اسے رحمت قرار دیا کہ ابتدائی عربی لہجوں اور اسالیب کے لیے گنجائش دی گئی۔',
        'ثبت في الأحاديث أن القرآن أُنزل على سبعة أحرف، وفسرها العلماء بأنها تيسير في بعض الوجوه اللغوية لألسنة العرب.'
      ),
      t(
        'This concept should not confuse believers about preservation. The Uthmani codex and canonical qira\'at preserved the revelation with precision, while maintaining legitimate recitational breadth.',
        'یہ تصور حفاظتِ قرآن کے خلاف نہیں۔ مصحفِ عثمانی اور متواتر قراءات نے وحی کو مکمل دقت کے ساتھ محفوظ رکھا اور جائز قراءتی وسعت بھی برقرار رہی۔',
        'لا يناقض ذلك حفظ القرآن؛ فالمصحف العثماني والقراءات المتواترة صانت النص بدقة مع بقاء السعة المعتبرة في الأداء.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'how-women-pray-islam',
    categoryId: 'salah',
    publishedAt: '2025-05-05',
    relatedSurah: undefined,
    title: t('How Women Pray in Islam', 'اسلام میں خواتین نماز کیسے پڑھتی ہیں؟', 'كيف تصلي المرأة في الإسلام؟'),
    excerpt: t(
      'Women perform the same pillars of salah, with fiqh details on modesty and congregation arrangements.',
      'خواتین بھی نماز کے بنیادی ارکان وہی ادا کرتی ہیں، البتہ فقہی تفصیلات حیا اور ترتیب سے متعلق ہیں۔',
      'تصلي المرأة بأركان الصلاة نفسها، مع تفاصيل فقهية تتعلق بالستر والتنظيم.'
    ),
    paragraphs: [
      t(
        'The essentials of salah are shared by men and women: intention, takbir, recitation, bowing, prostration, and tashahhud. The spiritual standing before Allah is equal in reward according to sincerity and obedience.',
        'نماز کے بنیادی ارکان مرد و عورت دونوں کے لیے یکساں ہیں: نیت، تکبیر، قراءت، رکوع، سجدہ اور تشہد۔ اللہ کے ہاں اجر اخلاص اور اطاعت کے مطابق ہے۔',
        'أركان الصلاة واحدة للرجل والمرأة: النية والتكبير والقراءة والركوع والسجود والتشهد. والثواب عند الله بحسب الإخلاص والطاعة.'
      ),
      t(
        'Schools of fiqh mention some practical differences in posture preference and public congregation context. Women should learn from reliable local scholars and maintain confidence that proper prayer is fully accepted by Allah.',
        'مذاہبِ فقہ میں بعض عملی فرق، جیسے ہیئت اور جماعتی ترتیب، بیان کیے گئے ہیں۔ خواتین معتبر اہلِ علم سے رہنمائی لیں اور اطمینان رکھیں کہ درست نماز اللہ کے ہاں پوری قبول ہے۔',
        'تذكر المذاهب بعض الفروع العملية في الهيئة وسياق الجماعة. والأصل أن تتعلم المرأة من أهل العلم الموثوقين وتطمئن إلى قبول صلاتها بإذن الله.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'qayamah-day-of-judgment',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-05-13',
    relatedSurah: 99,
    title: t('Qayamah: The Day of Judgment', 'قیامت کا دن', 'القيامة: يوم الحساب'),
    excerpt: t(
      'Qayamah is the final resurrection when every soul is judged with perfect justice.',
      'قیامت وہ دن ہے جب ہر نفس اٹھایا جائے گا اور مکمل عدل کے ساتھ حساب ہوگا۔',
      'القيامة يوم يبعث الله فيه الخلق للحساب بالعدل التام.'
    ),
    paragraphs: [
      t(
        'Islam teaches that worldly life is a test and not the final destination. On the Day of Judgment, deeds, intentions, and rights of others will be examined before Allah, who wrongs no one even by an atom\'s weight.',
        'اسلام سکھاتا ہے کہ دنیا امتحان ہے، آخری منزل نہیں۔ قیامت میں اعمال، نیتیں اور حقوق العباد سب پیش ہوں گے، اور اللہ ذرہ برابر ظلم نہیں کرے گا۔',
        'تعلمنا العقيدة أن الدنيا دار ابتلاء لا قرار. وفي يوم القيامة تعرض الأعمال والنيات والحقوق على الله الذي لا يظلم مثقال ذرة.'
      ),
      t(
        'Remembering Qayamah reforms conduct: a believer guards the tongue, fulfills trusts, and repents quickly. Hope in Allah\'s mercy and fear of accountability keep life balanced and meaningful.',
        'قیامت کی یاد انسان کی اصلاح کرتی ہے: زبان کی حفاظت، امانت کی ادائیگی اور فوری توبہ۔ اللہ کی رحمت کی امید اور حساب کا خوف زندگی کو متوازن بناتا ہے۔',
        'استحضار القيامة يهذب السلوك: حفظ اللسان وأداء الأمانة والمبادرة بالتوبة. والعبد يعيش بين رجاء الرحمة وخوف الحساب.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'kalima-in-islam',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-05-21',
    relatedSurah: undefined,
    title: t('The Kalima in Islam', 'اسلام میں کلمہ', 'الكلمة في الإسلام'),
    excerpt: t(
      'The Kalima declares tawhid and acceptance of Prophet Muhammad as Allah\'s messenger.',
      'کلمہ توحید اور رسالتِ محمدی کی گواہی ہے۔',
      'الكلمة إعلان للتوحيد والشهادة برسالة محمد ﷺ.'
    ),
    paragraphs: [
      t(
        'The testimony "La ilaha illa Allah, Muhammadur Rasulullah" is the doorway to Islam. It rejects all false objects of worship and commits the believer to obeying Allah through prophetic guidance.',
        '"لا الٰہ الا اللہ محمد رسول اللہ" اسلام کا دروازہ ہے۔ یہ ہر باطل معبود کی نفی کرتا ہے اور بندے کو اللہ اور اس کے رسول ﷺ کی اطاعت کا پابند بناتا ہے۔',
        'شهادة «لا إله إلا الله محمد رسول الله» هي مدخل الإسلام. فهي نفي لكل معبود باطل وإقرار بطاعة الله واتباع رسوله ﷺ.'
      ),
      t(
        'The Kalima is not a slogan but a covenant that shapes ethics, worship, and social dealings. A truthful tongue must be matched by truthful conduct.',
        'کلمہ صرف نعرہ نہیں بلکہ عہد ہے جو عبادت، اخلاق اور معاملات کو بدلتا ہے۔ زبان کی سچائی کے ساتھ کردار کی سچائی بھی ضروری ہے۔',
        'ليست الكلمة شعاراً مجرداً، بل عهد يوجّه العبادة والأخلاق والمعاملات. وصدق اللسان يكتمل بصدق العمل.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'abrahamic-prophets-islam',
    categoryId: 'prophets',
    publishedAt: '2025-05-29',
    relatedSurah: undefined,
    title: t('Abrahamic Prophets in Islam', 'اسلام میں ابراہیمی انبیاء', 'الأنبياء الإبراهيميون في الإسلام'),
    excerpt: t(
      'Islam honors Ibrahim and his prophetic descendants as one chain of monotheistic guidance.',
      'اسلام حضرت ابراہیم اور ان کی نسل کے انبیاء کو توحیدی ہدایت کی ایک زنجیر مانتا ہے۔',
      'يُجل الإسلام إبراهيم وذرية الأنبياء من بعده كسلسلة هداية توحيدية واحدة.'
    ),
    paragraphs: [
      t(
        'Ibrahim (AS) is a central figure in Islam, titled Khalilullah. Through his sons Ishaq and Isma\'il came many prophets, including Ya\'qub, Yusuf, Musa, Dawud, Sulayman, Zakariyya, Yahya, Isa, and finally Muhammad (peace be upon them all).',
        'حضرت ابراہیم علیہ السلام اسلام میں خلیل اللہ کے طور پر عظیم مقام رکھتے ہیں۔ ان کی نسل میں اسحاق و اسماعیل سے متعدد انبیاء آئے، یہاں تک کہ موسیٰ، داؤد، عیسیٰ اور آخر میں محمد ﷺ۔',
        'لإبراهيم عليه السلام مكانة عظيمة في الإسلام بوصفه خليل الله. ومن ذريته عبر إسحاق وإسماعيل جاء أنبياء كثيرون حتى خاتمهم محمد ﷺ.'
      ),
      t(
        'This continuity shows that divine revelation has one core message: worship Allah alone and live righteously. Muslims respect all prophets and reject selective belief in some while denying others.',
        'یہ تسلسل بتاتا ہے کہ وحی کا مرکزی پیغام ایک ہی ہے: صرف اللہ کی عبادت اور نیک زندگی۔ مسلمان تمام انبیاء پر ایمان رکھتے ہیں، کسی کو مان کر کسی کو رد نہیں کرتے۔',
        'يدل هذا الامتداد على وحدة الرسالة: عبادة الله وحده والاستقامة. ويؤمن المسلمون بجميع الأنبياء دون تفريق انتقائي.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'how-to-pray-janazah',
    categoryId: 'salah',
    publishedAt: '2025-06-06',
    relatedSurah: undefined,
    title: t('How to Pray Janazah', 'نمازِ جنازہ کیسے پڑھیں؟', 'كيف تصلى صلاة الجنازة؟'),
    excerpt: t(
      'Janazah prayer is a communal obligation with takbirs, dua, and no ruku or sujud.',
      'نمازِ جنازہ فرضِ کفایہ ہے، جس میں تکبیریں اور دعائیں ہوتی ہیں، رکوع و سجدہ نہیں۔',
      'صلاة الجنازة فرض كفاية، فيها تكبيرات وأدعية بلا ركوع ولا سجود.'
    ),
    paragraphs: [
      t(
        'The imam stands facing qiblah with the deceased placed ahead. Janazah consists of four takbirs: after the first, Surah Al-Fatihah; after the second, salawat on the Prophet; after the third, dua for the deceased; after the fourth, brief pause then salam.',
        'امام قبلہ رخ کھڑا ہوتا ہے اور میت سامنے رکھی جاتی ہے۔ جنازہ چار تکبیروں پر مشتمل ہے: پہلی کے بعد فاتحہ، دوسری کے بعد درود، تیسری کے بعد میت کے لیے دعا، چوتھی کے بعد سلام۔',
        'يقف الإمام إلى القبلة والميت أمامه. صلاة الجنازة أربع تكبيرات: بعد الأولى الفاتحة، وبعد الثانية الصلاة على النبي، وبعد الثالثة الدعاء للميت، ثم تسليم.'
      ),
      t(
        'Because death softens hearts, Janazah reminds the living to repent and prepare for meeting Allah. Participating in funeral rites is both service to the community and personal spiritual awakening.',
        'موت دل کو نرم کرتی ہے، اس لیے نمازِ جنازہ زندہ لوگوں کو توبہ اور آخرت کی تیاری یاد دلاتی ہے۔ جنازہ میں شرکت خدمتِ خلق بھی ہے اور روحانی بیداری بھی۔',
        'تذكّر الجنازة الأحياء بالرجوع إلى الله والاستعداد للآخرة. والمشاركة فيها خدمة للمجتمع وتربية للنفس.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'surah-kahf-first-10-verses',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-06-14',
    relatedSurah: 18,
    title: t('First 10 Verses of Surah Al-Kahf', 'سورۃ کہف کی پہلی دس آیات', 'أوائل عشر آيات من سورة الكهف'),
    excerpt: t(
      'Memorizing these verses is linked to protection from Dajjal and fitan.',
      'ان آیات کی یادداشت کو دجال کے فتنہ سے حفاظت کا ذریعہ بتایا گیا ہے۔',
      'حفظ هذه الآيات مرتبط بالحماية من فتنة الدجال والفتن.'
    ),
    paragraphs: [
      t(
        'The opening of Surah Al-Kahf praises Allah for revealing the straight Book and warns against deviation. It establishes clear faith principles: revelation, accountability, and hope for righteous deeds.',
        'سورۃ کہف کی ابتدا اللہ کی حمد اور کتابِ مستقیم کے ذکر سے ہوتی ہے، اور انحراف سے خبردار کرتی ہے۔ اس میں وحی، جواب دہی اور عملِ صالح کے بنیادی اصول قائم کیے گئے ہیں۔',
        'تبدأ سورة الكهف بحمد الله على إنزال الكتاب القيّم والتحذير من الانحراف. وتؤسس لمعاني الوحي والمسؤولية والبشارة لأهل الصلاح.'
      ),
      t(
        'Prophetic narrations encourage memorizing and reciting these verses for protection from major trials. Regular Friday recitation renews iman and reminds believers that truth survives every age.',
        'احادیث میں ان آیات کو بڑے فتنوں سے حفاظت کا ذریعہ بتایا گیا ہے۔ جمعہ کے دن ان کی تلاوت ایمان کو تازہ کرتی اور حق پر استقامت سکھاتی ہے۔',
        'تحث السنة على حفظ هذه الآيات وقراءتها اتقاءً للفتن الكبرى. ومواظبتها يوم الجمعة تجدد الإيمان وتثبت على الحق.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'bani-israel-in-quran',
    categoryId: 'quranic-stories',
    publishedAt: '2025-06-22',
    relatedSurah: 2,
    title: t('Bani Israel in the Quran', 'قرآن میں بنی اسرائیل', 'بنو إسرائيل في القرآن'),
    excerpt: t(
      'The Quran recounts Bani Israel with lessons on gratitude, covenant, and obedience.',
      'قرآن بنی اسرائیل کے واقعات کو شکر، عہد اور اطاعت کے اسباق کے ساتھ بیان کرتا ہے۔',
      'يذكر القرآن بني إسرائيل بعبر في الشكر والميثاق والطاعة.'
    ),
    paragraphs: [
      t(
        'Bani Israel are mentioned extensively in the Quran, especially around the mission of Musa (AS). Their story includes liberation from Pharaoh, receiving divine law, and repeated tests of faith and discipline.',
        'بنی اسرائیل کا ذکر قرآن میں کثرت سے آیا ہے، خصوصاً حضرت موسیٰ علیہ السلام کے واقعات میں۔ ان کی تاریخ میں فرعون سے نجات، شریعت کا ملنا، اور ایمان و اطاعت کے مسلسل امتحانات شامل ہیں۔',
        'ورد ذكر بني إسرائيل كثيراً في القرآن، ولا سيما مع موسى عليه السلام. وتتضمن قصتهم النجاة من فرعون، وتلقي الشريعة، وابتلاءات متكررة في الإيمان والانضباط.'
      ),
      t(
        'The Quran uses these narratives as moral instruction for all communities, not ethnic condemnation. Believers are taught to fulfill promises, avoid arrogance, and remain grateful for guidance.',
        'قرآن ان واقعات کو نسل پرستی کے لیے نہیں بلکہ اخلاقی رہنمائی کے لیے بیان کرتا ہے۔ اہلِ ایمان کو عہد پورا کرنے، تکبر سے بچنے اور ہدایت پر شکر ادا کرنے کی تعلیم دی جاتی ہے۔',
        'لا يذكر القرآن هذه القصة للتجريح العرقي، بل للعبرة العامة. فالمؤمن مأمور بالوفاء والبعد عن الكبر وشكر نعمة الهداية.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'surah-kahf-last-10-verses',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-06-30',
    relatedSurah: 18,
    title: t('Last 10 Verses of Surah Al-Kahf', 'سورۃ کہف کی آخری دس آیات', 'أواخر عشر آيات من سورة الكهف'),
    excerpt: t(
      'These verses conclude with sincerity, humility, and warning against hidden shirk.',
      'یہ آیات اخلاص، عاجزی اور پوشیدہ شرک سے بچنے کی نصیحت کرتی ہیں۔',
      'تختم هذه الآيات بمعاني الإخلاص والتواضع والتحذير من الشرك الخفي.'
    ),
    paragraphs: [
      t(
        'The closing of Surah Al-Kahf recalls accountability before Allah and the reality that worldly efforts can be wasted if detached from true faith. It addresses self-deception in worship and action.',
        'سورۃ کہف کا اختتام آخرت کے حساب اور اس حقیقت کو سامنے لاتا ہے کہ ایمان کے بغیر اعمال ضائع ہو سکتے ہیں۔ یہ عبادت اور عمل میں خود فریبی سے خبردار کرتا ہے۔',
        'ختام السورة يذكر بالحساب وأن العمل قد يضيع إذا خلا من الإيمان الصحيح. وفيه تحذير من الاغترار بالنفس في العبادة والعمل.'
      ),
      t(
        'The final verse commands that whoever hopes to meet Allah must do righteous deeds and avoid associating partners in worship. This concise formula defines accepted devotion.',
        'آخری آیت کہتی ہے کہ جو اپنے رب سے ملاقات کی امید رکھتا ہے وہ نیک عمل کرے اور عبادت میں کسی کو شریک نہ کرے۔ یہی قبولیتِ عبادت کا خلاصہ ہے۔',
        'تأمر الآية الأخيرة من يرجو لقاء ربه بالعمل الصالح وترك الإشراك في العبادة. وهي قاعدة جامعة لقبول العمل.'
      ),
    ],
    quote: {
      arabic: 'فَمَنْ كَانَ يَرْجُو لِقَاءَ رَبِّهِ فَلْيَعْمَلْ عَمَلًا صَالِحًا وَلَا يُشْرِكْ',
      ref: '18:110',
      en: '"Whoever hopes to meet his Lord, let him do righteous deeds and not associate anyone in worship."',
      ur: '"جو اپنے رب سے ملنے کی امید رکھتا ہے وہ نیک عمل کرے اور عبادت میں کسی کو شریک نہ ٹھہرائے۔"',
      ar: '«فليعمل عملاً صالحاً ولا يشرك بعبادة ربه أحداً»',
    },
  },
  {
    id: 'abraham-prophet-islam',
    categoryId: 'prophets',
    publishedAt: '2025-07-08',
    relatedSurah: 14,
    title: t('Prophet Ibrahim in Islam', 'اسلام میں حضرت ابراہیم علیہ السلام', 'إبراهيم عليه السلام في الإسلام'),
    excerpt: t(
      'Ibrahim is a model of tawhid, sacrifice, and unwavering trust in Allah.',
      'حضرت ابراہیم توحید، قربانی اور توکل کے عظیم نمونہ ہیں۔',
      'إبراهيم قدوة في التوحيد والتضحية والتوكل.'
    ),
    paragraphs: [
      t(
        'Ibrahim (AS) challenged idol worship with wisdom and courage, even facing his own people and ruler. He was thrown into fire, but Allah made it cool and safe, proving that truth is protected by divine will.',
        'حضرت ابراہیم علیہ السلام نے بت پرستی کے خلاف حکمت اور جرات سے آواز اٹھائی۔ انہیں آگ میں ڈالا گیا مگر اللہ نے اسے ٹھنڈی اور سلامتی والی بنا دیا۔',
        'واجه إبراهيم قومه وملكهم في قضية التوحيد، فأُلقي في النار فجعلها الله برداً وسلاماً عليه.'
      ),
      t(
        'His life also includes migration, rebuilding the Ka\'bah with Isma\'il, and readiness to sacrifice what he loved for Allah. Muslims honor him daily in salah and yearly in Hajj rites.',
        'ان کی زندگی ہجرت، اسماعیل کے ساتھ کعبہ کی تعمیر، اور اللہ کے لیے محبوب چیز قربان کرنے کے جذبے سے بھرپور ہے۔ مسلمان نماز اور حج میں روز ان کی یاد تازہ کرتے ہیں۔',
        'ومن سيرته الهجرة وبناء الكعبة مع إسماعيل والاستعداد للتضحية في سبيل الله. ويحيي المسلمون أثره في الصلاة والحج.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'messiah-in-quran',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-07-16',
    relatedSurah: 3,
    title: t('The Messiah in the Quran', 'قرآن میں مسیح کا تصور', 'المسيح في القرآن'),
    excerpt: t(
      'The Quran affirms Isa as al-Masih, a noble prophet and sign from Allah.',
      'قرآن حضرت عیسیٰ کو مسیح قرار دیتا ہے: اللہ کے برگزیدہ نبی اور نشانی۔',
      'يثبت القرآن أن عيسى هو المسيح، نبي كريم وآية من الله.'
    ),
    paragraphs: [
      t(
        'In the Quran, Isa ibn Maryam is called al-Masih and honored with miracles by Allah\'s permission. He spoke in the cradle, healed the sick by Allah\'s leave, and called people to pure monotheism.',
        'قرآن میں عیسیٰ ابن مریم کو "المسیح" کہا گیا ہے اور اللہ کے اذن سے معجزات دیے گئے۔ انہوں نے گہوارے میں کلام کیا، مریضوں کو شفا دی، اور توحید کی دعوت دی۔',
        'في القرآن يُسمى عيسى ابن مريم بالمسيح، وأُيّد بآيات بإذن الله؛ كالكلام في المهد وإبراء المرضى والدعوة إلى التوحيد.'
      ),
      t(
        'Islam rejects both denial and deification of Isa. Muslims love him as a mighty messenger, believe in his return before the end times, and follow the final revelation brought by Muhammad (peace be upon him).',
        'اسلام عیسیٰ علیہ السلام کے انکار اور الوہیت دونوں کو رد کرتا ہے۔ مسلمان انہیں عظیم رسول مانتے، ان کی واپسی پر ایمان رکھتے، اور محمد ﷺ کی آخری شریعت کی پیروی کرتے ہیں۔',
        'يرفض الإسلام جحود عيسى وتأليهه معاً. فالمسلمون يؤمنون به رسولاً عظيماً وبنزوله آخر الزمان، ويتبعون الوحي الخاتم لمحمد ﷺ.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'marriage-rules-islam',
    categoryId: 'lifestyle',
    publishedAt: '2025-07-24',
    relatedSurah: 4,
    title: t('Marriage Rules in Islam', 'اسلام میں نکاح کے اصول', 'أحكام الزواج في الإسلام'),
    excerpt: t(
      'Islamic marriage is a sacred contract built on consent, responsibility, and mercy.',
      'اسلامی نکاح رضامندی، ذمہ داری اور رحمت پر قائم ایک مقدس معاہدہ ہے۔',
      'الزواج في الإسلام عقد مقدس قائم على الرضا والمسؤولية والرحمة.'
    ),
    paragraphs: [
      t(
        'A valid nikah requires clear consent, witnesses, mahr, and public recognition. Islam forbids coercion and commands fairness, maintenance, and good treatment between spouses.',
        'درست نکاح کے لیے باہمی رضامندی، گواہ، مہر اور اعلان ضروری ہیں۔ اسلام زبردستی کو منع کرتا ہے اور میاں بیوی کے درمیان حسنِ سلوک اور عدل کا حکم دیتا ہے۔',
        'يشترط لصحة النكاح الرضا والشهود والمهر والإشهار. ويحرم الإكراه، ويأمر الإسلام بالعدل وحسن المعاشرة بين الزوجين.'
      ),
      t(
        'Marriage is not only social arrangement but spiritual partnership. Couples are encouraged to resolve conflict with patience, consultation, and respect for rights laid out in Shariah.',
        'نکاح صرف سماجی بندھن نہیں بلکہ روحانی رفاقت ہے۔ اختلاف کی صورت میں صبر، مشاورت اور شرعی حقوق کی پاسداری سے گھر مضبوط ہوتا ہے۔',
        'والزواج ليس ترتيباً اجتماعياً فقط بل شراكة إيمانية. وتُعالج الخلافات بالصبر والشورى واحترام الحقوق الشرعية.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'prophet-lineage-abraham',
    categoryId: 'history',
    publishedAt: '2025-08-01',
    relatedSurah: undefined,
    title: t('Prophetic Lineage from Abraham', 'ابراہیم علیہ السلام سے انبیاء کی نسل', 'سلسلة الأنبياء من ذرية إبراهيم'),
    excerpt: t(
      'Many prophets came through the blessed lineage of Ibrahim through Ishaq and Isma\'il.',
      'حضرت ابراہیم کی مبارک نسل سے اسحاق اور اسماعیل کے ذریعے کئی انبیاء آئے۔',
      'جاء كثير من الأنبياء من ذرية إبراهيم عبر إسحاق وإسماعيل.'
    ),
    paragraphs: [
      t(
        'Allah granted Ibrahim (AS) righteous descendants and made prophethood continue among them. Through Ishaq came prophets of Bani Israel, and through Isma\'il came the Arab line culminating in Prophet Muhammad (peace be upon him).',
        'اللہ نے حضرت ابراہیم کو نیک اولاد دی اور نبوت کا سلسلہ ان میں جاری رکھا۔ اسحاق کی نسل میں بنی اسرائیل کے انبیاء آئے، اور اسماعیل کی نسل میں آخرکار محمد ﷺ تشریف لائے۔',
        'جعل الله في ذرية إبراهيم النبوة. فمن جهة إسحاق جاء أنبياء بني إسرائيل، ومن جهة إسماعيل جاء خاتم الأنبياء محمد ﷺ.'
      ),
      t(
        'Studying prophetic lineage teaches historical continuity of faith. The message remained one across generations: submit to Allah, uphold justice, and call humanity to truth.',
        'انبیائی نسب کا مطالعہ ایمان کی تاریخی وحدت دکھاتا ہے۔ نسلیں بدلتی رہیں مگر پیغام ایک ہی رہا: اللہ کے آگے جھکنا، عدل قائم کرنا اور حق کی دعوت دینا۔',
        'تعلّمنا الأنساب النبوية وحدة الرسالة عبر التاريخ: الاستسلام لله وإقامة العدل والدعوة إلى الحق.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'universe-created-allah',
    categoryId: 'tawhid',
    publishedAt: '2025-08-09',
    relatedSurah: 21,
    title: t('Was the Universe Created by Allah?', 'کیا کائنات اللہ نے پیدا کی؟', 'هل خلق الله الكون؟'),
    excerpt: t(
      'The Quran repeatedly points to cosmic signs as evidence of one Creator.',
      'قرآن بار بار کائنات کی نشانیوں سے ایک خالق پر دلیل قائم کرتا ہے۔',
      'يستدل القرآن بآيات الكون على وجود الخالق الواحد.'
    ),
    paragraphs: [
      t(
        'Islamic belief affirms that Allah created the heavens and the earth with wisdom and purpose. The order of stars, cycles of life, and harmony of natural laws are signs leading the heart to tawhid.',
        'اسلامی عقیدہ ہے کہ اللہ نے آسمان و زمین کو حکمت کے ساتھ پیدا کیا۔ ستاروں کی ترتیب، زندگی کے نظام اور کائناتی توازن انسان کو توحید کی طرف رہنمائی دیتے ہیں۔',
        'تؤكد العقيدة الإسلامية أن الله خلق السماوات والأرض بحكمة. ونظام الكون وتناسقه آيات تهدي إلى التوحيد.'
      ),
      t(
        'The Quran encourages reflection rather than blind imitation. Scientific exploration can deepen faith when approached with humility, recognizing that knowledge uncovers creation but does not replace the Creator.',
        'قرآن اندھی تقلید کے بجائے غور و فکر کی دعوت دیتا ہے۔ سائنسی تحقیق ایمان کو گہرا کر سکتی ہے جب انسان عاجزی سے سمجھے کہ علم مخلوق کو کھولتا ہے، خالق کا بدل نہیں بنتا۔',
        'يدعو القرآن إلى التفكر لا التقليد الأعمى. والبحث العلمي يزيد الإيمان إذا اقترن بالتواضع، فالعلم يكشف الخلق ولا يغني عن الخالق.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'prophets-last-sermon',
    categoryId: 'sunnah-hadith',
    publishedAt: '2025-08-17',
    relatedSurah: undefined,
    title: t('Lessons from the Prophet\'s Last Sermon', 'خطبہ حجۃ الوداع کے اسباق', 'دروس من خطبة الوداع'),
    excerpt: t(
      'The Farewell Sermon established human dignity, justice, and accountability before Allah.',
      'خطبہ حجۃ الوداع نے انسانی حرمت، عدل اور جواب دہی کے اصول واضح کیے۔',
      'قررت خطبة الوداع حرمة الإنسان والعدل والمسؤولية أمام الله.'
    ),
    paragraphs: [
      t(
        'In his final sermon, the Prophet (peace be upon him) emphasized sanctity of life, property, and honor. He abolished pre-Islamic injustice, condemned usury, and reminded believers that all are equal before Allah except by taqwa.',
        'خطبہ حجۃ الوداع میں نبی ﷺ نے جان، مال اور عزت کی حرمت پر زور دیا۔ جاہلی ظلم اور سود کی مذمت کی، اور بتایا کہ اللہ کے نزدیک برتری کا معیار صرف تقویٰ ہے۔',
        'أكد النبي ﷺ في خطبة الوداع حرمة الدماء والأموال والأعراض، وأبطل مظالم الجاهلية والربا، وقرر أن التفاضل بالتقوى.'
      ),
      t(
        'He also highlighted women\'s rights, trust in revelation, and duty to convey truth. The sermon remains a comprehensive ethical charter for Muslim societies today.',
        'آپ ﷺ نے خواتین کے حقوق، کتاب و سنت سے وابستگی اور دین پہنچانے کی ذمہ داری بھی بیان کی۔ یہ خطبہ آج بھی مسلم معاشروں کے لیے مکمل اخلاقی منشور ہے۔',
        'كما أوصى بحقوق النساء والتمسك بالوحي وتبليغ الرسالة. وتبقى الخطبة ميثاقاً أخلاقياً جامعاً للمجتمعات المسلمة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'taharah-cleanliness',
    categoryId: 'lifestyle',
    publishedAt: '2025-08-25',
    relatedSurah: 2,
    title: t('Taharah and Cleanliness in Islam', 'اسلام میں طہارت اور صفائی', 'الطهارة والنظافة في الإسلام'),
    excerpt: t(
      'Taharah is physical and spiritual purification at the heart of Islamic practice.',
      'طہارت ظاہری و باطنی پاکیزگی ہے جو اسلامی زندگی کا بنیادی حصہ ہے۔',
      'الطهارة تطهير حسي ومعنوي وهي أصل في حياة المسلم.'
    ),
    paragraphs: [
      t(
        'Prayer, Quran recitation, and many acts of worship begin with purification through wudu or ghusl. Islam links cleanliness with dignity, health, and readiness to stand before Allah.',
        'نماز، تلاوت اور کئی عبادات سے پہلے وضو یا غسل کی طہارت مطلوب ہے۔ اسلام صفائی کو عزت، صحت اور اللہ کے حضور حاضری کی تیاری سے جوڑتا ہے۔',
        'تسبق الطهارة كثيراً من العبادات كالصلاة، بالوضوء أو الغسل. ويربط الإسلام النظافة بالكرامة والصحة والاستعداد للوقوف بين يدي الله.'
      ),
      t(
        'Taharah also includes moral purity: guarding the heart from envy and the tongue from harm. A clean home and clean heart together reflect prophetic character.',
        'طہارت صرف جسمانی نہیں، اخلاقی بھی ہے: دل کو حسد سے اور زبان کو اذیت سے پاک رکھنا۔ پاک گھر اور پاک دل مل کر سنتی کردار بناتے ہیں۔',
        'ولا تقتصر الطهارة على البدن، بل تشمل نقاء القلب من الحسد واللسان من الأذى. فطهارة الظاهر والباطن من هدي النبوة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'shirk-in-islam',
    categoryId: 'tawhid',
    publishedAt: '2025-09-02',
    relatedSurah: 4,
    title: t('Shirk in Islam', 'اسلام میں شرک', 'الشرك في الإسلام'),
    excerpt: t(
      'Shirk is associating partners with Allah and is the gravest spiritual violation.',
      'شرک اللہ کے ساتھ شریک ٹھہرانا ہے اور یہ سب سے بڑا روحانی جرم ہے۔',
      'الشرك هو جعل شريك لله، وهو أعظم الذنوب.'
    ),
    paragraphs: [
      t(
        'Tawhid is the foundation of Islam, and shirk opposes that foundation by directing worship, reliance, or ultimate fear to other than Allah. The Quran repeatedly warns against both obvious and subtle forms of shirk.',
        'توحید اسلام کی بنیاد ہے اور شرک اس بنیاد کی ضد ہے، یعنی عبادت، توکل یا خوفِ مطلق اللہ کے سوا کسی کے لیے رکھنا۔ قرآن کھلے اور پوشیدہ دونوں طرح کے شرک سے خبردار کرتا ہے۔',
        'التوحيد أساس الدين، والشرك نقض لهذا الأساس بتوجيه العبادة أو التوكل أو الخوف المطلق لغير الله. وقد حذر القرآن من الشرك الجلي والخفي.'
      ),
      t(
        'Muslims protect faith by learning correct aqidah, making sincere dua, and avoiding superstition. Repentance remains open for every sin before death, and Allah loves those who return to Him.',
        'مسلمان صحیح عقیدہ سیکھ کر، خالص دعا کر کے، اور توہمات سے بچ کر ایمان کی حفاظت کرتے ہیں۔ موت سے پہلے ہر گناہ سے توبہ کا دروازہ کھلا ہے، اور اللہ توبہ کرنے والوں سے محبت کرتا ہے۔',
        'يحفظ المسلم إيمانه بتعلم العقيدة الصحيحة والإخلاص في الدعاء وترك الخرافة. وباب التوبة مفتوح قبل الموت، والله يحب التوابين.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'types-of-kufr',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-09-10',
    relatedSurah: undefined,
    title: t('Types of Kufr', 'کفر کی اقسام', 'أنواع الكفر'),
    excerpt: t(
      'Islamic scholarship distinguishes between disbelief in creed and sins called minor kufr in language.',
      'علمائے اسلام اعتقادی کفر اور ایسے اعمال میں فرق کرتے ہیں جنہیں مجازی طور پر کفر کہا گیا ہو۔',
      'يفرق العلماء بين الكفر الاعتقادي وبين أعمال توصف بكفر دون الخروج من الملة.'
    ),
    paragraphs: [
      t(
        'Classical scholars describe major kufr as rejection of Allah, revelation, or core beliefs that define Islam. They also discuss forms like denial, arrogance, hypocrisy in creed, and turning away from truth knowingly.',
        'اکابر علماء کے نزدیک کفرِ اکبر وہ ہے جو اللہ، وحی یا اصولِ ایمان کے انکار پر مبنی ہو۔ اس میں انکار، استکبار، اعتقادی نفاق اور حق سے جان بوجھ کر اعراض شامل ہو سکتے ہیں۔',
        'يذكر العلماء أن الكفر الأكبر يكون بجحد أصول الإيمان أو الإعراض عنها، ومن صوره الجحود والاستكبار والنفاق الاعتقادي.'
      ),
      t(
        'Some texts also mention "kufr duna kufr" for severe sins that do not expel a Muslim from Islam. These distinctions require scholarship, caution, and avoidance of reckless takfir.',
        'بعض نصوص میں "کفر دون کفر" بھی آتا ہے، یعنی بڑے گناہ جو ایمان سے خارج نہیں کرتے۔ ان مسائل میں احتیاط اور اہلِ علم کی رہنمائی ضروری ہے، بے جا تکفیر سے بچنا چاہیے۔',
        'وتأتي نصوص في "كفر دون كفر" لأعمال عظيمة لا تُخرج من الملة. وهذه الأبواب تحتاج علماً وحذراً وترك التسرع في التكفير.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'names-of-angels-islam',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-09-18',
    relatedSurah: undefined,
    title: t('Names of Angels in Islam', 'اسلام میں فرشتوں کے نام', 'أسماء الملائكة في الإسلام'),
    excerpt: t(
      'Belief in angels includes known names and trust in unseen servants of Allah.',
      'فرشتوں پر ایمان میں معروف ناموں کے ساتھ تمام غیبی ملائکہ پر یقین شامل ہے۔',
      'الإيمان بالملائكة يشمل الأسماء الواردة والإيمان بسائرهم غيباً.'
    ),
    paragraphs: [
      t(
        'Among the well-known angels are Jibreel (revelation), Mika\'il (provision), Israfil (trumpet), and Malik (guardian of Hell). The Quran and Sunnah also mention Kiraman Katibin, Munkar and Nakir, and angels carrying the Throne.',
        'مشہور فرشتوں میں جبریل (وحی)، میکائیل (رزق)، اسرافیل (صور) اور مالک (دوزخ کے داروغہ) شامل ہیں۔ قرآن و حدیث میں کراماً کاتبین، منکر نکیر اور حاملانِ عرش کا بھی ذکر ہے۔',
        'من أشهر الملائكة: جبريل للوحي، وميكائيل للرزق، وإسرافيل للنفخ في الصور، ومالك خازن النار. وورد ذكر الكاتبين ومنكر ونكير وحملة العرش.'
      ),
      t(
        'Angels never disobey Allah and continuously serve His command. Remembering them deepens awareness that human life is recorded and monitored with absolute justice.',
        'فرشتے اللہ کی نافرمانی نہیں کرتے اور ہمیشہ اس کے حکم پر قائم رہتے ہیں۔ ان پر ایمان سے بندے کو شعور ملتا ہے کہ اس کی زندگی مکمل عدل کے ساتھ لکھی جا رہی ہے۔',
        'الملائكة لا يعصون الله ويفعلون ما يؤمرون. واستحضارهم يرسخ أن أعمال الإنسان محفوظة ومحاسَب عليها بالعدل.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'why-surah-kafirun-revealed',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-09-26',
    relatedSurah: 109,
    title: t('Why Was Surah Al-Kafirun Revealed?', 'سورۃ الکافرون کیوں نازل ہوئی؟', 'لماذا نزلت سورة الكافرون؟'),
    excerpt: t(
      'This surah firmly rejects religious compromise in matters of worship.',
      'یہ سورت عبادت کے معاملے میں مصالحتی شرک کو قطعی طور پر رد کرتی ہے۔',
      'ترفض السورة أي مساومة عقدية في العبادة.'
    ),
    paragraphs: [
      t(
        'Leaders of Quraysh proposed a compromise: they would worship Allah for a period if the Prophet joined idol worship for another period. Surah Al-Kafirun came as a decisive response rejecting mixture in creed.',
        'قریش کے سرداروں نے سمجھوتہ پیش کیا کہ کچھ عرصہ وہ اللہ کی عبادت کریں گے اور کچھ عرصہ نبی ﷺ ان کے معبودوں کی۔ سورۃ الکافرون نے اس عقیدتی سودے کو قطعی رد کر دیا۔',
        'اقترح مشركو قريش مساومة في العبادة، فنزلت سورة الكافرون حاسمةً برفض الخلط العقدي.'
      ),
      t(
        'The surah teaches respectful coexistence without surrendering principles. Muslims can show kindness to others while keeping worship purely for Allah.',
        'یہ سورت بتاتی ہے کہ باہمی احترام ممکن ہے مگر عقیدہ فروخت نہیں ہوتا۔ مسلمان دوسروں سے حسنِ سلوک رکھتے ہوئے عبادت صرف اللہ کے لیے خاص رکھتے ہیں۔',
        'تعلّم السورة الجمع بين حسن المعاملة والثبات العقدي؛ فالإحسان للناس لا يعني التنازل عن توحيد العبادة.'
      ),
    ],
    quote: {
      arabic: 'لَكُمْ دِينُكُمْ وَلِيَ دِينِ',
      ref: '109:6',
      en: '"For you is your religion, and for me is my religion."',
      ur: '"تمہارے لیے تمہارا دین، اور میرے لیے میرا دین۔"',
      ar: '«لكم دينكم ولي دين»',
    },
  },
  {
    id: 'evil-eye-islam',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-10-04',
    relatedSurah: 113,
    title: t('Evil Eye in Islam', 'اسلام میں نظرِ بد', 'العين في الإسلام'),
    excerpt: t(
      'Islam recognizes the evil eye and teaches protection through duas and trust in Allah.',
      'اسلام نظرِ بد کے اثر کو تسلیم کرتا ہے اور دعا و توکل کے ذریعے حفاظت سکھاتا ہے۔',
      'يقر الإسلام بالعَيْن ويعلّم التحصن بالأذكار والتوكل على الله.'
    ),
    paragraphs: [
      t(
        'Prophetic teachings confirm that envy-driven gaze can cause harm by Allah\'s permission. Islam does not promote paranoia; instead it gives balanced protection through adhkar, ruqyah, and humility.',
        'احادیث میں آیا ہے کہ حسد بھری نظر اللہ کے اذن سے اثر ڈال سکتی ہے۔ اسلام وہم نہیں پھیلاتا بلکہ متوازن تحفظ سکھاتا ہے: اذکار، رقیہ اور عاجزی۔',
        'ثبت في السنة أثر العين بإذن الله. ولا يدعو الإسلام إلى الهلع، بل إلى تحصين معتدل بالأذكار والرقية والتواضع.'
      ),
      t(
        'Recommended practices include reciting Al-Falaq and An-Nas, saying "Masha\'Allah" upon seeing blessings, and avoiding boastful display. Ultimate protection comes from sincere reliance on Allah.',
        'حفاظت کے لیے معوذتین کی تلاوت، نعمت دیکھ کر "ما شاء اللہ" کہنا، اور نمائش سے بچنا مفید ہے۔ حقیقی حفاظت خالص توکل سے ملتی ہے۔',
        'من أسباب الوقاية قراءة المعوذتين وقول "ما شاء الله" عند رؤية النعمة وترك التفاخر. والحفظ الحق بالتوكل الصادق على الله.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'palestine-in-quran',
    categoryId: 'quranic-teachings',
    publishedAt: '2025-10-12',
    relatedSurah: 17,
    title: t('Palestine in the Quran', 'قرآن میں فلسطین', 'فلسطين في القرآن'),
    excerpt: t(
      'The Quran refers to blessed lands around Al-Aqsa and links them to prophetic history.',
      'قرآن مسجد اقصیٰ کے گرد مبارک سرزمین کا ذکر کرتا ہے اور اسے انبیائی تاریخ سے جوڑتا ہے۔',
      'يشير القرآن إلى الأرض المباركة حول الأقصى ويربطها بسير الأنبياء.'
    ),
    paragraphs: [
      t(
        'Surah Al-Isra mentions Masjid Al-Aqsa as part of a blessed region. This land is associated with many prophets and major events in revelation history, making it spiritually significant for Muslims.',
        'سورۃ الاسراء میں مسجد اقصیٰ کو اس خطے کے ساتھ ذکر کیا گیا جسے اللہ نے برکت دی۔ یہ سرزمین انبیاء کے واقعات سے جڑی ہے، اس لیے مسلمانوں کے لیے خاص روحانی اہمیت رکھتی ہے۔',
        'ذكرت سورة الإسراء المسجد الأقصى في سياق «الذي باركنا حوله». وترتبط هذه الأرض بتاريخ أنبياء كثر، فهي ذات مكانة روحية عند المسلمين.'
      ),
      t(
        'Islamic concern for Palestine should combine prayer, justice, compassion, and ethical advocacy. The Quranic approach calls for principled support without hatred of innocents.',
        'فلسطین کے بارے میں اسلامی احساس میں دعا، عدل، رحم اور ذمہ دار آواز شامل ہونی چاہیے۔ قرآنی منہج اصولی حمایت سکھاتا ہے، بے گناہوں سے نفرت نہیں۔',
        'الواجب الشرعي تجاه فلسطين يجمع الدعاء والعدل والرحمة والمناصرة الأخلاقية، دون ظلم الأبرياء أو خطاب الكراهية.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'al-qantarah-bridge',
    categoryId: 'islamic-beliefs',
    publishedAt: '2025-10-20',
    relatedSurah: undefined,
    title: t('What Is Al-Qantarah?', 'القنطرہ کیا ہے؟', 'ما هي القنطرة؟'),
    excerpt: t(
      'Al-Qantarah is described in hadith as a station where believers settle mutual rights before Paradise.',
      'حدیث کے مطابق قنطرہ وہ مقام ہے جہاں اہلِ ایمان جنت سے پہلے باہمی حقوق کا حساب چکاتے ہیں۔',
      'القنطرة في الحديث موضع يُقتص فيه بين المؤمنين قبل دخول الجنة.'
    ),
    paragraphs: [
      t(
        'After crossing the Sirat, believers are gathered at al-Qantarah where unresolved wrongs between them are corrected. This demonstrates that even among believers, justice and rights remain sacred.',
        'صراط سے گزرنے کے بعد اہلِ ایمان قنطرہ پر روکے جائیں گے جہاں باہمی ظلم کا بدلہ اور تطہیر ہوگی۔ اس سے معلوم ہوتا ہے کہ مومنوں کے درمیان بھی حقوق کی بڑی اہمیت ہے۔',
        'بعد المرور على الصراط يقف المؤمنون على القنطرة فيُقتص لبعضهم من بعض. وفي ذلك تعظيم لحقوق العباد حتى بين أهل الإيمان.'
      ),
      t(
        'The teaching motivates us to forgive quickly and restore rights in this life. Whoever wants a peaceful entry into the Hereafter should clean his dealings now.',
        'یہ تعلیم ہمیں دنیا ہی میں معافی، مصالحت اور حقوق کی ادائیگی کی طرف بلاتی ہے۔ جو آخرت میں آسانی چاہتا ہے وہ اپنے معاملات ابھی درست کرے۔',
        'يدعونا هذا المعنى إلى إصلاح المظالم في الدنيا والمسارعة للعفو ورد الحقوق، ليكون المرور في الآخرة أيسر.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'combined-salah',
    categoryId: 'salah',
    publishedAt: '2025-10-28',
    relatedSurah: undefined,
    title: t('When Can Salah Be Combined?', 'نمازیں کب جمع کی جا سکتی ہیں؟', 'متى يجوز جمع الصلوات؟'),
    excerpt: t(
      'Combining prayers is allowed in specific conditions such as travel and hardship according to fiqh.',
      'فقہ کے مطابق سفر اور بعض مشقت کی حالتوں میں نمازیں جمع کرنا جائز ہے۔',
      'يجوز جمع الصلوات في أحوال مخصوصة كالسفر والمشقة.'
    ),
    paragraphs: [
      t(
        'Islam sets prayer times clearly, yet allows concessions for hardship. In travel, many scholars permit combining Dhuhr with Asr and Maghrib with Isha, either early or delayed.',
        'اسلام نے نماز کے اوقات مقرر کیے ہیں، مگر مشقت میں رخصت بھی دی ہے۔ سفر میں اکثر فقہاء ظہر عصر اور مغرب عشاء کو تقدیم یا تاخیر کے ساتھ جمع کرنے کی اجازت دیتے ہیں۔',
        'حدد الشرع أوقات الصلاة، مع رخصة عند المشقة. وفي السفر يجوز عند جمهور العلماء جمع الظهر مع العصر والمغرب مع العشاء تقديماً أو تأخيراً.'
      ),
      t(
        'Outside travel, some jurists also allow combining in unusual hardship, illness, or severe weather without making it habit. A believer should follow trusted local scholarship and avoid casual neglect of prayer times.',
        'سفر کے علاوہ بعض فقہاء بیماری یا غیر معمولی دشواری میں بھی جمع کی گنجائش دیتے ہیں، مگر اسے معمول نہیں بنانا چاہیے۔ معتبر اہلِ علم کی رہنمائی سے عمل کرنا بہتر ہے۔',
        'وخارج السفر رخص بعض الفقهاء في الجمع للحاجة الشديدة والمرض ونحوه بلا اتخاذه عادة. والواجب الرجوع للعلماء الموثوقين.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'salah-mentioned-quran',
    categoryId: 'salah',
    publishedAt: '2025-11-05',
    relatedSurah: 2,
    title: t('How Salah Is Mentioned in the Quran', 'قرآن میں نماز کا ذکر', 'ذكر الصلاة في القرآن'),
    excerpt: t(
      'The Quran repeatedly commands establishing prayer as a pillar of faith and discipline.',
      'قرآن بار بار نماز قائم کرنے کا حکم دیتا ہے جو ایمان اور نظم کی بنیاد ہے۔',
      'يأمر القرآن مراراً بإقامة الصلاة بوصفها عماد الإيمان والانضباط.'
    ),
    paragraphs: [
      t(
        'The Quran does not treat salah as occasional ritual but as an ongoing covenant: "Establish prayer." It links prayer with patience, charity, and remembrance, forming a complete moral life.',
        'قرآن نماز کو وقتی رسم نہیں بلکہ مستقل عہد کے طور پر پیش کرتا ہے: "نماز قائم کرو"۔ نماز کو صبر، زکوٰۃ اور ذکر کے ساتھ جوڑ کر مکمل اخلاقی زندگی بنائی گئی ہے۔',
        'لا يعرض القرآن الصلاة كطقس عابر، بل كعهد دائم: «أقيموا الصلاة». ويربطها بالصبر والزكاة والذكر لتكوين حياة مستقيمة.'
      ),
      t(
        'Prophetic Sunnah explains the details of timing and form, while Quran gives the central command and purpose. Together, they teach that prayer protects from indecency and spiritual drift.',
        'نماز کے اوقات اور طریقہ کی تفصیل سنت نبوی سے ملتی ہے، جبکہ قرآن اس کا بنیادی حکم اور مقصد بیان کرتا ہے۔ دونوں مل کر سکھاتے ہیں کہ نماز بے حیائی اور غفلت سے بچاتی ہے۔',
        'وتفاصيل الأداء بينتها السنة، بينما قرر القرآن أصل الفريضة ومقصدها. وكلاهما يدل على أن الصلاة تنهى عن الفحشاء وتقي من الغفلة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'signs-laylatul-qadr',
    categoryId: 'sawm',
    publishedAt: '2025-11-13',
    relatedSurah: 97,
    title: t('Signs of Laylatul Qadr', 'لیلۃ القدر کی نشانیاں', 'علامات ليلة القدر'),
    excerpt: t(
      'Hadith mention subtle signs, but the goal is worship across all last ten nights.',
      'احادیث میں کچھ نرم نشانیاں آئی ہیں، مگر اصل ہدف آخری عشرے کی مکمل عبادت ہے۔',
      'ذكرت السنة علامات لطيفة، لكن المقصود الاجتهاد في العشر كلها.'
    ),
    paragraphs: [
      t(
        'Laylatul Qadr is better than a thousand months and occurs in the last ten nights of Ramadan, especially odd nights. Reported signs include a peaceful night and a gentle sunrise without harsh rays.',
        'لیلۃ القدر ہزار مہینوں سے بہتر ہے اور رمضان کے آخری عشرے، خصوصاً طاق راتوں میں تلاش کی جاتی ہے۔ روایات میں اس کی نشانیوں میں پُرسکون رات اور نرم طلوعِ آفتاب کا ذکر ہے۔',
        'ليلة القدر خير من ألف شهر، وتلتمس في العشر الأواخر خاصة الأوتار. ومن علاماتها المروية سكون الليل وطلوع الشمس صبيحتها بلا شعاع قوي.'
      ),
      t(
        'Believers should avoid obsession with prediction and instead maximize prayer, Quran, and forgiveness. The famous dua "Allahumma innaka \'afuwwun..." captures the heart of this night.',
        'مومن کو قیاس آرائی کے بجائے عبادت بڑھانی چاہیے: قیام، تلاوت اور استغفار۔ مشہور دعا "اللهم إنك عفو..." اسی رات کا مرکزی پیغام ہے۔',
        'ينبغي ترك الانشغال بالتخمين والإكثار من القيام والقرآن والاستغفار. ودعاء «اللهم إنك عفو تحب العفو فاعف عني» خلاصة مقصودها.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'prayer-mat-origin',
    categoryId: 'history',
    publishedAt: '2025-11-21',
    relatedSurah: undefined,
    title: t('Origin of the Prayer Mat', 'جائے نماز کی تاریخ', 'أصل سجادة الصلاة'),
    excerpt: t(
      'Prayer mats are cultural tools for cleanliness and comfort, not a condition for valid prayer.',
      'جائے نماز صفائی اور سہولت کا ثقافتی وسیلہ ہے، نماز کی شرط نہیں۔',
      'سجادة الصلاة وسيلة للنظافة والراحة وليست شرطاً لصحة الصلاة.'
    ),
    paragraphs: [
      t(
        'In early Islam, people prayed directly on clean earth, sand, or simple coverings. Over time, woven mats became common in different regions to improve cleanliness and comfort, especially in homes and masjids.',
        'ابتدائی دورِ اسلام میں لوگ صاف زمین یا سادہ کپڑے پر نماز پڑھتے تھے۔ وقت کے ساتھ مختلف علاقوں میں صفائی اور آسانی کے لیے بُنی ہوئی جائے نماز عام ہو گئی۔',
        'في صدر الإسلام صلّى المسلمون على الأرض الطاهرة أو ما تيسر من البسط. ثم شاعت السجادات عبر العصور للنظافة والراحة.'
      ),
      t(
        'The key requirement in fiqh is purity of place, not owning a specific mat. A prayer mat is beneficial etiquette but should never become a barrier to praying anywhere permissible.',
        'فقہ کی اصل شرط جگہ کی پاکی ہے، مخصوص مصلّیٰ نہیں۔ جائے نماز مفید آداب میں سے ہے، مگر اسے نماز میں رکاوٹ نہیں بنانا چاہیے۔',
        'الشرط الشرعي هو طهارة الموضع لا وجود سجادة معينة. فهي أدب حسن، لكن لا ينبغي أن تمنع من الصلاة في كل مكان جائز.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'honor-parents-islam',
    categoryId: 'lifestyle',
    publishedAt: '2025-11-29',
    relatedSurah: 17,
    title: t('Honoring Parents in Islam', 'اسلام میں والدین کا احترام', 'بر الوالدين في الإسلام'),
    excerpt: t(
      'The Quran places kindness to parents immediately after worship of Allah.',
      'قرآن نے اللہ کی عبادت کے بعد فوراً والدین کے ساتھ حسنِ سلوک کا حکم دیا۔',
      'جعل القرآن الإحسان للوالدين بعد توحيد الله مباشرة.'
    ),
    paragraphs: [
      t(
        'Serving parents is one of the highest acts of worship after tawhid. The Quran commands gentle speech, humility, and gratitude for their sacrifice, especially in old age.',
        'والدین کی خدمت توحید کے بعد بڑی عبادات میں سے ہے۔ قرآن نرم گفتگو، عاجزی اور خصوصاً بڑھاپے میں ان کے احسانات کا اعتراف سکھاتا ہے۔',
        'بر الوالدين من أعظم القربات بعد التوحيد. ويأمر القرآن بالقول الكريم وخفض الجناح والرحمة، خصوصاً عند الكِبَر.'
      ),
      t(
        'Even where parents disagree with a child\'s faith choices, Islam requires respectful companionship without obeying sin. Daily kindness, dua, and practical help are lasting forms of birr.',
        'اگر عقیدے میں اختلاف بھی ہو تو اسلام گناہ میں اطاعت کے بغیر باادب ساتھ رہنے کا حکم دیتا ہے۔ روزمرہ خدمت، دعا اور مدد ہی حقیقی برّ ہے۔',
        'حتى مع الاختلاف الديني، يأمر الإسلام بصحبتهما بالمعروف دون طاعة في المعصية. والدعاء والخدمة اليومية من أصدق صور البر.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'imam-hussain-karbala',
    categoryId: 'history',
    publishedAt: '2025-12-07',
    relatedSurah: undefined,
    title: t('Imam Hussain and Karbala', 'امام حسین اور کربلا', 'الإمام الحسين وكربلاء'),
    excerpt: t(
      'Karbala symbolizes sacrifice for justice, principle, and moral courage in Muslim memory.',
      'کربلا مسلم تاریخ میں حق، اصول اور اخلاقی جرات کے لیے قربانی کی علامت ہے۔',
      'تمثل كربلاء رمز التضحية من أجل الحق والمبدأ في الوعي الإسلامي.'
    ),
    paragraphs: [
      t(
        'Imam Hussain, grandson of the Prophet (peace be upon him), refused to legitimize oppressive rule and stood for moral accountability. In 61 AH at Karbala, he and his small group were martyred after immense hardship.',
        'امام حسین رضی اللہ عنہ، نبی ﷺ کے نواسے، نے جابر اقتدار کی توثیق سے انکار کیا اور اصولی موقف اختیار کیا۔ 61 ہجری میں کربلا میں شدید مصائب کے بعد آپ اور آپ کے رفقا شہید ہوئے۔',
        'وقف الإمام الحسين سبط النبي ﷺ موقفاً أخلاقياً رافضاً للظلم. وفي كربلاء سنة 61هـ استشهد مع قلة من أهل بيته وأصحابه.'
      ),
      t(
        'Muslims remember Karbala as a call to integrity, patience, and speaking truth with wisdom. Respectful remembrance should unite hearts around justice and prophetic ethics, not division.',
        'کربلا کا پیغام دیانت، صبر اور حکمت کے ساتھ حق گوئی ہے۔ اس واقعے کی یاد ہمیں عدل اور اخلاقِ نبوی پر جمع کرے، تفرقہ نہ بڑھائے۔',
        'وتبقى كربلاء درساً في الثبات والصبر وصدق الكلمة. والواجب أن تكون ذكراها باب وحدة على العدل والأخلاق النبوية لا باب نزاع.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'moon-sighting-islamic-dates',
    categoryId: 'history',
    publishedAt: '2025-12-15',
    relatedSurah: 2,
    title: t('Moon Sighting and Islamic Dates', 'چاند دیکھنا اور اسلامی تاریخیں', 'رؤية الهلال والتواريخ الإسلامية'),
    excerpt: t(
      'Islamic months begin with lunar observation or valid astronomical-administrative methods.',
      'اسلامی مہینے چاند دیکھنے یا معتبر شرعی و انتظامی طریقوں سے شروع ہوتے ہیں۔',
      'تبدأ الشهور الهجرية برؤية الهلال أو بطرق معتبرة تنظيماً وفق الاجتهاد.'
    ),
    paragraphs: [
      t(
        'The Islamic calendar is lunar, so month starts are tied to the crescent. Communities historically relied on local sighting, while modern fiqh councils discuss broader criteria to reduce confusion.',
        'اسلامی تقویم قمری ہے، اس لیے مہینے کا آغاز ہلال سے وابستہ ہے۔ ماضی میں مقامی رویت پر عمل ہوتا رہا، جبکہ آج فقہی مجالس نظم و اتحاد کے لیے وسیع معیار بھی زیرِ بحث لاتی ہیں۔',
        'التقويم الهجري قمري، وبداية الشهر مرتبطة بالهلال. واعتمد الناس قديماً الرؤية المحلية، وتبحث المجامع المعاصرة عن معايير أوسع لضبط المواقيت.'
      ),
      t(
        'Differences should be handled with adab, not hostility. Whether one follows local authority or accepted regional decisions, unity of hearts and sincerity in worship remain essential.',
        'اختلاف کی صورت میں ادب لازم ہے، نزاع نہیں۔ مقامی اعلان ہو یا معتبر اجتماعی فیصلہ، اصل یہ ہے کہ عبادت اخلاص سے ہو اور دلوں میں وحدت قائم رہے۔',
        'ويجب أن يُدار الخلاف بأدب لا خصومة. سواء اتُّبع الإعلان المحلي أو القرار الجماعي المعتبر، فالمقصود إخلاص العبادة ووحدة القلوب.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'hijri-calendar-origin',
    categoryId: 'history',
    publishedAt: '2025-12-23',
    relatedSurah: undefined,
    title: t('Origin of the Hijri Calendar', 'ہجری تقویم کی ابتدا', 'أصل التقويم الهجري'),
    excerpt: t(
      'The Hijri calendar was formally organized under Caliph Umar using the migration as epoch.',
      'ہجری تقویم کو باضابطہ حضرت عمر کے دور میں مرتب کیا گیا اور ہجرت کو آغاز بنایا گیا۔',
      'نُظّم التقويم الهجري رسمياً في عهد عمر وجُعلت الهجرة مبدأه.'
    ),
    paragraphs: [
      t(
        'In the caliphate of Umar ibn al-Khattab, administrative correspondence needed a unified dating system. The companions agreed to count years from the Hijrah, which marked the rise of the Muslim community.',
        'حضرت عمر فاروق رضی اللہ عنہ کے دور میں سرکاری معاملات کے لیے ایک واضح تاریخ درکار تھی۔ صحابہ نے متفق ہو کر ہجرت نبوی کو سنِ ہجری کا نقطۂ آغاز بنایا۔',
        'في عهد عمر رضي الله عنه احتيج إلى تأريخ موحد للمعاملات، فاتفق الصحابة على جعل الهجرة مبدأ للتقويم.'
      ),
      t(
        'Muharram was chosen as the first month due to established Arab usage and practical governance rhythm. The Hijri calendar keeps Muslim memory connected to sacrifice, migration, and mission.',
        'محرم کو پہلا مہینہ مقرر کیا گیا جو عربی معمول اور انتظامی ترتیب سے موافق تھا۔ ہجری تقویم مسلمانوں کو ہجرت، قربانی اور دینی مقصد کی یاد سے جوڑے رکھتی ہے۔',
        'واختير المحرم أولاً للشهور موافقةً للاستعمال المعروف آنذاك. ويبقي التقويم الهجري الوعي الإسلامي متصلاً بمعاني الهجرة والجهاد الدعوي.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'islamic-lunar-calendar',
    categoryId: 'history',
    publishedAt: '2025-12-31',
    relatedSurah: 9,
    title: t('Understanding the Islamic Lunar Calendar', 'اسلامی قمری کیلنڈر کی سمجھ', 'فهم التقويم القمري الإسلامي'),
    excerpt: t(
      'The Islamic calendar runs on lunar months of 29 or 30 days across 12 months.',
      'اسلامی کیلنڈر 12 قمری مہینوں پر مشتمل ہے، ہر مہینہ 29 یا 30 دن کا ہوتا ہے۔',
      'يقوم التقويم الإسلامي على 12 شهراً قمرياً، كل شهر 29 أو 30 يوماً.'
    ),
    paragraphs: [
      t(
        'Unlike solar calendars, the Hijri year is shorter by about eleven days. This causes Ramadan and Hajj seasons to rotate through the year, allowing worship in varying climates and circumstances.',
        'شمسی کیلنڈر کے برعکس ہجری سال تقریباً گیارہ دن کم ہوتا ہے، اسی لیے رمضان اور حج کے موسم ہر سال آگے آتے ہیں اور مختلف حالات میں عبادت کا موقع ملتا ہے۔',
        'السنة الهجرية أقصر من الشمسية بنحو أحد عشر يوماً، لذلك يدور رمضان والحج على فصول العام المختلفة.'
      ),
      t(
        'The lunar cycle keeps Muslims closely connected to natural signs and communal timing. Learning Hijri months helps families plan worship, charity, and historical remembrance with greater awareness.',
        'قمری نظام مسلمانوں کو فطری نشانیوں اور اجتماعی عبادت کے اوقات سے جوڑتا ہے۔ ہجری مہینوں کا شعور خاندان کو عبادات، صدقات اور تاریخی مواقع کی بہتر تیاری دیتا ہے۔',
        'يربط النظام القمري المسلمين بآيات الكون ومواقيت الجماعة. وفهم شهوره يعين الأسر على تنظيم العبادة والصدقة واستحضار المناسبات الإيمانية.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'islamic-birth-date',
    categoryId: 'history',
    publishedAt: '2026-01-08',
    relatedSurah: undefined,
    title: t('Recording Birth Dates in Islamic Calendar', 'پیدائش کی اسلامی تاریخ لکھنے کی اہمیت', 'تسجيل تاريخ الميلاد بالهجري'),
    excerpt: t(
      'Using Hijri birth dates helps preserve Muslim calendar literacy and identity.',
      'پیدائش کی ہجری تاریخ محفوظ کرنے سے اسلامی تقویم کا شعور اور شناخت مضبوط ہوتی ہے۔',
      'حفظ تاريخ الميلاد الهجري يعزز الوعي بالتقويم الإسلامي والهوية.'
    ),
    paragraphs: [
      t(
        'Most official documents use Gregorian dates, but Muslim families can also preserve Hijri dates for births and key events. This practice keeps children connected to Islamic time consciousness.',
        'اگرچہ سرکاری ریکارڈ عموماً عیسوی تاریخ پر ہوتے ہیں، مگر مسلم خاندان پیدائش اور اہم مواقع کی ہجری تاریخ بھی محفوظ کر سکتے ہیں۔ اس سے نئی نسل اسلامی تقویم سے جڑی رہتی ہے۔',
        'رغم اعتماد المعاملات الرسمية على الميلادي، يمكن للأسرة المسلمة حفظ التاريخ الهجري للميلاد والمناسبات المهمة.'
      ),
      t(
        'Simple tools and apps can convert dates accurately, but families should verify with trusted sources. Blending practical civic needs with Islamic memory creates balanced identity.',
        'تاریخ تبدیل کرنے کے لیے ایپس اور کیلکولیٹر دستیاب ہیں، مگر معتبر ذرائع سے تصدیق بہتر ہے۔ شہری ضرورت اور دینی یادداشت کو ساتھ رکھنا متوازن شناخت بناتا ہے۔',
        'تتوفر أدوات دقيقة للتحويل بين التاريخين مع أهمية التثبت. والجمع بين متطلبات الواقع وحفظ الذاكرة الإسلامية يحقق توازناً محموداً.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'what-is-muharram',
    categoryId: 'history',
    publishedAt: '2026-01-16',
    relatedSurah: 9,
    title: t('What Is Muharram?', 'محرم کیا ہے؟', 'ما هو محرم؟'),
    excerpt: t(
      'Muharram is one of the four sacred months and marks the opening of the Hijri year.',
      'محرم چار حرمت والے مہینوں میں سے ہے اور ہجری سال کا آغاز ہے۔',
      'محرم أحد الأشهر الحرم وبداية السنة الهجرية.'
    ),
    paragraphs: [
      t(
        'Muharram carries special sanctity in Islam as one of the sacred months mentioned in the Quran. Sin and oppression are especially blameworthy in these months, while good deeds carry greater spiritual weight.',
        'محرم قرآن میں مذکور حرمت والے مہینوں میں شامل ہے۔ ان مہینوں میں گناہ اور ظلم کی قباحت زیادہ ہے، جبکہ نیک اعمال کی اہمیت بڑھ جاتی ہے۔',
        'محرم من الأشهر الحرم التي عظّمها الله. ويشتد قبح المعصية والظلم فيها، ويعظم أجر الطاعات.'
      ),
      t(
        'The 10th of Muharram (Ashura) is especially significant, with fasting encouraged in gratitude for Allah\'s help to Musa. Muslims begin the year with repentance, reflection, and resolve.',
        'دس محرم (یومِ عاشورا) خاص اہمیت رکھتا ہے اور اس دن روزہ رکھنا مستحب ہے، شکر کے طور پر کہ اللہ نے موسیٰ علیہ السلام کو نجات دی۔ مسلمان سال کی ابتدا توبہ اور عزم سے کرتے ہیں۔',
        'ويوم عاشوراء له منزلة عظيمة، ويستحب صيامه شكراً لنجاة موسى عليه السلام. ويستقبل المسلمون العام بالتوبة والعزم على الطاعة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'best-deeds-dhul-hijjah',
    categoryId: 'hajj',
    publishedAt: '2026-01-24',
    relatedSurah: 22,
    title: t('Best Deeds in Dhul Hijjah', 'ذوالحجہ میں بہترین اعمال', 'أفضل الأعمال في ذي الحجة'),
    excerpt: t(
      'The first ten days of Dhul Hijjah are among the most virtuous days of the year.',
      'ذوالحجہ کے پہلے دس دن سال کے سب سے افضل ایام میں شمار ہوتے ہیں۔',
      'العشر الأوائل من ذي الحجة من أفضل أيام السنة.'
    ),
    paragraphs: [
      t(
        'The Prophet (peace be upon him) praised righteous deeds in the first ten days of Dhul Hijjah. Recommended acts include abundant dhikr, Quran, charity, family ties, and extra prayers.',
        'نبی ﷺ نے ذوالحجہ کے ابتدائی دس دنوں میں نیک اعمال کی خاص فضیلت بیان فرمائی۔ ان دنوں میں ذکر، تلاوت، صدقہ، صلہ رحمی اور نوافل بڑھانا مستحب ہے۔',
        'بيّن النبي ﷺ فضل العمل الصالح في العشر الأول من ذي الحجة. ويستحب فيها الإكثار من الذكر والقرآن والصدقة والنوافل وصلة الرحم.'
      ),
      t(
        'For non-pilgrims, fasting on the Day of Arafah is highly recommended and expiates sins of two years by Allah\'s mercy. These days train hearts for sacrifice and gratitude.',
        'غیر حاجیوں کے لیے یومِ عرفہ کا روزہ بہت فضیلت رکھتا ہے اور اللہ کے فضل سے دو سال کے گناہوں کا کفارہ بنتا ہے۔ یہ دن دل کو قربانی اور شکر کی تربیت دیتے ہیں۔',
        'ويستحب لغير الحاج صيام يوم عرفة، وقد ورد أنه يكفّر سنتين بإذن الله. فهي أيام تربية على البذل والشكر.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'rights-of-women-islam',
    categoryId: 'lifestyle',
    publishedAt: '2026-02-01',
    relatedSurah: 4,
    title: t('Rights of Women in Islam', 'اسلام میں خواتین کے حقوق', 'حقوق المرأة في الإسلام'),
    excerpt: t(
      'Islam granted women legal, spiritual, and economic rights with dignity and responsibility.',
      'اسلام نے خواتین کو قانونی، روحانی اور معاشی حقوق باعزت انداز میں عطا کیے۔',
      'أقر الإسلام للمرأة حقوقاً شرعية وروحية واقتصادية بكرامة.'
    ),
    paragraphs: [
      t(
        'Islam recognizes women as full moral agents before Allah, equal in spiritual accountability and reward. They have rights in marriage consent, mahr, inheritance, property ownership, education, and protection from abuse.',
        'اسلام عورت کو اللہ کے سامنے مکمل اخلاقی شخصیت مانتا ہے، اجر و حساب میں برابر۔ نکاح میں رضامندی، مہر، وراثت، جائیداد، تعلیم اور تحفظ کے حقوق واضح کیے گئے ہیں۔',
        'جعل الإسلام المرأة مكلفة كاملة، مساوية في الثواب والعقاب. وأثبت لها حقوق الرضا في الزواج والمهر والميراث والتملك والتعليم وصيانة الكرامة.'
      ),
      t(
        'Abuses done in some cultures should not be confused with Islam itself. Restoring women\'s rights requires knowledge, justice in family systems, and prophetic ethics in daily behavior.',
        'بعض ثقافتی زیادتیوں کو اسلام پر منطبق نہیں کیا جا سکتا۔ خواتین کے حقوق کی بحالی کے لیے صحیح علم، خاندانی عدل اور اخلاقِ نبوی کی عملی پیروی ضروری ہے۔',
        'لا يجوز خلط الممارسات الثقافية الظالمة بتعاليم الإسلام. واستعادة حقوق المرأة تحتاج علماً وعدلاً أسرياً وتطبيقاً لأخلاق النبوة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'rights-of-children-islam',
    categoryId: 'lifestyle',
    publishedAt: '2026-02-09',
    relatedSurah: 31,
    title: t('Rights of Children in Islam', 'اسلام میں بچوں کے حقوق', 'حقوق الطفل في الإسلام'),
    excerpt: t(
      'Children have rights to care, naming, education, mercy, and moral nurturing in Islam.',
      'اسلام میں بچوں کو نگہداشت، اچھا نام، تعلیم، شفقت اور اخلاقی تربیت کے حقوق حاصل ہیں۔',
      'للطفل في الإسلام حقوق الرعاية والتسمية الحسنة والتعليم والرحمة والتربية.'
    ),
    paragraphs: [
      t(
        'From birth, Islam emphasizes dignity for children: kind naming, breastfeeding support, financial care, and lawful guardianship. Parents are trustees, not owners, responsible for safety and compassion.',
        'اسلام پیدائش سے ہی بچے کی حرمت سکھاتا ہے: اچھا نام، دودھ پلانے کا حق، مالی کفالت اور شرعی سرپرستی۔ والدین مالک نہیں بلکہ امانت دار ہیں۔',
        'يؤكد الإسلام كرامة الطفل منذ ولادته: التسمية الحسنة والرعاية والنفقة والحضانة الشرعية. والوالدان أمناء لا ملاك.'
      ),
      t(
        'Emotional wellbeing is also part of Sunnah: affection, listening, fairness among siblings, and disciplined guidance without humiliation. Healthy tarbiyah builds believers and responsible citizens.',
        'جذباتی آسودگی بھی سنت کا حصہ ہے: محبت، گفتگو، بہن بھائیوں میں انصاف، اور اصلاح کے ساتھ عزت کا خیال۔ متوازن تربیت سے باایمان اور ذمہ دار نسل تیار ہوتی ہے۔',
        'ومن هدي النبوة الرحمة العاطفية: التقبيل والإنصات والعدل بين الأبناء والتأديب بلا إهانة. والتربية المتوازنة تصنع جيلاً صالحاً مسؤولاً.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'sadaqah-jariyah',
    categoryId: 'lifestyle',
    publishedAt: '2026-02-17',
    relatedSurah: undefined,
    title: t('What Is Sadaqah Jariyah?', 'صدقہ جاریہ کیا ہے؟', 'ما هي الصدقة الجارية؟'),
    excerpt: t(
      'Sadaqah jariyah is continuous charity that keeps benefiting people over time.',
      'صدقہ جاریہ وہ خیر ہے جس کا نفع مسلسل جاری رہے۔',
      'الصدقة الجارية هي إحسان يستمر نفعه مع الزمن.'
    ),
    paragraphs: [
      t(
        'Examples include building wells, supporting Quran education, planting beneficial trees, or funding medical access. As long as people continue to benefit, the reward continues by Allah\'s grace.',
        'اس کی مثالیں: کنواں بنانا، دینی تعلیم میں تعاون، مفید درخت لگانا یا علاج کے وسائل فراہم کرنا۔ جب تک لوگوں کو فائدہ پہنچتا رہے، اجر جاری رہتا ہے۔',
        'من صورها حفر الآبار ودعم تعليم القرآن وغرس الأشجار النافعة وتمويل العلاج. ويستمر الأجر ما دام النفع مستمراً.'
      ),
      t(
        'Sadaqah jariyah is a legacy mindset: think beyond immediate giving to sustainable benefit. Even small recurring acts can become large in the scale through sincerity and planning.',
        'صدقہ جاریہ ہمیں دور رس سوچ سکھاتا ہے: وقتی خیر سے بڑھ کر پائیدار نفع کا منصوبہ بناؤ۔ چھوٹے مگر مستقل کام بھی اخلاص کے ساتھ میزان میں بہت بڑے ہو جاتے ہیں۔',
        'الصدقة الجارية تربي على أثر طويل المدى لا عطاء لحظي فقط. والعمل الصغير المتقن قد يعظم في الميزان بالإخلاص وحسن التدبير.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'kaffarah-in-islam',
    categoryId: 'islamic-beliefs',
    publishedAt: '2026-02-25',
    relatedSurah: 5,
    title: t('Kaffarah in Islam', 'اسلام میں کفارہ', 'الكفارة في الإسلام'),
    excerpt: t(
      'Kaffarah is an expiation prescribed for specific violations with mercy and discipline.',
      'کفارہ بعض مخصوص شرعی خلاف ورزیوں کا تدارک ہے جس میں رحمت اور تربیت دونوں ہیں۔',
      'الكفارة جبر شرعي لبعض المخالفات، يجمع بين الرحمة والتأديب.'
    ),
    paragraphs: [
      t(
        'Islamic law prescribes kaffarah for certain acts, such as broken oaths or specific fasting violations, with defined options like feeding the poor, clothing, or fasting. It teaches accountability with a path to repair.',
        'شریعت میں بعض معاملات پر کفارہ مقرر ہے، جیسے قسم توڑنا یا بعض روزے کی خلاف ورزیاں۔ اس کے طریقوں میں مسکینوں کو کھانا کھلانا، لباس دینا یا روزہ رکھنا شامل ہے۔',
        'شرعت الكفارة في مسائل محددة كالأيمان وبعض المخالفات، مع خيارات كالإطعام أو الكسوة أو الصيام. وهي باب إصلاح مع تحمل المسؤولية.'
      ),
      t(
        'Kaffarah should be learned from qualified scholars because details differ by case and madhhab. Its spirit is not punishment alone, but purification, restitution, and renewed obedience.',
        'کفارہ کے احکام مسئلہ اور فقہی مسلک کے لحاظ سے مختلف ہو سکتے ہیں، اس لیے اہلِ علم سے رہنمائی ضروری ہے۔ اس کا مقصد صرف سزا نہیں بلکہ تطہیر اور اصلاح ہے۔',
        'تفاصيل الكفارة تختلف باختلاف المسألة والمذهب، لذا يلزم الرجوع لأهل العلم. ومقصدها التطهير وجبر الخلل لا العقوبة المجردة.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'barzakh-in-islam',
    categoryId: 'islamic-beliefs',
    publishedAt: '2026-03-05',
    relatedSurah: 23,
    title: t('Barzakh in Islam', 'اسلام میں برزخ', 'البرزخ في الإسلام'),
    excerpt: t(
      'Barzakh is the intermediate life between death and resurrection.',
      'برزخ موت اور قیامت کے درمیان کی درمیانی زندگی ہے۔',
      'البرزخ هو الحياة الفاصلة بين الموت والبعث.'
    ),
    paragraphs: [
      t(
        'When a person dies, worldly deeds stop but accountability begins in a new unseen phase called barzakh. This stage includes comfort or hardship according to Allah\'s justice and mercy.',
        'انسان کے وفات پانے کے بعد دنیاوی عمل بند ہو جاتا ہے مگر حساب کا مرحلہ شروع ہوتا ہے جسے برزخ کہتے ہیں۔ اس میں اللہ کے عدل و رحمت کے مطابق راحت یا تنگی ہوتی ہے۔',
        'إذا مات الإنسان انتقل إلى عالم الغيب المسمى البرزخ، وفيه نعيم أو عذاب بحسب عدل الله ورحمته.'
      ),
      t(
        'Belief in barzakh reminds Muslims to prepare before death through repentance, good deeds, and settling rights. We pray for the deceased because dua and charity can still benefit them by Allah\'s permission.',
        'برزخ پر ایمان انسان کو موت سے پہلے توبہ، نیک اعمال اور حقوق کی ادائیگی کی طرف متوجہ کرتا ہے۔ میت کے لیے دعا اور صدقہ اسی لیے اہم ہیں کہ اللہ کے اذن سے نفع پہنچتا ہے۔',
        'والإيمان بالبرزخ يدفع إلى الاستعداد قبل الموت بالتوبة والعمل الصالح ورد المظالم. والدعاء والصدقة عن الميت من أعظم ما ينفعه بإذن الله.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'prophet-muhammad-miracles',
    categoryId: 'sunnah-hadith',
    publishedAt: '2026-03-13',
    relatedSurah: 54,
    title: t('Miracles of Prophet Muhammad', 'نبی اکرم ﷺ کے معجزات', 'معجزات النبي محمد ﷺ'),
    excerpt: t(
      'The Prophet\'s greatest miracle is the Quran, alongside many witnessed signs.',
      'نبی ﷺ کا سب سے بڑا معجزہ قرآن ہے، اس کے ساتھ بہت سے محسوس معجزات بھی ثابت ہیں۔',
      'أعظم معجزات النبي ﷺ القرآن، مع آيات حسية كثيرة ثابتة.'
    ),
    paragraphs: [
      t(
        'The everlasting miracle is the Quran: unmatched in language, guidance, and preservation. In hadith literature, companions also reported signs such as water flowing from his fingers and increase of food.',
        'دائمی معجزہ قرآن ہے: فصاحت، ہدایت اور حفاظت میں بے مثال۔ احادیث میں صحابہ نے دیگر معجزات بھی روایت کیے، جیسے انگلیوں سے پانی جاری ہونا اور کھانے میں برکت۔',
        'المعجزة الخالدة هي القرآن ببيانه وهدايته وحفظه. وروت السنة آيات حسية كنبع الماء من بين أصابعه وتكثير الطعام.'
      ),
      t(
        'Miracles are not entertainment; they affirm truthfulness of prophethood and call hearts to obedience. The strongest response to these signs is to follow his Sunnah in worship and character.',
        'معجزات تماشہ نہیں بلکہ نبوت کی صداقت کی دلیل ہیں جو اطاعت کی دعوت دیتی ہیں۔ ان کا بہترین جواب یہ ہے کہ عبادت اور اخلاق میں سنتِ نبوی کی پیروی کی جائے۔',
        'والمعجزات ليست للتسلية، بل لتصديق الرسالة ودعوة القلوب للطاعة. وأصدق الاستجابة لها اتباع سنته في العبادة والأخلاق.'
      ),
    ],
    quote: undefined,
  },
  {
    id: 'hadith-and-quran-importance',
    categoryId: 'sunnah-hadith',
    publishedAt: '2026-03-21',
    relatedSurah: 59,
    title: t('Importance of Hadith with the Quran', 'قرآن کے ساتھ حدیث کی اہمیت', 'أهمية الحديث مع القرآن'),
    excerpt: t(
      'The Quran gives foundations; Hadith explains implementation through the Prophet\'s teaching.',
      'قرآن اصول دیتا ہے اور حدیث نبی ﷺ کی سنت کے ذریعے اس کی عملی تشریح کرتی ہے۔',
      'يضع القرآن الأصول وتبيّن السنة التطبيق العملي لها.'
    ),
    paragraphs: [
      t(
        'Allah revealed the Quran and sent the Prophet to explain it in practice. Without Sunnah, key acts such as prayer units, zakah details, and Hajj procedures cannot be fully performed.',
        'اللہ نے قرآن نازل کیا اور رسول ﷺ کو اس کی عملی وضاحت کے لیے بھیجا۔ سنت کے بغیر نماز کی رکعات، زکوٰۃ کی تفصیل اور حج کے طریقے مکمل طور پر معلوم نہیں ہوتے۔',
        'أنزل الله القرآن وأرسل الرسول ﷺ لبيانه. فبدون السنة لا تُعرف كثير من تفاصيل الصلاة والزكاة والحج.'
      ),
      t(
        'Authentic hadith complements, clarifies, and contextualizes revelation. Muslims therefore hold both sources together: Quran as primary text and Sunnah as its lived interpretation.',
        'صحیح حدیث وحی کی تکمیل، توضیح اور تطبیق کرتی ہے۔ اسی لیے مسلمان دونوں کو ساتھ لیتے ہیں: قرآن اصل نص اور سنت اس کی زندہ تفسیر۔',
        'والحديث الصحيح يكمّل الوحي ويفسره. لذلك يجمع المسلم بين القرآن أصلاً والسنة بياناً عملياً.'
      ),
    ],
    quote: {
      arabic: 'وَمَا آتَاكُمُ الرَّسُولُ فَخُذُوهُ',
      ref: '59:7',
      en: '"Whatever the Messenger gives you, take it."',
      ur: '"رسول تمہیں جو کچھ دیں وہ لے لو۔"',
      ar: '«وما آتاكم الرسول فخذوه»',
    },
  },
  {
    id: 'types-of-hadith',
    categoryId: 'sunnah-hadith',
    publishedAt: '2026-03-29',
    relatedSurah: undefined,
    title: t('Types of Hadith', 'حدیث کی اقسام', 'أنواع الحديث'),
    excerpt: t(
      'Hadith sciences classify narrations by authenticity, transmission, and textual strength.',
      'علومِ حدیث روایات کو سند اور متن کی قوت کے لحاظ سے تقسیم کرتے ہیں۔',
      'يصنف علم الحديث الروايات بحسب السند والمتن ودرجة الثبوت.'
    ),
    paragraphs: [
      t(
        'Common categories by authenticity include sahih, hasan, and da\'if. Scholars analyze narrator reliability, chain continuity, and absence of hidden defects before accepting a report.',
        'قبولیت کے اعتبار سے معروف درجے صحیح، حسن اور ضعیف ہیں۔ محدثین راویوں کی عدالت، سند کے اتصال اور علتِ خفیہ کی جانچ کے بعد فیصلہ کرتے ہیں۔',
        'من أشهر الدرجات: صحيح وحسن وضعيف. ويدقق المحدثون في عدالة الرواة واتصال السند وسلامة الحديث من العلل.'
      ),
      t(
        'Hadith are also grouped by attribution: Qudsi (meaning from Allah, wording via Prophet), Marfu\', Mawquf, and Maqtu\'. Learning these basics protects Muslims from misinformation.',
        'نسبت کے اعتبار سے بھی اقسام ہیں: حدیث قدسی، مرفوع، موقوف اور مقطوع۔ یہ بنیادی علم مسلمان کو جھوٹی یا کمزور روایات سے بچاتا ہے۔',
        'وتصنف الأحاديث أيضاً بحسب النسبة: قدسي ومرفوع وموقوف ومقطوع. ومعرفة ذلك تقي من تداول الروايات غير الثابتة.'
      ),
    ],
    quote: undefined,
  },
];

export default { categories, topicArticles };
