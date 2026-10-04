import type { RelatedHadith } from './hadith.types';

export const RELATED_HADITHS: readonly RelatedHadith[] = [
  // 1: Surah Al-Fatihah
  {
    id: 'fatihah-greatest-surah',
    surah: 1,
    ayah: 1,
    ayahEnd: 7,
    arabic:
      'قَالَ لِي رَسُولُ اللَّهِ ﷺ: لَأُعَلِّمَنَّكَ سُورَةً هِيَ أَعْظَمُ السُّوَرِ فِي الْقُرْآنِ قَبْلَ أَنْ تَخْرُجَ مِنَ الْمَسْجِدِ... هِيَ: ﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾ هِيَ السَّبْعُ الْمَثَانِي، وَالْقُرْآنُ الْعَظِيمُ الَّذِي أُوتِيتُهُ',
    urdu:
      'رسول اللہ ﷺ نے مجھ سے فرمایا: مسجد سے نکلنے سے پہلے میں تمہیں قرآن کی سب سے عظیم سورت سکھاؤں گا... وہ سورت "الحمد لله رب العالمين" ہے، یہی سبع مثانی (بار بار دہرائی جانے والی سات آیات) اور قرآنِ عظیم ہے جو مجھے عطا کیا گیا۔',
    english:
      'The Messenger of Allah (ﷺ) said to me: "Shall I teach you a Surah which is the greatest Surah in the Quran before you leave the mosque?... It is Al-Hamdu Lillahi Rabbil-\'Alamin, which is the Seven Oft-Repeated Verses and the Great Quran given to me."',
    narrator: {
      en: 'Abu Sa\'id ibn al-Mu\'alla (RA)',
      ur: 'حضرت ابو سعید بن معلی رضی اللہ عنہ',
      ar: 'أبو سعيد بن المعلى رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 5006',
      ur: 'صحیح بخاری: 5006',
      ar: 'صحيح البخاري: 5006',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Virtue of Surah Al-Fatihah',
      ur: 'فضیلت سورۃ الفاتحہ',
      ar: 'فضل سورة الفاتحة',
    },
  },
  {
    id: 'fatihah-dialogue-with-allah',
    surah: 1,
    ayah: 2,
    ayahEnd: 7,
    arabic:
      'قَالَ اللَّهُ تَعَالَى: قَسَمْتُ الصَّلَاةَ بَيْنِي وَبَيْنَ عَبْدِي نِصْفَيْنِ، وَلِعَبْدِي مَا سَأَلَ، فَإِذَا قَالَ الْعَبْدُ: ﴿الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ﴾، قَالَ اللَّهُ تَعَالَى: حَمِدَنِي عَبْدِي، وَإِذَا قَالَ: ﴿الرَّحْمَنِ الرَّحِيمِ﴾، قَالَ اللَّهُ تَعَالَى: أَثْنَى عَلَيَّ عَبْدِي...',
    urdu:
      'اللہ تبارک و تعالیٰ فرماتا ہے: میں نے نماز (سورۃ الفاتحہ) کو اپنے اور اپنے بندے کے درمیان دو برابر حصوں میں تقسیم کر دیا ہے، اور میرے بندے کے لیے وہ ہے جو وہ مانگے۔ جب بندہ کہتا ہے "الحمد لله رب العالمين" تو اللہ فرماتا ہے: میرے بندے نے میری حمد بیان کی۔ اور جب وہ کہتا ہے "الرحمن الرحيم" تو اللہ فرماتا ہے: میرے بندے نے میری ثنا بیان کی...',
    english:
      'Allah the Exalted says (Hadith Qudsi): "I have divided prayer between Myself and My servant into two halves, and My servant will have what he asks for. When the servant says: \'Praise be to Allah, Lord of the worlds\', Allah says: \'My servant has praised Me...\'"',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 395',
      ur: 'صحیح مسلم: 395',
      ar: 'صحيح مسلم: 395',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Intimacy with Allah in Prayer',
      ur: 'مناجاتِ الٰہی و شرف نماز',
      ar: 'مناجاة العبد لربه في الصلاة',
    },
  },
  {
    id: 'fatihah-two-lights',
    surah: 1,
    ayah: 1,
    arabic:
      'أَبْشِرْ بِنُورَيْنِ أُوتِيتَهُمَا لَمْ يُؤْتَهُمَا نَبِيٌّ قَبْلَكَ: فَاتِحَةُ الْكِتَابِ، وَخَوَاتِيمُ سُورَةِ الْبَقَرَةِ، لَنْ تَقْرَأَ بِحَرْفٍ مِنْهُمَا إِلَّا أُعْطِيتَهُ',
    urdu:
      'ایک فرشتے نے آسمان سے اتر کر نبی کریم ﷺ کو بشارت دی: آپ کو ایسے دو نوروں کی خوشخبری ہو جو آپ سے پہلے کسی نبی کو نہیں دیئے گئے: سورۃ الفاتحہ اور سورۃ البقرہ کی آخری آیات۔ آپ ان میں سے جو حرف بھی پڑھیں گے، وہ دعا آپ کو عطا کی جائے گی۔',
    english:
      'An angel gave glad tidings to the Prophet (ﷺ): "Rejoice in two lights given to you which were not given to any prophet before you: the Opening of the Book (Surah Al-Fatihah) and the concluding verses of Surah Al-Baqarah. You will never recite a letter from them except that you will be granted it."',
    narrator: {
      en: 'Ibn Abbas (RA)',
      ur: 'حضرت عبد اللہ بن عباس رضی اللہ عنہما',
      ar: 'عبد الله بن عباس رضي الله عنهما',
    },
    source: {
      en: 'Sahih Muslim 806',
      ur: 'صحیح مسلم: 806',
      ar: 'صحيح مسلم: 806',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Two Heavenly Lights',
      ur: 'دو عظیم آسمانی انوار',
      ar: 'نوران أوتيهما النبي ﷺ',
    },
  },

  // 2: Surah Al-Baqarah
  {
    id: 'baqarah-expel-shaytan',
    surah: 2,
    ayah: 1,
    arabic:
      'لَا تَجْعَلُوا بُيُوتَكُمْ مَقَابِرَ، إِنَّ الشَّيْطَانَ يَنْفِرُ مِنَ الْبَيْتِ الَّذِي تُقْرَأُ فِيهِ سُورَةُ الْبَقَرَةِ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: اپنے گھروں کو قبرستان نہ بناؤ؛ شیطان اس گھر سے بھاگ جاتا ہے جس میں سورۃ البقرہ کی تلاوت کی جائے۔',
    english:
      'The Messenger of Allah (ﷺ) said: "Do not make your houses like graveyards; indeed, Satan flees from a house in which Surah Al-Baqarah is recited."',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 780',
      ur: 'صحیح مسلم: 780',
      ar: 'صحيح مسلم: 780',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Virtues of Surah Al-Baqarah',
      ur: 'سورۃ البقرہ کی برکت و حفاظت',
      ar: 'فضل سورة البقرة وطرد الشيطان',
    },
  },
  {
    id: 'baqarah-patience-prayer',
    surah: 2,
    ayah: 153,
    arabic:
      'كَانَ النَّبِيُّ ﷺ إِذَا حَزَبَهُ أَمْرٌ صَلَّى',
    urdu:
      'حضرت حذیفہ بن یمان رضی اللہ عنہ فرماتے ہیں کہ جب بھی نبی کریم ﷺ کو کوئی اہم یا پریشان کن معاملہ پیش آتا، تو آپ فوراً نماز کی طرف متوجہ ہو جاتے۔',
    english:
      'Whenever the Prophet (ﷺ) was afflicted by distress or a matter troubled him, he would hasten to prayer.',
    narrator: {
      en: 'Hudhayfah ibn al-Yaman (RA)',
      ur: 'حضرت حذیفہ بن یمان رضی اللہ عنہ',
      ar: 'حذيفة بن اليمان رضي الله عنه',
    },
    source: {
      en: 'Sunan Abi Dawud 1319',
      ur: 'سنن ابی داؤد: 1319',
      ar: 'سنن أبي داود: 1319',
    },
    grade: {
      en: 'Hasan (Good)',
      ur: 'حسن',
      ar: 'حسن',
    },
    theme: {
      en: 'Seeking Help through Patience & Prayer',
      ur: 'صبر اور نماز سے مدد حاصل کرنا',
      ar: 'الاستعانة بالصبر والصلاة',
    },
  },
  {
    id: 'baqarah-dua-nearness',
    surah: 2,
    ayah: 186,
    arabic:
      'إِنَّكُمْ لَا تَدْعُونَ أَصَمَّ وَلَا غَائِبًا، إِنَّكُمْ تَدْعُونَ سَمِيعًا قَرِيبًا وَهُوَ مَعَكُمْ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: تم کسی بہرے یا غائب کو نہیں پکار رہے، بلکہ تم اس ذات کو پکار رہے ہو جو سب کچھ سننے والی، نہایت قریب ہے اور وہ تمہارے ساتھ ہے۔',
    english:
      'The Prophet (ﷺ) said: "You are not calling upon one who is deaf or absent; you are calling upon the All-Hearing, Ever-Near, and He is with you."',
    narrator: {
      en: 'Abu Musa al-Ash\'ari (RA)',
      ur: 'حضرت ابو موسیٰ اشعری رضی اللہ عنہ',
      ar: 'أبو موسى الأشعري رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 4205, Sahih Muslim 2704',
      ur: 'صحیح بخاری: 4205، صحیح مسلم: 2704',
      ar: 'صحيح البخاري: 4205، صحيح مسلم: 2704',
    },
    grade: {
      en: 'Muttafaq Alayh (Agreed Upon)',
      ur: 'متفق علیہ',
      ar: 'متفق عليه',
    },
    theme: {
      en: 'Nearness of Allah and Supplication',
      ur: 'قربِ الٰہی اور قبولیتِ دعا',
      ar: 'قرب الله تعالى وإجابة الدعاء',
    },
  },
  {
    id: 'baqarah-ayat-al-kursi-greatest',
    surah: 2,
    ayah: 255,
    arabic:
      'يَا أَبَا الْمُنْذِرِ، أَتَدْرِي أَيُّ آيَةٍ مِنْ كِتَابِ اللَّهِ مَعَكَ أَعْظَمُ؟ قَالَ: قُلْتُ: ﴿اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ﴾ فَضَرَبَ فِي صَدْرِي، وَقَالَ: وَاللَّهِ لِيَهْنِكَ الْعِلْمُ أَبَا الْمُنْذِرِ',
    urdu:
      'رسول اللہ ﷺ نے دریافت فرمایا: اے ابو منذر! کیا تم جانتے ہو کہ کتاب اللہ کی کون سی آیت تمہارے پاس سب سے عظیم ہے؟ میں نے عرض کیا: "الله لا إله إلا هو الحي القيوم" (آیت الکرسی)۔ آپ ﷺ نے شفقت سے میرے سینے پر ہاتھ مارا اور فرمایا: اللہ کی قسم! اے ابو منذر، تمہیں تمہارا علم مبارک ہو!',
    english:
      'The Messenger of Allah (ﷺ) asked: "O Abu al-Mundhir! Do you know which verse from the Book of Allah is the greatest?" I replied: "Allahu la ilaha illa Huwal-Hayyul-Qayyum (Ayat al-Kursi)." He tapped my chest and said: "By Allah, congratulations on your knowledge, O Abu al-Mundhir!"',
    narrator: {
      en: 'Ubayy ibn Ka\'b (RA)',
      ur: 'حضرت ابی بن کعب رضی اللہ عنہ',
      ar: 'أبي بن كعب رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 810',
      ur: 'صحیح مسلم: 810',
      ar: 'صحيح مسلم: 810',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Greatest Ayah in the Quran',
      ur: 'قرآن کریم کی سب سے عظیم آیت',
      ar: 'أعظم آية في كتاب الله',
    },
  },
  {
    id: 'baqarah-ayat-al-kursi-protection',
    surah: 2,
    ayah: 255,
    arabic:
      'إِذَا أَوَيْتَ إِلَى فِرَاشِكَ فَاقْرَأْ آيَةَ الْكُرْسِيِّ... لَنْ يَزَالَ عَلَيْكَ مِنَ اللَّهِ حَافِظٌ، وَلَا يَقْرَبُكَ شَيْطَانٌ حَتَّى تُصْبِحَ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: جب تم رات کو سونے کے لیے بستر پر جاؤ تو آیت الکرسی پڑھ لیا کرو، اللہ کی طرف سے تم پر مسلسل ایک نگہبان فرشتہ مقرر رہے گا اور صبح تک کوئی شیطان تمہارے پاس نہیں آ سکے گا۔',
    english:
      'The Prophet (ﷺ) confirmed: "When you go to bed, recite Ayat al-Kursi... There will remain over you a guardian from Allah, and no devil will come near you until morning."',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 2311',
      ur: 'صحیح بخاری: 2311',
      ar: 'صحيح البخاري: 2311',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Night Protection against Evil',
      ur: 'رات کو شیطانی شر سے حفاظت',
      ar: 'حفظ الحافظ والحماية من الشيطان',
    },
  },
  {
    id: 'baqarah-charity-wealth',
    surah: 2,
    ayah: 261,
    ayahEnd: 274,
    arabic:
      'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا، وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلَّا رَفَعَهُ اللَّهُ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: صدقہ دینے سے مال میں کوئی کمی نہیں آتی، اور معاف کر دینے سے اللہ بندے کی عزت ہی بڑھاتا ہے، اور جو شخص اللہ کی رضا کے لیے عاجزی اختیار کرتا ہے، اللہ اس کا مرتبہ بلند فرما دیتا ہے۔',
    english:
      'The Prophet (ﷺ) said: "Charity does not decrease wealth, no one forgives another except that Allah increases his honor, and no one humbles himself for the sake of Allah except that Allah elevates him in status."',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 2588',
      ur: 'صحیح مسلم: 2588',
      ar: 'صحيح مسلم: 2588',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Virtues of Spending in Allah\'s Cause',
      ur: 'راہِ خدا میں خرچ کرنے کی برکت',
      ar: 'فضل الصدقة والإنفاق والعفو',
    },
  },
  {
    id: 'baqarah-last-two-verses',
    surah: 2,
    ayah: 285,
    ayahEnd: 286,
    arabic:
      'مَنْ قَرَأَ بِالْآيَتَيْنِ مِنْ آخِرِ سُورَةِ الْبَقَرَةِ فِي لَيْلَةٍ كَفَتَاهُ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: جس شخص نے رات کے وقت سورۃ البقرہ کی آخری دو آیات تلاوت کر لیں، وہ اس کے لیے (ہر شر سے حفاظت اور کفایت کے لیے) کافی ہو جائیں گی۔',
    english:
      'The Messenger of Allah (ﷺ) said: "Whoever recites the last two verses of Surah Al-Baqarah at night, they will suffice him (for protection and blessing)."',
    narrator: {
      en: 'Abu Mas\'ud al-Ansari (RA)',
      ur: 'حضرت ابو مسعود انصاری رضی اللہ عنہ',
      ar: 'أبو مسعود الأنصاري رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 5009, Sahih Muslim 808',
      ur: 'صحیح بخاری: 5009، صحیح مسلم: 808',
      ar: 'صحيح البخاري: 5009، صحيح مسلم: 808',
    },
    grade: {
      en: 'Muttafaq Alayh (Agreed Upon)',
      ur: 'متفق علیہ',
      ar: 'متفق عليه',
    },
    theme: {
      en: 'Sufficiency of the Concluding Verses',
      ur: 'سورۃ البقرہ کی آخری آیات کی کفایت',
      ar: 'فضل خواتيم سورة البقرة',
    },
  },

  // 3: Ali 'Imran
  {
    id: 'imran-reflection-creation',
    surah: 3,
    ayah: 190,
    ayahEnd: 200,
    arabic:
      'وَيْلٌ لِمَنْ قَرَأَهَا وَلَمْ يَتَفَكَّرْ فِيهَا: ﴿إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ﴾',
    urdu:
      'حضرت عائشہ صدیقہ رضی اللہ عنہا فرماتی ہیں کہ نبی کریم ﷺ رات کو اٹھے، آسمان کی طرف دیکھا اور سورۂ آل عمران کی آیات (190-200) تلاوت فرمائیں، پھر فرمایا: ہلاکت ہے اس شخص کے لیے جس نے یہ آیات پڑھیں اور ان میں غور و فکر (تدبر) نہ کیا!',
    english:
      'The Prophet (ﷺ) stood up at night, gazed at the sky, recited these verses (3:190-200), and remarked: "Woe to the person who recites them and does not reflect upon their wisdom!"',
    narrator: {
      en: 'Aisha (RA)',
      ur: 'حضرت عائشہ صدیقہ رضی اللہ عنہا',
      ar: 'عائشة رضي الله عنها',
    },
    source: {
      en: 'Sahih Ibn Hibban 620',
      ur: 'صحیح ابن حبان: 620',
      ar: 'صحيح ابن حبان: 620',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Contemplating the Signs of the Cosmos',
      ur: 'کائنات میں نشانیاں اور تدبر',
      ar: 'التفكر في خلق السماوات والأرض',
    },
  },

  // 17: Al-Isra
  {
    id: 'isra-honoring-parents',
    surah: 17,
    ayah: 23,
    ayahEnd: 24,
    arabic:
      'مَنْ أَحَقُّ النَّاسِ بِحُسْنِ صَحَابَتِي؟ قَالَ: أُمُّكَ، قَالَ: ثُمَّ مَنْ؟ قَالَ: أُمُّكَ، قَالَ: ثُمَّ مَنْ؟ قَالَ: أُمُّكَ، قَالَ: ثُمَّ مَنْ؟ قَالَ: ثُمَّ أَبُوكَ',
    urdu:
      'ایک شخص نے رسول اللہ ﷺ سے دریافت کیا: لوگوں میں میرے حسن سلوک کا سب سے زیادہ مستحق کون ہے؟ آپ ﷺ نے فرمایا: تمہاری ماں۔ اس نے عرض کیا: پھر کون؟ فرمایا: تمہاری ماں۔ اس نے عرض کیا: پھر کون؟ فرمایا: تمہاری ماں۔ اس نے پوچھا: پھر کون؟ فرمایا: پھر تمہارا باپ۔',
    english:
      'A man asked the Prophet (ﷺ): "Who among people is most deserving of my best companionship?" He answered: "Your mother." The man asked: "Then who?" He answered: "Your mother." The man asked: "Then who?" He answered: "Your mother." The man asked: "Then who?" He said: "Then your father."',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 5971, Sahih Muslim 2548',
      ur: 'صحیح بخاری: 5971، صحیح مسلم: 2548',
      ar: 'صحيح البخاري: 5971، صحيح مسلم: 2548',
    },
    grade: {
      en: 'Muttafaq Alayh (Agreed Upon)',
      ur: 'متفق علیہ',
      ar: 'متفق عليه',
    },
    theme: {
      en: 'Duty of Utmost Kindness to Parents',
      ur: 'والدین کی خدمت اور حسن سلوک',
      ar: 'بر الوالدين وحقهما العظيم',
    },
  },

  // 18: Al-Kahf
  {
    id: 'kahf-protection-dajjal',
    surah: 18,
    ayah: 1,
    ayahEnd: 10,
    arabic:
      'مَنْ حَفِظَ عَشْرَ آيَاتٍ مِنْ أَوَّلِ سُورَةِ الْكَهْفِ عُصِمَ مِنَ الدَّجَّالِ',
    urdu:
      'رسول اللہ ﷺ نے ارشاد فرمایا: جس شخص نے سورۃ الکہف کی ابتدائی دس آیات حفظ کر لیں، وہ دجال کے فتنے سے محفوظ رہے گا۔',
    english:
      'The Messenger of Allah (ﷺ) said: "Whoever memorizes the first ten verses of Surah Al-Kahf will be protected from the trial of the Dajjal (Antichrist)."',
    narrator: {
      en: 'Abu Darda (RA)',
      ur: 'حضرت ابو درداء رضی اللہ عنہ',
      ar: 'أبو الدرداء رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 809',
      ur: 'صحیح مسلم: 809',
      ar: 'صحيح مسلم: 809',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Fortress against the Trial of Dajjal',
      ur: 'فتنہ دجال سے حفاظت کی پناہ گاہ',
      ar: 'العصمة من فتنة الدجال',
    },
  },
  {
    id: 'kahf-friday-light',
    surah: 18,
    ayah: 1,
    arabic:
      'مَنْ قَرَأَ سُورَةَ الْكَهْفِ فِي يَوْمِ الْجُمُعَةِ أَضَاءَ لَهُ مِنَ النُّورِ مَا بَيْنَ الْجُمُعَتَيْنِ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: جس شخص نے جمعہ کے دن سورۃ الکہف کی تلاوت کی، اس کے لیے دونوں جمعوں کے درمیانی ایام میں نور چمکتا رہے گا۔',
    english:
      'The Prophet (ﷺ) said: "Whoever recites Surah Al-Kahf on Friday, a light will shine for him between the two Fridays."',
    narrator: {
      en: 'Abu Sa\'id al-Khudri (RA)',
      ur: 'حضرت ابو سعید خدری رضی اللہ عنہ',
      ar: 'أبو سعيد الخدري رضي الله عنه',
    },
    source: {
      en: 'Mustadrak al-Hakim, Sahih al-Jami 6470',
      ur: 'مستدرک حاکم، صحیح الجامع: 6470',
      ar: 'مستدرك الحاكم، صحيح الجامع: 6470',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Blessing of Friday Recitation',
      ur: 'جمعہ کے روز تلاوت کا نور',
      ar: 'نور ما بين الجمعتين',
    },
  },

  // 21: Al-Anbiya
  {
    id: 'anbiya-yunus-supplication',
    surah: 21,
    ayah: 87,
    arabic:
      'دَعْوَةُ ذِي النُّونِ إِذْ دَعَا وَهُوَ فِي بَطْنِ الْحُوتِ: ﴿لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ﴾ فَإِنَّهُ لَمْ يَدْعُ بِهَا رَجُلٌ مُسْلِمٌ فِي شَيْءٍ قَطُّ إِلَّا اسْتَجَابَ اللَّهُ لَهُ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: مچھلی والے پیغمبر (حضرت یونس علیہ السلام) کی دعا جو انہوں نے مچھلی کے پیٹ میں کی: "لا إله إلا أنت سبحانك إني كنت من الظالمين"۔ کوئی بھی مسلمان جب کسی بھی تکلیف یا پریشانی میں یہ دعا مانگے گا، اللہ اس کی پکار ضرور قبول فرمائے گا۔',
    english:
      'The Prophet (ﷺ) said: "The supplication of Dhun-Nun (Prophet Yunus) when he called upon Allah from the belly of the whale: \'There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.\' No Muslim calls upon Allah with this dua in any hardship except that Allah grants it to him."',
    narrator: {
      en: 'Sa\'d ibn Abi Waqqas (RA)',
      ur: 'حضرت سعد بن ابی وقاص رضی اللہ عنہ',
      ar: 'سعد بن أبي وقاص رضي الله عنه',
    },
    source: {
      en: 'Jami` at-Tirmidhi 3505',
      ur: 'جامع ترمذی: 3505',
      ar: 'جامع الترمذي: 3505',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Relief from Distress & Anxiety',
      ur: 'غموں اور پریشانیوں سے نجات کا وظیفہ',
      ar: 'دعاء كشف الكرب والهم',
    },
  },

  // 33: Al-Ahzab
  {
    id: 'ahzab-salawat-upon-prophet',
    surah: 33,
    ayah: 56,
    arabic:
      'مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرَ صَلَوَاتٍ، وَحُطَّتْ عَنْهُ عَشْرُ خَطِيئَاتٍ، وَرُفِعَتْ لَهُ عَشْرُ دَرَجَاتٍ',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: جس شخص نے مجھ پر ایک مرتبہ درود بھیجا، اللہ تعالیٰ اس پر دس رحمتیں نازل فرماتا ہے، اس کے دس گناہ مٹا دیتا ہے اور اس کے دس درجات بلند فرما دیتا ہے۔',
    english:
      'The Messenger of Allah (ﷺ) said: "Whoever sends blessings upon me once, Allah sends blessings upon him tenfold, erases ten sins from him, and elevates him by ten ranks."',
    narrator: {
      en: 'Anas ibn Malik (RA)',
      ur: 'حضرت انس بن مالک رضی اللہ عنہ',
      ar: 'أنس بن مالك رضي الله عنه',
    },
    source: {
      en: 'Sunan an-Nasa\'i 1297',
      ur: 'سنن نسائی: 1297',
      ar: 'سنن النسائي: 1297',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Immense Blessings of Salawat (Durood)',
      ur: 'درود شریف کے فضائل و برکات',
      ar: 'فضل الصلاة على النبي ﷺ',
    },
  },

  // 39: Az-Zumar
  {
    id: 'zumar-boundless-forgiveness',
    surah: 39,
    ayah: 53,
    arabic:
      'قَالَ اللَّهُ تَبَارَكَ وَتَعَالَى: يَا ابْنَ آدَمَ، إِنَّكَ مَا دَعَوْتَنِي وَرَجَوْتَنِي غَفَرْتُ لَكَ عَلَى مَا كَانَ فِيكَ وَلَا أُبَالِي... لَوْ بَلَغَتْ ذُنُوبُكَ عَنَانَ السَّمَاءِ ثُمَّ اسْتَغْفَرْتَنِي غَفَرْتُ لَكَ',
    urdu:
      'اللہ تبارک و تعالیٰ فرماتا ہے: اے ابن آدم! جب تک تو مجھ سے دعا مانگتا رہے گا اور مجھ سے مغفرت کی امید رکھے گا، میں تیرے گناہ بخشتا رہوں گا اور پروا نہیں کروں گا... اگر تیرے گناہ آسمان کی بلندیوں تک بھی پہنچ جائیں، پھر تو مجھ سے بخشش مانگے تو میں تجھے معاف کر دوں گا۔',
    english:
      'Allah the Almighty says: "O son of Adam! So long as you call upon Me and hope in Me, I forgive you for what you have done and I do not mind... Even if your sins reached the heights of the heavens and then you asked My forgiveness, I would forgive you."',
    narrator: {
      en: 'Anas ibn Malik (RA)',
      ur: 'حضرت انس بن مالک رضی اللہ عنہ',
      ar: 'أنس بن مالك رضي الله عنه',
    },
    source: {
      en: 'Jami` at-Tirmidhi 3540',
      ur: 'جامع ترمذی: 3540',
      ar: 'جامع الترمذي: 3540',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Boundless Mercy and Repentance',
      ur: 'وسعتِ رحمت و سچی توبہ',
      ar: 'سعة مغفرة الله ورحمته بالتائبين',
    },
  },

  // 67: Al-Mulk
  {
    id: 'mulk-intercession-grave',
    surah: 67,
    ayah: 1,
    ayahEnd: 30,
    arabic:
      'إِنَّ سُورَةً مِنَ الْقُرْآنِ ثَلَاثُونَ آيَةً شَفَعَتْ لِرَجُلٍ حَتَّى غُفِرَ لَهُ، وَهِيَ: ﴿تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ﴾',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: بے شک قرآن میں تیس آیات کی ایک ایسی سورت ہے جس نے ایک شخص کی اس قدر شفاعت و سفارش کی کہ اسے بخش دیا گیا، اور وہ سورت "تبارك الذي بيده الملك" (سورۃ الملک) ہے۔',
    english:
      'The Prophet (ﷺ) said: "Indeed, there is a surah in the Quran containing thirty verses which interceded for a person until he was completely forgiven: Blessed is He in whose hand is the dominion (Surah Al-Mulk)."',
    narrator: {
      en: 'Abu Hurairah (RA)',
      ur: 'حضرت ابو ہریرہ رضی اللہ عنہ',
      ar: 'أبو هريرة رضي الله عنه',
    },
    source: {
      en: 'Jami` at-Tirmidhi 2891, Sunan Abi Dawud 1400',
      ur: 'جامع ترمذی: 2891، سنن ابی داؤد: 1400',
      ar: 'جامع الترمذي: 2891، سنن أبي داود: 1400',
    },
    grade: {
      en: 'Hasan (Good)',
      ur: 'حسن',
      ar: 'حسن',
    },
    theme: {
      en: 'Intercession and Shield from Grave Torment',
      ur: 'عذابِ قبر سے نجات کی سفارش',
      ar: 'شفاعة سورة الملك والمنجية من عذاب القبر',
    },
  },

  // 93: Ad-Duha & 94: Ash-Sharh
  {
    id: 'duha-sharh-ease',
    surah: 94,
    ayah: 5,
    ayahEnd: 6,
    arabic:
      'لَنْ يَغْلِبَ عُسْرٌ يُسْرَيْنِ: ﴿فَإِنَّ مَعَ الْعُسْرِ يُسْرًا • إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾',
    urdu:
      'رسول اللہ ﷺ نے ارشاد فرمایا: ایک تنگی دو آسانیوں پر کبھی غالب نہیں آ سکتی، یقیناً ہر تنگی کے ساتھ آسانی ہے، بے شک تنگی کے ساتھ آسانی ہے۔',
    english:
      'The Prophet (ﷺ) encouraged: "A single hardship shall never overcome two eases: Indeed, with hardship comes ease; truly, with hardship comes ease."',
    narrator: {
      en: 'Ibn Abbas (RA)',
      ur: 'حضرت عبد اللہ بن عباس رضی اللہ عنہما',
      ar: 'عبد الله بن عباس رضي الله عنهما',
    },
    source: {
      en: 'Musannaf Abdur-Razzaq, Bayhaqi',
      ur: 'مصنف عبد الرزاق، شعب الایمان للبیہقی',
      ar: 'مصنف عبد الرزاق، البيهقي في الشعب',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Certainty of Relief after Difficulty',
      ur: 'مشکل کے بعد آسانی اور امید',
      ar: 'البشارة باليسر بعد العسر',
    },
  },

  // 108: Al-Kawthar
  {
    id: 'kawthar-river-in-jannah',
    surah: 108,
    ayah: 1,
    ayahEnd: 3,
    arabic:
      'أَتَدْرُونَ مَا الْكَوْثَرُ؟ قَالُوا: اللَّهُ وَرَسُولُهُ أَعْلَمُ، قَالَ: فَإِنَّهُ نَهْرٌ وَعَدَنِيهِ رَبِّي عَزَّ وَجَلَّ فِي الْجَنَّةِ، عَلَيْهِ خَيْرٌ كَثِيرٌ...',
    urdu:
      'رسول اللہ ﷺ پر اونگھ طاری ہوئی پھر آپ مسکراتے ہوئے اٹھے اور فرمایا: ابھی مجھ پر ایک سورت نازل ہوئی ہے (إنا أعطيناك الكوثر...)۔ پھر دریافت فرمایا: کیا تم جانتے ہو کہ کوثر کیا ہے؟ صحابہ نے عرض کیا: اللہ اور اس کا رسول بہتر جانتے ہیں۔ آپ ﷺ نے فرمایا: وہ جنت کی ایک نہر ہے جس کا میرے رب نے مجھ سے وعدہ فرمایا ہے، اس پر بے پناہ خیر و بھلائی ہے...',
    english:
      'The Messenger of Allah (ﷺ) smiled and said: "A Surah was just revealed to me (Indeed, We have granted you al-Kawthar)... Do you know what al-Kawthar is?" The companions replied: "Allah and His Messenger know best." He said: "It is a river that my Lord has promised me in Paradise, carrying boundless goodness..."',
    narrator: {
      en: 'Anas ibn Malik (RA)',
      ur: 'حضرت انس بن مالک رضی اللہ عنہ',
      ar: 'أنس بن مالك رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 400',
      ur: 'صحیح مسلم: 400',
      ar: 'صحيح مسلم: 400',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'The Heavenly River of Al-Kawthar',
      ur: 'حوض و نہرِ کوثر کی بشارت',
      ar: 'حوض الكوثر ونهر الجنة الموعود',
    },
  },

  // 112: Al-Ikhlas
  {
    id: 'ikhlas-one-third-quran',
    surah: 112,
    ayah: 1,
    ayahEnd: 4,
    arabic:
      'وَالَّذِي نَفْسِي بِيَدِهِ، إِنَّهَا لَتَعْدِلُ ثُلُثَ الْقُرْآنِ',
    urdu:
      'رسول اللہ ﷺ نے سورۂ اخلاص کے بارے میں قسم کھا کر ارشاد فرمایا: اس ذات کی قسم جس کے ہاتھ میں میری جان ہے! یہ سورت تہائی قرآن (ایک تہائی) کے برابر ہے۔',
    english:
      'The Prophet (ﷺ) swore: "By Him in Whose Hand my soul rests, it (Surah Al-Ikhlas) is truly equivalent to one-third of the entire Quran."',
    narrator: {
      en: 'Abu Sa\'id al-Khudri (RA)',
      ur: 'حضرت ابو سعید خدری رضی اللہ عنہ',
      ar: 'أبو سعيد الخدري رضي الله عنه',
    },
    source: {
      en: 'Sahih al-Bukhari 5013',
      ur: 'صحیح بخاری: 5013',
      ar: 'صحيح البخاري: 5013',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Tawheed & Equivalence to One-Third of Quran',
      ur: 'توحیدِ خالص اور ثلثِ قرآن کا ثواب',
      ar: 'فضل سورة الإخلاص وتعديلها لثلث القرآن',
    },
  },

  // 113 & 114: Al-Mu'awwidhatayn
  {
    id: 'muawwidhatayn-unmatched-protection',
    surah: 113,
    ayah: 1,
    ayahEnd: 5,
    arabic:
      'أَلَمْ تَرَ آيَاتٍ أُنْزِلَتِ اللَّيْلَةَ لَمْ يُرَ مِثْلُهُنَّ قَطُّ؟ ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ﴾، وَ ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ﴾',
    urdu:
      'رسول اللہ ﷺ نے فرمایا: کیا تم نے نہیں دیکھا کہ آج رات ایسی انوکھی آیات نازل ہوئی ہیں جن کی مثل کبھی نہیں دیکھی گئی؟ وہ "قل أعوذ برب الفلق" اور "قل أعوذ برب الناس" ہیں۔',
    english:
      'The Messenger of Allah (ﷺ) said: "Have you not seen verses revealed tonight, the likes of which have never been witnessed? They are: Qul a\'udhu bi Rabbil-falaq and Qul a\'udhu bi Rabbin-nas."',
    narrator: {
      en: '\'Uqbah ibn \'Amir (RA)',
      ur: 'حضرت عقبہ بن عامر رضی اللہ عنہ',
      ar: 'عقبة بن عامر رضي الله عنه',
    },
    source: {
      en: 'Sahih Muslim 814',
      ur: 'صحیح مسلم: 814',
      ar: 'صحيح مسلم: 814',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'The Supreme Verses of Divine Refuge',
      ur: 'ہر قسم کے شرور و حسد سے پناہ',
      ar: 'المعوذتان وفضل التعوذ بهما',
    },
  },
  {
    id: 'muawwidhatayn-bedtime-sunnah',
    surah: 114,
    ayah: 1,
    ayahEnd: 6,
    arabic:
      'كَانَ النَّبِيُّ ﷺ إِذَا أَوَى إِلَى فِرَاشِهِ جَمَعَ كَفَّيْهِ ثُمَّ نَفَثَ فِيهِمَا فَقَرَأَ فِيهِمَا: ﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾ وَ ﴿قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ﴾ وَ ﴿قُلْ أَعُوذُ بِرَبِّ النَّاسِ﴾، ثُمَّ يَمْسَحُ بِهِمَا مَا اسْتَطَاعَ مِنْ جَسَدِهِ',
    urdu:
      'حضرت عائشہ صدیقہ رضی اللہ عنہا فرماتی ہیں کہ نبی کریم ﷺ جب ہر رات اپنے بستر پر تشریف لے جاتے تو اپنی دونوں ہتھیلیوں کو ملا کر ان پر دم فرماتے، اور ان میں سورۂ اخلاص، سورۂ فلق اور سورۂ ناس پڑھتے، پھر اپنے مبارک ہاتھوں کو جسم کے جس حصے تک ممکن ہوتا پھیرتے۔',
    english:
      'Aisha (RA) narrated: Whenever the Prophet (ﷺ) went to bed each night, he would cup his hands together, blow into them, and recite Surah Al-Ikhlas, Surah Al-Falaq, and Surah An-Nas, then wipe as much of his body as he could reach with them.',
    narrator: {
      en: 'Aisha (RA)',
      ur: 'حضرت عائشہ صدیقہ رضی اللہ عنہا',
      ar: 'عائشة رضي الله عنها',
    },
    source: {
      en: 'Sahih al-Bukhari 5017',
      ur: 'صحیح بخاری: 5017',
      ar: 'صحيح البخاري: 5017',
    },
    grade: {
      en: 'Sahih (Authentic)',
      ur: 'صحیح',
      ar: 'صحيح',
    },
    theme: {
      en: 'Night Sunnah of Wiping with the Mu\'awwidhat',
      ur: 'سونے سے قبل تینوں سورتوں سے دم کرنے کی سنت',
      ar: 'سنة النفث بالمعوذات عند النوم',
    },
  },
];
