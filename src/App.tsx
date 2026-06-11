import { useState } from "react";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useSleepData } from "./hooks/useSleepData";
import { useTheme } from "./hooks/useTheme";
import { SleepList } from "./components/SleepList";
import { Heatmap } from "./components/Heatmap";
import { Icon } from "./components/Icon.tsx";
import { getThemeModeLabel } from "./theme";
import styles from "./App.module.css";

type Tab = "timeline" | "heatmap";
type Period = "week" | "month" | "year";
type LoadPreset = "month" | "year" | "all";

function getLoadUntilForPreset(preset: LoadPreset): Date | null {
  const date = new Date();
  switch (preset) {
    case "month":
      date.setMonth(date.getMonth() - 1);
      return date;
    case "year":
      date.setFullYear(date.getFullYear() - 1);
      return date;
    case "all":
      return null;
  }
}

function getLoadedSinceText(loadUntil: Date | null): string {
  if (!loadUntil) return "Loaded: all time";

  return `Loaded since ${loadUntil.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export default function App() {
  const { accessToken, isSignedIn, loading: authLoading, error: authError, signIn, signOut } =
    useGoogleAuth();
  const [loadPreset, setLoadPreset] = useState<LoadPreset>("month");
  const [loadUntil, setLoadUntil] = useState<Date | null>(() => getLoadUntilForPreset("month"));
  const { sessions, loading: dataLoading, error: dataError, stopLoading } =
    useSleepData(accessToken, loadUntil);
  const [tab, setTab] = useState<Tab>("timeline");
  const [period, setPeriod] = useState<Period>("month");
  const [infoOpen, setInfoOpen] = useState(false);
  const [loadRangeOpen, setLoadRangeOpen] = useState(false);
  const { themeMode, effectiveTheme, nextThemeMode, setThemeMode } = useTheme();
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
            type="button"
            className={styles.themeBtn}
            onClick={() => setThemeMode(nextThemeMode)}
            aria-label={`Theme: ${getThemeModeLabel(themeMode)}. Switch to ${getThemeModeLabel(nextThemeMode)} theme`}
            title={`Theme: ${getThemeModeLabel(themeMode)} (${effectiveTheme}). Switch to ${getThemeModeLabel(nextThemeMode)}`}
          >
            <Icon
              name={themeMode === "system" ? "system" : themeMode === "light" ? "sun" : "moon"}
              className={styles.themeIcon}
            />
          </button>
          <button
            type="button"
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
            <p className={styles.heroDescription}>
              Sleep Vis is a free web app that turns the sleep records tracked by your
              Fitbit or Pixel Watch into clear, interactive charts — right in your browser.
            </p>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <Icon name="timeline" className={styles.featureIcon} />
                <p className={styles.featureTitle}>Timeline</p>
                <p className={styles.featureText}>
                  Browse every night's sleep sessions day by day, with bed and wake times at a glance.
                </p>
              </div>
              <div className={styles.featureCard}>
                <Icon name="heatmap" className={styles.featureIcon} />
                <p className={styles.featureTitle}>Heatmap</p>
                <p className={styles.featureText}>
                  Spot patterns in your sleep rhythm across weeks, months, or a whole year.
                </p>
              </div>
              <div className={styles.featureCard}>
                <Icon name="lock" className={styles.featureIcon} />
                <p className={styles.featureTitle}>Private by design</p>
                <p className={styles.featureText}>
                  Everything runs locally in your browser. Your data is never stored on a server or shared.
                </p>
              </div>
            </div>
            <button className={styles.signIn} onClick={signIn}>
              Sign in with Google
            </button>
            <p className={styles.dataDisclosure}>
              Sleep Vis requests <strong>read-only access to your sleep data</strong> from
              your Google account, solely to display your sleep timeline and heatmap.
              The data is fetched directly from Google in your browser and is never
              collected, stored, or shared with anyone. See our{" "}
              <a href="/privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </p>
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
                    {getLoadedSinceText(loadUntil)} ▾
                  </button>
                  {loadRangeOpen && (
                    <div className={styles.loadRangeDropdown}>
                      {(["month", "year", "all"] as const).map((r) => (
                        <button
                          key={r}
                          className={`${styles.loadRangeOption} ${loadPreset === r ? styles.loadRangeOptionActive : ""}`}
                          onClick={() => {
                            setLoadPreset(r);
                            setLoadUntil(getLoadUntilForPreset(r));
                            setLoadRangeOpen(false);
                          }}
                        >
                          {r === "month" ? "Load past month" : r === "year" ? "Load past year" : "Load all time"}
                        </button>
                      ))}
                      {dataLoading && (
                        <>
                          <span className={styles.loadRangeMenuDivider} />
                          <button
                            className={`${styles.loadRangeOption} ${styles.loadRangeStopOption}`}
                            onClick={() => {
                              stopLoading();
                              setLoadRangeOpen(false);
                            }}
                          >
                            Stop loading
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {tab === "timeline" ? (
              <SleepList sessions={sessions} />
            ) : (
              <Heatmap sessions={sessions} period={period} theme={effectiveTheme} />
            )}
            {dataLoading && (
              <p className={styles.loadingBelow}>Loading more data...</p>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
          Privacy Policy
        </a>
        <span className={styles.footerDivider}>/</span>
        <a href="/terms.html" target="_blank" rel="noopener noreferrer">
          Terms of Service
        </a>
      </footer>
    </div>
  );
}
