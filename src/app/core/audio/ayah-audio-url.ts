/** Mishary Rashid Alafasy 128kbps ayah clips (everyayah.com). */
export const ALAFASY_AYAH_CDN = 'https://everyayah.com/data/Alafasy_128kbps';

export function padAyahAudioPart(n: number): string {
  return String(n).padStart(3, '0');
}

/** e.g. surah 2 ayah 255 → `https://…/Alafasy_128kbps/002255.mp3` */
export function alafasyAyahAudioUrl(surah: number, ayah: number): string {
  return `${ALAFASY_AYAH_CDN}/${padAyahAudioPart(surah)}${padAyahAudioPart(ayah)}.mp3`;
}
