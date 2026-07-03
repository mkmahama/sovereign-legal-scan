export interface StoredOriginalFile {
  caseId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  blob: Blob;
}

type StoredFileRecord = Omit<StoredOriginalFile, "blob"> & { bytes: ArrayBuffer };

const DATABASE_NAME = "sovereign-legal-originals";
const STORE_NAME = "case-files";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "caseId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOriginalFile(caseId: string, file: File): Promise<StoredOriginalFile> {
  const bytes = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
  const record: StoredFileRecord = {
    caseId,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    uploadedAt: new Date().toISOString(),
    bytes,
  };

  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  const { bytes: _bytes, ...metadata } = record;
  return { ...metadata, blob: file };
}

export async function getOriginalFile(caseId: string): Promise<StoredOriginalFile | null> {
  const database = await openDatabase();
  const record = await new Promise<StoredFileRecord | undefined>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(caseId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  if (!record) return null;
  const { bytes, ...metadata } = record;
  return { ...metadata, blob: new Blob([bytes], { type: record.mimeType }) };
}

export async function deleteOriginalFile(caseId: string): Promise<void> {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(caseId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export function downloadStoredFile(file: StoredOriginalFile) {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
