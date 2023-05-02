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
exports.StaggeredShimmers = exports.ShimmerEffect = void 0;
const React = __importStar(require("react"));
const useDelay_1 = require("../../../hooks/useDelay");
require("./index.scss");
const ShimmerEffect = ({ animationDelay = '0ms', height = '60px', width = '100%' }) => {
    return (React.createElement("div", { className: "shimmer-effect", style: {
            height: typeof height === 'number' ? `${height}px` : height,
            width: typeof width === 'number' ? `${width}px` : width,
        } },
        React.createElement("div", { className: "shimmer-effect__shine", style: {
                animationDelay,
            } })));
};
exports.ShimmerEffect = ShimmerEffect;
const StaggeredShimmers = ({ count, className, shimmerItemClassName, width, height, shimmerDelay = 25, renderDelay = 500 }) => {
    const shimmerDelayToPass = typeof shimmerDelay === 'number' ? `${shimmerDelay}ms` : shimmerDelay;
    const [hasDelayed] = (0, useDelay_1.useDelay)(renderDelay, true);
    if (!hasDelayed)
        return null;
    return (React.createElement("div", { className: className }, [...Array(count)].map((_, i) => (React.createElement("div", { key: i, className: shimmerItemClassName },
        React.createElement(exports.ShimmerEffect, { animationDelay: `calc(${i} * ${shimmerDelayToPass})`, height: height, width: width }))))));
};
exports.StaggeredShimmers = StaggeredShimmers;
//# sourceMappingURL=index.js.map