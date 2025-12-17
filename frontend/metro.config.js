const { getDefaultConfig } = require('expo/metro-config');

// Polyfill URL.canParse for Node < 18.17
if (typeof URL.canParse !== 'function') {
  URL.canParse = function(url, base) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

const config = getDefaultConfig(__dirname);

module.exports = config;
