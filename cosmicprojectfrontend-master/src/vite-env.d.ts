/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_FILE_BASE_URL?: string;
  readonly VITE_VERCEL_ENV?: string;
  readonly MODE?: string;
  readonly NODE_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
