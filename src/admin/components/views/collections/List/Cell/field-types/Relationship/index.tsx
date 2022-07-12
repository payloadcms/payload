import React, { useState, useEffect } from 'react';
import querystring from 'qs';
import { useConfig } from '../../../../../../utilities/Config';
import useIntersect from '../../../../../../../hooks/useIntersect';
import { requests } from '../../../../../../../api';

const RelationshipCell = (props) => {
  const { field, data: cellData } = props;
  const { relationTo } = field;
  const { collections, routes } = useConfig();
  const [data, setData] = useState<string | undefined>();
  const [intersectionRef, entry] = useIntersect();
  const isAboveViewport = entry?.boundingClientRect?.top > 0;

  useEffect(() => {
    const fetchRelations = async () => {
      const relationships: Record<string, string[]> = {};
      const values: Record<string, { relationTo: string, value: string }> = {};
      const ids: string[] = [];
      const promises: Promise<unknown>[] = [];
      if (Array.isArray(cellData)) {
        // hasMany
        cellData.forEach((value) => {
          if (value?.relationTo) {
            // polymorphic
            ids.push(value.value);
            relationships[value.relationTo] = [value.value, ...(relationships[value.relationTo] || [])];
            values[value.value] = { relationTo: value.relationTo, value };
          } else {
            ids.push(value);
            relationships[relationTo] = [value, ...(relationships[relationTo]) || []];
            values[value] = { relationTo, value };
          }
        });
      } else if (typeof cellData === 'object') {
        // polymorphic
        ids.push(cellData.value);
        relationships[cellData?.relationTo] = [cellData.value];
        values[cellData.value] = { relationTo: cellData.relationTo, value: cellData.value };
      } else {
        ids.push(cellData);
        relationships[relationTo] = [cellData];
        values[cellData] = { relationTo, value: cellData };
      }
      const allDocs = [];
      Object.keys(relationships).forEach((key) => {
        const url = `${routes.api}/${key}`;
        const params = {
          depth: 0,
          'where[id][in]': relationships[key],
          limit: 10,
        };
        const query = querystring.stringify(params, { addQueryPrefix: true });
        promises.push(requests.get(`${url}${query}`).then(async (res) => {
          const result = await res.json();
          if (result.docs) {
            allDocs.push(...result.docs);
          }
        }));
      });

      await Promise.all(promises);
      const output = ids.map((id) => {
        const collection = collections.find(({ slug }) => slug === values[id].relationTo);
        const useAsTitle = collection.admin.useAsTitle ? collection.admin.useAsTitle : 'id';
        const doc = allDocs.find((_) => id === _.id);
        if (doc) {
          return doc[useAsTitle];
        }
        // probably 403
        return `Untitled - ${id}`;
      });
      let overflow = '';
      if (allDocs.length < ids.length) {
        overflow = '...';
      }
      setData(`${output.join(', ')}${overflow}`);
    };

    if (!data && cellData && isAboveViewport) {
      fetchRelations();
    }
  }, [data, cellData, relationTo, field, collections, isAboveViewport, routes.api]);

  return (
    <div ref={intersectionRef}>
      {data}
    </div>
  );
};

export default RelationshipCell;
