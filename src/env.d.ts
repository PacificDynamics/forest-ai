/// <reference types="astro/client" />
interface ImportMetaEnv {
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly AWS_REGION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
