"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Code_1 = __importDefault(require("./Code"));
const JSON_1 = __importDefault(require("./JSON"));
const Email_1 = __importDefault(require("./Email"));
const HiddenInput_1 = __importDefault(require("./HiddenInput"));
const Text_1 = __importDefault(require("./Text"));
const DateTime_1 = __importDefault(require("./DateTime"));
const Password_1 = __importDefault(require("./Password"));
const ConfirmPassword_1 = __importDefault(require("./ConfirmPassword"));
const Relationship_1 = __importDefault(require("./Relationship"));
const Textarea_1 = __importDefault(require("./Textarea"));
const Select_1 = __importDefault(require("./Select"));
const Number_1 = __importDefault(require("./Number"));
const Checkbox_1 = __importDefault(require("./Checkbox"));
const RichText_1 = __importDefault(require("./RichText"));
const RadioGroup_1 = __importDefault(require("./RadioGroup"));
const Point_1 = __importDefault(require("./Point"));
const Blocks_1 = __importDefault(require("./Blocks"));
const Group_1 = __importDefault(require("./Group"));
const Array_1 = __importDefault(require("./Array"));
const Row_1 = __importDefault(require("./Row"));
const Collapsible_1 = __importDefault(require("./Collapsible"));
const Tabs_1 = __importDefault(require("./Tabs"));
const Upload_1 = __importDefault(require("./Upload"));
const UI_1 = __importDefault(require("./UI"));
const fieldTypes = {
    code: Code_1.default,
    json: JSON_1.default,
    email: Email_1.default,
    hidden: HiddenInput_1.default,
    text: Text_1.default,
    date: DateTime_1.default,
    password: Password_1.default,
    confirmPassword: ConfirmPassword_1.default,
    relationship: Relationship_1.default,
    textarea: Textarea_1.default,
    select: Select_1.default,
    number: Number_1.default,
    checkbox: Checkbox_1.default,
    richText: RichText_1.default,
    point: Point_1.default,
    radio: RadioGroup_1.default,
    blocks: Blocks_1.default,
    group: Group_1.default,
    array: Array_1.default,
    row: Row_1.default,
    collapsible: Collapsible_1.default,
    tabs: Tabs_1.default,
    upload: Upload_1.default,
    ui: UI_1.default,
};
exports.default = fieldTypes;
//# sourceMappingURL=index.js.map