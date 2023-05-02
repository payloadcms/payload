import React from 'react';
import { Context as ContextType } from './types';
import './index.scss';
declare const StepNavProvider: React.FC<{
    children?: React.ReactNode;
}>;
declare const useStepNav: () => ContextType;
declare const StepNav: React.FC;
export { StepNavProvider, useStepNav, };
export default StepNav;
