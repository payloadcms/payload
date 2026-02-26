// @ts-ignore - ambient type declarations
import './payload-types.d.ts'

const validField: FieldConfig = {
  name: 'test',
  type: 'text',
  admin: {
    components: {
      Field: '/components/MyField.tsx#MyField',
      Label: '/components/MyField.tsx#MyLabel',
    },
  },
}

const invalidPath: FieldConfig = {
  name: 'broken',
  type: 'text',
  admin: {
    components: {
      Field: '/components/DoesNotExist.tsx#Nope',
    },
  },
}

const invalidExport: FieldConfig = {
  name: 'wrongExport',
  type: 'text',
  admin: {
    components: {
      Field: '/components/MyField.tsx#WrongExport',
    },
  },
}

const defaultExport: FieldConfig = {
  name: 'defaultExport',
  type: 'text',
  admin: {
    components: {
      Field: '/components/views/CustomView/index.tsx',
    },
  },
}

const objectForm: FieldConfig = {
  name: 'objectForm',
  type: 'text',
  admin: {
    components: {
      Field: {
        exportName: 'MyField',
        path: '/components/MyField.tsx',
      },
    },
  },
}

const objectFormInvalidExport: FieldConfig = {
  name: 'objectFormBad',
  type: 'text',
  admin: {
    components: {
      Field: {
        exportName: 'DoesNotExist',
        path: '/components/MyField.tsx',
      },
    },
  },
}

const objectFormWithHash: FieldConfig = {
  name: 'objectFormHash',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '/components/MyField.tsx#MyField',
      },
    },
  },
}

const objectFormDirIndex: FieldConfig = {
  name: 'objectFormDirIndex',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '/components/views/CustomView#CustomView',
      },
    },
  },
}

const noDefaultExport: FieldConfig = {
  name: 'noDefault',
  type: 'text',
  admin: {
    components: {
      Field: '/components/icons/Icon',
    },
  },
}

const noDefaultExportObjectForm: FieldConfig = {
  name: 'noDefaultObj',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '/components/icons/Icon',
      },
    },
  },
}

const objectFormWithExportName: FieldConfig = {
  name: 'withExportName',
  type: 'text',
  admin: {
    components: {
      Field: {
        exportName: 'Icon',
        path: '/components/icons/Icon',
      },
    },
  },
}

const adminConfig: AdminConfig = {
  components: {
    actions: ['/components/MyField.tsx#MyField'],
    Nav: '/components/MyField.tsx#MyField',
    views: {
      custom: {
        Component: '/components/views/CustomView/index.tsx#CustomView',
        path: '/custom',
      },
    },
  },
}
