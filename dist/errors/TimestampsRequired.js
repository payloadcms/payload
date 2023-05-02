"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const APIError_1 = __importDefault(require("./APIError"));
class TimestampsRequired extends APIError_1.default {
    constructor(collection) {
        super(`Timestamps are required in the collection ${collection.slug} because you have opted in to Versions.`);
    }
}
exports.default = TimestampsRequired;
//# sourceMappingURL=TimestampsRequired.js.map