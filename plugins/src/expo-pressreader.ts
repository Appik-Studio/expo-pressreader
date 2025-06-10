/**
 * Expo PressReader Plugin
 *
 * This plugin automatically configures your Expo project for PressReader SDK integration.
 *
 * PRConfig Dictionary Structure:
 * All PressReader configuration is placed under PRConfig dictionary in Info.plist with
 * SCREAMING_SNAKE_CASE keys following the official PressReader SDK documentation.
 * Key parameters with dots (e.g., "ARTICLE.POPUP_VIEW_ALLOWED") are preserved as-is.
 * Social media URLs are grouped under ABOUT_SOCIAL_URLS array as per documentation.
 *
 * Automatic iOS Configurations Applied:
 * ✅ Dynamic frameworks configuration (ios.useFrameworks = "dynamic")
 * ✅ SDWebImage and CocoaLumberjack pod dependencies
 * ✅ Swift version 5.10 for all targets
 * ✅ RNReanimated static linking compatibility in dynamic framework environment
 * ✅ react-native-reanimated/plugin added to babel.config.js
 *
 * These configurations resolve known compatibility issues between:
 * - PressReader SDK (requires dynamic frameworks)
 * - React Native Reanimated (has issues with dynamic frameworks)
 * - CocoaLumberjack framework loading at runtime
 *
 * @param config Expo config
 * @param props Plugin configuration
 */

import {
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withInfoPlist,
  withPodfileProperties,
  withProjectBuildGradle
} from '@expo/config-plugins'
import fs from 'fs'
import path from 'path'
import { commonConfigKeys } from './constants'
import type { ExpoPressReaderPluginProps, PressReaderCommonConfig } from './types'

const toSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)

const toScreamingSnakeCase = (str: string) =>
  str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()

const hexToNumber = (hex: string): number => {
  return parseInt(hex.replace('#', '0x'))
}

const withExpoPressReader: ConfigPlugin<ExpoPressReaderPluginProps> = (config, props) => {
  if (!props?.serviceName) {
    throw new Error('ExpoPressReader: serviceName is required in the plugin configuration.')
  }

  // Configure iOS to use dynamic frameworks (required for PressReader SDK)
  config = withPodfileProperties(config, (config) => {
    config.modResults['ios.useFrameworks'] = 'dynamic'
    return config
  })

  // Configure Podfile for PressReader SDK compatibility
  config = withDangerousMod(config, [
    'ios',
    async config => {
      const filePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(filePath, 'utf-8');

      // Add required dependencies for PressReader SDK
      const requiredPods = `
  # Required dependencies for PressReader SDK
  pod 'SDWebImage'
  pod 'CocoaLumberjack'
`
      if (!contents.includes("pod 'SDWebImage'")) {
        contents = contents.replace(
          /use_expo_modules!/,
          `use_expo_modules!${requiredPods}`
        )
      }

      // Add post_install configuration
      const postInstallAddition = `
    # PressReader SDK compatibility configuration
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['SWIFT_VERSION'] = '5.10'
      end
      
      # Special configuration for RNReanimated to work with dynamic frameworks
      if target.name == 'RNReanimated'
        target.build_configurations.each do |config|
          config.build_settings['MACH_O_TYPE'] = 'staticlib'
          config.build_settings['PRODUCT_NAME'] = 'RNReanimated'
          config.build_settings['SKIP_INSTALL'] = 'YES'
          config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'NO'
        end
      end
    end`

      if (contents.includes('post_install do |installer|')) {
        contents = contents.replace(
          /(config\.build_settings\['CODE_SIGNING_ALLOWED'\] = 'NO'[\s\S]*?end\s*\n\s*end\s*\n)(  end\s*\n)/,
          `$1${postInstallAddition}\n$2`
        )
      }
      
      fs.writeFileSync(filePath, contents);
      return config;
    }
  ]);

  // Configure babel.config.js to add react-native-reanimated plugin
  config = withDangerousMod(config, [
    'ios',
    async config => {
      const projectRoot = config.modRequest.projectRoot
      const babelConfigPath = path.join(projectRoot, 'babel.config.js')

      if (fs.existsSync(babelConfigPath)) {
        let babelContent = fs.readFileSync(babelConfigPath, 'utf8')

        // Check if reanimated plugin is already present
        if (!babelContent.includes('react-native-reanimated/plugin')) {
          // Add the plugin to the plugins array or create one
          if (babelContent.includes('plugins:')) {
            // Add to existing plugins array
            babelContent = babelContent.replace(
              /plugins:\s*\[(.*?)\]/s,
              (match, pluginsContent) => {
                const trimmedContent = pluginsContent.trim()
                const separator = trimmedContent ? ', ' : ''
                return `plugins: [${trimmedContent}${separator}"react-native-reanimated/plugin"]`
              }
            )
          } else {
            // Add plugins array
            babelContent = babelContent.replace(
              /presets:\s*\[(.*?)\]/s,
              (match) => `${match},
    plugins: ["react-native-reanimated/plugin"]`
            )
          }

          fs.writeFileSync(babelConfigPath, babelContent)
        }
      }

      return config
    },
  ])

  // Configure iOS Info.plist for PressReader settings
  config = withInfoPlist(config, (config) => {
    const infoPlist = config.modResults

    // Initialize PRConfig dictionary
    const prConfig: Record<string, any> = {}

    // Set service name
    prConfig.SERVICE_NAME = props.serviceName

    // Handle debug mode if specified
    if (props.isDebugMode !== undefined) {
      // Add debug mode configuration if needed by specific implementations
      prConfig.DEVICE_ACCOUNT_ONLY = true
      prConfig.SHOW_SIGNUP = false
      prConfig.MODE = 1
    }

    // Apply common iOS properties with proper conversion and exact documentation keys
    if (props.colorBrand !== undefined) prConfig.COLOR_BRAND = hexToNumber(props.colorBrand);
    if (props.colorBrandDark !== undefined) prConfig.COLOR_BRAND_DARK = hexToNumber(props.colorBrandDark);
    if (props.colorBackground !== undefined) prConfig.COLOR_BACKGROUND = hexToNumber(props.colorBackground);
    if (props.colorBackgroundDark !== undefined) prConfig.COLOR_BACKGROUND_DARK = hexToNumber(props.colorBackgroundDark);
    if (props.brandGradientStartColor !== undefined) prConfig.BRAND_GRADIENT_START_COLOR = hexToNumber(props.brandGradientStartColor);
    if (props.brandGradientEndColor !== undefined) prConfig.BRAND_GRADIENT_END_COLOR = hexToNumber(props.brandGradientEndColor);
    if (props.onboardingEnabled !== undefined) prConfig.ONBOARDING_SUPPORTED = props.onboardingEnabled;
    if (props.sdkExitButtonText !== undefined) prConfig.SDK_EXIT_BUTTON_TITLE = props.sdkExitButtonText;
    if (props.supportEmailAddress !== undefined) prConfig.SUPPORT_EMAIL_ADDRESS = props.supportEmailAddress;
    if (props.newsfeedApi !== undefined) prConfig.NEWSFEED_API = props.newsfeedApi;
    if (props.articleCommentsEnabled !== undefined) prConfig.ARTICLE_COMMENTS_ENABLED = props.articleCommentsEnabled;
    if (props.articleVotesEnabled !== undefined) prConfig.ARTICLE_VOTES_ENABLED = props.articleVotesEnabled;
    if (props.isPopupArticleViewAllowed !== undefined) prConfig['ARTICLE.POPUP_VIEW_ALLOWED'] = props.isPopupArticleViewAllowed;
    if (props.readerExternalLinksEnabled !== undefined) prConfig['READER.EXTERNAL_LINKS.ENABLED'] = props.readerExternalLinksEnabled;
    if (props.localServerUrl !== undefined) prConfig.LOCAL_SERVER_URL = props.localServerUrl;
    if (props.showCustomerSupport !== undefined) prConfig['BUNDLE.SHOW_CUSTOMER_SUPPORT'] = props.showCustomerSupport;
    if (props.supportPhoneNumber !== undefined) prConfig.SUPPORT_PHONE_NUMBER = props.supportPhoneNumber;
    if (props.termsOfUseUrl !== undefined) prConfig.LEGAL_URL = props.termsOfUseUrl;
    if (props.privacyPolicyUrl !== undefined) prConfig.PRIVACY_POLICY_URL = props.privacyPolicyUrl;
    if (props.translateEnabled !== undefined) prConfig.TRANSLATE = props.translateEnabled;
    if (props.showRegistration !== undefined) prConfig.SHOW_SIGNUP = props.showRegistration;

    // Handle social URLs as ABOUT_SOCIAL_URLS array according to documentation
    const socialUrls: Array<Record<string, string>> = [];
    if (props.facebookUrl !== undefined) socialUrls.push({ "Facebook": props.facebookUrl });
    if (props.instagramUrl !== undefined) socialUrls.push({ "Instagram": props.instagramUrl });
    if (props.twitterUrl !== undefined) socialUrls.push({ "Twitter": props.twitterUrl });
    if (props.youtubeUrl !== undefined) socialUrls.push({ "YouTube": props.youtubeUrl });
    if (socialUrls.length > 0) {
      prConfig.ABOUT_SOCIAL_URLS = socialUrls;
    }

    // Apply iOS-specific properties
    if (props.ios) {
      for (const [key, value] of Object.entries(props.ios)) {
        if (value === undefined || value === null) continue

        // Skip mutualized fields that are now handled by common props
        if (commonConfigKeys.includes(key as keyof PressReaderCommonConfig)) {
          continue;
        }

        const configKey = toScreamingSnakeCase(key)
        prConfig[configKey] = value
      }
    }

    // Set the PRConfig dictionary in Info.plist
    infoPlist.PRConfig = prConfig

    return config
  })

  // Configure AndroidManifest.xml for service name and debug mode
  config = withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0]

    if (!application) {
      throw new Error('Could not find application in AndroidManifest.xml')
    }

    const metaDataArray = application['meta-data'] || []

    const existingServiceName = metaDataArray.find(
      (item: any) => item.$?.['android:name'] === 'com.pressreader.SERVICE_NAME'
    )

    if (!existingServiceName) {
      metaDataArray.push({
        $:{
          'android:name': 'com.pressreader.SERVICE_NAME',
          'android:value': props.serviceName,
        },
      })
    } else {
      existingServiceName.$['android:value'] = props.serviceName
    }

    if (props.isDebugMode) {
      const existingDebugMode = metaDataArray.find(
        (item: any) => item.$?.['android:name'] === 'com.pressreader.DEBUG_MODE'
      )

      if (!existingDebugMode) {
        metaDataArray.push({
          $:{
            'android:name': 'com.pressreader.DEBUG_MODE',
            'android:value': 'true',
          },
        })
      } else {
        existingDebugMode.$['android:value'] = 'true'
      }
    }

    (application as any)['meta-data'] = metaDataArray

    return config
  })

  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== 'groovy') {
      throw new Error(
        'Cannot add PressReader maven repository to a non-groovy build.gradle'
      )
    }

    const correctRepo = `maven { url "$rootDir/../../android/sdk-dist" }`
    const oldRepo = `maven { url "$rootDir/../node_modules/expo-pressreader/android/sdk-dist" }`

    // Remove old incorrect repository if it exists
    if (config.modResults.contents.includes(oldRepo)) {
      config.modResults.contents = config.modResults.contents.replace(oldRepo, correctRepo)
    } else if (!config.modResults.contents.includes(correctRepo)) {
      // Add the correct repository if neither exists
      config.modResults.contents = config.modResults.contents.replace(
        /allprojects\s*\{\s*repositories\s*\{/,
        `allprojects {\n    repositories {\n        ${correctRepo}`
      )
    }

    return config
  })

  // Configure Android xml for custom settings
  if (props.android || Object.keys(props).some(key => commonConfigKeys.includes(key as keyof PressReaderCommonConfig))) {
    config = withDangerousMod(config, [
      'android',
      async config => {
        const projectRoot = config.modRequest.platformProjectRoot
        const valuesDir = path.join(projectRoot, 'app/src/main/res/values')
        const configFilePath = path.join(valuesDir, 'pressreader_sdk_config.xml')

        const resources: { type: 'string' | 'bool' | 'color' | 'integer'; name: string; value: any; translatable?: boolean }[] = []

        // Add serviceName and isDebugMode from top-level props
        resources.push({ type: 'string', name: 'service_name', value: props.serviceName, translatable: false });
        if (props.isDebugMode !== undefined) {
          resources.push({ type: 'bool', name: 'debug_mode', value: String(props.isDebugMode) });
        }

        // Apply common Android properties
        if (props.colorBrand !== undefined) resources.push({ type: 'color', name: 'color_brand', value: props.colorBrand });
        if (props.colorBrandDark !== undefined) resources.push({ type: 'color', name: 'color_brand_dark', value: props.colorBrandDark });
        if (props.colorBackground !== undefined) resources.push({ type: 'color', name: 'color_background', value: props.colorBackground });
        if (props.colorBackgroundDark !== undefined) resources.push({ type: 'color', name: 'color_background_dark', value: props.colorBackgroundDark });
        if (props.brandGradientStartColor !== undefined) resources.push({ type: 'color', name: 'brand_gradient_start_color', value: props.brandGradientStartColor });
        if (props.brandGradientEndColor !== undefined) resources.push({ type: 'color', name: 'brand_gradient_end_color', value: props.brandGradientEndColor });
        if (props.onboardingEnabled !== undefined) resources.push({ type: 'bool', name: 'enroll_in_onboarding', value: String(props.onboardingEnabled) });
        if (props.sdkExitButtonText !== undefined) resources.push({ type: 'string', name: 'sdk_exit_button_text', value: props.sdkExitButtonText, translatable: false });
        if (props.supportEmailAddress !== undefined) resources.push({ type: 'string', name: 'pref_feedback_email', value: props.supportEmailAddress, translatable: false });
        if (props.newsfeedApi !== undefined) resources.push({ type: 'integer', name: 'newsfeed_api', value: String(props.newsfeedApi) });
        if (props.articleCommentsEnabled !== undefined) resources.push({ type: 'bool', name: 'comments_enabled', value: String(props.articleCommentsEnabled) });
        if (props.articleVotesEnabled !== undefined) resources.push({ type: 'bool', name: 'vote_enabled', value: String(props.articleVotesEnabled) });
        if (props.isPopupArticleViewAllowed !== undefined) resources.push({ type: 'bool', name: 'is_popup_article_view_allowed', value: String(props.isPopupArticleViewAllowed) });
        if (props.readerExternalLinksEnabled !== undefined) resources.push({ type: 'bool', name: 'reader_external_links_enable', value: String(props.readerExternalLinksEnabled) });
        if (props.localServerUrl !== undefined) resources.push({ type: 'string', name: 'local_server_url', value: props.localServerUrl, translatable: false });
        if (props.showCustomerSupport !== undefined) resources.push({ type: 'bool', name: 'pref_feedback_show_support', value: String(props.showCustomerSupport) });
        if (props.supportPhoneNumber !== undefined) resources.push({ type: 'string', name: 'pref_feedback_phone_number', value: props.supportPhoneNumber, translatable: false });
        if (props.termsOfUseUrl !== undefined) resources.push({ type: 'string', name: 'terms_of_use_url', value: props.termsOfUseUrl, translatable: false });
        if (props.privacyPolicyUrl !== undefined) resources.push({ type: 'string', name: 'privacy_policy_url', value: props.privacyPolicyUrl, translatable: false });
        if (props.registrationUrl !== undefined) resources.push({ type: 'string', name: 'registration_url', value: props.registrationUrl, translatable: false });
        if (props.translateEnabled !== undefined) resources.push({ type: 'bool', name: 'translate_enabled', value: String(props.translateEnabled) });
        if (props.showRegistration !== undefined) resources.push({ type: 'bool', name: 'hide_register', value: String(!props.showRegistration) }); // Inverted logic
        if (props.facebookUrl !== undefined) resources.push({ type: 'string', name: 'facebook_url', value: props.facebookUrl, translatable: false });
        if (props.instagramUrl !== undefined) resources.push({ type: 'string', name: 'instagram_url', value: props.instagramUrl, translatable: false });
        if (props.twitterUrl !== undefined) resources.push({ type: 'string', name: 'twitter_url', value: props.twitterUrl, translatable: false });
        if (props.youtubeUrl !== undefined) resources.push({ type: 'string', name: 'youtube_url', value: props.youtubeUrl, translatable: false });


        if (props.android) {
          for (const [key, value] of Object.entries(props.android)) {
            if (value === undefined || value === null) continue
            const name = toSnakeCase(key)

            // Skip serviceName and isDebugMode as they are handled at the top level
            // Also skip mutualized fields that are now handled by common props
            if (commonConfigKeys.includes(key as keyof PressReaderCommonConfig) || key === 'serviceName' || key === 'isDebugMode') {
              continue;
            }

            if (key.endsWith('Url') || key.endsWith('Email') || key.endsWith('Id') || key.endsWith('Name') || key.endsWith('Text')) {
              resources.push({ type: 'string', name, value, translatable: false })
            } else if (typeof value === 'boolean') {
              resources.push({ type: 'bool', name, value: String(value) })
            } else if (key.startsWith('color') || key.endsWith('Color')) {
              resources.push({ type: 'color', name, value })
            } else if (typeof value === 'number') {
              resources.push({ type: 'integer', name, value: String(value) })
            } else {
              resources.push({ type: 'string', name, value: String(value) })
            }
          }
        }

        const xmlContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${resources
  .map(
    r =>
      `<${r.type} name="${r.name}"${r.translatable === false ? ' translatable="false"' : ''}>${r.value}</${r.type}>`
  )
  .join('\n')}\n</resources>`

        if (!fs.existsSync(valuesDir)) {
          fs.mkdirSync(valuesDir, { recursive: true })
        }

        fs.writeFileSync(configFilePath, xmlContent)

        return config
      },
    ])
  }

  return config
}

const pkg = require('../../package.json')

export default createRunOncePlugin(withExpoPressReader, pkg.name, pkg.version)
export type {
  ExpoPressReaderPluginProps, PressReaderAndroidConfig, PressReaderCommonConfig,
  PressReaderIosConfig
} from './types'

