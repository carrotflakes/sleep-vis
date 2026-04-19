import { useState, useCallback, useEffect } from "react";

const SCOPES = "https://www.googleapis.com/auth/googlehealth.sleep.readonly";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface AuthState {
  accessToken: string | null;
  isSignedIn: boolean;
  loading: boolean;
  error: string | null;
}

export function useGoogleAuth() {
  const [auth, setAuth] = useState<AuthState>({
    accessToken: null,
    isSignedIn: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!CLIENT_ID) {
      setAuth({
        accessToken: null,
        isSignedIn: false,
        loading: false,
        error:
          "VITE_GOOGLE_CLIENT_ID is not configured. Please create a .env file.",
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      setAuth((prev) => ({ ...prev, loading: false }));
    };
    script.onerror = () => {
      setAuth((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load Google Identity Services.",
      }));
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const signIn = useCallback(() => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error) {
          setAuth({
            accessToken: null,
            isSignedIn: false,
            loading: false,
            error: `Authentication error: ${response.error}`,
          });
          return;
        }
        setAuth({
          accessToken: response.access_token,
          isSignedIn: true,
          loading: false,
          error: null,
        });
      },
    });
    client.requestAccessToken();
  }, []);

  const signOut = useCallback(() => {
    if (auth.accessToken) {
      google.accounts.oauth2.revoke(auth.accessToken, () => {});
    }
    setAuth({
      accessToken: null,
      isSignedIn: false,
      loading: false,
      error: null,
    });
  }, [auth.accessToken]);

  return { ...auth, signIn, signOut };
}
