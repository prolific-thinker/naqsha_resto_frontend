import { useEffect, useRef, useState } from 'react';

/**
 * Measure a container's pixel width so SVG charts can draw in real pixels (needed
 * for accurate pointer→data hit-testing). Height is fixed by each chart. Returns
 * `[ref, width]`; width is 0 until the first layout pass — charts guard on it.
 */
export function useSize<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.round(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}
