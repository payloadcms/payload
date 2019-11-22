import React from 'react';
import SetStepNav from '../../utilities/SetStepNav';

const MediaLibrary = props => {

  return (
    <div className="media-library">
      <SetStepNav nav={[{
        label: 'Media Library'
      }]} />
      <h1>Media Library</h1>
    </div>
  )
}

export default MediaLibrary;
