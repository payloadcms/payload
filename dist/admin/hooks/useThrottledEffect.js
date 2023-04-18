"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable react-hooks/exhaustive-deps */
const react_1 = require("react");
const useThrottledEffect = (callback, delay, deps = []) => {
    const lastRan = (0, react_1.useRef)(Date.now());
    (0, react_1.useEffect)(() => {
        const handler = setTimeout(() => {
            if (Date.now() - lastRan.current >= delay) {
                callback();
                lastRan.current = Date.now();
            }
        }, delay - (Date.now() - lastRan.current));
        return () => {
            clearTimeout(handler);
        };
    }, [delay, ...deps]);
};
exports.default = useThrottledEffect;
//# sourceMappingURL=useThrottledEffect.js.map