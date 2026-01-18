export const SlateRelationshipConverter = {
  converter({
    slateNode
  }) {
    return {
      type: 'relationship',
      format: '',
      relationTo: slateNode.relationTo,
      value: slateNode?.value?.id || '',
      version: 2
    };
  },
  nodeTypes: ['relationship']
};
//# sourceMappingURL=converter.js.map