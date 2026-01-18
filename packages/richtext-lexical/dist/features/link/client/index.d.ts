import type { ExclusiveLinkCollectionsProps } from '../server/index.js';
export type ClientProps = {
    defaultLinkType?: string;
    defaultLinkURL?: string;
    disableAutoLinks?: 'creationOnly' | true;
} & ExclusiveLinkCollectionsProps;
export declare const LinkFeatureClient: import("../../typesClient.js").FeatureProviderProviderClient<ClientProps, ClientProps>;
//# sourceMappingURL=index.d.ts.map