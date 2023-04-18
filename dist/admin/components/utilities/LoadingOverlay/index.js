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
exports.useLoadingOverlay = exports.LoadingOverlayProvider = void 0;
const react_1 = __importStar(require("react"));
const react_i18next_1 = require("react-i18next");
const useDelayedRender_1 = require("../../../hooks/useDelayedRender");
const reducer_1 = require("./reducer");
const Loading_1 = require("../../elements/Loading");
const animatedDuration = 250;
const Context = (0, react_1.createContext)({
    toggleLoadingOverlay: undefined,
    isOnScreen: false,
});
const LoadingOverlayProvider = ({ children }) => {
    const { t } = (0, react_i18next_1.useTranslation)('general');
    const fallbackText = t('loading');
    const [overlays, dispatchOverlay] = react_1.default.useReducer(reducer_1.reducer, reducer_1.defaultLoadingOverlayState);
    const { isMounted, isUnmounting, triggerDelayedRender, } = (0, useDelayedRender_1.useDelayedRender)({
        show: overlays.isLoading,
        delayBeforeShow: 1000,
        inTimeout: animatedDuration,
        outTimeout: animatedDuration,
        minShowTime: 500,
    });
    const toggleLoadingOverlay = react_1.default.useCallback(({ type, key, isLoading, loadingText = fallbackText }) => {
        if (isLoading) {
            triggerDelayedRender();
            dispatchOverlay({
                type: 'add',
                payload: {
                    type,
                    key,
                    loadingText,
                },
            });
        }
        else {
            dispatchOverlay({
                type: 'remove',
                payload: {
                    key,
                    type,
                },
            });
        }
    }, [triggerDelayedRender, fallbackText]);
    return (react_1.default.createElement(Context.Provider, { value: {
            toggleLoadingOverlay,
            isOnScreen: isMounted,
        } },
        isMounted && (react_1.default.createElement(Loading_1.LoadingOverlay, { show: !isUnmounting, loadingText: overlays.loadingText || fallbackText, overlayType: overlays.overlayType, animationDuration: `${animatedDuration}ms` })),
        children));
};
exports.LoadingOverlayProvider = LoadingOverlayProvider;
const useLoadingOverlay = () => {
    const contextHook = react_1.default.useContext(Context);
    if (contextHook === undefined) {
        throw new Error('useLoadingOverlay must be used within a LoadingOverlayProvider');
    }
    return contextHook;
};
exports.useLoadingOverlay = useLoadingOverlay;
exports.default = Context;
//# sourceMappingURL=index.js.map