import styles from "./index.module.css";

const MARKER_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

const MARKERS = MARKER_HOURS.map((hour, index) => ({
  label: hour === 24 ? "24:00" : `${String(hour).padStart(2, "0")}:00`,
  pct: index === MARKER_HOURS.length - 1 ? 100 : (hour / 24) * 100,
}));

interface Props {
  labelWidth?: number;
}

export function TimeRuler({ labelWidth = 90 }: Props) {
  return (
    <div className={styles.ruler}>
      <div
        className={styles.labelSpacer}
        style={{ width: labelWidth, flexBasis: labelWidth }}
        aria-hidden="true"
      />
      <div className={styles.rulerBar}>
        {MARKERS.map(({ label, pct }) => (
          <div key={label} className={styles.rulerMark} style={{ left: `${pct}%` }}>
            <span className={styles.rulerLabel}>{label}</span>
            <div className={styles.rulerTick} />
          </div>
        ))}
      </div>
    </div>
  );
}