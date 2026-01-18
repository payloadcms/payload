import { jsx as _jsx } from "react/jsx-runtime";
import { TenantSelectorClient } from './index.client.js';
export const TenantSelector = (props)=>{
    const { label, viewType } = props;
    return /*#__PURE__*/ _jsx(TenantSelectorClient, {
        label: label,
        viewType: viewType
    });
};

//# sourceMappingURL=index.js.map