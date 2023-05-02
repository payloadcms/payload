"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Array_1 = __importDefault(require("./Array"));
const Blocks_1 = __importDefault(require("./Blocks"));
const Checkbox_1 = __importDefault(require("./Checkbox"));
const Code_1 = __importDefault(require("./Code"));
const Date_1 = __importDefault(require("./Date"));
const JSON_1 = __importDefault(require("./JSON"));
const Relationship_1 = __importDefault(require("./Relationship"));
const Richtext_1 = __importDefault(require("./Richtext"));
const Select_1 = __importDefault(require("./Select"));
const Textarea_1 = __importDefault(require("./Textarea"));
const File_1 = __importDefault(require("./File"));
exports.default = {
    array: Array_1.default,
    blocks: Blocks_1.default,
    code: Code_1.default,
    checkbox: Checkbox_1.default,
    date: Date_1.default,
    json: JSON_1.default,
    relationship: Relationship_1.default,
    richText: Richtext_1.default,
    select: Select_1.default,
    radio: Select_1.default,
    textarea: Textarea_1.default,
    upload: Relationship_1.default,
    File: File_1.default,
};
//# sourceMappingURL=index.js.map