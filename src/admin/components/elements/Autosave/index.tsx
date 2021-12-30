import { useConfig } from '@payloadcms/config-provider';
import { formatDistance } from 'date-fns';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import React, { useCallback, useEffect, useState } from 'react';
import { useWatchForm, useFormModified } from '../../forms/Form/context';
import { useLocale } from '../../utilities/Locale';
import { Props } from './types';
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues';
import buildStateFromSchema from '../../forms/Form/buildStateFromSchema';
import { Field } from '../../../../fields/config/types';

import './index.scss';

const baseClass = 'autosave';

const Autosave: React.FC<Props> = ({ collection, global, id, updatedAt }) => {
  const { serverURL, routes: { api, admin } } = useConfig();
  const { fields, dispatchFields } = useWatchForm();
  const modified = useFormModified();
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>();
  const locale = useLocale();
  const { push } = useHistory();

  const interval = collection.versions.drafts && collection.versions.drafts.autosave ? collection.versions.drafts.autosave.interval : 5;

  const createDoc = useCallback(async () => {
    const res = await fetch(`${serverURL}${api}/${collection.slug}?locale=${locale}&fallback-locale=null&depth=0&autosave=true`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (res.status === 201) {
      const json = await res.json();
      push(`${admin}/collections/${collection.slug}/${json.doc.id}`);
    } else {
      toast.error('There was a problem while autosaving this document.');
    }
  }, [collection, serverURL, api, admin, locale, push]);

  const getLastSaved = useCallback(async () => {
    let url: string;

    if (collection && id) {
      url = `${serverURL}${api}/${collection.slug}/versions?where[parent][equals]=${id}&depth=0`;
    }

    if (global) {
      url = `${serverURL}${api}/globals/${global.slug}/versions?depth=0`;
    }

    if (url) {
      const res = await fetch(url);

      if (res.status === 200) {
        const json = await res.json();

        if (json.docs[0]) {
          return setLastSaved(new Date(json.docs[0].updatedAt).getTime());
        }
      }
    }

    if (updatedAt) return setLastSaved(new Date(updatedAt).getTime());

    return null;
  }, [collection, global, id, api, serverURL, updatedAt]);

  // On mount, check for a recent autosave
  // Need it to store the lastSaved date
  useEffect(() => {
    getLastSaved();
  }, [getLastSaved]);

  useEffect(() => {
    // If no ID, but this is used for a collection doc,
    // Immediately save it and set lastSaved
    if (!id && collection) {
      createDoc();
    }
  }, [id, collection, global, createDoc]);

  // When fields change, autosave
  useEffect(() => {
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
            url = `${serverURL}${api}/${collection.slug}/${id}?autosave=true`;
            method = 'PUT';
            entityFields = collection.fields;
          }

          if (global) {
            url = `${serverURL}${api}/globals/${global.slug}?autosave=true`;
            method = 'POST';
            entityFields = global.fields;
          }

          if (url) {
            setTimeout(() => {
              setSaving(false);
            }, 1000);

            const body = {
              ...reduceFieldsToValues(fields),
              _status: 'draft',
            };

            // TODO:
            // Determine why field values are not present
            // even though we are using useWatchForm
            console.log(body);

            const res = await fetch(url, {
              method,
              body: JSON.stringify(body),
            });

            if (res.status === 200) {
              const json = await res.json();
              const state = await buildStateFromSchema(entityFields, json.doc);
              dispatchFields({ type: 'REPLACE_STATE', state });
              setLastSaved(new Date().getTime());
            }
          }
        }, 1000);
      }
    }
  }, [fields, modified, interval, lastSaved, serverURL, api, collection, global, id, saving, dispatchFields]);

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
