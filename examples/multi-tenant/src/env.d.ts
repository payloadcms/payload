declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URI: string
    PAYLOAD_SECRET: string
    PAYLOAD_PUBLIC_SERVER_URL: string
  }
}
