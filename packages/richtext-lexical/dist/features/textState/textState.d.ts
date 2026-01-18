import type { LexicalEditor, StateConfig } from 'lexical';
import { type StateValues, type TextStateFeatureProps } from './feature.server.js';
export type StateMap = Map<string, {
    stateConfig: StateConfig<string, string | undefined>;
    stateValues: StateValues;
}>;
export declare function registerTextStates(state: TextStateFeatureProps['state']): StateMap;
export declare function setTextState(editor: LexicalEditor, stateMap: StateMap, stateKey: string, value: string | undefined): void;
export declare function StatePlugin({ stateMap }: {
    stateMap: StateMap;
}): null;
//# sourceMappingURL=textState.d.ts.map