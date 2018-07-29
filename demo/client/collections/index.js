import PagesArchive from '../components/collections/Pages/Archive';
import PagesEdit from '../components/collections/Pages/Edit';

import OrdersArchive from '../components/collections/Orders/Archive';
import OrdersEdit from '../components/collections/Orders/Edit';

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
