export interface QuranReciter {
  readonly id: number;
  readonly name: string;
  readonly style?: string;
  readonly audioBaseUrl: string;
}

/** Reciters with Quran.com word-level timing data and stable ayah MP3s. */
export const QURAN_RECITERS: readonly QuranReciter[] = [
  {
    id: 7,
    name: 'Mishary Rashid Alafasy',
    audioBaseUrl: 'https://verses.quran.com/Alafasy/mp3',
  },
  {
    id: 3,
    name: 'Abdur-Rahman as-Sudais',
    audioBaseUrl: 'https://verses.quran.com/Sudais/mp3',
  },
  {
    id: 12,
    name: 'Mahmoud Khalil Al-Husary',
    style: 'Muallim',
    audioBaseUrl: 'https://mirrors.quranicaudio.com/everyayah/Husary_Muallim_128kbps',
  },
] as const;

export const DEFAULT_RECITER_ID = 7;

export function padAyahAudioPart(n: number): string {
  return String(n).padStart(3, '0');
}

/** e.g. surah 2 ayah 255 → `https://…/002255.mp3` */
export function ayahAudioUrl(
  reciterId: number,
  surah: number,
  ayah: number,
): string {
  const reciter =
    QURAN_RECITERS.find((candidate) => candidate.id === reciterId) ??
    QURAN_RECITERS[0]!;
  return `${reciter.audioBaseUrl}/${padAyahAudioPart(surah)}${padAyahAudioPart(ayah)}.mp3`;
}

/** Backward-compatible default voice used by learner exercises. */
export function alafasyAyahAudioUrl(surah: number, ayah: number): string {
  return ayahAudioUrl(DEFAULT_RECITER_ID, surah, ayah);
}
