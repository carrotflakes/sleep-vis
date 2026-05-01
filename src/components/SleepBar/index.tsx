import { SleepSession } from "../../models/sleep";
import { formatDateLabel } from "../../models/date";
import styles from "./index.module.css";

export const WINDOW_MS = 24 * 60 * 60 * 1000;

// Window starts at midnight of the given date's calendar day.
export function getWindowStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

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
            }}
            title={`${formatTime(session.startTime)} - ${formatTime(session.endTime)}`}
          />
        ))}
      </div>
    </div>
  );
}
