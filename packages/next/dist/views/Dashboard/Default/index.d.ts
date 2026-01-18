import type { groupNavItems } from '@payloadcms/ui/shared';
import type { AdminViewServerPropsOnly, ClientUser, Locale } from 'payload';
import React from 'react';
export type DashboardViewClientProps = {
    locale: Locale;
};
export type DashboardViewServerPropsOnly = {
    globalData: Array<{
        data: {
            _isLocked: boolean;
            _lastEditedAt: string;
            _userEditing: ClientUser | number | string;
        };
        lockDuration?: number;
        slug: string;
    }>;
    /**
     * @deprecated
     * This prop is deprecated and will be removed in the next major version.
     * Components now import their own `Link` directly from `next/link`.
     */
    Link?: React.ComponentType;
    navGroups?: ReturnType<typeof groupNavItems>;
} & AdminViewServerPropsOnly;
export type DashboardViewServerProps = DashboardViewClientProps & DashboardViewServerPropsOnly;
export declare function DefaultDashboard(props: DashboardViewServerProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map