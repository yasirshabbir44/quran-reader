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
  readonly benefit?: AdhkarLocalizedText;
  readonly category?: string;
}

export interface AdhkarCollection {
  readonly id: string;
  readonly icon: string;
  readonly sortOrder: number;
  readonly category?: string;
  readonly title: AdhkarLocalizedText;
  readonly description: AdhkarLocalizedText;
  readonly itemCount: number;
  readonly items: readonly AdhkarItem[];
}

export interface AdhkarIndexPayload {
  readonly version: number;
  readonly collections: readonly AdhkarCollection[];
}

export interface AdhkarSearchResult {
  readonly item: AdhkarItem;
  readonly collectionId: string;
  readonly collectionTitle: AdhkarLocalizedText;
  readonly collectionIcon: string;
  readonly matchField: 'arabic' | 'transliteration' | 'translation' | 'source';
}
