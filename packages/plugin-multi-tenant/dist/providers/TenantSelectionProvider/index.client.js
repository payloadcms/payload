'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { toast, useAuth, useConfig } from '@payloadcms/ui';
import { useRouter } from 'next/navigation.js';
import { formatAdminURL } from 'payload/shared';
import React, { createContext } from 'react';
import { generateCookie } from '../../utilities/generateCookie.js';
const Context = /*#__PURE__*/ createContext({
    entityType: undefined,
    options: [],
    selectedTenantID: undefined,
    setEntityType: ()=>undefined,
    setModified: ()=>undefined,
    setTenant: ()=>null,
    syncTenants: ()=>Promise.resolve(),
    updateTenants: ()=>null
});
const DEFAULT_COOKIE_NAME = 'payload-tenant';
const setTenantCookie = (args)=>{
    const { cookieName = DEFAULT_COOKIE_NAME, value } = args;
    document.cookie = generateCookie({
        name: cookieName,
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        returnCookieAsObject: false,
        value: value || ''
    });
};
const deleteTenantCookie = (args = {})=>{
    const { cookieName = DEFAULT_COOKIE_NAME } = args;
    document.cookie = generateCookie({
        name: cookieName,
        maxAge: -1,
        path: '/',
        returnCookieAsObject: false,
        value: ''
    });
};
const getTenantCookie = (args = {})=>{
    const { cookieName = DEFAULT_COOKIE_NAME } = args;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${cookieName}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift();
    }
    return undefined;
};
export const TenantSelectionProviderClient = ({ children, initialTenantOptions, initialValue, tenantsCollectionSlug })=>{
    const [selectedTenantID, setSelectedTenantID] = React.useState(initialValue);
    const [modified, setModified] = React.useState(false);
    const [entityType, setEntityType] = React.useState(undefined);
    const { user } = useAuth();
    const { config } = useConfig();
    const router = useRouter();
    const userID = React.useMemo(()=>user?.id, [
        user?.id
    ]);
    const prevUserID = React.useRef(userID);
    const userChanged = userID !== prevUserID.current;
    const [tenantOptions, setTenantOptions] = React.useState(()=>initialTenantOptions);
    const selectedTenantLabel = React.useMemo(()=>tenantOptions.find((option)=>option.value === selectedTenantID)?.label, [
        selectedTenantID,
        tenantOptions
    ]);
    const setTenantAndCookie = React.useCallback(({ id, refresh })=>{
        setSelectedTenantID(id);
        if (id !== undefined) {
            setTenantCookie({
                value: String(id)
            });
        } else {
            deleteTenantCookie();
        }
        if (refresh) {
            router.refresh();
        }
    }, [
        router
    ]);
    const setTenant = React.useCallback(({ id, refresh })=>{
        if (id === undefined) {
            if (tenantOptions.length > 1 || tenantOptions.length === 0) {
                // users with multiple tenants can clear the tenant selection
                setTenantAndCookie({
                    id: undefined,
                    refresh
                });
            } else if (tenantOptions[0]) {
                // if there is only one tenant, auto-select that tenant
                setTenantAndCookie({
                    id: tenantOptions[0].value,
                    refresh: true
                });
            }
        } else if (!tenantOptions.find((option)=>option.value === id)) {
            // if the tenant is invalid, set the first tenant as selected
            setTenantAndCookie({
                id: tenantOptions[0]?.value,
                refresh
            });
        } else {
            // if the tenant is in the options, set it as selected
            setTenantAndCookie({
                id,
                refresh
            });
        }
    }, [
        tenantOptions,
        setTenantAndCookie
    ]);
    const syncTenants = React.useCallback(async ()=>{
        try {
            const req = await fetch(formatAdminURL({
                apiRoute: config.routes.api,
                path: `/${tenantsCollectionSlug}/populate-tenant-options`
            }), {
                credentials: 'include',
                method: 'GET'
            });
            const result = await req.json();
            if (result.tenantOptions && userID) {
                setTenantOptions(result.tenantOptions);
                if (result.tenantOptions.length === 1) {
                    setSelectedTenantID(result.tenantOptions[0].value);
                    setTenantCookie({
                        value: String(result.tenantOptions[0].value)
                    });
                }
            }
        } catch (e) {
            toast.error(`Error fetching tenants`);
        }
    }, [
        config.routes.api,
        tenantsCollectionSlug,
        userID
    ]);
    const updateTenants = React.useCallback(({ id, label })=>{
        setTenantOptions((prev)=>{
            return prev.map((currentTenant)=>{
                if (id === currentTenant.value) {
                    return {
                        label,
                        value: id
                    };
                }
                return currentTenant;
            });
        });
        void syncTenants();
    }, [
        syncTenants
    ]);
    React.useEffect(()=>{
        if (userChanged || initialValue && String(initialValue) !== getTenantCookie()) {
            if (userID) {
                // user logging in
                void syncTenants();
            } else {
                // user logging out
                setSelectedTenantID(undefined);
                deleteTenantCookie();
                if (tenantOptions.length > 0) {
                    setTenantOptions([]);
                }
                router.refresh();
            }
            prevUserID.current = userID;
        }
    }, [
        userID,
        userChanged,
        syncTenants,
        tenantOptions,
        initialValue,
        router
    ]);
    /**
   * If there is no initial value, clear the tenant and refresh the router.
   * Needed for stale tenantIDs set as a cookie.
   */ React.useEffect(()=>{
        if (!initialValue) {
            setTenant({
                id: undefined,
                refresh: true
            });
        }
    }, [
        initialValue,
        setTenant
    ]);
    /**
   * If there is no selected tenant ID and the entity type is 'global', set the first tenant as selected.
   * This ensures that the global tenant is always set when the component mounts.
   */ React.useEffect(()=>{
        if (!selectedTenantID && tenantOptions.length > 0 && entityType === 'global') {
            setTenant({
                id: tenantOptions[0]?.value,
                refresh: true
            });
        }
    }, [
        selectedTenantID,
        tenantOptions,
        entityType,
        setTenant
    ]);
    return /*#__PURE__*/ _jsx("span", {
        "data-selected-tenant-id": selectedTenantID,
        "data-selected-tenant-title": selectedTenantLabel,
        children: /*#__PURE__*/ _jsx(Context, {
            value: {
                entityType,
                modified,
                options: tenantOptions,
                selectedTenantID,
                setEntityType,
                setModified,
                setTenant,
                syncTenants,
                updateTenants
            },
            children: children
        })
    });
};
export const useTenantSelection = ()=>React.use(Context);

//# sourceMappingURL=index.client.js.map