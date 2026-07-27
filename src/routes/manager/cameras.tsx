import { useState } from 'react';
import { VideoOff, SignalHigh } from 'lucide-react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { PreviewBadge } from '@/components/naqsha/PreviewBadge';
import { cn } from '@/lib/utils';
import { clock } from '@/lib/format';
import { useNow } from '@/hooks/useNow';
import { CAMERAS, CAMERA_STREAM_KIND, type CameraConfig } from '@/lib/cameras';

const LAYOUTS = ['Grid 2×2', 'Focus + strip', 'Single'];

type TileStatus = 'unconfigured' | 'connecting' | 'live' | 'offline';

function CameraTile({ cam }: { cam: CameraConfig }) {
  const configured = cam.streamUrl.trim().length > 0;
  const [status, setStatus] = useState<TileStatus>(configured ? 'connecting' : 'unconfigured');

  return (
    <div className="relative overflow-hidden rounded border border-ink-3 bg-black">
      {configured ? (
        CAMERA_STREAM_KIND === 'mjpeg' ? (
          <img
            src={cam.streamUrl}
            alt={`${cam.name} live view`}
            className="h-full w-full object-cover"
            onLoad={() => setStatus('live')}
            onError={() => setStatus('offline')}
          />
        ) : (
          <video
            src={cam.streamUrl}
            className="h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            onPlaying={() => setStatus('live')}
            onWaiting={() => setStatus('connecting')}
            onError={() => setStatus('offline')}
            onStalled={() => setStatus('offline')}
          />
        )
      ) : null}

      {/* Overlay: honest per-tile status — no fake LIVE badge */}
      {status !== 'live' && (
        <div className="absolute inset-0 grid place-items-center bg-ink-2/60 text-center">
          <div className="px-4">
            <VideoOff size={22} className="mx-auto text-muted-2" />
            <div className="mt-2 text-[13px] font-medium text-paper-4">
              {status === 'unconfigured' && 'Stream not configured'}
              {status === 'connecting' && 'Connecting…'}
              {status === 'offline' && 'No signal'}
            </div>
            {status === 'unconfigured' && (
              <div className="mt-1 text-[11px] text-muted-2">Set VITE_CAM URL for {cam.id}</div>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <div className="font-display text-[13px] font-semibold text-paper drop-shadow">{cam.name}</div>
        {status === 'live' && (
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-ink/70 px-2 py-[3px] text-[10px] font-medium text-paper backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alert" />
            LIVE
          </span>
        )}
      </div>
      <div className="absolute bottom-3 left-3 font-mono text-[10px] text-paper-4/70 drop-shadow">{cam.id}</div>
    </div>
  );
}

export default function ManagerCameras() {
  const now = useNow();
  const [layout, setLayout] = useState(LAYOUTS[0]);
  const time = clock(new Date(now));
  const configuredCount = CAMERAS.filter((c) => c.streamUrl.trim().length > 0).length;

  return (
    <ManagerShell
      theme="dark"
      title="Cameras"
      right={
        <>
          <PreviewBadge />
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-line-2">
            <SignalHigh size={14} className="text-saffron" />
            {configuredCount}/{CAMERAS.length} configured · {CAMERA_STREAM_KIND.toUpperCase()}
          </span>
          <span className="font-mono text-[11px] text-line-2">{time}</span>
        </>
      }
    >
      <div className="flex flex-1 flex-col overflow-hidden bg-ink px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-1 rounded bg-ink-3 p-[3px]">
            {LAYOUTS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                className={cn(
                  'rounded-sm px-3 py-1.5 text-[12px] font-medium',
                  l === layout ? 'bg-ink text-saffron' : 'text-line-2',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
          {CAMERAS.map((cam) => (
            <CameraTile key={cam.id} cam={cam} />
          ))}
        </div>

        {configuredCount === 0 && (
          <div className="mt-4 rounded border border-ink-3 bg-white/[0.03] px-4 py-3 text-[12px] text-line-2">
            No camera streams configured yet. Point <span className="font-mono text-paper">VITE_CAM1_URL…VITE_CAM4_URL</span>{' '}
            at your MediaMTX/go2rtc gateway — see <span className="font-mono text-paper">docs/CAMERA_HIKVISION_SETUP.md</span>.
          </div>
        )}
      </div>
    </ManagerShell>
  );
}
