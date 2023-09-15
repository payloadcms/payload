// Flatten relationships to object with path keys
// for easier retrieval
export const createRelationshipMap = (rawRelationships: unknown): Record<string, Record<string, unknown>[]> => {
  let relationships = {};

  if (Array.isArray(rawRelationships)) {
    relationships = rawRelationships.reduce((res, relation) => {
      const formattedRelation = {
        ...relation,
      };

      delete formattedRelation.path;

      if (!res[relation.path]) res[relation.path] = [];
      res[relation.path].push(formattedRelation);

      return res;
    }, {});
  }

  return relationships;
};
