"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const buildObjectType_1 = __importDefault(require("./buildObjectType"));
const formatLabels_1 = require("../../utilities/formatLabels");
function buildBlockType({ payload, block, forceNullable, }) {
    const { slug, graphQL: { singularName, } = {}, } = block;
    if (!payload.types.blockTypes[slug]) {
        const formattedBlockName = singularName || (0, formatLabels_1.toWords)(slug, true);
        payload.types.blockTypes[slug] = (0, buildObjectType_1.default)({
            payload,
            name: formattedBlockName,
            parentName: formattedBlockName,
            fields: [
                ...block.fields,
                {
                    name: 'blockType',
                    type: 'text',
                },
            ],
            forceNullable,
        });
    }
}
exports.default = buildBlockType;
//# sourceMappingURL=buildBlockType.js.map