"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const qs_1 = __importDefault(require("qs"));
const Page_1 = __importDefault(require("./Page"));
const Separator_1 = __importDefault(require("./Separator"));
const ClickableArrow_1 = __importDefault(require("./ClickableArrow"));
const SearchParams_1 = require("../../utilities/SearchParams");
require("./index.scss");
const nodeTypes = {
    Page: Page_1.default,
    Separator: Separator_1.default,
    ClickableArrow: ClickableArrow_1.default,
};
const baseClass = 'paginator';
const Pagination = (props) => {
    const history = (0, react_router_dom_1.useHistory)();
    const params = (0, SearchParams_1.useSearchParams)();
    const { totalPages = null, page: currentPage, hasPrevPage = false, hasNextPage = false, prevPage = null, nextPage = null, numberOfNeighbors = 1, disableHistoryChange = false, onChange, } = props;
    if (!totalPages || totalPages <= 1)
        return null;
    // uses react router to set the current page
    const updatePage = (page) => {
        if (!disableHistoryChange) {
            const newParams = {
                ...params,
            };
            newParams.page = page;
            history.push({ search: qs_1.default.stringify(newParams, { addQueryPrefix: true }) });
        }
        if (typeof onChange === 'function')
            onChange(page);
    };
    // Create array of integers for each page
    const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
    // Assign indices for start and end of the range of pages that should be shown in paginator
    let rangeStartIndex = (currentPage - 1) - numberOfNeighbors;
    // Sanitize rangeStartIndex in case it is less than zero for safe split
    if (rangeStartIndex <= 0)
        rangeStartIndex = 0;
    const rangeEndIndex = (currentPage - 1) + numberOfNeighbors + 1;
    // Slice out the range of pages that we want to render
    const nodes = pages.slice(rangeStartIndex, rangeEndIndex);
    // Add prev separator if necessary
    if (currentPage - numberOfNeighbors - 1 >= 2)
        nodes.unshift({ type: 'Separator' });
    // Add first page if necessary
    if (currentPage > numberOfNeighbors + 1) {
        nodes.unshift({
            type: 'Page',
            props: {
                page: 1,
                updatePage,
                isFirstPage: true,
            },
        });
    }
    // Add next separator if necessary
    if (currentPage + numberOfNeighbors + 1 < totalPages)
        nodes.push({ type: 'Separator' });
    // Add last page if necessary
    if (rangeEndIndex < totalPages) {
        nodes.push({
            type: 'Page',
            props: {
                page: totalPages,
                updatePage,
                isLastPage: true,
            },
        });
    }
    // Add prev and next arrows based on necessity
    nodes.unshift({
        type: 'ClickableArrow',
        props: {
            updatePage: () => updatePage(nextPage),
            isDisabled: !hasNextPage,
            direction: 'right',
        },
    });
    nodes.unshift({
        type: 'ClickableArrow',
        props: {
            updatePage: () => updatePage(prevPage),
            isDisabled: !hasPrevPage,
            direction: 'left',
        },
    });
    return (react_1.default.createElement("div", { className: baseClass }, nodes.map((node, i) => {
        if (typeof node === 'number') {
            return (react_1.default.createElement(Page_1.default, { key: i, page: node, updatePage: updatePage, isCurrent: currentPage === node }));
        }
        const NodeType = nodeTypes[node.type];
        return (react_1.default.createElement(NodeType, { key: i, ...node.props }));
    })));
};
exports.default = Pagination;
//# sourceMappingURL=index.js.map