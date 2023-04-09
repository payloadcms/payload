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
exports.useDocumentDrawer = exports.DocumentDrawer = exports.DocumentDrawerToggler = exports.baseClass = void 0;
const react_1 = __importStar(require("react"));
const modal_1 = require("@faceless-ui/modal");
const react_i18next_1 = require("react-i18next");
const getTranslation_1 = require("../../../../utilities/getTranslation");
const Drawer_1 = require("../Drawer");
const useRelatedCollections_1 = require("../../forms/field-types/Relationship/AddNew/useRelatedCollections");
const EditDepth_1 = require("../../utilities/EditDepth");
const DrawerContent_1 = require("./DrawerContent");
require("./index.scss");
exports.baseClass = 'doc-drawer';
const formatDocumentDrawerSlug = ({ collectionSlug, id, depth, uuid, }) => `doc-drawer_${collectionSlug}_${depth}${id ? `_${id}` : ''}_${uuid}`;
const DocumentDrawerToggler = ({ children, className, drawerSlug, id, collectionSlug, disabled, ...rest }) => {
    const { t, i18n } = (0, react_i18next_1.useTranslation)(['fields', 'general']);
    const [collectionConfig] = (0, useRelatedCollections_1.useRelatedCollections)(collectionSlug);
    return (react_1.default.createElement(Drawer_1.DrawerToggler, { slug: drawerSlug, className: [
            className,
            `${exports.baseClass}__toggler`,
        ].filter(Boolean).join(' '), disabled: disabled, "aria-label": t(!id ? 'fields:addNewLabel' : 'general:editLabel', { label: (0, getTranslation_1.getTranslation)(collectionConfig.labels.singular, i18n) }), ...rest }, children));
};
exports.DocumentDrawerToggler = DocumentDrawerToggler;
const DocumentDrawer = (props) => {
    const { drawerSlug } = props;
    return (react_1.default.createElement(Drawer_1.Drawer, { slug: drawerSlug, className: exports.baseClass, header: false, gutter: false },
        react_1.default.createElement(DrawerContent_1.DocumentDrawerContent, { ...props })));
};
exports.DocumentDrawer = DocumentDrawer;
const useDocumentDrawer = ({ id, collectionSlug }) => {
    const drawerDepth = (0, EditDepth_1.useEditDepth)();
    const uuid = (0, react_1.useId)();
    const { modalState, toggleModal, closeModal, openModal } = (0, modal_1.useModal)();
    const [isOpen, setIsOpen] = (0, react_1.useState)(false);
    const drawerSlug = formatDocumentDrawerSlug({
        collectionSlug,
        id,
        depth: drawerDepth,
        uuid,
    });
    (0, react_1.useEffect)(() => {
        var _a;
        setIsOpen(Boolean((_a = modalState[drawerSlug]) === null || _a === void 0 ? void 0 : _a.isOpen));
    }, [modalState, drawerSlug]);
    const toggleDrawer = (0, react_1.useCallback)(() => {
        toggleModal(drawerSlug);
    }, [toggleModal, drawerSlug]);
    const closeDrawer = (0, react_1.useCallback)(() => {
        closeModal(drawerSlug);
    }, [closeModal, drawerSlug]);
    const openDrawer = (0, react_1.useCallback)(() => {
        openModal(drawerSlug);
    }, [openModal, drawerSlug]);
    const MemoizedDrawer = (0, react_1.useMemo)(() => {
        return ((props) => (react_1.default.createElement(exports.DocumentDrawer, { ...props, collectionSlug: collectionSlug, id: id, drawerSlug: drawerSlug, key: drawerSlug })));
    }, [id, drawerSlug, collectionSlug]);
    const MemoizedDrawerToggler = (0, react_1.useMemo)(() => {
        return ((props) => (react_1.default.createElement(exports.DocumentDrawerToggler, { ...props, id: id, collectionSlug: collectionSlug, drawerSlug: drawerSlug })));
    }, [id, drawerSlug, collectionSlug]);
    const MemoizedDrawerState = (0, react_1.useMemo)(() => ({
        drawerSlug,
        drawerDepth,
        isDrawerOpen: isOpen,
        toggleDrawer,
        closeDrawer,
        openDrawer,
    }), [drawerDepth, drawerSlug, isOpen, toggleDrawer, closeDrawer, openDrawer]);
    return [
        MemoizedDrawer,
        MemoizedDrawerToggler,
        MemoizedDrawerState,
    ];
};
exports.useDocumentDrawer = useDocumentDrawer;
//# sourceMappingURL=index.js.map