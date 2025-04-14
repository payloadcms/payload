import type { ToolbarGroup } from '../../types.js'

import { createServerFeature } from '../../../../utilities/createServerFeature.js'

export type FixedToolbarFeatureProps = {
  /**
   * @default false
   *
   * If this is enabled, the toolbar will apply to the focused editor, not the editor with the FixedToolbarFeature.
   *
   * This means that if the editor has a child-editor, and the child-editor is focused, the toolbar will apply to the child-editor, not the parent editor with this feature added.
   */
  applyToFocusedEditor?: boolean
  /**
   * Custom configurations for toolbar groups
   * Key is the group key (e.g. 'format', 'indent', 'align')
   * Value is a partial ToolbarGroup object that will be merged with the default configuration
   */
  customGroups?: Record<string, Partial<ToolbarGroup>>
  /**
   * @default false
   *
   * If there is a parent editor with a fixed toolbar, this will disable the toolbar for this editor.
   */
  disableIfParentHasFixedToolbar?: boolean
}

export const FixedToolbarFeature = createServerFeature<
  FixedToolbarFeatureProps,
  FixedToolbarFeatureProps,
  FixedToolbarFeatureProps
>({
  feature: ({ props }) => {
    const sanitizedProps: FixedToolbarFeatureProps = {
      applyToFocusedEditor:
        props?.applyToFocusedEditor === undefined ? false : props.applyToFocusedEditor,
      customGroups: props?.customGroups,
      disableIfParentHasFixedToolbar:
        props?.disableIfParentHasFixedToolbar === undefined
          ? false
          : props.disableIfParentHasFixedToolbar,
    }

    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient',
      clientFeatureProps: sanitizedProps,
      sanitizedServerFeatureProps: sanitizedProps,
    }
  },
  key: 'toolbarFixed',
})
