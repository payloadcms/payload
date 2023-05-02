"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Text_1 = __importDefault(require("./Text"));
const Nested_1 = __importDefault(require("./Nested"));
const Iterable_1 = __importDefault(require("./Iterable"));
const Relationship_1 = __importDefault(require("./Relationship"));
const Tabs_1 = __importDefault(require("./Tabs"));
const Select_1 = __importDefault(require("./Select"));
exports.default = {
    text: Text_1.default,
    textarea: Text_1.default,
    number: Text_1.default,
    email: Text_1.default,
    code: Text_1.default,
    json: Text_1.default,
    checkbox: Text_1.default,
    radio: Select_1.default,
    row: Nested_1.default,
    collapsible: Nested_1.default,
    group: Nested_1.default,
    array: Iterable_1.default,
    blocks: Iterable_1.default,
    date: Text_1.default,
    select: Select_1.default,
    richText: Text_1.default,
    relationship: Relationship_1.default,
    upload: Relationship_1.default,
    point: Text_1.default,
    tabs: Tabs_1.default,
};
//# sourceMappingURL=index.js.map