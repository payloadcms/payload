export const SlateUploadConverter = {
  converter({
    slateNode
  }) {
    return {
      type: 'upload',
      fields: {
        ...slateNode.fields
      },
      format: '',
      relationTo: slateNode.relationTo,
      value: slateNode.value?.id || '',
      version: 2
    };
  },
  nodeTypes: ['upload']
};
//# sourceMappingURL=converter.js.map