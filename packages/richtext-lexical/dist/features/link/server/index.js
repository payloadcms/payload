import escapeHTML from 'escape-html';
import { sanitizeFields } from 'payload';
import { createServerFeature } from '../../../utilities/createServerFeature.js';
import { convertLexicalNodesToHTML } from '../../converters/lexicalToHtml_deprecated/converter/index.js';
import { createNode } from '../../typeUtilities.js';
import { LinkMarkdownTransformer } from '../markdownTransformer.js';
import { AutoLinkNode } from '../nodes/AutoLinkNode.js';
import { LinkNode } from '../nodes/LinkNode.js';
import { linkPopulationPromiseHOC } from './graphQLPopulationPromise.js';
import { i18n } from './i18n.js';
import { transformExtraFields } from './transformExtraFields.js';
import { linkValidation } from './validate.js';
export const LinkFeature = createServerFeature({
  feature: async ({
    config: _config,
    isRoot,
    parentIsLocalized,
    props
  }) => {
    if (!props) {
      props = {};
    }
    const validRelationships = _config.collections.map(c => c.slug) || [];
    const _transformedFields = transformExtraFields(props.fields ? props.fields : null, _config, props.enabledCollections, props.disabledCollections, props.maxDepth);
    const sanitizedFields = await sanitizeFields({
      config: _config,
      fields: _transformedFields,
      parentIsLocalized,
      requireFieldLevelRichTextEditor: isRoot,
      validRelationships
    });
    props.fields = sanitizedFields;
    // the text field is not included in the node data.
    // Thus, for tasks like validation, we do not want to pass it a text field in the schema which will never have data.
    // Otherwise, it will cause a validation error (field is required).
    const sanitizedFieldsWithoutText = sanitizedFields.filter(field => !('name' in field) || field.name !== 'text');
    let linkTypeField = null;
    let linkURLField = null;
    for (const field of sanitizedFields) {
      if ('name' in field && field.name === 'linkType') {
        linkTypeField = field;
      }
      if ('name' in field && field.name === 'url') {
        linkURLField = field;
      }
    }
    const defaultLinkType = linkTypeField ? 'defaultValue' in linkTypeField && typeof linkTypeField.defaultValue === 'string' ? linkTypeField.defaultValue : 'custom' : undefined;
    const defaultLinkURL = linkURLField ? 'defaultValue' in linkURLField && typeof linkURLField.defaultValue === 'string' ? linkURLField.defaultValue : 'https://' : undefined;
    return {
      ClientFeature: '@payloadcms/richtext-lexical/client#LinkFeatureClient',
      clientFeatureProps: {
        defaultLinkType,
        defaultLinkURL,
        disableAutoLinks: props.disableAutoLinks,
        disabledCollections: props.disabledCollections,
        enabledCollections: props.enabledCollections
      },
      generateSchemaMap: () => {
        if (!sanitizedFields || !Array.isArray(sanitizedFields) || sanitizedFields.length === 0) {
          return null;
        }
        const schemaMap = new Map();
        schemaMap.set('fields', {
          fields: sanitizedFields
        });
        return schemaMap;
      },
      i18n,
      markdownTransformers: [LinkMarkdownTransformer],
      nodes: [props?.disableAutoLinks === true ? null : createNode({
        converters: {
          html: {
            converter: async ({
              converters,
              currentDepth,
              depth,
              draft,
              node,
              overrideAccess,
              parent,
              req,
              showHiddenFields
            }) => {
              const childrenText = await convertLexicalNodesToHTML({
                converters,
                currentDepth,
                depth,
                draft,
                lexicalNodes: node.children,
                overrideAccess,
                parent: {
                  ...node,
                  parent
                },
                req,
                showHiddenFields
              });
              let href = node.fields.url ?? '';
              if (node.fields.linkType === 'internal') {
                href = typeof node.fields.doc?.value !== 'object' ? String(node.fields.doc?.value) : String(node.fields.doc?.value?.id);
              }
              return `<a href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`;
            },
            nodeTypes: [AutoLinkNode.getType()]
          }
        },
        node: AutoLinkNode,
        // Since AutoLinkNodes are just internal links, they need no hooks or graphQL population promises
        validations: [linkValidation(props, sanitizedFieldsWithoutText)]
      }), createNode({
        converters: {
          html: {
            converter: async ({
              converters,
              currentDepth,
              depth,
              draft,
              node,
              overrideAccess,
              parent,
              req,
              showHiddenFields
            }) => {
              const childrenText = await convertLexicalNodesToHTML({
                converters,
                currentDepth,
                depth,
                draft,
                lexicalNodes: node.children,
                overrideAccess,
                parent: {
                  ...node,
                  parent
                },
                req,
                showHiddenFields
              });
              const href = node.fields.linkType === 'custom' ? escapeHTML(node.fields.url) : node.fields.doc?.value;
              return `<a href="${href}"${node.fields.newTab ? ' rel="noopener noreferrer" target="_blank"' : ''}>${childrenText}</a>`;
            },
            nodeTypes: [LinkNode.getType()]
          }
        },
        getSubFields: () => {
          return sanitizedFieldsWithoutText;
        },
        getSubFieldsData: ({
          node
        }) => {
          return node?.fields;
        },
        graphQLPopulationPromises: [linkPopulationPromiseHOC(props)],
        node: LinkNode,
        validations: [linkValidation(props, sanitizedFieldsWithoutText)]
      })].filter(Boolean),
      sanitizedServerFeatureProps: props
    };
  },
  key: 'link'
});
//# sourceMappingURL=index.js.map