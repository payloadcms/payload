import React from 'react';
import DefaultTemplate from '../../layout/DefaultTemplate';

const MediaLibrary = () => {
  return (
    <DefaultTemplate
      className="media-library"
      stepNav={[{
        label: 'Media Library',
      }]}
    >
      <h1>Media Library</h1>
    </DefaultTemplate>
  );
};

export default MediaLibrary;
