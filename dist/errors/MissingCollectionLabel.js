"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class MissingCollectionLabel extends APIError_1.default {
    constructor() {
        super('payload.config.collection object is missing label');
    }
}
exports.default = MissingCollectionLabel;
//# sourceMappingURL=MissingCollectionLabel.js.map