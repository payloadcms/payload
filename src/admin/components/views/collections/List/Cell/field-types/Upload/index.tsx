import React, { useEffect, useState } from 'react';
import querystring from 'qs';
import { requests } from '../../../../../../../api';
import { useConfig } from '../../../../../../utilities/Config';

const UploadCell = ({ data, field }) => {
  const [cell, setCell] = useState<string>();
  const { routes } = useConfig();

  useEffect(() => {
    const fetchUpload = async () => {
      const params = {
        depth: 0,
        limit: 1,
        where: {
          id: {
            equals: data.id,
          },
        },
      };
      const url = `${routes.api}/${field.relationTo}`;
      const query = querystring.stringify(params, { addQueryPrefix: true });
      const request = await requests.get(`${url}${query}`);
      const result = await request.json();

      if (result?.docs.length === 1) {
        setCell(result.docs[0].filename);
      } else {
        setCell(`Untitled - ${data}`);
      }
    };

    fetchUpload();
    // get the doc
  }, [data, field.relationTo, routes.api]);

  return (

    <React.Fragment>
      <span>
        { cell }
      </span>
    </React.Fragment>
  );
};

export default UploadCell;
