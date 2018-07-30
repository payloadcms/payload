import PagesArchive from './client/components/collections/Pages/Archive';
import PagesEdit from './client/components/collections/Pages/Edit';

import OrdersArchive from './client/components/collections/Orders/Archive';
import OrdersEdit from './client/components/collections/Orders/Edit';

export default [
  {
    slug: 'pages',
    archive: PagesArchive,
    edit: PagesEdit
  },
  {
    slug: 'orders',
    archive: OrdersArchive,
    edit: OrdersEdit
  }
];
