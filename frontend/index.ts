// Polyfill URL.canParse for older environments
if (typeof URL.canParse !== 'function') {
  (URL as any).canParse = function(url: string, base?: string) {
    try {
      new URL(url, base);
      return true;
    } catch {
      return false;
    }
  };
}

import '@expo/metro-runtime';
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
