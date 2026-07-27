# Naqsha — Hikvision Camera Streaming Setup

> How the **Cameras** screen (`/manager/cameras`) shows live CCTV inside the app.
> The frontend never talks to a camera directly — it plays a browser-friendly stream
> published by a small **media gateway** on your LAN. This doc is the whole pipeline
> plus the exact env vars the app reads.

---

## 1 · The pipeline

```
Hikvision cameras ──▶ NVR / DVR ──HDMI out──▶ HDMI capture card ──▶ media host
                                                                       │
                                              MediaMTX / go2rtc (restreamer)
                                                                       │
                                        HLS (.m3u8) / WebRTC / MJPEG over HTTP(S)
                                                                       │
                                          Naqsha  /manager/cameras  <video>/<img>
```

Two ways to get the video off the cameras — pick one:

**A. HDMI capture (what you asked for).** The Hikvision NVR/DVR outputs its live
mosaic (or a single camera) over **HDMI**. A USB/PCIe **HDMI capture card** on the media
host turns that into a V4L2/`/dev/video*` device. A restreamer reads that device and
publishes a browser stream. Simplest wiring, but the browser sees whatever layout the
NVR outputs (often a fixed grid), so per-camera tiles are limited.

**B. RTSP per camera (recommended if you want independent tiles).** Every Hikvision
camera/NVR also exposes an **RTSP** URL per channel. The restreamer pulls each RTSP
channel and publishes one browser stream **per camera**, which maps cleanly to the four
tiles in the UI. You can run both (HDMI for a wall mosaic, RTSP for named tiles).

Hikvision RTSP URL shape (confirm on your model/firmware):

```
rtsp://<user>:<pass>@<nvr-ip>:554/Streaming/Channels/<chan><stream>
# chan = camera number; stream = 01 main / 02 sub. e.g. channel 1 sub-stream:
rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/102
```

> Use the **sub-stream** (…02) for the grid — lower resolution = far less browser CPU.
> Switch to the main stream only for a single full-screen tile.

---

## 2 · The media gateway (browsers can't play RTSP)

Browsers cannot play RTSP or H.265/HEVC reliably. Put a restreamer in front. Two good,
free options:

### go2rtc (simplest, does HDMI + RTSP, outputs WebRTC/MSE/MJPEG/HLS)
`go2rtc.yaml`:
```yaml
streams:
  cam1: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/102   # Kitchen
  cam2: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/202   # Counter
  cam3: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/302   # Seating
  cam4: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/402   # Entrance
  # HDMI capture card instead of / in addition to RTSP:
  # hdmi: ffmpeg:device?video=/dev/video0#video=h264
```
Browser URLs it exposes: `http://<host>:1984/api/stream.m3u8?src=cam1` (HLS),
`http://<host>:1984/api/stream.mp4?src=cam1` (MSE), or the WebRTC endpoint.

### MediaMTX (a.k.a. rtsp-simple-server) — great HLS output
`mediamtx.yml`:
```yaml
paths:
  cam1:
    source: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/102
  cam2:
    source: rtsp://admin:pass@192.168.1.64:554/Streaming/Channels/202
```
HLS URL: `http://<host>:8888/cam1/index.m3u8`.

Run either as a systemd service or a container on the media host. Cameras stay on the
**camera VLAN**; only the gateway is reachable from the POS/console network.

---

## 3 · What the frontend expects

`src/lib/cameras.ts` reads these Vite env vars (put them in `.env` / `.env.local`, then
restart `npm run dev` or rebuild):

```bash
# How the gateway publishes the streams the app will play:
VITE_CAM_KIND=hls            # hls | webrtc | mjpeg

# One browser-playable URL per camera (from §2). Empty = tile shows "not configured".
VITE_CAM1_URL=http://192.168.1.10:8888/cam1/index.m3u8
VITE_CAM2_URL=http://192.168.1.10:8888/cam2/index.m3u8
VITE_CAM3_URL=http://192.168.1.10:8888/cam3/index.m3u8
VITE_CAM4_URL=http://192.168.1.10:8888/cam4/index.m3u8
```

- Names/ids of the four tiles are in `src/lib/cameras.ts` (`CAMERAS`) — edit them to
  match your physical layout.
- The tile shows an honest status: **Stream not configured** (no URL) → **Connecting…**
  → **LIVE** (on `playing`) → **No signal** (on error/stall). There is **no fake feed**.

### HLS in Chrome/Edge needs a helper
`<video src="…m3u8">` plays natively in **Safari** only. For Chrome/Edge/Firefox, HLS
needs **hls.js** (MSE). When you go live, either:

1. Prefer **WebRTC** (`VITE_CAM_KIND=webrtc`, go2rtc) — lowest latency, no extra lib for
   modern browsers; or
2. Add `hls.js` and attach it in `CameraTile` when `CAMERA_STREAM_KIND==='hls'`:

```ts
import Hls from 'hls.js';
// inside CameraTile, when the <video> mounts and kind === 'hls':
if (Hls.isSupported()) { const hls = new Hls(); hls.loadSource(cam.streamUrl); hls.attachMedia(videoEl); }
else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) { videoEl.src = cam.streamUrl; } // Safari
```

`MJPEG` (`VITE_CAM_KIND=mjpeg`) plays with a plain `<img>` and needs no helper — a good
zero-dependency fallback for a couple of low-FPS tiles.

---

## 4 · Security & ops checklist

- **Isolate cameras** on their own VLAN; expose only the gateway to the console network.
- Serve the gateway over **HTTPS** if the app is served over HTTPS (mixed content is
  blocked). Terminate TLS at the gateway or a reverse proxy.
- Don't put camera credentials in frontend env — they live only in the **gateway config**
  on the server. `VITE_CAM*_URL` should point at the gateway, never at `rtsp://…@camera`.
- Recording/retention/motion, PTZ, and any analytics (e.g. YOLO) belong to the
  **NVR/gateway**, not this app — the app is a viewer. (The earlier mock's storage/CPU/YOLO
  stats were placeholders and were removed.)
- Sub-streams for the grid; cap the grid to 4 tiles to keep decode load sane on the
  console machine.
