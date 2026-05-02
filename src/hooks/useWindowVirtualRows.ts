import { useEffect, useMemo, useRef, useState } from "react";

interface Options {
  itemCount: number;
  rowHeight: number;
  rowGap?: number;
  overscan?: number;
  initialRenderCount?: number;
}

interface VisibleRange {
  start: number;
  end: number;
}

export function useWindowVirtualRows({
  itemCount,
  rowHeight,
  rowGap = 0,
  overscan = 20,
  initialRenderCount = 100,
}: Options) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rowStride = rowHeight + rowGap;
  const [visibleRange, setVisibleRange] = useState<VisibleRange>(() => ({
    start: 0,
    end: initialRenderCount,
  }));

  useEffect(() => {
    function updateVisibleRange() {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const containerTop = rect.top + window.scrollY;
      const viewportTop = window.scrollY;
      const viewportBottom = viewportTop + window.innerHeight;
      const rawStart =
        Math.floor((viewportTop - containerTop) / rowStride) - overscan;
      const rawEnd =
        Math.ceil((viewportBottom - containerTop) / rowStride) + overscan;
      const nextStart = Math.min(itemCount, Math.max(0, rawStart));
      const nextEnd = Math.min(itemCount, Math.max(nextStart, rawEnd));

      setVisibleRange((current) =>
        current.start === nextStart && current.end === nextEnd
          ? current
          : { start: nextStart, end: nextEnd }
      );
    }

    let frameId = 0;
    function scheduleUpdate() {
      if (frameId !== 0) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateVisibleRange();
      });
    }

    updateVisibleRange();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    let resizeObserver: ResizeObserver | undefined;
    if ("ResizeObserver" in window && containerRef.current) {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [itemCount, overscan, rowStride]);

  const visibleStart = Math.min(visibleRange.start, itemCount);
  const visibleEnd = Math.min(
    Math.max(visibleRange.end, visibleStart),
    itemCount
  );
  const totalHeight = itemCount === 0 ? 0 : itemCount * rowStride - rowGap;
  const virtualRows = useMemo(
    () =>
      Array.from({ length: visibleEnd - visibleStart }, (_, offset) => {
        const index = visibleStart + offset;
        return {
          index,
          offsetTop: index * rowStride,
        };
      }),
    [rowStride, visibleEnd, visibleStart]
  );

  return {
    containerRef,
    totalHeight,
    virtualRows,
  };
}
