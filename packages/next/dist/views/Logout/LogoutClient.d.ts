import React from 'react';
import './index.scss';
/**
 * This component should **just** be the inactivity route and do nothing with logging the user out.
 *
 * It currently handles too much, the auth provider should just log the user out and then
 * we could remove the useEffect in this file. So instead of the logout button
 * being an anchor link, it should be a button that calls `logOut` in the provider.
 *
 * This view is still useful if cookies attempt to refresh and fail, i.e. the user
 * is logged out due to inactivity.
 */
export declare const LogoutClient: React.FC<{
    adminRoute: string;
    inactivity?: boolean;
    redirect: string;
}>;
//# sourceMappingURL=LogoutClient.d.ts.map