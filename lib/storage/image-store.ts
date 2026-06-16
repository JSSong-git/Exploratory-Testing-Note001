import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

const DB_NAME = 'et-screenshots';
const DB_VERSION = 1;
const STORE_NAME = 'images';

interface ScreenshotDB extends DBSchema {
  images: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      createdAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<ScreenshotDB>> | null = null;

function getDb(): Promise<IDBPDatabase<ScreenshotDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ScreenshotDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveImage(blob: Blob): Promise<string> {
  const id = crypto.randomUUID();
  const db = await getDb();
  await db.put(STORE_NAME, { id, blob, createdAt: Date.now() });
  return id;
}

export async function getImage(id: string): Promise<Blob | null> {
  const db = await getDb();
  const record = await db.get(STORE_NAME, id);
  return record?.blob ?? null;
}

export async function deleteImage(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

export async function deleteImages(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => deleteImage(id)));
}

export async function clearAllImages(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE_NAME);
}

/** Test helper */
export async function resetImageStore(): Promise<void> {
  dbPromise = null;
  await clearAllImages();
}
