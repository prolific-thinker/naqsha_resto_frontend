import { useEffect, useState } from 'react';
import { ManagerShell } from '@/components/layouts/ManagerShell';
import { cn } from '@/lib/utils';
import { clock } from '@/lib/format';

type Cam = {
  id: string;
  name: string;
  code: string;
  gradient: string;
  yolo?: boolean;
};

// Camera-specific gradients from the mockup — fake feeds until real HLS lands.
const CAMS: Cam[] = [
  {
    id: 'CAM-01',
    name: 'Kitchen · main line',
    code: 'CAM-01 · 4MP · 1080p',
    gradient:
      'radial-gradient(ellipse at 30% 30%, rgba(223,160,43,0.14), transparent 60%), linear-gradient(180deg, #1A2532 0%, #0A0F17 100%)',
    yolo: true,
  },
  {
    id: 'CAM-02',
    name: 'Counter · POS',
    code: 'CAM-02 · 4MP · 1080p',
    gradient: 'linear-gradient(180deg, #1F2A38 0%, #0D131C 100%)',
  },
  {
    id: 'CAM-03',
    name: 'Seating · front',
    code: 'CAM-03 · 4MP · 1080p',
    gradient: 'linear-gradient(180deg, #202B3A 0%, #0F1620 100%)',
  },
  {
    id: 'CAM-04',
    name: 'Entrance · patio',
    code: 'CAM-04 · 4MP · 1080p',
    gradient: 'linear-gradient(180deg, #1B2632 0%, #0B1119 100%)',
  },
];

const LAYOUTS = ['Grid 2×2', 'Focus + strip', 'Single'];

function CamTile({ cam, time }: { cam: Cam; time: string }) {
  return (
    <div className="relative overflow-hidden rounded border border-ink-3 bg-[#0A0F17]">
      <div className="absolute inset-0" style={{ background: cam.gradient }} />
      <div className="absolute inset-x-3 top-3 flex items-start justify-between">
        <div>
          <div className="font-display text-[13px] font-semibold text-paper drop-shadow">
            {cam.name}
          </div>
          <div className="font-mono text-[10px] tracking-ref text-saffron drop-shadow">
            {cam.code}
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-ink/70 px-2 py-[3px] font-mono text-[10px] text-paper backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-alert" />
          LIVE
        </span>
      </div>
      {cam.yolo && (
        <span className="absolute left-3 top-10 rounded-sm bg-success/90 px-1.5 py-[3px] font-mono text-[9px] uppercase tracking-ref text-paper">
          YOLO ready · v2
        </span>
      )}
      <div className="absolute bottom-3 left-3 font-mono text-[10px] text-paper-4/60 drop-shadow">
        15 fps · H.264
      </div>
      <div className="absolute bottom-3 right-3 font-mono text-[10px] tracking-[0.04em] text-paper-4/70 drop-shadow">
        {time}
      </div>
    </div>
  );
}

export default function ManagerCameras() {
  const [now, setNow] = useState(() => new Date());
  const [layout, setLayout] = useState(LAYOUTS[0]);
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = clock(now);

  return (
    <ManagerShell
      theme="dark"
      title="Cameras"
      refCode="M-05 · 4/4 online · mediamtx"
      right={
        <>
          <span className="font-mono text-[11px] text-line-2">
            Recording · <strong className="text-paper">4 streams</strong>
          </span>
          <span className="font-mono text-[11px] text-line-2">
            Retention · <strong className="text-paper">14d</strong>
          </span>
          <button className="rounded border border-ink-3 bg-ink-3 px-3 py-1.5 font-body text-xs font-semibold text-paper">
            Playback
          </button>
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
                  'rounded-sm px-3 py-1.5 font-mono text-[11px] tracking-[0.05em]',
                  l === layout ? 'bg-ink text-saffron' : 'text-line-2',
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-saffron">● LIVE</span>
            <span className="font-mono text-[11px] text-line-2">{time} · Thu 16 Jul</span>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
          {CAMS.map((cam) => (
            <CamTile key={cam.id} cam={cam} time={time} />
          ))}
        </div>

        <div className="mt-4 flex justify-between rounded bg-white/[0.03] px-4 py-3 font-mono text-[11px] text-line-2">
          <span>
            Storage · <span className="font-semibold text-paper">312 GB / 2 TB</span>
          </span>
          <span>
            Retention days remaining · <span className="font-semibold text-paper">10.2</span>
          </span>
          <span>
            CPU decode load · <span className="font-semibold text-paper">18%</span>
          </span>
          <span className="text-saffron">
            v2 · YOLO consumer offline · <span className="font-semibold">planned Nov</span>
          </span>
        </div>
      </div>
    </ManagerShell>
  );
}
