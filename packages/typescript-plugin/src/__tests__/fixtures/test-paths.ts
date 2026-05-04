// @ts-ignore - ambient type declarations
import './payload-types.d.ts'

// --- Valid: @/ alias with named export ---
const aliasNamedExport: FieldConfig = {
  name: 'aliasNamed',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/NavIcon#NavIcon',
    },
  },
}

// --- Valid: @/ alias with second named export ---
const aliasSecondExport: FieldConfig = {
  name: 'aliasSecond',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/NavIcon#NavIconSmall',
    },
  },
}

// --- Valid: @/ alias to nested path with default export ---
const aliasDefaultExport: FieldConfig = {
  name: 'aliasDefault',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/ui/Badge',
    },
  },
}

// --- Valid: @/ alias in object form with exportName ---
const aliasObjectForm: FieldConfig = {
  name: 'aliasObj',
  type: 'text',
  admin: {
    components: {
      Field: {
        exportName: 'Badge',
        path: '@/components/ui/Badge',
      },
    },
  },
}

// --- Valid: @/ alias in object form with # in path ---
const aliasObjectHash: FieldConfig = {
  name: 'aliasObjHash',
  type: 'text',
  admin: {
    components: {
      Field: {
        path: '@/components/NavIcon#NavIcon',
      },
    },
  },
}

// --- Invalid: @/ alias with wrong export ---
const aliasWrongExport: FieldConfig = {
  name: 'aliasWrongExport',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/NavIcon#DoesNotExist',
    },
  },
}

// --- Invalid: @/ alias to non-existent file ---
const aliasInvalidPath: FieldConfig = {
  name: 'aliasBadPath',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/NotAFile#Nope',
    },
  },
}

// --- Invalid: @/ alias no default export ---
const aliasNoDefault: FieldConfig = {
  name: 'aliasNoDefault',
  type: 'text',
  admin: {
    components: {
      Field: '@/components/NavIcon',
    },
  },
}

// --- Invalid: @/ alias in object form with wrong exportName ---
const aliasObjectWrongExport: FieldConfig = {
  name: 'aliasObjWrong',
  type: 'text',
  admin: {
    components: {
      Field: {
        exportName: 'Fake',
        path: '@/components/ui/Badge',
      },
    },
  },
}

// --- Valid: @/ alias in array context ---
const aliasInArray: AdminConfig = {
  components: {
    actions: ['@/components/NavIcon#NavIcon'],
    Nav: '@/components/ui/Badge#Badge',
  },
}
