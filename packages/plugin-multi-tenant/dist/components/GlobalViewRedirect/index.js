import { headers as getHeaders } from 'next/headers.js';
import { redirect } from 'next/navigation.js';
import { getGlobalViewRedirect } from '../../utilities/getGlobalViewRedirect.js';
export const GlobalViewRedirect = async (args)=>{
    const collectionSlug = args?.collectionSlug;
    if (collectionSlug && args.globalSlugs?.includes(collectionSlug)) {
        const headers = await getHeaders();
        const redirectRoute = await getGlobalViewRedirect({
            slug: collectionSlug,
            basePath: args.basePath,
            docID: args.docID,
            headers,
            payload: args.payload,
            tenantFieldName: args.tenantFieldName,
            tenantsArrayFieldName: args.tenantArrayFieldName,
            tenantsArrayTenantFieldName: args.tenantArrayTenantFieldName,
            tenantsCollectionSlug: args.tenantsCollectionSlug,
            useAsTitle: args.useAsTitle,
            user: args.user,
            userHasAccessToAllTenants: args.userHasAccessToAllTenants,
            view: args.viewType
        });
        if (redirectRoute) {
            redirect(redirectRoute);
        }
    }
};

//# sourceMappingURL=index.js.map