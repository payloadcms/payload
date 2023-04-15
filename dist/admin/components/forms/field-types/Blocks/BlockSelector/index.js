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
const react_1 = __importStar(require("react"));
const BlockSearch_1 = __importDefault(require("./BlockSearch"));
const BlocksContainer_1 = __importDefault(require("./BlocksContainer"));
const baseClass = 'block-selector';
const BlockSelector = (props) => {
    const { blocks, close, parentIsHovered, watchParentHover, ...remainingProps } = props;
    const [searchTerm, setSearchTerm] = (0, react_1.useState)('');
    const [filteredBlocks, setFilteredBlocks] = (0, react_1.useState)(blocks);
    const [isBlockSelectorHovered, setBlockSelectorHovered] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        const matchingBlocks = blocks.reduce((matchedBlocks, block) => {
            if (block.slug.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1)
                matchedBlocks.push(block);
            return matchedBlocks;
        }, []);
        setFilteredBlocks(matchingBlocks);
    }, [searchTerm, blocks]);
    (0, react_1.useEffect)(() => {
        if (!parentIsHovered && !isBlockSelectorHovered && close && watchParentHover)
            close();
    }, [isBlockSelectorHovered, parentIsHovered, close, watchParentHover]);
    return (react_1.default.createElement("div", { className: baseClass, onMouseEnter: () => setBlockSelectorHovered(true), onMouseLeave: () => setBlockSelectorHovered(false) },
        react_1.default.createElement(BlockSearch_1.default, { setSearchTerm: setSearchTerm }),
        react_1.default.createElement(BlocksContainer_1.default, { blocks: filteredBlocks, close: close, ...remainingProps })));
};
exports.default = BlockSelector;
//# sourceMappingURL=index.js.map