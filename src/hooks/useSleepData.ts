import { useState, useEffect, useCallback, useRef } from "react";
import { SleepSession, SleepSegment, parseSleepStageType } from "../models/sleep";

const HEALTH_API = "https://health.googleapis.com/v4/users/me";

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

function hasReachedLoadUntil(
  sessions: SleepSession[],
  loadUntil: Date | null
): boolean {
  return loadUntil
    ? sessions.some((session) => session.endTime < loadUntil)
    : false;
}

export function useSleepData(accessToken: string | null, loadUntil: Date | null) {
  const [sessions, setSessions] = useState<SleepSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const sessionsRef = useRef<SleepSession[]>([]);
  const nextPageTokenRef = useRef<string | undefined>(undefined);
  const hasMoreRef = useRef(true);

  const stopLoading = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const fetchSleepData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    if (
      !hasMoreRef.current ||
      hasReachedLoadUntil(sessionsRef.current, loadUntil)
    ) {
      setLoading(false);
      return;
    }

    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setError(null);

    try {
      // Paginate through results (max 25 per page for sleep)
      while (
        hasMoreRef.current &&
        !hasReachedLoadUntil(sessionsRef.current, loadUntil)
      ) {
        const params = new URLSearchParams();
        const pageToken = nextPageTokenRef.current;
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
        nextPageTokenRef.current = data.nextPageToken;
        hasMoreRef.current = Boolean(data.nextPageToken);

        if (data.dataPoints?.length) {
          const pageSessions = data.dataPoints.map(toSleepSession);
          sessionsRef.current = sortSessions([
            ...sessionsRef.current,
            ...pageSessions,
          ]);
          setSessions(sessionsRef.current);
        }
      }
    } catch (e) {
      if (abortController.signal.aborted) {
        return;
      }
      setError(
        e instanceof Error
          ? e.message
          : "An error occurred while fetching data."
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
        setLoading(false);
      }
    }
  }, [accessToken, loadUntil]);

  useEffect(() => {
    abortControllerRef.current?.abort();
    sessionsRef.current = [];
    nextPageTokenRef.current = undefined;
    hasMoreRef.current = Boolean(accessToken);
    setSessions([]);
    setLoading(false);
    setError(null);
  }, [accessToken]);

  useEffect(() => {
    fetchSleepData();
    return () => {
      stopLoading();
    };
  }, [fetchSleepData, stopLoading]);

  return { sessions, loading, error, stopLoading };
}
