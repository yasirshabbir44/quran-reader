export type SurahNavItem = {
  readonly number: number;
  readonly nameAr: string;
  readonly nameTranslit: string;
  readonly versesCount: number;
  readonly revelationType: 'meccan' | 'medinan';
};
