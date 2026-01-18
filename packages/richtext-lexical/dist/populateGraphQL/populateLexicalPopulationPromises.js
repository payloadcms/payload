import { recurseNodes } from '../utilities/forEachNodeRecursively.js';
/**
 * Appends all new populationPromises to the populationPromises prop
 */
export const populateLexicalPopulationPromises = ({
  context,
  currentDepth,
  depth,
  draft,
  editorPopulationPromises,
  field,
  fieldPromises,
  findMany,
  flattenLocales,
  overrideAccess,
  parentIsLocalized,
  populationPromises,
  req,
  showHiddenFields,
  siblingDoc
}) => {
  const shouldPopulate = depth && currentDepth <= depth;
  if (!shouldPopulate) {
    return;
  }
  recurseNodes({
    callback: node => {
      const editorPopulationPromisesOfNodeType = editorPopulationPromises?.get(node.type);
      if (editorPopulationPromisesOfNodeType) {
        for (const promise of editorPopulationPromisesOfNodeType) {
          promise({
            context,
            currentDepth: currentDepth,
            depth,
            draft,
            editorPopulationPromises,
            field,
            fieldPromises,
            findMany,
            flattenLocales,
            node,
            overrideAccess: overrideAccess,
            parentIsLocalized,
            populationPromises,
            req,
            showHiddenFields,
            siblingDoc
          });
        }
      }
    },
    nodes: siblingDoc[field?.name]?.root?.children ?? []
  });
};
//# sourceMappingURL=populateLexicalPopulationPromises.js.map