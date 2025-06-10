import ExpoModulesCore
import Foundation
import PRAnalytics
import PRUI
import PRAPI

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