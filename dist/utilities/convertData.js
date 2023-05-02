"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertArrayToObject = exports.convertObjectToArray = exports.convertArrayToHash = void 0;
const convertArrayToObject = (arr, key) => arr.reduce((obj, item) => {
    if (key) {
        obj[item[key]] = item;
        return obj;
    }
    obj[item] = {};
    return obj;
}, {});
exports.convertArrayToObject = convertArrayToObject;
const convertObjectToArray = (arr) => Object.values(arr);
exports.convertObjectToArray = convertObjectToArray;
const convertArrayToHash = (arr, key) => arr.reduce((obj, item, i) => {
    obj[item[key]] = i;
    return obj;
}, {});
exports.convertArrayToHash = convertArrayToHash;
//# sourceMappingURL=convertData.js.map