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
exports.useDelayedRender = void 0;
const React = __importStar(require("react"));
const useDelay_1 = require("./useDelay");
const useDelayedRender = ({ show, delayBeforeShow, inTimeout, minShowTime, outTimeout }) => {
    const totalMountTime = inTimeout + minShowTime + outTimeout;
    const [hasDelayed, triggerDelay] = (0, useDelay_1.useDelay)(delayBeforeShow);
    const [isMounted, setIsMounted] = React.useState(false);
    const [isUnmounting, setIsUnmounting] = React.useState(false);
    const onMountTimestampRef = React.useRef(0);
    const unmountTimeoutRef = React.useRef();
    const unmount = React.useCallback(() => {
        setIsUnmounting(true);
        unmountTimeoutRef.current = setTimeout(() => {
            setIsMounted(false);
            setIsUnmounting(false);
        }, outTimeout);
    }, [setIsUnmounting, outTimeout]);
    React.useEffect(() => {
        const shouldMount = hasDelayed && !isMounted && show;
        const shouldUnmount = isMounted && !show;
        if (shouldMount) {
            onMountTimestampRef.current = Date.now();
            setIsMounted(true);
        }
        else if (shouldUnmount) {
            const totalTimeMounted = Date.now() - onMountTimestampRef.current;
            const remainingTime = totalMountTime - totalTimeMounted;
            clearTimeout(unmountTimeoutRef.current);
            unmountTimeoutRef.current = setTimeout(unmount, Math.max(0, remainingTime));
        }
    }, [isMounted, show, unmount, totalMountTime, hasDelayed]);
    return {
        isMounted,
        isUnmounting,
        triggerDelayedRender: triggerDelay,
    };
};
exports.useDelayedRender = useDelayedRender;
//# sourceMappingURL=useDelayedRender.js.map