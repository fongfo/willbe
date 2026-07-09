const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const joseBrowserEntry = path.join(
  path.dirname(require.resolve('jose/package.json')),
  'dist/browser/index.js'
);

config.resolver.unstable_conditionNames = [
  'browser',
  ...(config.resolver.unstable_conditionNames ?? [])
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'jose') {
    return {
      type: 'sourceFile',
      filePath: joseBrowserEntry
    };
  }

  if (moduleName === '@noble/hashes/crypto.js') {
    return context.resolveRequest(context, '@noble/hashes/crypto', platform);
  }

  if (
    moduleName === './crypto.js' &&
    context.originModulePath?.includes(`${path.sep}@noble${path.sep}hashes${path.sep}`)
  ) {
    return context.resolveRequest(context, '@noble/hashes/crypto', platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
