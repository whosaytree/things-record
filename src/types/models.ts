export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
};

export type ItemRecord = {
  id: string;
  name: string;
  categoryId: string;
  rating: number | null;
  note: string;
  imageDataUrl: string;
  link: string;
  createdAt: string;
  updatedAt: string;
};

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  categories: Category[];
  items: ItemRecord[];
};
