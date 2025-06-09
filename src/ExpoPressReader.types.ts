enum PRState {
  Running = 1,
  Activated = 2,
  CatalogLoaded = 4,
}

enum DownloadState {
  Stop = "stop",
  Progress = "progress",
  Pause = "pause",
  Ready = "ready",
}

type PRConfig = {
  serviceName: string;
  isDebugMode?: boolean;
  analyticsTrackers?: string[];
};

type PRLaunchOptions = {
  prAnalyticsTrackers?: AnalyticsTracker[];
  prConfig?: PRConfig;
};

type AnalyticsTracker = {
  trackOpenIssueForReading?(issue: TrackingIssue): void;
  trackIssuePage?(issue: TrackingIssue, pageNumber: number): void;
  trackIssueTextFlow?(issue: TrackingIssue): void;
  trackArticleView?(issue: TrackingIssue, article: TrackingArticle): void;
  trackListenView?(issue: TrackingIssue): void;
  trackTranslated?(
    article: TrackingArticle,
    languageFrom: string,
    languageTo: string
  ): void;
  trackPrintedPages?(
    issue: TrackingIssue,
    isFullPage: boolean,
    pageNumbers: number[]
  ): void;
  trackPrintedArticle?(
    issue: TrackingIssue,
    article: TrackingArticle,
    inReplicaPresentation: boolean
  ): void;
};

type TrackingIssue = {
  cid: string;
  date: Date;
  isLatest: boolean;
  version?: number;
  smartLayoutVersion?: number;
  title: string;
  slug?: string;
  sourceType: string;
};

type TrackingArticle = {
  id: string;
  headline: string;
  language: string;
};

type Download = {
  state: DownloadState;
  progress: number;
  error?: Error;
  start(): void;
  pause(): void;
  cancel(): void;
};

type Item = {
  cid: string;
  date: Date;
  title: string;
  size?: number;
  download: Download;
};

type Downloaded = {
  items: Item[];
  delete(item: Item): void;
  deleteAll(): void;
};

type Catalog = {
  downloaded: Downloaded;
  item(cid: string, date: Date): Item | null;
};

type Account = {
  authorize(token: string): Promise<void>;
};

type PressReaderInstance = {
  account: Account;
  catalog: Catalog;
  state: PRState;
  rootViewController?: any;
  openArticle(id: string): Promise<void>;
  getLogs(): Promise<{ linkToUploadedLogs: string; additionalInfo: string }>;
};

type PressReaderStatic = {
  launchOptions?: PRLaunchOptions;
  instance(): PressReaderInstance;
  dismiss(): void;
};

export { DownloadState, PRState };
export type {
  Account,
  AnalyticsTracker,
  Catalog,
  Download,
  Downloaded,
  Item,
  PRConfig,
  PRLaunchOptions,
  PressReaderInstance,
  PressReaderStatic,
  TrackingArticle,
  TrackingIssue,
};
