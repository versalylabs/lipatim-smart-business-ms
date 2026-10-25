/**
 * Phase 7: IndexedDB Offline-First Storage & Queue Engine
 * Provides persistent IndexedDB storage for products, invoices, and queued eTIMS sync operations
 * so LipaTim operates with 0ms interruption during Safaricom / ISP fiber outages.
 */

import { Invoice } from '../types/sales';
import { Product } from '../types/inventory';

const DB_NAME = 'LipaTimOfflineDB';
const DB_VERSION = 1;

export interface OfflineSyncQueueItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  branchId: string;
  branchName: string;
  grandTotal: number;
  totalTax: number;
  cuSerialNumber: string;
  queuedAt: string;
  retryCount: number;
  lastError?: string;
  status: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached_invoices')) {
        db.createObjectStore('cached_invoices', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cached_products')) {
        db.createObjectStore('cached_products', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveInvoiceToIndexedDB(invoice: Invoice): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['cached_invoices', 'offline_queue'], 'readwrite');
    tx.objectStore('cached_invoices').put(invoice);

    if (invoice.offlineQueued || invoice.etimsValidation.status === 'OFFLINE_QUEUED') {
      const queueItem: OfflineSyncQueueItem = {
        id: `sync_${invoice.id}`,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        branchId: invoice.branchId,
        branchName: invoice.branchName,
        grandTotal: invoice.grandTotal,
        totalTax: invoice.totalTax,
        cuSerialNumber: invoice.etimsValidation.cuSerialNumber,
        queuedAt: invoice.createdAt,
        retryCount: 0,
        status: 'QUEUED',
      };
      tx.objectStore('offline_queue').put(queueItem);
    }
    db.close();
  } catch {
    // Fallback handled gracefully by localStorage
  }
}

export async function syncAllInvoicesToIndexedDB(invoices: Invoice[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['cached_invoices'], 'readwrite');
    const store = tx.objectStore('cached_invoices');
    for (const inv of invoices) {
      store.put(inv);
    }
    db.close();
  } catch {
    // Ignore IDB errors in restricted environments
  }
}

export async function syncCatalogToIndexedDB(products: Product[]): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['cached_products'], 'readwrite');
    const store = tx.objectStore('cached_products');
    for (const prod of products) {
      store.put(prod);
    }
    db.close();
  } catch {
    // Ignore IDB errors
  }
}

export async function clearOfflineQueueInIndexedDB(): Promise<void> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['offline_queue'], 'readwrite');
    tx.objectStore('offline_queue').clear();
    db.close();
  } catch {
    // Ignore
  }
}

export async function getIndexedDBStats(): Promise<{
  cachedInvoicesCount: number;
  cachedProductsCount: number;
  queuedSyncCount: number;
}> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(['cached_invoices', 'cached_products', 'offline_queue'], 'readonly');

    const countStore = (storeName: string): Promise<number> =>
      new Promise((resolve) => {
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(0);
      });

    const [cachedInvoicesCount, cachedProductsCount, queuedSyncCount] = await Promise.all([
      countStore('cached_invoices'),
      countStore('cached_products'),
      countStore('offline_queue'),
    ]);

    db.close();
    return { cachedInvoicesCount, cachedProductsCount, queuedSyncCount };
  } catch {
    return { cachedInvoicesCount: 0, cachedProductsCount: 0, queuedSyncCount: 0 };
  }
}
