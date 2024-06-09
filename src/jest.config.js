/** @type {import('jest').Config} */
const config = {
    verbose: true,
    collectCoverageFrom: [
        '**/*.{js,jsx}',
        '!**/node_modules/**',
        '!**/coverage/**',
        '!**/seedrandom.js',
        '!**/*.config.js',
      ],
  };
  
  module.exports = config;