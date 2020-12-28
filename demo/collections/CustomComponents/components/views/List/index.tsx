import React from 'react';
import DefaultList from '../../../../../../src/admin/components/views/collections/List/Default';

import './index.scss';

const CustomListView: React.FC = (props) => (
  <div className="custom-list">
    <p>This is a custom Pages list view</p>
    <p>Sup</p>
    <DefaultList {...props} />
  </div>
);

export default CustomListView;
