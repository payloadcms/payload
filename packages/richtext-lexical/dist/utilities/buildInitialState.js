import { fieldSchemasToFormState } from '@payloadcms/ui/forms/fieldSchemasToFormState';
export async function buildInitialState({
  context,
  initialState: initialStateFromArgs,
  nodeData
}) {
  let initialState = initialStateFromArgs ?? {};
  for (const node of nodeData) {
    if ('children' in node) {
      initialState = await buildInitialState({
        context,
        initialState,
        nodeData: node.children
      });
    }
    if (node.type === 'block' || node.type === 'inlineBlock') {
      const blockNode = node;
      const id = blockNode?.fields?.id;
      if (!id) {
        continue;
      }
      const schemaFieldsPath = node.type === 'block' ? `${context.lexicalFieldSchemaPath}.lexical_internal_feature.blocks.lexical_blocks.${blockNode.fields.blockType}.fields` : `${context.lexicalFieldSchemaPath}.lexical_internal_feature.blocks.lexical_inline_blocks.${blockNode.fields.blockType}.fields`;
      // Build form state for the block
      const formStateResult = await fieldSchemasToFormState({
        id: context.id,
        clientFieldSchemaMap: context.clientFieldSchemaMap,
        collectionSlug: context.collectionSlug,
        data: blockNode.fields,
        documentData: context.documentData,
        fields: context.fieldSchemaMap.get(schemaFieldsPath)?.fields,
        fieldSchemaMap: context.fieldSchemaMap,
        initialBlockData: blockNode.fields,
        operation: context.operation,
        permissions: true,
        preferences: context.preferences,
        readOnly: context.disabled,
        renderAllFields: true,
        renderFieldFn: context.renderFieldFn,
        req: context.req,
        schemaPath: schemaFieldsPath
      });
      if (!initialState[id]) {
        initialState[id] = {};
      }
      initialState[id].formState = formStateResult;
      if (node.type === 'block') {
        const currentFieldPreferences = context.preferences?.fields?.[context.field.name];
        const collapsedArray = currentFieldPreferences?.collapsed;
        if (Array.isArray(collapsedArray) && collapsedArray.includes(id)) {
          initialState[id].collapsed = true;
        }
      }
    }
  }
  return initialState;
}
//# sourceMappingURL=buildInitialState.js.map