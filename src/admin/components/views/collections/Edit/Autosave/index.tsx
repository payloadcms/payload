import React, { useEffect, useState } from 'react';
import { SanitizedCollectionConfig } from '../../../../../../collections/config/types';
import { useWatchForm, useFormModified } from '../../../../forms/Form/context';

const Autosave: React.FC<{ collection: SanitizedCollectionConfig}> = ({ collection }) => {
  const { fields } = useWatchForm();
  const modified = useFormModified();
  const [lastSaved, setLastSaved] = useState(() => {
    const date = new Date();
    date.setSeconds(date.getSeconds() - 2);
    return date.getTime();
  });

  const interval = collection.versions.drafts && collection.versions.drafts.autosave ? collection.versions.drafts.autosave.interval : 5;

  useEffect(() => {
    const lastSavedDate = new Date(lastSaved);
    lastSavedDate.setSeconds(lastSavedDate.getSeconds() + interval);
    const timeToSaveAgain = lastSavedDate.getTime();

    if (Date.now() >= timeToSaveAgain && modified) {
      setTimeout(() => {
        console.log('Autosaving');
      }, 1000);
      setLastSaved(new Date().getTime());
    }
  }, [modified, fields, interval, lastSaved]);

  return null;
};

export default Autosave;
