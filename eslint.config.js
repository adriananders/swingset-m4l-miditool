'use strict';
const globals = require('globals');
const js = require('@eslint/js');
const jest = require('eslint-plugin-jest');

module.exports = [
  js.configs.recommended,
  jest.configs['flat/recommended'],
  {
    languageOptions: { 
      globals: globals.browser 
    },
    plugins: {
      jest
    }
  },
  {
    files: ["**/*.js"], 
    languageOptions: { 
      sourceType: "commonjs" 
    }
  },
  {
    ignores: [
      "*/seedrandom.js",
      "coverage/*"
    ]
  }
];