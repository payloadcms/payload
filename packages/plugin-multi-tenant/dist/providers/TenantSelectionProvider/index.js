import { jsx as _jsx } from "react/jsx-runtime";
import { cookies as getCookies } from 'next/headers.js';
import { getTenantOptions } from '../../utilities/getTenantOptions.js';
import { TenantSelectionProviderClient } from './index.client.js';
export const TenantSelectionProvider = async ({ children, payload, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, user, userHasAccessToAllTenants })=>{
    const tenantOptions = await getTenantOptions({
        payload,
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName,
        tenantsCollectionSlug,
        useAsTitle,
        user,
        userHasAccessToAllTenants
    });
    const cookies = await getCookies();
    const tenantCookie = cookies.get('payload-tenant')?.value;
    let initialValue = undefined;
    /**
   * Ensure the cookie is a valid tenant
   */ if (tenantCookie) {
        const matchingOption = tenantOptions.find((option)=>String(option.value) === tenantCookie);
        if (matchingOption) {
            initialValue = matchingOption.value;
        }
    }
    /**
   * If the there was no cookie or the cookie was an invalid tenantID set intialValue
   */ if (!initialValue) {
        initialValue = tenantOptions.length > 1 ? undefined : tenantOptions[0]?.value;
    }
    return /*#__PURE__*/ _jsx(TenantSelectionProviderClient, {
        initialTenantOptions: tenantOptions,
        initialValue: initialValue,
        tenantsCollectionSlug: tenantsCollectionSlug,
        children: children
    });
};

//# sourceMappingURL=index.js.map