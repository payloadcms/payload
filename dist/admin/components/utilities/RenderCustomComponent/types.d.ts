import React from 'react';
export type Props = {
    CustomComponent: React.ComponentType<any>;
    DefaultComponent: React.ComponentType<any>;
    componentProps?: Record<string, unknown>;
};
