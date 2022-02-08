import { useConfig } from '@payloadcms/config-provider';
import { formatDistance } from 'date-fns';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useWatchForm, useFormModified } from '../../forms/Form/context';
import { useLocale } from '../../utilities/Locale';
import { Props } from './types';
import reduceFieldsToValues from '../../forms/Form/reduceFieldsToValues';
import { useDocumentInfo } from '../../utilities/DocumentInfo';
import useDebounce from '../../../hooks/useDebounce';

import './index.scss';

const baseClass = 'autosave';

const Autosave: React.FC<Props> = ({ collection, global, id, publishedDocUpdatedAt }) => {
  const { serverURL, routes: { api, admin } } = useConfig();
  const { versions, getVersions } = useDocumentInfo();
  const { fields, dispatchFields } = useWatchForm();
  const modified = useFormModified();
  const locale = useLocale();
  const { replace } = useHistory();

  let interval = 800;
  if (collection?.versions.drafts && collection.versions?.drafts?.autosave) interval = collection.versions.drafts.autosave.interval;
  if (global?.versions.drafts && global.versions?.drafts?.autosave) interval = global.versions.drafts.autosave.interval;

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number>();
  const debouncedFields = useDebounce(fields, interval);
  const fieldRef = useRef(fields);

  // Store fields in ref so the autosave func
  // can always retrieve the most to date copies
  // after the timeout has executed
  fieldRef.current = fields;

  const createCollectionDoc = useCallback(async () => {
    const res = await fetch(`${serverURL}${api}/${collection.slug}?locale=${locale}&fallback-locale=null&depth=0&draft=true`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (res.status === 201) {
      const json = await res.json();
      replace(`${admin}/collections/${collection.slug}/${json.doc.id}`);
    } else {
      toast.error('There was a problem while autosaving this document.');
    }
  }, [collection, serverURL, api, admin, locale, replace]);

  useEffect(() => {
    // If no ID, but this is used for a collection doc,
    // Immediately save it and set lastSaved
    if (!id && collection) {
      createCollectionDoc();
    }
  }, [id, collection, createCollectionDoc]);

  // When debounced fields change, autosave

  useEffect(() => {
    const autosave = async () => {
      if (modified) {
        setSaving(true);

        let url: string;
        let method: string;

        if (collection && id) {
          url = `${serverURL}${api}/${collection.slug}/${id}?draft=true&autosave=true`;
          method = 'PUT';
        }

        if (global) {
          url = `${serverURL}${api}/globals/${global.slug}?draft=true&autosave=true`;
          method = 'POST';
        }

        if (url) {
          const body = {
            ...reduceFieldsToValues(fieldRef.current),
            _status: 'draft',
          };

          setTimeout(async () => {
            const res = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            });

            setSaving(false);

            if (res.status === 200) {
              setLastSaved(new Date().getTime());
              getVersions();
            }
          }, 1000);
        }
      }
    };

    autosave();
  }, [debouncedFields, modified, serverURL, api, collection, global, id, dispatchFields, getVersions]);

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
