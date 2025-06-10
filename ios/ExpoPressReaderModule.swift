import ExpoModulesCore
import Foundation
import PRAnalytics
import PRAPI
import PRUI
import UIKit

public class ExpoPressReaderModule: Module {
    private lazy var pressReaderInstance: PressReader = {
        PressReader.fullReset()

        let trackerAdapter = AnalyticsTrackerAdapter(tracker: self)
        PressReader.launchOptions = [UIApplication.LaunchOptionsKey.prAnalyticsTrackers: [trackerAdapter]]

        return PressReader.instance()
    }()

    private var downloadedObserver: Downloaded.Observer?
    private let dateFormatter: Foundation.ISO8601DateFormatter = {
        let formatter = Foundation.ISO8601DateFormatter()
        return formatter
    }()

    public func definition() -> ModuleDefinition {
        Name("ExpoPressReader")

        OnCreate {
            // Trigger lazy initialization at module creation
            _ = self.pressReaderInstance
            registerObservers()
        }

        OnDestroy {
            unregisterObservers()
        }

        Events("onAnalyticsEvent", "onStateChange", "onAuthStateChange", "onDownloadsUpdate")

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

        Function("open") {
            handleOpen()
        }
    }

    private func getState() -> String {
        let state = pressReaderInstance.state
        if state.contains(.running) && state.contains(.activated) && state.contains(.catalogLoaded) {
            return "ready"
        } else if state.contains(.running) && state.contains(.activated) {
            return "activated"
        } else if state.contains(.running) {
            return "running"
        }
        return "stopped"
    }

    private func handleAuthorize(token: String, promise: ExpoModulesCore.Promise) {
        let account = pressReaderInstance.account
        account.authorize(token: token) { success, error in
            if success {
                promise.resolve(nil)
            } else {
                let errorMessage = error?.localizedDescription ?? "Authorization failed"
                promise.reject("AUTHORIZATION_FAILED", errorMessage)
            }
        }
    }

    private func getRootViewController() -> Any? {
        return pressReaderInstance.rootViewController
    }

    private func handleOpenArticle(articleId: String, promise: ExpoModulesCore.Promise) {
        let success = pressReaderInstance.openArticle(withId: articleId, parameters: nil)
        if success {
            promise.resolve(nil)
        } else {
            promise.reject("ARTICLE_OPEN_FAILED", "Failed to open article")
        }
    }

    private func handleGetLogs(promise: ExpoModulesCore.Promise) {
        pressReaderInstance.getLogs { result in
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
        let downloadedItems = pressReaderInstance.catalog.downloaded.items
        return downloadedItems.map { item in
            [
                "cid": item.cid,
                "date": item.date.map { dateFormatter.string(from: $0) } ?? "",
                "title": item.title ?? "",
                "size": item.size
            ]
        }
    }

    private func getCatalogItem(cid: String, dateString: String) -> [String: Any]? {
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
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
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return "not_downloaded"
        }

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
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
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
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
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
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return
        }

        if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
            download.perform(NSSelectorFromString("start"))
        }
    }

    private func pauseDownload(cid: String, dateString: String) {
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return
        }

        if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
            download.perform(NSSelectorFromString("pause"))
        }
    }

    private func resumeDownload(cid: String, dateString: String) {
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return
        }

        if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
            download.perform(NSSelectorFromString("start"))
        }
    }

    private func cancelDownload(cid: String, dateString: String) {
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return
        }

        if let download = item.perform(NSSelectorFromString("download"))?.takeUnretainedValue() as? NSObject {
            download.perform(NSSelectorFromString("cancel"))
        }
    }

    private func deleteDownloadedItem(cid: String, dateString: String) {
        guard let date = dateFormatter.date(from: dateString),
              let item = pressReaderInstance.catalog.item(cid: cid, date: date)
        else {
            return
        }

        pressReaderInstance.catalog.downloaded.delete(item)
    }

    private func deleteAllDownloadedItems() {
        let downloadedItems = pressReaderInstance.catalog.downloaded.items
        for item in downloadedItems {
            pressReaderInstance.catalog.downloaded.delete(item)
        }
    }

    private func dismiss() {
        let rvc = pressReaderInstance.rootViewController
        DispatchQueue.main.async {
            if rvc.presentingViewController != nil {
                rvc.dismiss(animated: true, completion: nil)
            }
        }
    }

    private func getPresentingController() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene,
              let window = scene.windows.first(where: { $0.isKeyWindow })
        else {
            return nil
        }
        return window.rootViewController
    }

    private func handleOpen() {
        let rvc = pressReaderInstance.rootViewController

        DispatchQueue.main.async {
            guard let presentingController = self.getPresentingController() else {
                return
            }

            presentingController.present(rvc, animated: true, completion: nil)
        }
    }

    // MARK: - Observers

    private func registerObservers() {
        let nCentre = NotificationCenter.default

        nCentre.addObserver(self,
                            selector: #selector(pressreaderStateHandler),
                            name: .PressReaderStateDidChange,
                            object: pressReaderInstance)

        let account = pressReaderInstance.account
        nCentre.addObserver(self,
                                selector: #selector(authStateHandler),
                                name: .PRAuthStateDidChange,
                                object: account)

        downloadedObserver = pressReaderInstance.catalog.downloaded.observe { [weak self] in
            guard let self = self else { return }
            self.sendEvent("onDownloadsUpdate", ["items": self.getDownloadedItems()])
        }
    }

    private func unregisterObservers() {
        NotificationCenter.default.removeObserver(self)
        downloadedObserver = nil
    }

    @objc
    private func pressreaderStateHandler(note: NSNotification) {
        var body: [String: Any] = ["state": getState()]
        if let error = note.userInfo?["error"] as? Error {
            body["error"] = error.localizedDescription
        }
        sendEvent("onStateChange", body)
    }

    @objc
    private func authStateHandler(note: NSNotification) {
        let account = pressReaderInstance.account

        let authState: String
        switch account.state {
        case .idle: authState = "idle"
        case .authorising: authState = "authorising"
        case .sponsorship: authState = "sponsorship"
        case .localService: authState = "localService"
        case .notReachable: authState = "notReachable"
        @unknown default:
            authState = "unknown"
        }

        var body: [String: Any] = ["state": authState]
        if let error = note.userInfo?["error"] as? Error {
            body["error"] = error.localizedDescription
        }

        sendEvent("onAuthStateChange", body)
    }
}

// MARK: - ReadingViewAnalyticsTracker

extension ExpoPressReaderModule: ReadingViewAnalyticsTracker {
    public func trackOpenIssueForReading(issue: TrackingIssue) {
        sendEvent("onAnalyticsEvent", [
            "name": "openIssueForReading",
            "issue": [
                "sourceType": issue.sourceType.rawValue,
                "title": issue.title,
                "date": issue.date.map { dateFormatter.string(from: $0) } ?? ""
            ]
        ])
    }

    public func trackIssuePage(issue: TrackingIssue, pageNumber: Int) {
        sendEvent("onAnalyticsEvent", [
            "name": "issuePage",
            "issue": [
                "sourceType": issue.sourceType.rawValue,
                "title": issue.title,
                "date": issue.date.map { dateFormatter.string(from: $0) } ?? ""
            ],
            "pageNumber": pageNumber
        ])
    }

    public func trackArticleView(issue: TrackingIssue, article: TrackingArticle) {
        sendEvent("onAnalyticsEvent", [
            "name": "articleView",
            "issue": [
                "sourceType": issue.sourceType.rawValue,
                "title": issue.title,
                "date": issue.date.map { dateFormatter.string(from: $0) } ?? ""
            ],
            "article": [
                "id": article.id,
                "headline": article.headline
            ]
        ])
    }
}
