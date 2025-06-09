require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'ExpoPressReader'
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
  s.platforms      = {
    :ios => '16.0',
    :tvos => '16.0'
  }
  s.source         = { git: 'https://github.com/Appik-Studio/expo-pressreader.git' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.dependency 'PRSDK', '7.5.1'

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
