import { useState, useEffect, useCallback, useRef } from "react";
import { SleepSession, SleepSegment, parseSleepStageType } from "../models/sleep";

const HEALTH_API = "https://health.googleapis.com/v4/users/me";

export type LoadRange = "month" | "year" | "all";

interface HealthSleepStage {
  startTime: string;
  endTime: string;
  type: string;
}

interface HealthSleep {
  interval: {
    startTime: string;
    endTime: string;
  };
  type?: string;
  stages?: HealthSleepStage[];
  summary?: {
    minutesAsleep?: string;
    minutesAwake?: string;
    minutesInSleepPeriod?: string;
  };
}

interface HealthDataPoint {
  name?: string;
  sleep: HealthSleep;
}

interface HealthListResponse {
  dataPoints?: HealthDataPoint[];
  nextPageToken?: string;
}

function toSleepSession(dp: HealthDataPoint): SleepSession {
  const sleep = dp.sleep;
  const startTime = new Date(sleep.interval.startTime);
  const endTime = new Date(sleep.interval.endTime);
  const durationMinutes =
    (endTime.getTime() - startTime.getTime()) / 60000;

  const segments: SleepSegment[] = (sleep.stages ?? []).map((s) => ({
    startTime: new Date(s.startTime),
    endTime: new Date(s.endTime),
    stage: parseSleepStageType(s.type),
  }));

  return {
    id: dp.name ?? `${sleep.interval.startTime}`,
    startTime,
    endTime,
    durationMinutes,
    minutesAsleep: parseInt(sleep.summary?.minutesAsleep ?? "0") || 0,
    minutesAwake: parseInt(sleep.summary?.minutesAwake ?? "0") || 0,
    segments,
  };
}

function sortSessions(sessions: SleepSession[]): SleepSession[] {
  return [...sessions].sort(
    (a, b) => b.startTime.getTime() - a.startTime.getTime()
  );
}

function getCivilDateDaysAgo(days: number): string {
  const date = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getFilterForRange(loadRange: LoadRange): string | null {
  switch (loadRange) {
    case "month":
      return `sleep.interval.civil_end_time >= "${getCivilDateDaysAgo(30)}"`;
    case "year":
      return `sleep.interval.civil_end_time >= "${getCivilDateDaysAgo(365)}"`;
    case "all":
      return null;
  }
}

export function useSleepData(accessToken: string | null, loadRange: LoadRange) {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSleepData = useCallback(async () => {
    if (!accessToken) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const filter = getFilterForRange(loadRange);

      const loadedSessions: SleepSession[] = [];
      let pageToken: string | undefined;

      // Paginate through results (max 25 per page for sleep)
      do {
        const params = new URLSearchParams();
        if (filter) params.set("filter", filter);
        if (pageToken) params.set("pageToken", pageToken);

        const res = await fetch(
          `${HEALTH_API}/dataTypes/sleep/dataPoints?${params}`,
          {
            signal: abortController.signal,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch sleep data: ${res.status} ${res.statusText}`
          );
        }

        const data: HealthListResponse = await res.json();
        if (requestIdRef.current !== requestId) {
          return;
        }

        if (data.dataPoints?.length) {
          loadedSessions.push(...data.dataPoints.map(toSleepSession));
          setSessions(sortSessions(loadedSessions));
        }
        pageToken = data.nextPageToken;
      } while (pageToken);
    } catch (e) {
      if (abortController.signal.aborted) {
        return;
      }
      if (requestIdRef.current !== requestId) {
        return;
      }
      setError(e instanceof Error ? e.message : "An error occurred while fetching data.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [accessToken, loadRange]);

  useEffect(() => {
    fetchSleepData();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchSleepData]);

  return { sessions, loading, error, refetch: fetchSleepData };
}
