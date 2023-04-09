import { Action, State } from './types';
export declare const defaultLoadingOverlayState: {
    isLoading: boolean;
    overlayType: any;
    loaders: any[];
    loadingText: string;
};
export declare const reducer: (state: State, action: Action) => State;
