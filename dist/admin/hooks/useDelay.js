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
exports.useDelay = void 0;
const React = __importStar(require("react"));
const useDelay = (delay, triggerOnMount = false) => {
    const [hasDelayed, setHasDelayed] = React.useState(false);
    const triggerTimeoutRef = React.useRef();
    const triggerDelay = React.useCallback(() => {
        setHasDelayed(false);
        clearTimeout(triggerTimeoutRef.current);
        triggerTimeoutRef.current = setTimeout(() => {
            setHasDelayed(true);
        }, delay);
        return () => {
            clearTimeout(triggerTimeoutRef.current);
        };
    }, [delay]);
    React.useEffect(() => {
        if (triggerOnMount) {
            triggerDelay();
        }
    }, [triggerDelay, triggerOnMount]);
    return [
        hasDelayed,
        triggerDelay,
    ];
};
exports.useDelay = useDelay;
//# sourceMappingURL=useDelay.js.map