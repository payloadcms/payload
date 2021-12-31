import { useConfig } from '@payloadcms/config-provider';
import { formatDistance } from 'date-fns';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWatchForm, useFormModified } from '../../forms/Form/context';
import { useLocale } from '../../utilities/Locale';
import { Props } from './types';
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { Field } from '../../../../fields/config/types';
import { useDocumentInfo } from '../../utilities/DocumentInfo';

import './index.scss';

const baseClass = 'autosave';

const Autosave: React.FC<Props> = ({ collection, global, id, publishedDocUpdatedAt }) => {
  const { serverURL, routes: { api, admin } } = useConfig();
  const { versions, getVersions } = useDocumentInfo();
  const { fields, dispatchFields } = useWatchForm();
  const modified = useFormModified();
  const locale = useLocale();
  const { push } = useHistory();

  const fieldRef = useRef(fields);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>();

  // Store fields in ref so the autosave func
  // can always retrieve the most to date copies
  // after the timeout has executed
  fieldRef.current = fields;

  const interval = collection.versions.drafts && collection.versions.drafts.autosave ? collection.versions.drafts.autosave.interval : 5;

  const createDoc = useCallback(async () => {
    const res = await fetch(`${serverURL}${api}/${collection.slug}?locale=${locale}&fallback-locale=null&depth=0&draft=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (res.status === 201) {
      const json = await res.json();
      push(`${admin}/collections/${collection.slug}/${json.doc.id}`);
    } else {
      toast.error('There was a problem while autosaving this document.');
    }
  }, [collection, serverURL, api, admin, locale, push]);

  useEffect(() => {
    // If no ID, but this is used for a collection doc,
    // Immediately save it and set lastSaved
    if (!id && collection) {
      createDoc();
    }
  }, [id, collection, global, createDoc]);

  // When fields change, autosave
  useEffect(() => {
    const autosave = async () => {
      if (lastSaved && modified && !saving) {
        const lastSavedDate = new Date(lastSaved);
        lastSavedDate.setSeconds(lastSavedDate.getSeconds() + interval);
        const timeToSaveAgain = lastSavedDate.getTime();

        if (Date.now() >= timeToSaveAgain) {
          setSaving(true);

          setTimeout(async () => {
            let url: string;
            let method: string;
            let entityFields: Field[] = [];

            if (collection && id) {
              url = `${serverURL}${api}/${collection.slug}/${id}?draft=true&autosave=true`;
              method = 'PUT';
              entityFields = collection.fields;
            }

            if (global) {
              url = `${serverURL}${api}/globals/${global.slug}?draft=true&autosave=true`;
              method = 'POST';
              entityFields = global.fields;
            }

            if (url) {
              const body = {
                ...reduceFieldsToValues(fieldRef.current),
                _status: 'draft',
              };

              const res = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
              });

              if (res.status === 200) {
                const json = await res.json();
                const state = await buildStateFromSchema(entityFields, json.doc);
                dispatchFields({ type: 'REPLACE_STATE', state });
                setLastSaved(new Date().getTime());
                getVersions();
              }

              setSaving(false);
            }
          }, 1000);
        }
      }
    };

    autosave();
  }, [fields, modified, interval, lastSaved, serverURL, api, collection, global, id, saving, dispatchFields, getVersions]);

  useEffect(() => {
    if (versions?.docs?.[0]) {
      setLastSaved(new Date(versions.docs[0].updatedAt).getTime());
    } else if (publishedDocUpdatedAt) {
      setLastSaved(new Date(publishedDocUpdatedAt).getTime());
    }
  }, [publishedDocUpdatedAt, versions]);

  return (
    <div className={baseClass}>
      {saving && 'Saving...'}
      {(!saving && lastSaved) && (
        <React.Fragment>
          Last saved&nbsp;
          {formatDistance(new Date(), new Date(lastSaved))}
          &nbsp;ago
        </React.Fragment>
      )}
    </div>
  );
};

export default Autosave;
