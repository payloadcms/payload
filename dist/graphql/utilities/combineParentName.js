"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const formatName_1 = __importDefault(require("./formatName"));
const combineParentName = (parent, name) => (0, formatName_1.default)(`${parent ? `${parent}_` : ''}${name}`);
exports.default = combineParentName;
//# sourceMappingURL=combineParentName.js.map