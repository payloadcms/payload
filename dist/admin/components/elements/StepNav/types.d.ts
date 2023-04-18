export type StepNavItem = {
    label: Record<string, string> | string;
    url?: string;
};
export type Context = {
    stepNav: StepNavItem[];
    setStepNav: (items: StepNavItem[]) => void;
};
