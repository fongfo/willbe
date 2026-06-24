const expoConfig = require('eslint-config-expo/flat');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...expoConfig,
  {
    ignores: ['dist/*', '.expo/*']
  }
];
