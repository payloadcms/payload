import type { FeatureProviderProviderServer } from '../../types.js'

import { FixedToolbarFeatureClientComponent } from './feature.client.js'

export type FixedToolbarFeatureProps = {
  /**
   * @default true
   *
   * If this is enabled, the toolbar will apply to the focused editor, not the editor with the FixedToolbarFeature.
   *
   * This means that if the editor has a child-editor, and the child-editor is focused, the toolbar will apply to the child-editor, not the parent editor with this feature added.
   */
  applyToFocusedEditor?: boolean
  /**
   * @default true
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
          props?.applyToFocusedEditor === undefined ? true : props.applyToFocusedEditor,
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
