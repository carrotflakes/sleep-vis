import { useState } from "react";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { LoadRange, useSleepData } from "./hooks/useSleepData";
import { SleepList } from "./components/SleepList";
import { Heatmap } from "./components/Heatmap";
import { Icon } from "./components/Icon.tsx";
import styles from "./App.module.css";

type Tab = "timeline" | "heatmap";
type Period = "week" | "month" | "year";

function getLoadedSinceText(range: LoadRange): string {
  if (range === "all") return "Loaded: all time";
  const since = new Date();
  if (range === "month") since.setMonth(since.getMonth() - 1);
  else since.setFullYear(since.getFullYear() - 1);
  return `Loaded since ${since.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default function App() {
  const { accessToken, isSignedIn, loading: authLoading, error: authError, signIn, signOut } =
    useGoogleAuth();
  const [loadRange, setLoadRange] = useState<LoadRange>("month");
  const { sessions, loading: dataLoading, error: dataError } =
    useSleepData(accessToken, loadRange);
  const [tab, setTab] = useState<Tab>("timeline");
  const [period, setPeriod] = useState<Period>("month");
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadRangeOpen, setLoadRangeOpen] = useState(false);
  const hasSessions = sessions.length > 0;
  const isInitialDataLoading = isSignedIn && dataLoading && !hasSessions;
  const canShowData = isSignedIn && !dataError && (!dataLoading || hasSessions);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <Icon name="moon" className={styles.titleIcon} />
          <span>Sleep Vis</span>
        </h1>
        <div className={styles.headerRight}>
          <button
            className={styles.infoBtn}
            onClick={() => setInfoOpen((v) => !v)}
            aria-label="About this app"
          >
            <Icon name="info" className={styles.infoIcon} />
          </button>
          {isSignedIn && (
            <button className={styles.signOut} onClick={signOut}>
              Sign out
            </button>
          )}
        </div>
      </header>
      {infoOpen && (
        <div className={styles.infoOverlay} onClick={() => setInfoOpen(false)}>
          <div className={styles.infoPanel} onClick={(e) => e.stopPropagation()}>
            <p className={styles.infoPanelTitle}>Sleep Vis</p>
            <p className={styles.infoPanelText}>
              Visualizes sleep data available through Google Health, including data from Fitbit devices and Google Pixel Watch. Sign in to see your sleep timeline and heatmap.
              Your data is fetched directly from Google's servers in the browser and is never sent to any third party.
            </p>
            <p className={styles.infoPanelText}>
              <a href="https://github.com/carrotflakes/sleep-vis" target="_blank" rel="noopener noreferrer">GitHub Repository</a>
              <br />
              <a href="/terms.html" target="_blank" rel="noopener noreferrer">Terms of Service</a>
              <br />
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            </p>
            <button className={styles.infoPanelClose} onClick={() => setInfoOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        {authLoading && <p className={styles.message}>Loading...</p>}

        {authError && <p className={styles.error}>{authError}</p>}

        {!authLoading && !isSignedIn && !authError && (
          <div className={styles.signInContainer}>
            <p className={styles.tagline}>Your sleep, visualized.</p>
            <div className={styles.deviceLine}>
              <Icon name="watch" className={styles.deviceIcon} />
              <span>Fitbit</span>
              <span className={styles.deviceDivider}>/</span>
              <span>Pixel Watch</span>
            </div>
            <button className={styles.signIn} onClick={signIn}>
              Sign in with Google
            </button>
          </div>
        )}

        {isInitialDataLoading && (
          <p className={styles.message}>Loading sleep data...</p>
        )}

        {dataError && <p className={styles.error}>{dataError}</p>}

        {canShowData && (
          <>
            <div className={styles.controls}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${tab === "timeline" ? styles.tabActive : ""}`}
                  onClick={() => setTab("timeline")}
                >
                  Timeline
                </button>
                <button
                  className={`${styles.tab} ${tab === "heatmap" ? styles.tabActive : ""}`}
                  onClick={() => setTab("heatmap")}
                >
                  Heatmap
                </button>
                {tab === "heatmap" && (
                  <>
                    <span className={styles.tabDivider} />
                    <div className={styles.periodGroup}>
                      {(["week", "month", "year"] as const).map((p) => (
                        <button
                          key={p}
                          className={`${styles.periodBtn} ${period === p ? styles.periodActive : ""}`}
                          onClick={() => setPeriod(p)}
                        >
                          {p === "week" ? "Week" : p === "month" ? "Month" : "Year"}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.toolbarGroups}>
                {loadRangeOpen && (
                  <div className={styles.loadRangeOverlay} onClick={() => setLoadRangeOpen(false)} />
                )}
                <div className={styles.loadRangeWrapper}>
                  <button
                    className={styles.loadRangeBtn}
                    onClick={() => setLoadRangeOpen((v) => !v)}
                  >
                    {getLoadedSinceText(loadRange)} ▾
                  </button>
                  {loadRangeOpen && (
                    <div className={styles.loadRangeDropdown}>
                      {(["year", "all"] as const).map((r) => (
                        <button
                          key={r}
                          className={`${styles.loadRangeOption} ${loadRange === r ? styles.loadRangeOptionActive : ""}`}
                          onClick={() => { setLoadRange(r); setLoadRangeOpen(false); }}
                        >
                          {r === "year" ? "Load past year" : "Load all time"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {tab === "timeline" ? (
              <SleepList sessions={sessions} />
            ) : (
              <Heatmap sessions={sessions} period={period} />
            )}
            {dataLoading && (
              <p className={styles.loadingBelow}>Loading more data...</p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
