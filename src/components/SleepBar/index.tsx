import { SleepSession } from "../../models/sleep";
import { formatDateLabel } from "../../models/date";
import styles from "./index.module.css";

export const WINDOW_MS = 24 * 60 * 60 * 1000;

export const MARKER_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const HOUR_TICKS = Array.from({ length: 23 }, (_, index) => index + 1);

// Window starts at midnight of the given date's calendar day.
export function getWindowStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

const SLEEP_COLOR = "#54a0ff";

interface Props {
  windowStart: Date;
  sessions: SleepSession[];
  yearLabel?: string;
}

export function SleepBar({ windowStart, sessions, yearLabel }: Props) {
  const toPercent = (time: Date) => {
    const pct = ((time.getTime() - windowStart.getTime()) / WINDOW_MS) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const toWidth = (start: Date, end: Date) => {
    const raw = ((end.getTime() - start.getTime()) / WINDOW_MS) * 100;
    const left = ((start.getTime() - windowStart.getTime()) / WINDOW_MS) * 100;
    return Math.min(raw, 100 - left);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className={styles.sleepBar}>
      <span className={styles.date}>
        {yearLabel && <span className={styles.year}>{yearLabel}</span>}
        <span>{formatDateLabel(windowStart, "day")}</span>
      </span>
      <div className={styles.bar}>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={styles.segment}
            style={{
              left: `${toPercent(session.startTime)}%`,
              width: `${toWidth(session.startTime, session.endTime)}%`,
              backgroundColor: SLEEP_COLOR,
            }}
            title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
          />
        ))}
        <div className={styles.hourMarkers} aria-hidden="true">
          {HOUR_TICKS.map((hour) => (
            <div
              key={hour}
              className={styles.hourTick}
              style={{ left: `${(hour / 24) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
