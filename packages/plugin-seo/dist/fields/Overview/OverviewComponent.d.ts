import type { UIField } from 'payload';
import React from 'react';
type OverviewProps = {
    descriptionOverrides?: {
        maxLength?: number;
        minLength?: number;
    };
    descriptionPath?: string;
    imagePath?: string;
    titleOverrides?: {
        maxLength?: number;
        minLength?: number;
    };
    titlePath?: string;
} & UIField;
export declare const OverviewComponent: React.FC<OverviewProps>;
export {};
//# sourceMappingURL=OverviewComponent.d.ts.map