# Voice Notes + To-Do App

A lightweight browser app that lets you:

- Manage a local to-do list
- Record voice notes from your microphone
- Persist everything in local storage so it is available next time you open the app

## Run locally

You can open `index.html` directly in a modern browser, or serve the project:

```bash
python -m http.server 8000
```

Then open: <http://localhost:8000>

## Features

- Add / complete / delete to-do items
- Start / stop audio recording
- Playback and delete voice notes
- All data is stored on-device in `localStorage`
