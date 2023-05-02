"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const md5_1 = __importDefault(require("md5"));
const qs_1 = __importDefault(require("qs"));
const Auth_1 = require("../../utilities/Auth");
const Gravatar = () => {
    const { user } = (0, Auth_1.useAuth)();
    const hash = (0, md5_1.default)(user.email.trim().toLowerCase());
    const query = qs_1.default.stringify({
        s: 50,
        r: 'g',
        default: 'mp',
    });
    return (react_1.default.createElement("img", { className: "gravatar-account", style: { borderRadius: '50%' }, src: `https://www.gravatar.com/avatar/${hash}?${query}`, alt: "yas", width: 25, height: 25 }));
};
exports.default = Gravatar;
//# sourceMappingURL=Gravatar.js.map