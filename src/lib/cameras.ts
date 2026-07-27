/**
 * Camera stream configuration.
 *
 * Pipeline: Hikvision cameras → NVR/DVR HDMI-out → USB/PCIe HDMI capture card on
 * the media host → a restreaming gateway (MediaMTX or go2rtc) that publishes a
 * browser-playable stream per camera. The frontend only ever talks to the
 * gateway URLs below — never to the cameras directly (they stay on the LAN).
 *
 * Set the URLs via Vite env vars (see .env / docs/CAMERA_HIKVISION_SETUP.md).
 * Empty URL = not yet configured; the tile shows an honest "not configured"
 * state rather than a fake feed.
 *
 *   VITE_CAM_KIND = hls | webrtc | mjpeg   (how the gateway publishes)
 *   VITE_CAM1_URL … VITE_CAM4_URL          (one per camera)
 */
export type CameraStreamKind = 'hls' | 'webrtc' | 'mjpeg';

export type CameraConfig = {
  id: string;
  name: string;
  /** Gateway URL for this camera (.m3u8 for HLS, MJPEG endpoint, etc.). */
  streamUrl: string;
};

const env = import.meta.env as Record<string, string | undefined>;

export const CAMERA_STREAM_KIND: CameraStreamKind =
  (env.VITE_CAM_KIND as CameraStreamKind) ?? 'hls';

export const CAMERAS: CameraConfig[] = [
  { id: 'CAM-01', name: 'Kitchen · main line', streamUrl: env.VITE_CAM1_URL ?? '' },
  { id: 'CAM-02', name: 'Counter · POS', streamUrl: env.VITE_CAM2_URL ?? '' },
  { id: 'CAM-03', name: 'Seating · front', streamUrl: env.VITE_CAM3_URL ?? '' },
  { id: 'CAM-04', name: 'Entrance · patio', streamUrl: env.VITE_CAM4_URL ?? '' },
];
