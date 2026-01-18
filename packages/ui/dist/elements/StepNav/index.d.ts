import React from 'react';
import type { StepNavItem } from './types.js';
import { StepNavProvider, useStepNav } from './context.js';
import './index.scss';
export { SetStepNav } from './SetStepNav.js';
declare const StepNav: React.FC<{
    readonly className?: string;
    readonly CustomIcon?: React.ReactNode;
    /**
     * @deprecated
     * This prop is deprecated and will be removed in the next major version.
     * Components now import their own `Link` directly from `next/link`.
     */
    readonly Link?: React.ComponentType;
}>;
export { StepNav, StepNavItem, StepNavProvider, useStepNav };
//# sourceMappingURL=index.d.ts.map