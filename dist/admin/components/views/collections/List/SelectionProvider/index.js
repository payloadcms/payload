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
exports.useSelection = exports.SelectionProvider = exports.SelectAllStatus = void 0;
const react_1 = __importStar(require("react"));
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
var SelectAllStatus;
(function (SelectAllStatus) {
    SelectAllStatus["AllAvailable"] = "allAvailable";
    SelectAllStatus["AllInPage"] = "allInPage";
    SelectAllStatus["Some"] = "some";
    SelectAllStatus["None"] = "none";
})(SelectAllStatus = exports.SelectAllStatus || (exports.SelectAllStatus = {}));
const Context = (0, react_1.createContext)({});
const SelectionProvider = ({ children, docs = [], totalDocs }) => {
    const contextRef = (0, react_1.useRef)({});
    const history = (0, react_router_dom_1.useHistory)();
    const [selected, setSelected] = (0, react_1.useState)({});
    const [selectAll, setSelectAll] = (0, react_1.useState)(SelectAllStatus.None);
    const [count, setCount] = (0, react_1.useState)(0);
    const toggleAll = (0, react_1.useCallback)((allAvailable = false) => {
        const rows = {};
        if (allAvailable) {
            setSelectAll(SelectAllStatus.AllAvailable);
            docs.forEach(({ id }) => {
                rows[id] = true;
            });
        }
        else if (selectAll === SelectAllStatus.AllAvailable || selectAll === SelectAllStatus.AllInPage) {
            setSelectAll(SelectAllStatus.None);
            docs.forEach(({ id }) => {
                rows[id] = false;
            });
        }
        else {
            docs.forEach(({ id }) => {
                rows[id] = selectAll !== SelectAllStatus.Some;
            });
        }
        setSelected(rows);
    }, [docs, selectAll]);
    const setSelection = (0, react_1.useCallback)((id) => {
        const isSelected = !selected[id];
        const newSelected = {
            ...selected,
            [id]: isSelected,
        };
        if (!isSelected) {
            setSelectAll(SelectAllStatus.Some);
        }
        setSelected(newSelected);
    }, [selected]);
    const getQueryParams = (0, react_1.useCallback)((additionalParams) => {
        let where;
        if (selectAll === SelectAllStatus.AllAvailable) {
            const params = qs_1.default.parse(history.location.search, { ignoreQueryPrefix: true }).where;
            where = params || {
                id: { not_equals: '' },
            };
        }
        else {
            where = {
                id: {
                    in: Object.keys(selected).filter((id) => selected[id]).map((id) => id),
                },
            };
        }
        if (additionalParams) {
            where = {
                and: [
                    { ...additionalParams },
                    where,
                ],
            };
        }
        return qs_1.default.stringify({
            where,
        }, { addQueryPrefix: true });
    }, [history.location.search, selectAll, selected]);
    (0, react_1.useEffect)(() => {
        if (selectAll === SelectAllStatus.AllAvailable) {
            return;
        }
        let some = false;
        let all = true;
        Object.values(selected).forEach((val) => {
            all = all && val;
            some = some || val;
        });
        if (all) {
            setSelectAll(SelectAllStatus.AllInPage);
        }
        else if (some) {
            setSelectAll(SelectAllStatus.Some);
        }
        else {
            setSelectAll(SelectAllStatus.None);
        }
    }, [docs, selectAll, selected]);
    (0, react_1.useEffect)(() => {
        const rows = {};
        if (docs.length) {
            docs.forEach(({ id }) => {
                rows[id] = false;
            });
            setSelected(rows);
        }
        setSelectAll(SelectAllStatus.None);
    }, [docs, history]);
    (0, react_1.useEffect)(() => {
        const newCount = selectAll === SelectAllStatus.AllAvailable ? totalDocs : Object.keys(selected).filter((id) => selected[id]).length;
        setCount(newCount);
    }, [selectAll, selected, totalDocs]);
    contextRef.current = {
        selectAll,
        toggleAll,
        selected,
        setSelection,
        totalDocs,
        count,
        getQueryParams,
    };
    return (react_1.default.createElement(Context.Provider, { value: contextRef.current }, children));
};
exports.SelectionProvider = SelectionProvider;
const useSelection = () => (0, react_1.useContext)(Context);
exports.useSelection = useSelection;
//# sourceMappingURL=index.js.map