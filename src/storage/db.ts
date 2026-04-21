import type { Category, ExportPayload, ItemRecord } from '../types/models';

const DB_NAME = 'things-record-db';
const DB_VERSION = 1;
const CATEGORY_STORE = 'categories';
const ITEM_STORE = 'items';
const STORAGE_EVENT = 'things-record:changed';

const defaultCategoryNames = ['衣物', '护肤', '食物', '其他'];

let dbPromise: Promise<IDBDatabase> | null = null;
let seedPromise: Promise<void> | null = null;

function openDatabase() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(CATEGORY_STORE)) {
          db.createObjectStore(CATEGORY_STORE, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(ITEM_STORE)) {
          db.createObjectStore(ITEM_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('打开数据库失败'));
    });
  }

  return dbPromise;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('数据库请求失败'));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('事务失败'));
    transaction.onabort = () => reject(transaction.error ?? new Error('事务已中断'));
  });
}

function emitStorageChanged() {
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function onStorageChanged(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);
  return () => window.removeEventListener(STORAGE_EVENT, callback);
}

export function createId() {
  if ('randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function ensureSeedData() {
  if (seedPromise) {
    return seedPromise;
  }

  seedPromise = seedData();
  return seedPromise;
}

async function seedData() {
  const db = await openDatabase();
  const transaction = db.transaction(CATEGORY_STORE, 'readonly');
  const store = transaction.objectStore(CATEGORY_STORE);
  const categories = await requestToPromise(store.getAll()) as Category[];
  await transactionDone(transaction);

  if (categories.length > 0) {
    await mergeDuplicateCategories();
    return;
  }

  const writeTransaction = db.transaction(CATEGORY_STORE, 'readwrite');
  const writeStore = writeTransaction.objectStore(CATEGORY_STORE);
  const now = new Date().toISOString();

  defaultCategoryNames.forEach((name, index) => {
    writeStore.put({
      id: createId(),
      name,
      sortOrder: index,
      createdAt: now
    } satisfies Category);
  });

  await transactionDone(writeTransaction);
  emitStorageChanged();
}

async function mergeDuplicateCategories() {
  const db = await openDatabase();
  const readTransaction = db.transaction([CATEGORY_STORE, ITEM_STORE], 'readonly');
  const categories = await requestToPromise(readTransaction.objectStore(CATEGORY_STORE).getAll()) as Category[];
  const items = await requestToPromise(readTransaction.objectStore(ITEM_STORE).getAll()) as ItemRecord[];
  await transactionDone(readTransaction);

  const canonicalByName = new Map<string, Category>();
  const duplicateIds = new Map<string, string>();

  categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt))
    .forEach((category) => {
      const key = category.name.trim();
      const canonical = canonicalByName.get(key);

      if (canonical) {
        duplicateIds.set(category.id, canonical.id);
        return;
      }

      canonicalByName.set(key, category);
    });

  if (duplicateIds.size === 0) {
    return;
  }

  const writeTransaction = db.transaction([CATEGORY_STORE, ITEM_STORE], 'readwrite');
  const categoryStore = writeTransaction.objectStore(CATEGORY_STORE);
  const itemStore = writeTransaction.objectStore(ITEM_STORE);
  const now = new Date().toISOString();

  categories.forEach((category) => {
    if (duplicateIds.has(category.id)) {
      categoryStore.delete(category.id);
    }
  });

  items.forEach((item) => {
    const categoryId = duplicateIds.get(item.categoryId);

    if (categoryId) {
      itemStore.put({ ...item, categoryId, updatedAt: now });
    }
  });

  await transactionDone(writeTransaction);
  emitStorageChanged();
}

export async function getCategories() {
  await ensureSeedData();
  const db = await openDatabase();
  const transaction = db.transaction(CATEGORY_STORE, 'readonly');
  const store = transaction.objectStore(CATEGORY_STORE);
  const categories = await requestToPromise(store.getAll()) as Category[];
  await transactionDone(transaction);
  return categories.sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export async function saveCategory(input: Pick<Category, 'name'> & { id?: string }) {
  const db = await openDatabase();
  const categories = await getCategories();
  const existing = input.id ? categories.find((category) => category.id === input.id) : undefined;
  const now = new Date().toISOString();
  const name = input.name.trim();

  if (!name) {
    throw new Error('类别名称不能为空');
  }

  const nextCategory: Category = {
    id: existing?.id ?? createId(),
    name,
    sortOrder: existing?.sortOrder ?? categories.length,
    createdAt: existing?.createdAt ?? now
  };

  const transaction = db.transaction(CATEGORY_STORE, 'readwrite');
  transaction.objectStore(CATEGORY_STORE).put(nextCategory);
  await transactionDone(transaction);
  emitStorageChanged();
  return nextCategory;
}

export async function deleteCategory(categoryId: string) {
  const db = await openDatabase();
  const categories = await getCategories();
  const target = categories.find((category) => category.id === categoryId);

  if (!target) {
    return;
  }

  const remainingCategories = categories.filter((category) => category.id !== categoryId);
  let fallbackCategory = remainingCategories.find((category) => category.name === '其他') ?? remainingCategories[0];

  if (!fallbackCategory) {
    fallbackCategory = await saveCategory({ name: '其他' });
  }

  const items = await getItems();
  const now = new Date().toISOString();
  const transaction = db.transaction([CATEGORY_STORE, ITEM_STORE], 'readwrite');
  const categoryStore = transaction.objectStore(CATEGORY_STORE);
  const itemStore = transaction.objectStore(ITEM_STORE);

  categoryStore.delete(categoryId);

  items
    .filter((item) => item.categoryId === categoryId)
    .forEach((item) => {
      itemStore.put({ ...item, categoryId: fallbackCategory.id, updatedAt: now });
    });

  await transactionDone(transaction);
  emitStorageChanged();
}

export async function getItems() {
  const db = await openDatabase();
  const transaction = db.transaction(ITEM_STORE, 'readonly');
  const store = transaction.objectStore(ITEM_STORE);
  const items = await requestToPromise(store.getAll()) as ItemRecord[];
  await transactionDone(transaction);
  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getItem(itemId: string) {
  const db = await openDatabase();
  const transaction = db.transaction(ITEM_STORE, 'readonly');
  const item = await requestToPromise(transaction.objectStore(ITEM_STORE).get(itemId)) as ItemRecord | undefined;
  await transactionDone(transaction);
  return item ?? null;
}

export async function saveItem(
  input: Omit<ItemRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
) {
  const db = await openDatabase();
  const existing = input.id ? await getItem(input.id) : null;
  const now = new Date().toISOString();
  const nextItem: ItemRecord = {
    id: existing?.id ?? createId(),
    name: input.name.trim(),
    categoryId: input.categoryId,
    rating: input.rating,
    note: input.note.trim(),
    imageDataUrl: input.imageDataUrl,
    link: input.link.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  const transaction = db.transaction(ITEM_STORE, 'readwrite');
  transaction.objectStore(ITEM_STORE).put(nextItem);
  await transactionDone(transaction);
  emitStorageChanged();
  return nextItem;
}

export async function deleteItem(itemId: string) {
  const db = await openDatabase();
  const transaction = db.transaction(ITEM_STORE, 'readwrite');
  transaction.objectStore(ITEM_STORE).delete(itemId);
  await transactionDone(transaction);
  emitStorageChanged();
}

export async function exportData(): Promise<ExportPayload> {
  const [categories, items] = await Promise.all([getCategories(), getItems()]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    categories,
    items
  };
}

export async function importData(payload: ExportPayload) {
  const db = await openDatabase();
  const transaction = db.transaction([CATEGORY_STORE, ITEM_STORE], 'readwrite');
  const categoryStore = transaction.objectStore(CATEGORY_STORE);
  const itemStore = transaction.objectStore(ITEM_STORE);

  categoryStore.clear();
  itemStore.clear();

  payload.categories.forEach((category) => categoryStore.put(category));
  payload.items.forEach((item) => itemStore.put(item));

  await transactionDone(transaction);
  emitStorageChanged();
}
