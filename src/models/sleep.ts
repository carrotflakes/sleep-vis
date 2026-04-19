export interface SleepSegment {
  startTime: Date;
  endTime: Date;
  stage: SleepStage;
}

export interface SleepSession {
  id: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  minutesAsleep: number;
  minutesAwake: number;
  segments: SleepSegment[];
}

export type SleepStage = "awake" | "light" | "deep" | "rem" | "unknown";

export function parseSleepStageType(value: string): SleepStage {
  switch (value) {
    case "AWAKE":
      return "awake";
    case "LIGHT":
      return "light";
    case "DEEP":
      return "deep";
    case "REM":
      return "rem";
    case "ASLEEP":
    case "RESTLESS":
      return "unknown";
    default:
      return "unknown";
  }
}
