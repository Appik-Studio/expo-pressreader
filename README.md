# 📦 expo-pressreader

Expo plugin for PressReader SDK - provides access to newspapers and magazines in React Native and Expo apps.

## Features

- 📱 Cross-platform support (iOS & Android)
- 📰 Access to 7,000+ newspapers and magazines worldwide  
- 🔐 User authentication and authorization
- ⬇️ Download and manage publications
- 📖 Reading interface with text-to-speech
- 🌐 Multi-language translation support
- 📊 Analytics tracking
- 🎯 Service-based authorization

## Installation

```bash
bun add expo-pressreader
```

## Configuration

Add the plugin to your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "@appik-studio/expo-pressreader",
        {
          "serviceName": "your-service-name",
          "isDebugMode": true,
          "colorBrand": "#000000",
          "colorBrandDark": "#111111",
          "colorBackground": "#FFFFFF",
          "colorBackgroundDark": "#222222",
          "brandGradientStartColor": "#333333",
          "brandGradientEndColor": "#444444",
          "onboardingEnabled": false,
          "sdkExitButtonText": "EXIT",
          "supportEmailAddress": "your-support-email",
          "newsfeedApi": 0,
          "articleCommentsEnabled": true,
          "articleVotesEnabled": true,
          "isPopupArticleViewAllowed": true,
          "readerExternalLinksEnabled": true,
          "localServerUrl": "http://your.local.server",
          "showCustomerSupport": true,
          "supportPhoneNumber": "+1-604-555-1234",
          "termsOfUseUrl": "https://your.terms.of.use",
          "privacyPolicyUrl": "https://your.privacy.policy",
          "registrationUrl": "https://your.registration.url",
          "translateEnabled": true,
          "showRegistration": true,
          "facebookUrl": "https://your.facebook.url",
          "instagramUrl": "https://your.instagram.url",
          "twitterUrl": "https://your.twitter.url",
          "youtubeUrl": "https://your.youtube.url",
          "ios": {
            "deviceAccountOnly": true,
            "mode": 1,
            "sdkAuthorizationType": 0,
            "configRunTimeUpdateAllowed": true,
            "configVersion": "1.0",
            "catalogMode": 2,
            "filterPanelEnabled": true,
            "homeFeedChannel": "your_channel_id",
            "homeFeedCollection": "your_collection_id",
            "articleAutorizationRequiredToPrint": false,
            "articleAutorizationRequiredToListen": false,
            "channelFeedArticleAccessMode": 1,
            "feedArticleActions": 15,
            "issueFeedArticleActions": 15,
            "aboutSocialUrls": [
              { "Facebook": "https://facebook.com/mypage" },
              { "Twitter": "https://twitter.com/mypage" }
            ],
            "supportEmails": ["support@example.com"],
            "supportEmailSubject": "Feedback from {deviceType}",
            "appMenuItemsAbsence": 1024,
            "sdkExitButtonHidden": false,
            "autoTranslateAvailability": 3,
            "autoTranslatePairsLimit": 5,
            "externalAuthEnabled": true
          },
          "android": {
            "articleHashsymbolInHashtagEnable": false,
            "articleOnlineShowByline": true,
            "articleShowBookmarkSection": false,
            "articleShowLongTapMenuForEmptyArticle": false,
            "articleToolbarCopyEnable": false,
            "articleToolbarListenButtonEnable": false,
            "articleToolbarPageviewButtonEnable": false,
            "bookmarksDialogEnabled": false,
            "bookmarksEnabled": true,
            "bookmarksPagesetsEnabled": false,
            "defaultAppPanel": 2,
            "enableGoogleAnalyticsWebId": "",
            "enablePianoSignin": false,
            "enablePrintSubscriptions": true,
            "enableSocialSignin": false,
            "facebookAppId": "",
            "facebookAppSecret": "",
            "favouritesEnabled": false,
            "forceTtsLangugage": "",
            "gigyaAppId": "",
            "gigyaEnabled": false,
            "hideSharing": true,
            "homeCollectionId": "",
            "homeCollectionName": "Online stories",
            "isFreeApp": true,
            "janrainAppId": "",
            "janrainEnabled": false,
            "janrainTokenUrl": "",
            "mandatoryAuthentication": false,
            "newspaperDetailsLabel": "",
            "newspaperNavigationPanelEnabled": true,
            "passwordRecoveryUrl": "",
            "privSortCids": "",
            "publisherChannelId": "",
            "publisherPushTopicId": "",
            "purchaseAdviceExpirationPeriod": 0,
            "radioSupport": false,
            "sampleIssuesCids": "",
            "settingsAutocleanupDefault": 0,
            "settingsBackgroundUpdatesEnable": true,
            "settingsDataStoragePathEnable": true,
            "settingsFullscreenHighlightsEnable": true,
            "settingsInfoEnable": true,
            "settingsPostponeSleepEnable": true,
            "settingsSingleTapZoomDefault": false,
            "settingsSmartZoomEnable": true,
            "settingsTipsEnable": true,
            "showFavorites": true,
            "showFreeIcon": true,
            "showLoginInSplash": true,
            "showRelatedArticles": true,
            "singleTitleMode": false,
            "smartEditionName": "",
            "smartFlowDefault": false,
            "smartFlowEnabled": false,
            "twitterAppId": "",
            "twitterAppSecret": "",
            "webRegistration": false,
            "webUpdateAccountUrl": "",
            "webUpdateSubscriptionUrl": "",
            "sdkExitButton": true,
            "sdkHomefeedButton": true,
            "sdkCatalogButton": true,
            "sdkMylibraryButton": true,
            "sdkAccountsButton": true,
            "sdkSettingsButton": true,
            "sdkBookmarksButton": true,
            "fairUsageUrl": "https://your.fair.usage.policy",
            "newPaymentFlowSupported": false,
            "hyphenationDisabled": false,
            "themeSwitchingEnabled": false
          }
        }
      ]
    ]
  }
}
```

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `serviceName` | string | ✅ | - | Your PressReader service name |
| `isDebugMode` | boolean | ❌ | `false` | Enable debug mode |
| `iosDeploymentTarget` | string | ❌ | `"16.0"` | iOS deployment target |
| `androidMinSdkVersion` | number | ❌ | `21` | Android minimum SDK version |

## Usage

### Basic Setup

```typescript
import ExpoPressReader, { PRState } from 'expo-pressreader'

// Get PressReader instance
const pressReader = ExpoPressReader.instance
```

### Authentication

```typescript
// Authorize with token
await pressReader.account.authorize('your-auth-token')

// Check if activated
if (pressReader.state & PRState.Activated) {
  console.log('PressReader is activated')
}
```

### Downloading Publications

```typescript
import { DownloadState } from 'expo-pressreader'

// Get a catalog item by CID and date
const item = pressReader.catalog.item('publication-cid', new Date())

if (item) {
  // Start download
  item.download.start()
  
  // Monitor download progress
  const progressInterval = setInterval(() => {
    const progress = item.download.progress
    const state = item.download.state
    
    console.log(`Progress: ${progress}%, State: ${state}`)
    
    // Check if download completed
    if (state === DownloadState.Ready) {
      console.log('Download completed!')
      clearInterval(progressInterval)
    }
    
    // Check for download errors
    if (state === DownloadState.Stop && item.download.error) {
      console.error('Download failed:', item.download.error.message)
      clearInterval(progressInterval)
    }
  }, 1000)
  
  // Download controls
  // item.download.pause()    // Pause download
  // item.download.start()    // Resume download
  // item.download.cancel()   // Cancel download completely
}
```

### Managing Downloaded Content

```typescript
// Get all downloaded items
const downloadedItems = pressReader.catalog.downloaded.items

// Delete specific item
pressReader.catalog.downloaded.delete(item)

// Delete all downloaded items
pressReader.catalog.downloaded.deleteAll()
```

### Opening the Reader

```typescript
// Open the main reader interface
pressReader.open()
```

### Opening Articles

```typescript
// Open article by ID
await pressReader.openArticle('article-id')

// For iOS: Present reading interface
if (Platform.OS === 'ios' && pressReader.rootViewController) {
  // Present the root view controller
  // Implementation depends on your navigation setup
}
```

### Analytics Tracking

```typescript
import { AnalyticsTracker } from 'expo-pressreader'

const customTracker: AnalyticsTracker = {
  trackOpenIssueForReading: (issue) => {
    console.log('Issue opened:', issue.title)
  },
  trackIssuePage: (issue, pageNumber) => {
    console.log(`Page ${pageNumber} viewed in ${issue.title}`)
  },
  trackArticleView: (issue, article) => {
    console.log('Article viewed:', article.headline)
  }
}

ExpoPressReader.launchOptions = {
  prAnalyticsTrackers: [customTracker]
}
```

### Error Handling

```typescript
// Authorization errors
try {
  await pressReader.account.authorize('your-token')
} catch (error) {
  console.error('Authorization failed:', error)
}

// Download errors
const item = pressReader.catalog.item('publication-cid', new Date())
if (item) {
  item.download.start()
  
  // Check for download errors during progress monitoring
  if (item.download.error) {
    console.error('Download error:', item.download.error.message)
    // Handle error (retry, show user message, etc.)
  }
}

// Catalog item not found
if (!item) {
  console.error('Publication not found in catalog')
}
```

### Logs Collection

```typescript
// Collect and upload logs
const logs = await pressReader.getLogs()
console.log('Logs uploaded to:', logs.linkToUploadedLogs)
console.log('Additional info:', logs.additionalInfo)
```

## API Reference

### ExpoPressReader

Main singleton class for PressReader SDK operations.

- `ExpoPressReader.instance: ExpoPressReader` - Get singleton instance
All the functions are called on the instance.

#### Properties

- `account: Account` - Account management
- `catalog: Catalog` - Publication catalog
- `state: PRState` - Current SDK state
- `rootViewController?: any` - iOS root view controller

#### Methods

- `dismiss(): void` - Cleanup and dismiss SDK
- `open(): void` - Opens the PressReader interface
- `openArticle(id: string): Promise<void>` - Open article by ID
- `getLogs(): Promise<{linkToUploadedLogs: string, additionalInfo: string}>` - Collect logs

### Account

User account and authentication management.

#### Methods

- `authorize(token: string): Promise<void>` - Authorize with token

### Catalog

Publication catalog and download management.

#### Properties

- `downloaded: Downloaded` - Downloaded publications manager

#### Methods

- `item(cid: string, date: Date): Item | null` - Get catalog item

### Download

Publication download management.

#### Properties

- `state: DownloadState` - Current download state
- `progress: number` - Download progress (0-100)
- `error?: Error` - Download error if any

#### Methods

- `start(): void` - Start download
- `pause(): void` - Pause download  
- `cancel(): void` - Cancel download

### Types

```typescript
enum PRState {
  Running = 1,
  Activated = 2,
  CatalogLoaded = 4
}

enum DownloadState {
  Stop = 'stop',
  Progress = 'progress', 
  Pause = 'pause',
  Ready = 'ready'
}
```

## Platform Requirements

### iOS
- iOS 16.0+
- Xcode 14+
- Swift 5.7+

### Android
- Android API 21+
- Kotlin support
- AndroidX

## Troubleshooting

### iOS Issues

1. **Framework not found**: Ensure you have run `cd ios && pod install`
2. **Build errors**: Check that iOS deployment target is set to 16.0+
3. **XCFramework issues**: Verify all PressReader frameworks are properly linked

### Android Issues

1. **Module not found**: Ensure the Android SDK dependency is properly configured
2. **Build errors**: Check minimum SDK version is 21+
3. **Permissions**: Verify required permissions are added to AndroidManifest.xml

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev

# Lint
bun run lint

# Test
bun run test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- [GitHub Issues](https://github.com/Appik-Studio/expo-pressreader/issues)
- [PressReader Support](https://www.pressreader.com/help)

## Related

- [PressReader iOS SDK](https://github.com/pressreader/pr-ios-sdk)
- [PressReader Website](https://www.pressreader.com)
- [Expo Documentation](https://docs.expo.dev) 
