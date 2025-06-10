const { createRunOncePlugin } = require('expo/config-plugins');

const withPressReader = require('./plugin/build/index').default;

const pkg = require('./package.json');

module.exports = createRunOncePlugin(withPressReader, pkg.name, pkg.version); 