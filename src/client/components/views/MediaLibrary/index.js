import React, { useEffect } from 'react';
import { useStepNav } from '../../modules/StepNav';

const MediaLibrary = () => {
  const { setStepNav } = useStepNav();

  useEffect(() => {
    setStepNav([{
      label: 'Media Library',
    }]);
  }, []);

  return (
    <div className="media-library">
      <h1>Media Library</h1>
    </div>
  );
};

export default MediaLibrary;
