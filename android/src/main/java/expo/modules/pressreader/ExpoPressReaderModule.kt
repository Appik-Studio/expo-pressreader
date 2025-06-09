package expo.modules.pressreader

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.newspaperdirect.sdkfull.PressReader
import com.newspaperdirect.sdkfull.catalog.Download
import com.newspaperdirect.sdkfull.catalog.Item
import com.newspaperdirect.sdk.analytics.AnalyticsTracker
import com.newspaperdirect.sdk.analytics.ReadingViewAnalyticsTracker
import com.newspaperdirect.sdk.analytics.TrackingArticle
import com.newspaperdirect.sdk.analytics.TrackingIssue
import java.text.SimpleDateFormat
import java.util.Date
import java.util.TimeZone

class ExpoPressReaderModule : Module() {
  private val isoFormatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").apply {
    timeZone = TimeZone.getTimeZone("UTC")
  }

  private fun getItem(cid: String, date: Date): Item? {
    return PressReader.instance.catalog.getItem(cid, date)
  }

  private fun getItemDownload(cid: String, dateString: String): Download? {
    val date = isoFormatter.parse(dateString) ?: return null
    return getItem(cid, date)?.download
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoPressReader")

    Events("onAnalyticsEvent")

    Function("setLaunchOptions") { options: Map<String, Any> ->
      handleSetLaunchOptions(options)
    }

    Function("getState") {
      getState()
    }

    AsyncFunction("authorize") { token: String, promise: Promise ->
      handleAuthorize(token, promise)
    }

    Function("getRootViewController") {
      getRootViewController()
    }

    AsyncFunction("openArticle") { articleId: String, promise: Promise ->
      handleOpenArticle(articleId, promise)
    }

    AsyncFunction("getLogs") { promise: Promise ->
      handleGetLogs(promise)
    }

    Function("getDownloadedItems") {
      getDownloadedItems()
    }

    Function("getCatalogItem") { cid: String, dateString: String ->
      getCatalogItem(cid, dateString)
    }

    Function("getDownloadState") { cid: String, dateString: String ->
      getDownloadState(cid, dateString)
    }

    Function("getDownloadProgress") { cid: String, dateString: String ->
      getDownloadProgress(cid, dateString)
    }

    Function("getDownloadError") { cid: String, dateString: String ->
      getDownloadError(cid, dateString)
    }

    Function("startDownload") { cid: String, dateString: String ->
      startDownload(cid, dateString)
    }

    Function("pauseDownload") { cid: String, dateString: String ->
      pauseDownload(cid, dateString)
    }

    Function("resumeDownload") { cid: String, dateString: String ->
      resumeDownload(cid, dateString)
    }

    Function("cancelDownload") { cid: String, dateString: String ->
      cancelDownload(cid, dateString)
    }

    Function("deleteDownloadedItem") { cid: String, dateString: String ->
      deleteDownloadedItem(cid, dateString)
    }

    Function("deleteAllDownloadedItems") {
      deleteAllDownloadedItems()
    }

    Function("dismiss") {
      dismiss()
    }
  }

  private fun handleSetLaunchOptions(options: Map<String, Any>) {
    val context = appContext.reactContext?.applicationContext ?: return

    // Ensure PressReader initialization happens on the main thread
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      val trackerList: MutableList<AnalyticsTracker> = ArrayList()
      // trackerList.add(CustomAnalyticsTracker(this)) // Commented out for now due to type mismatch
      PressReader.init(context as android.app.Application, PressReader.Params(trackerList))
    }
  }

  private fun getState(): String {
    return try {
      val instance = PressReader.instance
      if (instance.isCatalogLoaded) {
        "ready"
      } else if (instance.isActivated) {
        "activated"
      } else {
        "running"
      }
    } catch (e: IllegalStateException) {
      "stopped"
    }
  }

  private fun handleAuthorize(token: String, promise: Promise) {
    // Ensure authorization happens on the main thread
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      PressReader.instance.account.authorize(token, object : PressReader.Callback {
        override fun onComplete(success: Boolean, error: Throwable?) {
          if (success) {
            promise.resolve(null)
          } else {
            promise.reject("AUTHORIZATION_FAILED", error?.message ?: "Authorization failed", error)
          }
        }
      })
    }
  }

  private fun getRootViewController(): Any? {
    return null
  }

  private fun handleOpenArticle(articleId: String, promise: Promise) {
    android.os.Handler(android.os.Looper.getMainLooper()).post {
      try {
        // Try to find the item by articleId in downloaded items first
        val downloadedItems = PressReader.instance.catalog.downloaded.items
        val item = downloadedItems.find { it.cid == articleId }
        
        if (item != null) {
          // Use the Item.open() method which returns boolean
          val success = item.open()
          if (success) {
            promise.resolve(null)
          } else {
            promise.reject("ARTICLE_OPEN_FAILED", "Failed to open article with ID: $articleId", null)
          }
        } else {
          // Fallback to execute method for non-downloaded items
          val params = mapOf("articleId" to articleId)
          PressReader.instance.execute("openArticle", params, object : PressReader.ExecuteCallback {
            override fun completed(error: Throwable?) {
              if (error == null) {
                promise.resolve(null)
              } else {
                promise.reject("ARTICLE_OPEN_FAILED", "Failed to open article with ID: $articleId - ${error.message}", error)
              }
            }
          })
        }
      } catch (e: Exception) {
        promise.reject("ARTICLE_OPEN_ERROR", "Error opening article: ${e.message}", e)
      }
    }
  }

  private fun handleGetLogs(promise: Promise) {
    PressReader.instance.getLogs(object : PressReader.LogsCallback {
      override fun onComplete(linkToUploadedLogs: String?, additionalInfo: String?, error: Throwable?) {
        if (error == null) {
          promise.resolve(mapOf(
            "linkToUploadedLogs" to (linkToUploadedLogs ?: ""),
            "additionalInfo" to (additionalInfo ?: "")
          ))
        } else {
          promise.reject("GET_LOG_FAILED", error.message ?: "Failed to get logs", error)
        }
      }
    })
  }

  private fun getDownloadedItems(): List<Map<String, Any?>> {
    val items = PressReader.instance.catalog.downloaded.items
    return items.map { item ->
      mapOf(
        "cid" to item.cid,
        "date" to isoFormatter.format(item.date),
        "title" to item.title,
        "size" to 0 // Placeholder for consistency with iOS
      )
    }
  }

  private fun getCatalogItem(cid: String, dateString: String): Map<String, Any?>? {
    val date = isoFormatter.parse(dateString) ?: return null
    val item = getItem(cid, date)
    return item?.let {
      mapOf(
        "cid" to it.cid,
        "date" to isoFormatter.format(it.date),
        "title" to it.title,
        "size" to 0, // Placeholder for consistency with iOS
        "downloadState" to when (it.download.state) {
          Download.DownloadState.Stop -> "not_downloaded"
          Download.DownloadState.Progress -> "downloading"
          Download.DownloadState.Pause -> "paused"
          Download.DownloadState.Ready -> "downloaded"
        },
        "downloadProgress" to (it.download.progress / 100.0),
        "downloadError" to it.download.error?.localizedMessage
      )
    }
  }

  private fun getDownloadState(cid: String, dateString: String): String {
    return when (getItemDownload(cid, dateString)?.state) {
      Download.DownloadState.Stop -> "not_downloaded"
      Download.DownloadState.Progress -> "downloading"
      Download.DownloadState.Pause -> "paused"
      Download.DownloadState.Ready -> "downloaded"
      else -> "not_downloaded"
    }
  }

  private fun getDownloadProgress(cid: String, dateString: String): Double {
    val progress = getItemDownload(cid, dateString)?.progress ?: 0
    return progress / 100.0
  }

  private fun getDownloadError(cid: String, dateString: String): String? {
    return getItemDownload(cid, dateString)?.error?.localizedMessage
  }

  private fun startDownload(cid: String, dateString: String) {
    getItemDownload(cid, dateString)?.start()
  }

  private fun pauseDownload(cid: String, dateString: String) {
    getItemDownload(cid, dateString)?.pause()
  }

  private fun resumeDownload(cid: String, dateString: String) {
    getItemDownload(cid, dateString)?.start()
  }

  private fun cancelDownload(cid: String, dateString: String) {
    getItemDownload(cid, dateString)?.cancel()
  }

  private fun deleteDownloadedItem(cid: String, dateString: String) {
    val date = isoFormatter.parse(dateString) ?: return
    val downloaded = PressReader.instance.catalog.downloaded
    val itemToDelete = downloaded.items.find { it.cid == cid && it.date == date }
    if (itemToDelete != null) {
      downloaded.delete(itemToDelete)
    }
  }

  private fun deleteAllDownloadedItems() {
    PressReader.instance.catalog.downloaded.deleteAll()
  }

  private fun dismiss() {
    try {
      // On Android, the PressReader SDK manages its own activities and fragments
      // We can try to finish the current activity if it's a PressReader activity
      val context = appContext.reactContext
      if (context is android.app.Activity) {
        context.finish()
      }
    } catch (e: Exception) {
      // Silently ignore errors in dismiss as it's not critical
    }
  }
}
