"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-shadow */
const react_1 = require("react");
const useIntersect = ({ root = null, rootMargin = '0px', threshold = 0, } = {}) => {
    const [entry, updateEntry] = (0, react_1.useState)();
    const [node, setNode] = (0, react_1.useState)(null);
    const observer = (0, react_1.useRef)(new window.IntersectionObserver(([ent]) => updateEntry(ent), {
        root,
        rootMargin,
        threshold,
    }));
    (0, react_1.useEffect)(() => {
        const { current: currentObserver } = observer;
        currentObserver.disconnect();
        if (node)
            currentObserver.observe(node);
        return () => currentObserver.disconnect();
    }, [node]);
    return [setNode, entry];
};
exports.default = useIntersect;
//# sourceMappingURL=useIntersect.js.map