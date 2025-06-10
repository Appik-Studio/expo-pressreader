import { requireNativeModule } from 'expo-modules-core';
import type { AnalyticsTracker, DownloadState, PRLaunchOptions, PRState } from './ExpoPressReader.types';

interface NativeModule {
  setLaunchOptions(options: PRLaunchOptions): void;
  getState(): PRState;
  authorize(token: string): Promise<void>;
  getRootViewController(): any;
  openArticle(articleId: string): Promise<void>;
  getLogs(): Promise<{ linkToUploadedLogs: string; additionalInfo: string }>;
  getDownloadedItems(): any[];
  getCatalogItem(cid: string, dateString: string): any | null;
  getDownloadState(cid: string, dateString: string): string;
  getDownloadProgress(cid: string, dateString: string): number;
  getDownloadError(cid: string, dateString: string): string | null;
  startDownload(cid: string, dateString: string): void;
  pauseDownload(cid: string, dateString: string): void;
  cancelDownload(cid: string, dateString: string): void;
  deleteDownloadedItem(cid: string, dateString: string): void;
  deleteAllDownloadedItems(): void;
  dismiss(): void;
  open(): void;
}

const nativeModule = requireNativeModule<NativeModule>("ExpoPressReader");

class Download {
  constructor(private cid: string, private dateString: string) {}

  get state(): DownloadState {
    return nativeModule.getDownloadState(this.cid, this.dateString) as DownloadState;
  }

  get progress(): number {
    return nativeModule.getDownloadProgress(this.cid, this.dateString);
  }

  get error(): Error | undefined {
    const errorMessage = nativeModule.getDownloadError(this.cid, this.dateString);
    return errorMessage ? new Error(errorMessage) : undefined;
  }

  start(): void {
    nativeModule.startDownload(this.cid, this.dateString);
  }

  pause(): void {
    nativeModule.pauseDownload(this.cid, this.dateString);
  }

  cancel(): void {
    nativeModule.cancelDownload(this.cid, this.dateString);
  }
}

class Item {
  public download: Download;

  constructor(private cid: string, private date: Date) {
    this.download = new Download(cid, date.toISOString());
  }
}

class Downloaded {
  get items(): any[] {
    return nativeModule.getDownloadedItems();
  }

  delete(item: Item): void {
    nativeModule.deleteDownloadedItem(item['cid'], item['date'].toISOString());
  }

  deleteAll(): void {
    nativeModule.deleteAllDownloadedItems();
  }
}

class Catalog {
  public downloaded = new Downloaded();

  item(cid: string, date: Date): Item | null {
    const nativeItem = nativeModule.getCatalogItem(cid, date.toISOString());
    return nativeItem ? new Item(cid, date) : null;
  }
}

class Account {
  async authorize(token: string): Promise<void> {
    return nativeModule.authorize(token);
  }
}

class ExpoPressReader {
  private static _instance: ExpoPressReader;
  public static launchOptions?: { prAnalyticsTrackers?: AnalyticsTracker[] };

  public account = new Account();
  public catalog = new Catalog();

  private constructor() {}

  static get instance(): ExpoPressReader {
    if (!ExpoPressReader._instance) {
      ExpoPressReader._instance = new ExpoPressReader();
    }
    return ExpoPressReader._instance;
  }

  get state(): PRState {
    return nativeModule.getState();
  }

  get rootViewController(): any {
    return nativeModule.getRootViewController();
  }

  async openArticle(id: string): Promise<void> {
    return nativeModule.openArticle(id);
  }

  async getLogs(): Promise<{ linkToUploadedLogs: string; additionalInfo: any }> {
    return nativeModule.getLogs();
  }

  dismiss(): void {
    nativeModule.dismiss();
  }

  open(): void {
    nativeModule.open();
  }
}

export default ExpoPressReader;
