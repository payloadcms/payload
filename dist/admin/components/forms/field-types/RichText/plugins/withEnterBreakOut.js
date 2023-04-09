"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enterBreakOutTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'link'];
const withEnterBreakOut = (editor) => {
    const newEditor = editor;
    newEditor.shouldBreakOutOnEnter = (element) => enterBreakOutTypes.includes(String(element.type));
    return newEditor;
};
exports.default = withEnterBreakOut;
//# sourceMappingURL=withEnterBreakOut.js.map