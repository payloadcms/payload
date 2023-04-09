"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elements_1 = __importDefault(require("./elements"));
const leaves_1 = __importDefault(require("./leaves"));
const addPluginReducer = (EditorWithPlugins, plugin) => {
    if (typeof plugin === 'function')
        return plugin(EditorWithPlugins);
    return EditorWithPlugins;
};
const enablePlugins = (CreatedEditor, functions) => functions.reduce((CreatedEditorWithPlugins, func) => {
    if (typeof func === 'object' && Array.isArray(func.plugins)) {
        return func.plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
    }
    if (typeof func === 'string') {
        if (elements_1.default[func] && elements_1.default[func].plugins) {
            return elements_1.default[func].plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
        }
        if (leaves_1.default[func] && leaves_1.default[func].plugins) {
            return leaves_1.default[func].plugins.reduce(addPluginReducer, CreatedEditorWithPlugins);
        }
    }
    return CreatedEditorWithPlugins;
}, CreatedEditor);
exports.default = enablePlugins;
//# sourceMappingURL=enablePlugins.js.map