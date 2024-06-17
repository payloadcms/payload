import type { FeatureProviderProviderServer } from '../../types.js'

// eslint-disable-next-line payload/no-imports-from-exports-dir
import { FixedToolbarFeatureClientComponent } from '../../../../exports/client/index.js'

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

export const FixedToolbarFeature: FeatureProviderProviderServer<
  FixedToolbarFeatureProps,
  FixedToolbarFeatureProps
> = (props) => {
  return {
    feature: () => {
      const sanitizedProps: FixedToolbarFeatureProps = {
        applyToFocusedEditor:
          props?.applyToFocusedEditor === undefined ? false : props.applyToFocusedEditor,
        disableIfParentHasFixedToolbar:
          props?.disableIfParentHasFixedToolbar === undefined
            ? false
            : props.disableIfParentHasFixedToolbar,
      }

      return {
        ClientComponent: FixedToolbarFeatureClientComponent,
        clientFeatureProps: sanitizedProps,
        serverFeatureProps: sanitizedProps,
      }
    },
    key: 'toolbarFixed',
    serverFeatureProps: props,
  }
}
