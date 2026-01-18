import { createServerFeature } from '../../../../utilities/createServerFeature.js';
export const FixedToolbarFeature = createServerFeature({
  feature: ({
    props
  }) => {
    const sanitizedProps = {
      applyToFocusedEditor: props?.applyToFocusedEditor === undefined ? false : props.applyToFocusedEditor,
      customGroups: props?.customGroups,
      disableIfParentHasFixedToolbar: props?.disableIfParentHasFixedToolbar === undefined ? false : props.disableIfParentHasFixedToolbar
    };
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#FixedToolbarFeatureClient',
      clientFeatureProps: sanitizedProps,
      sanitizedServerFeatureProps: sanitizedProps
    };
  },
  key: 'toolbarFixed'
});
//# sourceMappingURL=index.js.map