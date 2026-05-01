import { useMemo, useRef, useEffect } from "react";
import { formatDateLabel } from "../../models/date";
import { SleepSession } from "../../models/sleep";
import type { Theme } from "../../theme";
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
  key: string;
  label: string;
  freq: number[];
}

interface HeatmapPalette {
  startHue: number;
  endHue: number;
  saturation: number;
  startLightness: number;
  endLightness: number;
  markerColor: string;
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
    .map(([bucketKey, bucket]) => {
      const freq = new Array<number>(RESOLUTION).fill(0);

      for (const daySlots of bucket.daySlots.values()) {
        for (let index = 0; index < RESOLUTION; index++) {
          freq[index] += daySlots[index];
        }
      }

      return {
        key: bucketKey,
        label: bucket.label,
        freq,
      };
    });
}

function getCssVar(element: Element, name: string, fallback: string): string {
  return getComputedStyle(element).getPropertyValue(name).trim() || fallback;
}

function getCssNumberVar(element: Element, name: string, fallback: number): number {
  const value = Number.parseFloat(getCssVar(element, name, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
}

function getHeatmapPalette(element: Element): HeatmapPalette {
  return {
    startHue: getCssNumberVar(element, "--heatmap-start-hue", 240),
    endHue: getCssNumberVar(element, "--heatmap-end-hue", 0),
    saturation: getCssNumberVar(element, "--heatmap-saturation", 80),
    startLightness: getCssNumberVar(element, "--heatmap-start-lightness", 25),
    endLightness: getCssNumberVar(element, "--heatmap-end-lightness", 50),
    markerColor: getCssVar(element, "--heatmap-marker", "rgba(255,255,255,0.25)"),
  };
}

function freqToColor(freq: number, maxFreq: number, palette: HeatmapPalette): string {
  const t = freq / Math.max(maxFreq, 1);
  const hue = palette.startHue + (palette.endHue - palette.startHue) * t;
  const lightness =
    palette.startLightness + (palette.endLightness - palette.startLightness) * t;
  return `hsl(${hue}, ${palette.saturation}%, ${lightness}%)`;
}

// ---- Row component (canvas per bucket) ----

function HeatmapRow({
  freq,
  maxFreq,
  theme,
}: {
  freq: number[];
  maxFreq: number;
  theme: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = RESOLUTION;
    canvas.height = 5;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width;
    const h = canvas.height;
    const slotW = w / RESOLUTION;
    const palette = getHeatmapPalette(canvas);

    for (let i = 0; i < RESOLUTION; i++) {
      ctx.fillStyle = freqToColor(freq[i], maxFreq, palette);
      ctx.fillRect(i * slotW, 0, Math.ceil(slotW), h);
    }

    ctx.strokeStyle = palette.markerColor;
    ctx.lineWidth = 1;
    for (let hour = 1; hour < 24; hour++) {
      const x = Math.round((hour / 24) * w) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, h * 0.2);
      ctx.lineTo(x, h * 0.8);
      ctx.stroke();
    }
  }, [freq, maxFreq, theme]);

  return <canvas ref={canvasRef} className={styles.canvas} />;
}

// ---- main ----

interface Props {
  sessions: SleepSession[];
  period: Period;
  theme: Theme;
}

export function Heatmap({ sessions, period, theme }: Props) {
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
          {rows.map(({ key, label, freq }) => (
            <div key={key} className={styles.row}>
              <span className={styles.rowLabel}>{label}</span>
              <HeatmapRow freq={freq} maxFreq={globalMax} theme={theme} />
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
