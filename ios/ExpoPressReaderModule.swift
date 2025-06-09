import ExpoModulesCore
import Foundation
import PRUI
import PRAPI
import PRAnalytics

class ExpoAnalyticsTracker: NSObject, AnalyticsTracker {
  weak var module: ExpoPressReaderModule?
  
  init(module: ExpoPressReaderModule) {
    self.module = module
    super.init()
  }
}

extension ExpoAnalyticsTracker: AnalyticsService {
  static var isEnabled: Bool {
    return true
  }
  
  func track(_ name: PRAnalyticsTrackName, parameters: [PRAnalyticsTrackParameter : Any]?) {
    module?.sendEvent("onAnalyticsEvent", [
      "name": name,
      "parameters": parameters ?? [:]
    ])
  }
}

public class ExpoPressReaderModule: Module {
  private var pressReaderInstance: PressReader?
  private var analyticsTracker: ExpoAnalyticsTracker?
  private let dateFormatter: Foundation.ISO8601DateFormatter = {
    let formatter = Foundation.ISO8601DateFormatter()
    return formatter
  }()
  
  public func definition() -> ModuleDefinition {
    Name("ExpoPressReader")
    
    Events("onAnalyticsEvent")

    Function("setLaunchOptions") { (options: [String: Any]) in
      handleSetLaunchOptions(options: options)
    }

    Function("getState") { () -> String in
      return getState()
    }

    AsyncFunction("authorize") { (token: String, promise: ExpoModulesCore.Promise) in
      handleAuthorize(token: token, promise: promise)
    }

    Function("getRootViewController") { () -> Any? in
      return getRootViewController()
    }

    AsyncFunction("openArticle") { (articleId: String, promise: ExpoModulesCore.Promise) in
      handleOpenArticle(articleId: articleId, promise: promise)
    }

    AsyncFunction("getLogs") { (promise: ExpoModulesCore.Promise) in
      handleGetLogs(promise: promise)
    }

    Function("getDownloadedItems") { () -> [[String: Any]] in
      return getDownloadedItems()
    }

    Function("getCatalogItem") { (cid: String, dateString: String) -> [String: Any]? in
      return getCatalogItem(cid: cid, dateString: dateString)
    }

    Function("getDownloadState") { (cid: String, dateString: String) -> String in
      return getDownloadState(cid: cid, dateString: dateString)
    }

    Function("getDownloadProgress") { (cid: String, dateString: String) -> Double in
      return getDownloadProgress(cid: cid, dateString: dateString)
    }

    Function("getDownloadError") { (cid: String, dateString: String) -> String? in
      return getDownloadError(cid: cid, dateString: dateString)
    }

    Function("startDownload") { (cid: String, dateString: String) in
      startDownload(cid: cid, dateString: dateString)
    }

    Function("pauseDownload") { (cid: String, dateString: String) in
      pauseDownload(cid: cid, dateString: dateString)
    }

    Function("resumeDownload") { (cid: String, dateString: String) in
      resumeDownload(cid: cid, dateString: dateString)
    }

    Function("cancelDownload") { (cid: String, dateString: String) in
      cancelDownload(cid: cid, dateString: dateString)
    }

    Function("deleteDownloadedItem") { (cid: String, dateString: String) in
      deleteDownloadedItem(cid: cid, dateString: dateString)
    }

    Function("deleteAllDownloadedItems") {
      deleteAllDownloadedItems()
    }

    Function("dismiss") {
      dismiss()
    }
  }

  private func handleSetLaunchOptions(options: [String: Any]) {
    analyticsTracker = ExpoAnalyticsTracker(module: self)
    
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    for (key, value) in options {
      let launchOptionKey = UIApplication.LaunchOptionsKey(rawValue: key)
      launchOptions[launchOptionKey] = value
    }
    
    if let tracker = analyticsTracker {
      let trackerAdapter = AnalyticsTrackerAdapter(tracker: tracker)
      launchOptions[UIApplication.LaunchOptionsKey.prAnalyticsTrackers] = [trackerAdapter]
    }
    
    PressReader.launchOptions = launchOptions
  }

  private func getState() -> String {
    if let instance = pressReaderInstance {
      let state = instance.state
      if state.contains(.running) && state.contains(.activated) && state.contains(.catalogLoaded) {
        return "ready"
      } else if state.contains(.running) && state.contains(.activated) {
        return "activated"
      } else if state.contains(.running) {
        return "running"
      }
    }
    return "stopped"
  }

  private func handleAuthorize(token: String, promise: ExpoModulesCore.Promise) {
    pressReaderInstance = PressReader.instance()

    PRCommandAuthorizeAccount.authorizeAccount(withName: token) { account in
      if account != nil {
        promise.resolve(nil)
      } else {
        promise.reject("AUTHORIZATION_FAILED", "Authorization failed")
      }
    }
  }

  private func getRootViewController() -> Any? {
    return pressReaderInstance?.rootViewController
  }

  private func handleOpenArticle(articleId: String, promise: ExpoModulesCore.Promise) {
    guard let instance = pressReaderInstance else {
      promise.reject("INSTANCE_NOT_AVAILABLE", "PressReader instance not available")
      return
    }

    let success = instance.openArticle(withId: articleId, parameters: nil)
    if success {
      promise.resolve(nil)
    } else {
      promise.reject("ARTICLE_OPEN_FAILED", "Failed to open article")
    }
  }

  private func handleGetLogs(promise: ExpoModulesCore.Promise) {
    guard let instance = pressReaderInstance else {
      promise.reject("INSTANCE_NOT_AVAILABLE", "PressReader instance not available")
      return
    }

    instance.getLogs { result in
      switch result {
      case .success(let (linkToUploadedLogs, additionalInfo)):
        promise.resolve([
          "linkToUploadedLogs": linkToUploadedLogs.absoluteString,
          "additionalInfo": additionalInfo
        ])
      case .failure(let error):
        promise.reject("GET_LOG_FAILED", "Failed to get logs: \(error.localizedDescription)")
      }
    }
  }

  private func getDownloadedItems() -> [[String: Any]] {
    guard let instance = pressReaderInstance else {
      return []
    }

    let downloadedItems = instance.catalog.downloaded.items
    return downloadedItems.map { item in
      return [
        "cid": item.cid,
        "date": item.date.map { dateFormatter.string(from: $0) } ?? "",
        "title": item.title ?? "",
        "size": item.size
      ]
    }
  }

  private func getCatalogItem(cid: String, dateString: String) -> [String: Any]? {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return nil
    }

    return [
      "cid": item.cid,
      "date": item.date.map { dateFormatter.string(from: $0) } ?? "",
      "title": item.title ?? "",
      "size": item.size
    ]
  }

  private func getDownloadState(cid: String, dateString: String) -> String {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return "not_downloaded"
    }

    // Assuming the item has a 'download' property that matches the documentation
    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        if let downloadState = download.value(forKey: "state") as? Int {
            switch downloadState {
            case 0: // stop
                return "not_downloaded"
            case 1: // progress
                return "downloading"
            case 2: // pause
                return "paused"
            case 3: // ready
                return "downloaded"
            default:
                return "unknown"
            }
        }
    }

    return "unknown"
  }

  private func getDownloadProgress(cid: String, dateString: String) -> Double {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return 0.0
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        if let progress = download.value(forKey: "progress") as? Int {
            return Double(progress) / 100.0
        }
    }

    return 0.0
  }

  private func getDownloadError(cid: String, dateString: String) -> String? {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return nil
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        if let error = download.value(forKey: "error") as? Error {
            return error.localizedDescription
        }
    }

    return nil
  }

  private func startDownload(cid: String, dateString: String) {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        download.perform(NSSelectorFromString("start"))
    }
  }

  private func pauseDownload(cid: String, dateString: String) {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        download.perform(NSSelectorFromString("pause"))
    }
  }

  private func resumeDownload(cid: String, dateString: String) {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        download.perform(NSSelectorFromString("start"))
    }
  }

  private func cancelDownload(cid: String, dateString: String) {
    guard let instance = pressReaderInstance,
          let date = dateFormatter.date(from: dateString),
          let item = instance.catalog.item(cid: cid, date: date) else {
      return
    }

    if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
        download.perform(NSSelectorFromString("cancel"))
    }
  }

  private func deleteDownloadedItem(cid: String, dateString: String) {
    guard let instance = pressReaderInstance,
        let date = dateFormatter.date(from: dateString),
        let item = instance.catalog.item(cid: cid, date: date) as? PRTitleItemExemplar else {
      return
    }

    item.cancelDownload()
  }

  private func deleteAllDownloadedItems() {
    guard let instance = pressReaderInstance else {
        return
    }

    let downloadedItems = instance.catalog.downloaded.items
    for item in downloadedItems {
        if let exemplar = item as? PRTitleItemExemplar {
            exemplar.cancelDownload()
        }
    }
  }

    private func dismiss() {
    PressReader.fullReset()
    pressReaderInstance = nil
  }
}
