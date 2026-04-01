declare type RawPayloadComponent = {
  clientProps?: object
  exportName?: string
  path: string
  serverProps?: object
}

declare type PayloadComponent = false | RawPayloadComponent | string

declare type CustomComponent = PayloadComponent

declare interface FieldConfig {
  admin?: {
    components?: {
      Cell?: PayloadComponent
      Description?: PayloadComponent
      Field?: PayloadComponent
      Label?: PayloadComponent
    }
  }
  name: string
  type: string
}

declare interface AdminConfig {
  components?: {
    actions?: CustomComponent[]
    graphics?: {
      Icon?: PayloadComponent
      Logo?: PayloadComponent
    }
    Nav?: PayloadComponent
    views?: Record<
      string,
      {
        Component?: PayloadComponent
        path?: string
      }
    >
  }
}
