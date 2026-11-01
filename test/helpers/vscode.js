// Lets modules that require('vscode') load under plain Node. Only what's reached at load time or by
// the tested functions is here; the real thing is covered by test/smoke.
'use strict';
const Module = require('module');

const config = values => ({ get: (key, fallback) => (key in values ? values[key] : fallback) });
const stub = {
  workspace: { getConfiguration: () => config({}), workspaceFolders: [], textDocuments: [] },
  window: { createOutputChannel: () => ({ appendLine() {}, show() {} }) },
  commands: { registerCommand: (id, fn) => ({ id, fn, dispose() {} }) },
  languages: {},
};

const load = Module._load;
Module._load = function (request, ...rest) {
  return request === 'vscode' ? stub : load.call(this, request, ...rest);
};
module.exports = stub;
