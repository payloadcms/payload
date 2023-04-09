"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const Config_1 = require("../../utilities/Config");
const Auth_1 = require("../../utilities/Auth");
const StepNav_1 = require("../../elements/StepNav");
const RenderCustomComponent_1 = __importDefault(require("../../utilities/RenderCustomComponent"));
const Default_1 = __importDefault(require("./Default"));
const Dashboard = () => {
    const { permissions } = (0, Auth_1.useAuth)();
    const { setStepNav } = (0, StepNav_1.useStepNav)();
    const [filteredGlobals, setFilteredGlobals] = (0, react_1.useState)([]);
    const { collections, globals, admin: { components: { views: { Dashboard: CustomDashboard, } = {
        Dashboard: undefined,
    }, } = {}, } = {}, } = (0, Config_1.useConfig)();
    (0, react_1.useEffect)(() => {
        setFilteredGlobals(globals.filter((global) => { var _a, _b, _c; return (_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.globals) === null || _a === void 0 ? void 0 : _a[global.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission; }));
    }, [permissions, globals]);
    (0, react_1.useEffect)(() => {
        setStepNav([]);
    }, [setStepNav]);
    return (react_1.default.createElement(RenderCustomComponent_1.default, { DefaultComponent: Default_1.default, CustomComponent: CustomDashboard, componentProps: {
            globals: filteredGlobals,
            collections: collections.filter((collection) => { var _a, _b, _c; return (_c = (_b = (_a = permissions === null || permissions === void 0 ? void 0 : permissions.collections) === null || _a === void 0 ? void 0 : _a[collection.slug]) === null || _b === void 0 ? void 0 : _b.read) === null || _c === void 0 ? void 0 : _c.permission; }),
            permissions,
        } }));
};
exports.default = Dashboard;
//# sourceMappingURL=index.js.map