/**
 * Formats a number into Eastern Arabic-Indic numerals (٠، ١، ٢، ٣، ٤، ٥، ٦، ٧، ٨، ٩)
 * commonly used in Quranic mushafs worldwide for ayah numbering.
 */
export function toArabicDigits(num: number | string): string {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).replace(/[0-9]/g, (d) => digits[Number(d)] ?? d);
}
