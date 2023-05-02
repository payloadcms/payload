"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utilities_1 = require("./utilities");
const Button_1 = require("./Button");
const Element_1 = require("./Element");
const link = {
    Button: Button_1.LinkButton,
    Element: Element_1.LinkElement,
    plugins: [
        utilities_1.withLinks,
    ],
};
exports.default = link;
//# sourceMappingURL=index.js.map