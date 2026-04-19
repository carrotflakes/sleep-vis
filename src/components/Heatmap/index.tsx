import { useMemo, useRef, useEffect } from "react";
import { formatDateLabel } from "../../models/date";
import { SleepSession } from "../../models/sleep";
import { TimeRuler } from "../TimeRuler";
import styles from "./index.module.css";

type Period = "week" | "month" | "year";

const RESOLUTION = 500;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// ---- grouping helpers ----

function weekStart(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7)); // Monday
  return r;
}

function monthStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function yearStart(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

interface Bucket {
  label: string;
  daySlots: Map<string, Uint8Array>;
}

interface HeatmapRowData {
  label: string;
  freq: number[];
}

function markDayRange(slots: Uint8Array, startOff: number, endOff: number) {
  const slotMs = ONE_DAY_MS / RESOLUTION;
  const startIndex = Math.max(0, Math.floor(startOff / slotMs));
  const endIndex = Math.min(RESOLUTION - 1, Math.ceil(endOff / slotMs) - 1);

  for (let index = startIndex; index <= endIndex; index++) {
    slots[index] = 1;
  }
}

function buildRows(sessions: SleepSession[], period: Period): HeatmapRowData[] {
  const startFn = period === "week" ? weekStart : period === "month" ? monthStart : yearStart;
  const map = new Map<string, Bucket>();

  for (const session of sessions) {
    let cursor = new Date(session.startTime);

    while (cursor < session.endTime) {
      const dayStart = new Date(cursor);
      dayStart.setHours(0, 0, 0, 0);
      const nextDay = new Date(dayStart.getTime() + ONE_DAY_MS);

      const segmentStart = Math.max(session.startTime.getTime(), dayStart.getTime());
      const segmentEnd = Math.min(session.endTime.getTime(), nextDay.getTime());

      if (segmentEnd > segmentStart) {
        const bucketStart = startFn(dayStart);
        const bucketKey = bucketStart.toISOString();

        if (!map.has(bucketKey)) {
          map.set(bucketKey, {
            label: formatDateLabel(bucketStart, period),
            daySlots: new Map(),
          });
        }

        const bucket = map.get(bucketKey)!;
        const dayKey = dayStart.toISOString();
        if (!bucket.daySlots.has(dayKey)) {
          bucket.daySlots.set(dayKey, new Uint8Array(RESOLUTION));
        }

        markDayRange(
          bucket.daySlots.get(dayKey)!,
          segmentStart - dayStart.getTime(),
          segmentEnd - dayStart.getTime()
        );
      }

      cursor = nextDay;
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, bucket]) => {
      const freq = new Array<number>(RESOLUTION).fill(0);

      for (const daySlots of bucket.daySlots.values()) {
        for (let index = 0; index < RESOLUTION; index++) {
          freq[index] += daySlots[index];
        }
      }

      return {
        label: bucket.label,
        freq,
      };
    });
}

function freqToColor(freq: number, maxFreq: number): string {
  if (maxFreq === 0 || freq === 0) return "#1e293b";
  const t = freq / maxFreq;
  const hue = 240 * (1 - t);
  const lightness = 25 + t * 25;
  return `hsl(${hue}, 80%, ${lightness}%)`;
}

// ---- Row component (canvas per bucket) ----

function HeatmapRow({ freq, maxFreq }: { freq: number[]; maxFreq: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;
    const slotW = w / RESOLUTION;

    for (let i = 0; i < RESOLUTION; i++) {
      ctx.fillStyle = freqToColor(freq[i], maxFreq);
      ctx.fillRect(i * slotW, 0, Math.ceil(slotW), h);
    }

    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    for (let hour = 1; hour < 24; hour++) {
      const x = Math.round((hour / 24) * w) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.2);
      ctx.lineTo(x, h * 0.8);
      ctx.stroke();
    }
  }, [freq, maxFreq]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

// ---- main ----

interface Props {
  sessions: SleepSession[];
  period: Period;
}

export function Heatmap({ sessions, period }: Props) {
  const rows = useMemo(() => buildRows(sessions, period), [sessions, period]);
  const globalMax = useMemo(
    () => rows.reduce((max, row) => Math.max(max, ...row.freq), 0),
    [rows]
  );

  return (
    <div className={styles.container}>
      <div className={styles.listWrapper}>
        <TimeRuler />
        <div className={styles.rows}>
          {rows.map(({ label, freq }) => (
            <div key={label} className={styles.row}>
              <span className={styles.rowLabel}>{label}</span>
              <HeatmapRow freq={freq} maxFreq={globalMax} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.legend}>
        <span className={styles.legendText}>Less</span>
        <div className={styles.legendGradient} />
        <span className={styles.legendText}>More</span>
      </div>
    </div>
  );
}
