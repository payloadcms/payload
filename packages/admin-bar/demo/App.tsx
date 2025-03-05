import React from 'react';
import { PayloadAdminBar } from '../src';

const AppDemo: React.FC = () => (
  <div>
    <PayloadAdminBar
      cmsURL="https://fake-cms-url"
      adminPath="/admin"
      apiPath="/api"
      collection="pages"
      id="1"
      devMode
    />
  </div>
);

export default AppDemo;
