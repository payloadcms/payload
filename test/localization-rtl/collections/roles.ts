import type { CollectionConfig } from '../../../src/collections/config/types';


export const Roles: CollectionConfig = {
  slug: 'roles',
  labels: {
    singular: {
      en: 'Role',
      ar: 'دور',
    },
    plural: {
      en: 'Roles',
      ar: 'أدوار',
    },
  },
  fields: [
    {
      name: 'roleName',
      type: 'text',
      label: {
        en: 'Role Name',
        ar: 'اسم الدور',
      },
      required: true,
      unique: true,
    },
    {
      name: 'permissions',
      type: 'select',
      label: {
        en: 'Permissions',
        ar: 'الصلاحيات',
      },
      admin: {
      },
      options: [
        {
          value: 'read',
          label: {
            en: 'Read',
            ar: 'قراءة',
          },
        },
        {
          value: 'create',
          label: {
            en: 'Create',
            ar: 'إنشاء',
          },
        },
        {
          value: 'update',
          label: {
            en: 'Update',
            ar: 'تعديل',
          },
        },
        {
          value: 'delete',
          label: {
            en: 'Delete',
            ar: 'حذف',
          },
        },
      ],
      hasMany: true,
    },
    {
      name: 'resources',
      type: 'select',
      label: {
        en: 'Resources',
        ar: 'الموارد',
      },
      admin: {
      },
      options: [
        {
          value: 'pages',
          label: {
            en: 'Pages',
            ar: 'الصفحات',
          },
        },
        {
          value: 'rooms',
          label: {
            en: 'Rooms',
            ar: 'الغرف',
          },
        },
        {
          value: 'media',
          label: {
            en: 'Media Files',
            ar: 'صور',
          },
        },
        {
          value: 'users',
          label: {
            en: 'Users',
            ar: 'مستخدمين',
          },
        },
        {
          value: 'employees',
          label: {
            en: 'Employees',
            ar: 'موظّفين',
          },
        },
      ],
      hasMany: true,
    },
    {
      name: 'users',
      type: 'relationship',
      label: {
        en: 'Users',
        ar: 'المستخدمون',
      },
      relationTo: 'users',
      hasMany: true,
    },
  ],
};
