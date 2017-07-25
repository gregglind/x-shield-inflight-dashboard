"use strict";

module.exports = {
  env: {
    "node": true,
    "es6": true
  },
  extends: [
    "eslint:recommended",
  ],
  plugins: [
  ],
  rules: {
    //"babel/new-cap": "off",
    //"comma-dangle": ["error", "always-multiline"],
    //"eqeqeq": "error",
    //"indent": ["warn", 2, {SwitchCase: 1}],
    //"mozilla/no-aArgs": "warn",
    //"mozilla/balanced-listeners": 0,
    "no-console": "warn",
    "no-debugger": "warn",
    "no-shadow": ["warn"],
    "no-unused-vars": "warn",
    "prefer-const": "warn",
    //"semi": ["error", "always"],
  },
};
