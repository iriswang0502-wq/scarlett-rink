# Scarlett's Rink

A small web app, hosted with GitHub Pages, for tracking daily hockey drills at home: stickhandling, shooting and fitness, with Duolingo-style streaks, XP, levels, badges and parent-set rewards. Everything is stored on the device (localStorage). No accounts, no server.

## Files
- `index.html` – the full app, ready to host anywhere (GitHub Pages, Netlify, a home server).
- `app.html` – the same page without the document wrapper, used for the Claude artifact preview.
- `manifest.json`, `icon.svg`, `sw.js` – let the app install to the iPad home screen and work offline when served over HTTPS.

## Run locally
    python3 -m http.server 8000
Open http://localhost:8000 on the same network from the iPad.

## Install on iPad
Open the hosted URL in Safari, tap Share, then "Add to Home Screen".

## Daily reminder
The app has no server, so it cannot send push notifications on its own. Add a daily alarm in the iPad Clock or Reminders app that points to the home-screen icon.
