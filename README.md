# Sleep Vis

Small web app for viewing sleep records available through Google Health, including data from Fitbit devices and Google Pixel Watch.

This is the successor to [fitbit-sleep-vis](https://github.com/carrotflakes/fitbit-sleep-vis), and the current app uses Google OAuth plus the Google Health API sleep endpoint.

It is intentionally small. The goal is just to sign in, load sleep data, and look at it in a couple of useful views.

## What it does

- Shows sleep sessions as a timeline list
- Shows sleep patterns as a heatmap
- Loads sleep data for `month`, `year`, or `all`
- Runs entirely in the browser
- Sends data directly to Google and does not use an app backend

## Tech

- React
- TypeScript
- Vite
- Google Identity Services
- Google Health API

## Google Health API notes

- This app requests `https://www.googleapis.com/auth/googlehealth.sleep.readonly`
- Sleep data is fetched from `https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints`
- The returned sleep data may include records from Fitbit devices and Google Pixel Watch
- Access happens directly from the browser with a Google access token
- If `VITE_GOOGLE_CLIENT_ID` is missing, sign-in will not work

Depending on the Google Health API project settings, verification or policy requirements may apply.

## Copyright

Copyright (c) 2026 carrotflakes (carrotflakes@gmail.com)

## License

Licensed under the MIT License.