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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useConfig = exports.ConfigProvider = void 0;
const react_1 = __importStar(require("react"));
const Context = (0, react_1.createContext)({});
const ConfigProvider = ({ children, config: incomingConfig }) => {
    const [config, setConfig] = react_1.default.useState();
    const hasAwaited = react_1.default.useRef(false);
    react_1.default.useEffect(() => {
        if (incomingConfig && !hasAwaited.current) {
            hasAwaited.current = true;
            const awaitConfig = async () => {
                const resolvedConfig = await incomingConfig;
                setConfig(resolvedConfig);
            };
            awaitConfig();
        }
    }, [incomingConfig]);
    if (!config)
        return null;
    return (react_1.default.createElement(Context.Provider, { value: config }, children));
};
exports.ConfigProvider = ConfigProvider;
const useConfig = () => (0, react_1.useContext)(Context);
exports.useConfig = useConfig;
//# sourceMappingURL=index.js.map