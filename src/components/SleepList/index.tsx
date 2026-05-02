import { useMemo } from "react";
import { useWindowVirtualRows } from "../../hooks/useWindowVirtualRows";
import { SleepSession } from "../../models/sleep";
import { SleepBar, getWindowStart } from "../SleepBar";
import { TimeRuler } from "../TimeRuler";
import styles from "./index.module.css";

interface Props {
  sessions: SleepSession[];
}

const WINDOW_MS = 24 * 60 * 60 * 1000;
const ROW_HEIGHT = 12;
const ROW_GAP = 1;
const OVERSCAN_ROWS = 30;
const INITIAL_RENDER_ROWS = 120;

function addToWindow(
  map: Map<string, { windowStart: Date; sessions: SleepSession[] }>,
  ws: Date,
  session: SleepSession
) {
  const key = ws.toISOString();
  if (!map.has(key)) {
    map.set(key, { windowStart: ws, sessions: [] });
  }
  map.get(key)!.sessions.push(session);
}

function groupByDay(
  sessions: SleepSession[]
): { windowStart: Date; sessions: SleepSession[] }[] {
  const map = new Map<string, { windowStart: Date; sessions: SleepSession[] }>();
  for (const session of sessions) {
    const ws = getWindowStart(session.startTime);
    addToWindow(map, ws, session);
    // If the session extends past the end of this window (ws + 24h),
    // also add it to the next window so it appears on the next day's bar.
    const windowEnd = new Date(ws.getTime() + WINDOW_MS);
    if (session.endTime > windowEnd) {
      addToWindow(map, windowEnd, session);
    }
  }
  // Sort descending by windowStart
  return Array.from(map.values()).sort(
    (a, b) => b.windowStart.getTime() - a.windowStart.getTime()
  );
}

export function SleepList({ sessions }: Props) {
  const days = useMemo(() => groupByDay(sessions), [sessions]);
  const { containerRef, totalHeight, virtualRows } = useWindowVirtualRows({
    itemCount: days.length,
    rowHeight: ROW_HEIGHT,
    rowGap: ROW_GAP,
    overscan: OVERSCAN_ROWS,
    initialRenderCount: INITIAL_RENDER_ROWS,
  });

  if (sessions.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No sleep data found for the past 30 days.</p>
        <p className={styles.hint}>
          Sleep records from Google Health will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.listWrapper}>
        <TimeRuler />
        <div
          ref={containerRef}
          className={styles.list}
          style={{ height: totalHeight }}
        >
          {virtualRows.map(({ index, offsetTop }) => {
            const { windowStart, sessions: daySessions } = days[index];
            return (
              <div
                key={windowStart.toISOString()}
                className={styles.virtualRow}
                style={{ transform: `translateY(${offsetTop}px)` }}
              >
                <SleepBar
                  windowStart={windowStart}
                  sessions={daySessions}
                  yearLabel={
                    index === 0 ||
                    days[index - 1].windowStart.getFullYear() !==
                      windowStart.getFullYear()
                      ? String(windowStart.getFullYear())
                      : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
