import * as React from 'react';
import useField from '../../../../../src/admin/components/forms/useField';
import { textFieldsSlug } from '../../Text';

export const PrePopulateFieldUI: React.FC<{ path: string, hasMultipleRelations: boolean }> = ({ path, hasMultipleRelations }) => {
  const { setValue } = useField({ path });

  const addDefaults = React.useCallback(() => {
    const fetchRelationDocs = async () => {
      const res = await fetch(`/api/${textFieldsSlug}?limit=20&where[text][contains]=relationship-test`);
      const json = await res.json();
      const docIds = json.docs.map((doc) => {
        if (hasMultipleRelations) {
          return {
            relationTo: textFieldsSlug,
            value: doc.id,
          };
        }

        return doc.id;
      });
      setValue(docIds);
    };

    fetchRelationDocs();
  }, [setValue, hasMultipleRelations]);

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
