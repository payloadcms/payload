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
exports.TableColumnsProvider = exports.useTableColumns = exports.TableColumnContext = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const Preferences_1 = require("../../utilities/Preferences");
const buildColumns_1 = __importDefault(require("./buildColumns"));
const columnReducer_1 = require("./columnReducer");
const getInitialColumns_1 = __importDefault(require("./getInitialColumns"));
const formatFields_1 = __importDefault(require("../../views/collections/List/formatFields"));
exports.TableColumnContext = (0, react_1.createContext)({});
const useTableColumns = () => (0, react_1.useContext)(exports.TableColumnContext);
exports.useTableColumns = useTableColumns;
const TableColumnsProvider = ({ children, cellProps, collection, collection: { admin: { useAsTitle, defaultColumns, }, }, }) => {
    const preferenceKey = `${collection.slug}-list`;
    const prevCollection = (0, react_1.useRef)();
    const hasInitialized = (0, react_1.useRef)(false);
    const { getPreference, setPreference } = (0, Preferences_1.usePreferences)();
    const { t } = (0, react_i18next_1.useTranslation)();
    const [formattedFields] = (0, react_1.useState)(() => (0, formatFields_1.default)(collection, t));
    const [tableColumns, dispatchTableColumns] = (0, react_1.useReducer)(columnReducer_1.columnReducer, {}, () => {
        const initialColumns = (0, getInitialColumns_1.default)(formattedFields, useAsTitle, defaultColumns);
        return (0, buildColumns_1.default)({
            collection,
            columns: initialColumns.map((column) => ({
                accessor: column,
                active: true,
            })),
            cellProps,
        });
    });
    // /////////////////////////////////////
    // Sync preferences on collection change
    // /////////////////////////////////////
    (0, react_1.useEffect)(() => {
        const sync = async () => {
            const collectionHasChanged = prevCollection.current !== collection.slug;
            if (collectionHasChanged) {
                hasInitialized.current = false;
                const currentPreferences = await getPreference(preferenceKey);
                prevCollection.current = collection.slug;
                const initialColumns = (0, getInitialColumns_1.default)(formattedFields, useAsTitle, defaultColumns);
                const newCols = (currentPreferences === null || currentPreferences === void 0 ? void 0 : currentPreferences.columns) || initialColumns;
                dispatchTableColumns({
                    type: 'set',
                    payload: {
                        columns: newCols.map((column) => {
                            // 'string' is for backwards compatibility
                            // the preference used to be stored as an array of strings
                            if (typeof column === 'string') {
                                return {
                                    accessor: column,
                                    active: true,
                                };
                            }
                            return column;
                        }),
                        collection: { ...collection, fields: (0, formatFields_1.default)(collection, t) },
                        cellProps,
                    },
                });
                hasInitialized.current = true;
            }
        };
        sync();
    }, [preferenceKey, setPreference, tableColumns, getPreference, useAsTitle, defaultColumns, collection, cellProps, formattedFields, t]);
    // /////////////////////////////////////
    // Set preferences on column change
    // /////////////////////////////////////
    (0, react_1.useEffect)(() => {
        if (!hasInitialized.current)
            return;
        const sync = async () => {
            const currentPreferences = await getPreference(preferenceKey);
            const newPreferences = {
                ...currentPreferences,
                columns: tableColumns.map((c) => ({
                    accessor: c.accessor,
                    active: c.active,
                })),
            };
            setPreference(preferenceKey, newPreferences);
        };
        sync();
    }, [tableColumns, preferenceKey, setPreference, getPreference]);
    const setActiveColumns = (0, react_1.useCallback)((columns) => {
        dispatchTableColumns({
            type: 'set',
            payload: {
                collection: { ...collection, fields: (0, formatFields_1.default)(collection, t) },
                columns: columns.map((column) => ({
                    accessor: column,
                    active: true,
                })),
                // onSelect,
                cellProps,
            },
        });
    }, [collection, t, cellProps]);
    const moveColumn = (0, react_1.useCallback)((args) => {
        const { fromIndex, toIndex } = args;
        dispatchTableColumns({
            type: 'move',
            payload: {
                fromIndex,
                toIndex,
                collection: { ...collection, fields: (0, formatFields_1.default)(collection, t) },
                cellProps,
            },
        });
    }, [collection, t, cellProps]);
    const toggleColumn = (0, react_1.useCallback)((column) => {
        dispatchTableColumns({
            type: 'toggle',
            payload: {
                column,
                collection: { ...collection, fields: (0, formatFields_1.default)(collection, t) },
                cellProps,
            },
        });
    }, [collection, t, cellProps]);
    return (react_1.default.createElement(exports.TableColumnContext.Provider, { value: {
            columns: tableColumns,
            dispatchTableColumns,
            setActiveColumns,
            moveColumn,
            toggleColumn,
        } }, children));
};
exports.TableColumnsProvider = TableColumnsProvider;
//# sourceMappingURL=index.js.map