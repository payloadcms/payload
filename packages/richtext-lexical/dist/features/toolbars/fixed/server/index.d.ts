import type { CustomGroups } from '../../types.js';
export type FixedToolbarFeatureProps = {
    /**
     * @default false
     *
     * If this is enabled, the toolbar will apply to the focused editor, not the editor with the FixedToolbarFeature.
     *
     * This means that if the editor has a child-editor, and the child-editor is focused, the toolbar will apply to the child-editor, not the parent editor with this feature added.
     */
    applyToFocusedEditor?: boolean;
    /**
     * Custom configurations for toolbar groups
     * Key is the group key (e.g. 'format', 'indent', 'align')
     * Value is a partial ToolbarGroup object that will be merged with the default configuration
     *
     * @note Props passed via customGroups must be serializable. Avoid using functions or dynamic components.
     * ChildComponent, if provided, must be a serializable server component.
     */
    customGroups?: CustomGroups;
    /**
     * @default false
     *
     * If there is a parent editor with a fixed toolbar, this will disable the toolbar for this editor.
     */
    disableIfParentHasFixedToolbar?: boolean;
};
export declare const FixedToolbarFeature: import("../../../typesServer.js").FeatureProviderProviderServer<FixedToolbarFeatureProps, FixedToolbarFeatureProps, FixedToolbarFeatureProps>;
//# sourceMappingURL=index.d.ts.map