import { SleepSession } from "../../models/sleep";
import { SleepBar, getWindowStart } from "../SleepBar";
import { TimeRuler } from "../TimeRuler";
import styles from "./index.module.css";

interface Props {
  sessions: SleepSession[];
}

const WINDOW_MS = 24 * 60 * 60 * 1000;

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

  const days = groupByDay(sessions);

  return (
    <div className={styles.container}>
      <div className={styles.listWrapper}>
        <TimeRuler />
        <div className={styles.list}>
          {days.map(({ windowStart, sessions: daySessions }) => (
            <SleepBar
              key={windowStart.toISOString()}
              windowStart={windowStart}
              sessions={daySessions}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
