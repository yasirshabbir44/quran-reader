export interface AdhkarLocalizedText {
  readonly en: string;
  readonly ur: string;
  readonly ar: string;
}

export interface AdhkarItem {
  readonly id: string;
  readonly arabic: string;
  readonly transliteration?: string;
  readonly translation: AdhkarLocalizedText;
  readonly repeat?: number;
  readonly source?: string;
}

export interface AdhkarCollection {
  readonly id: string;
  readonly icon: string;
  readonly sortOrder: number;
  readonly title: AdhkarLocalizedText;
  readonly description: AdhkarLocalizedText;
  readonly itemCount: number;
  readonly items: readonly AdhkarItem[];
}

export interface AdhkarIndexPayload {
  readonly version: number;
  readonly collections: readonly AdhkarCollection[];
}
