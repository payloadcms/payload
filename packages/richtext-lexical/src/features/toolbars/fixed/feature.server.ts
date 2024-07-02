// eslint-disable-next-line payload/no-imports-from-exports-dir
import { FixedToolbarFeatureClient } from '../../../exports/client/index.js'
import { createServerFeature } from '../../../utilities/createServerFeature.js'

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
      disableIfParentHasFixedToolbar:
        props?.disableIfParentHasFixedToolbar === undefined
          ? false
          : props.disableIfParentHasFixedToolbar,
    }

    return {
      ClientFeature: FixedToolbarFeatureClient,
      clientFeatureProps: sanitizedProps,
      sanitizedServerFeatureProps: sanitizedProps,
    }
  },
  key: 'toolbarFixed',
})
