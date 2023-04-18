"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const react_i18next_1 = require("react-i18next");
const Config_1 = require("../../../../utilities/Config");
const RenderCustomComponent_1 = __importDefault(require("../../../../utilities/RenderCustomComponent"));
const field_types_1 = __importDefault(require("./field-types"));
const getTranslation_1 = require("../../../../../../utilities/getTranslation");
const types_1 = require("../../../../../../fields/config/types");
const DefaultCell = (props) => {
    const { field, collection, collection: { slug, }, cellData, rowData, rowData: { id, } = {}, link = true, onClick, className, } = props;
    const { routes: { admin } } = (0, Config_1.useConfig)();
    const { t, i18n } = (0, react_i18next_1.useTranslation)('general');
    let WrapElement = 'span';
    const wrapElementProps = {
        className,
    };
    if (link) {
        WrapElement = react_router_dom_1.Link;
        wrapElementProps.to = `${admin}/collections/${slug}/${id}`;
    }
    if (typeof onClick === 'function') {
        WrapElement = 'button';
        wrapElementProps.type = 'button';
        wrapElementProps.onClick = () => {
            onClick(props);
        };
    }
    let CellComponent = cellData && field_types_1.default[field.type];
    if (!CellComponent) {
        if (collection.upload && (0, types_1.fieldAffectsData)(field) && field.name === 'filename') {
            CellComponent = field_types_1.default.File;
        }
        else {
            return (react_1.default.createElement(WrapElement, { ...wrapElementProps },
                ((cellData === '' || typeof cellData === 'undefined') && 'label' in field) && t('noLabel', { label: (0, getTranslation_1.getTranslation)(typeof field.label === 'function' ? 'data' : field.label || 'data', i18n) }),
                typeof cellData === 'string' && cellData,
                typeof cellData === 'number' && cellData,
                typeof cellData === 'object' && JSON.stringify(cellData)));
        }
    }
    return (react_1.default.createElement(WrapElement, { ...wrapElementProps },
        react_1.default.createElement(CellComponent, { field: field, data: cellData, collection: collection, rowData: rowData })));
};
const Cell = (props) => {
    const { colIndex, collection, cellData, rowData, field, field: { admin: { components: { Cell: CustomCell, } = {}, } = {}, }, link, onClick, className, } = props;
    return (react_1.default.createElement(RenderCustomComponent_1.default, { componentProps: {
            rowData,
            colIndex,
            cellData,
            collection,
            field,
            link,
            onClick,
            className,
        }, CustomComponent: CustomCell, DefaultComponent: DefaultCell }));
};
exports.default = Cell;
//# sourceMappingURL=index.js.map