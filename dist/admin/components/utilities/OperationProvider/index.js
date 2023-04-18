"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOperation = exports.OperationContext = void 0;
const react_1 = require("react");
exports.OperationContext = (0, react_1.createContext)(undefined);
const useOperation = () => (0, react_1.useContext)(exports.OperationContext);
exports.useOperation = useOperation;
//# sourceMappingURL=index.js.map