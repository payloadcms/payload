import * as React from 'react';
import useField from '../../../src/admin/components/forms/useField';
import { collection1Slug } from '../collectionSlugs';

export const PrePopulateFieldUI: React.FC<{ path: string, hasMany?: boolean, hasMultipleRelations?: boolean }> = ({ path, hasMany = true, hasMultipleRelations = false }) => {
  const { setValue } = useField({ path });

  const addDefaults = React.useCallback(() => {
    const fetchRelationDocs = async () => {
      const res = await fetch(`/api/${collection1Slug}?limit=20&where[name][contains]=relationship-test`);
      const json = await res.json();
      if (hasMany) {
        const docIds = json.docs.map((doc) => {
          if (hasMultipleRelations) {
            return {
              relationTo: collection1Slug,
              value: doc.id,
            };
          }

          return doc.id;
        });
        setValue(docIds);
      } else {
        // value that does not appear in first 10 docs fetch
        setValue(json.docs[6].id);
      }
    };

    fetchRelationDocs();
  }, [setValue, hasMultipleRelations, hasMany]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      className="pre-populate-field-ui"
    >
      <button
        type="button"
        onClick={addDefaults}
        style={{

        }}
      >
        Add default items
      </button>
    </div>
  );
};
