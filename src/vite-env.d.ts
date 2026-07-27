/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * MUST be empty. The SPA and Frappe share one origin behind nginx (D-06), so every
   * path is relative. An absolute URL here re-introduces cross-origin requests, and
   * the failure is subtle: reads keep working while every mutation dies on CSRF and
   * realtime stops authenticating.
   */
  readonly VITE_API_BASE?: string;
  /**
   * 'false' routes the wired screens at the real backend. The not-yet-wired ERP
   * screens ignore this and pin themselves to mocks — see src/lib/api/erp.ts.
   */
  readonly VITE_USE_MOCKS?: string;
  /**
   * The Frappe site name, e.g. `naqsha_ops.localhost`. Used as the socket.io
   * namespace, which Frappe requires to equal the site name. Do NOT derive this from
   * window.location.hostname — nginx may serve the SPA on a different hostname.
   */
  readonly VITE_SITE_NAME?: string;
  /** Table slug the kiosk orders against. Point at a dedicated "Kiosk" table. */
  readonly VITE_KIOSK_TABLE_SLUG?: string;
  /** How the owner is greeted on the guest feedback page. */
  readonly VITE_OWNER_GREETING?: string;

  // Cameras (v2)
  readonly VITE_CAM_KIND?: string;
  readonly VITE_CAM1_URL?: string;
  readonly VITE_CAM2_URL?: string;
  readonly VITE_CAM3_URL?: string;
  readonly VITE_CAM4_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
