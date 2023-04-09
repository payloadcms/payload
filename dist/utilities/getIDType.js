"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIDType = void 0;
const getIDType = (idField) => {
    if (idField) {
        return idField.type === 'number' ? 'number' : 'text';
    }
    return 'ObjectID';
};
exports.getIDType = getIDType;
//# sourceMappingURL=getIDType.js.map