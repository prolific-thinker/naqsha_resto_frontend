/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the backend API, e.g. https://host/api (no trailing slash). */
  readonly VITE_API_BASE?: string;
  /** 'false' to hit the real API; anything else keeps the in-memory mocks. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
