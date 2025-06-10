require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoPressReader'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for PressReader integration'
  s.description    = 'An Expo module that provides PressReader functionality for React Native applications'
  s.author         = ''
  s.homepage       = 'https://github.com/expo/expo'
  s.platform       = :ios, '13.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'PRSDK', '7.5.1'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
