import PagesArchive from './client/components/collections/Pages/Archive';
import PagesEdit from './client/components/collections/Pages/Edit';

import OrdersArchive from './client/components/collections/Orders/Archive';
import OrdersEdit from './client/components/collections/Orders/Edit';

export default [
  {
    slug: 'pages',
    label: 'Pages',
    singular: 'Page',
    plural: 'Pages',
    archive: PagesArchive,
    edit: PagesEdit
  },
  {
    slug: 'orders',
    label: 'Orders',
    singular: 'Order',
    plural: 'Orders',
    archive: OrdersArchive,
    edit: OrdersEdit
  }
];
