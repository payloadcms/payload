"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reducer = exports.defaultLoadingOverlayState = void 0;
exports.defaultLoadingOverlayState = {
    isLoading: false,
    overlayType: null,
    loaders: [],
    loadingText: '',
};
const reducer = (state, action) => {
    const loadersCopy = [...state.loaders];
    const { type = 'fullscreen', key = 'user', loadingText } = action.payload;
    if (action.type === 'add') {
        loadersCopy.push({ type, key, loadingText });
    }
    else if (action.type === 'remove') {
        const index = loadersCopy.findIndex((item) => item.key === key && item.type === type);
        loadersCopy.splice(index, 1);
    }
    const nextLoader = (loadersCopy === null || loadersCopy === void 0 ? void 0 : loadersCopy.length) > 0 ? loadersCopy[loadersCopy.length - 1] : null;
    return {
        isLoading: Boolean(nextLoader),
        overlayType: (nextLoader === null || nextLoader === void 0 ? void 0 : nextLoader.type) || (state === null || state === void 0 ? void 0 : state.overlayType),
        loaders: loadersCopy,
        loadingText: (nextLoader === null || nextLoader === void 0 ? void 0 : nextLoader.loadingText) || (state === null || state === void 0 ? void 0 : state.loadingText),
    };
};
exports.reducer = reducer;
//# sourceMappingURL=reducer.js.map