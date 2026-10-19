# Screencast production guide

A reproducible, fully headless pipeline for recording polished product screencasts:
scripted browser interactions with an animated cursor, per-scene captions, neural-TTS
voiceover, light synthesized sound FX, and branded intro/outro cards. No screen, no
microphone, no video editor — everything is code plus ffmpeg.

Companion file: `screencast.json` — the tuned voice/FX/mix/encode settings. This
document explains the method; the JSON is the source of truth for numbers.

## Principles

- **Voiceover first.** Synthesize and measure every narration line *before* recording,
  then pace each scene so its line fits. Syncing audio to an existing recording never
  lands cleanly; pacing the recording to the audio always does.
- **Instrument the recording.** Log a timestamped event for every click, keystroke,
  scene start, and async completion. FX and VO are placed at those timestamps — no
  guessing from playback.
- **Isolated demo data.** Record against a seeded fixture (separate user, separate
  data dir), never real content. Seed via the app's own API.
- **Minimal sound design.** Quiet clicks, quieter key ticks, one soft success chime,
  one closing chime. Screen transitions stay silent — synthesized whooshes read as
  noise, not polish.
- **Narrate what is on screen.** Write each line for what is visible at that moment;
  never describe something before it appears.

## Requirements

- Node.js + ffmpeg in PATH.
- Headless Chromium: Puppeteer (`page.screencast`) or Playwright
  (`context.newCDPSession` + `Page.startScreencast`, frames + per-frame timestamps,
  assembled via ffmpeg concat then `-vf fps=30`).
- `msedge-tts` (npm) for voiceover.
- Fonts installed for rendering (`~/.fonts` + `fc-cache`): a modern sans
  (e.g. Inter, aliased to `sans-serif`/`system-ui` via fontconfig) and
  **Noto Color Emoji** — without it every emoji in the UI is a tofu box.

## Pipeline

### 1. Seed demo data

Create a small, presentable fixture through the app's API: a handful of realistic
items with images (generate scenic placeholders with sharp/SVG if needed). Keep a
`reset` script that deletes the fixture the same way, so retries start clean.
Pre-warm anything that lazy-loads (open the app once before recording) so no
spinner appears on tape.

### 2. Voiceover

One line per scene, conversational, ~4–8 s each:

```js
const {MsEdgeTTS, OUTPUT_FORMAT} = require('msedge-tts');
const tts = new MsEdgeTTS();
await tts.setMetadata('en-US-AndrewMultilingualNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
await tts.toFile(dir, line);          // writes <dir>/audio.mp3
```

Measure each clip with `ffprobe -show_entries format=duration` and save a
`vo.json` of durations — scene pacing depends on it.

### 3. Record

- Viewport **1280×720**, browser launched with `--force-device-scale-factor=1.5`
  and `--hide-scrollbars` → true 1920×1080 frames. (Emulated
  `setViewport({deviceScaleFactor})` is ignored by screencast capture — it records
  at the browser's *native* ratio, so force it at launch.)
- Inject an overlay after load: a fake cursor (SVG arrow, `position:fixed`,
  `pointer-events:none`) that follows real `mousemove` events, a click ripple on
  `mousedown`, and a bottom-center caption pill with fade transitions. Driving the
  real mouse and letting the overlay follow gives exact sync and free hover states.
- Move the mouse with eased interpolation (~30–60 steps, 16 ms apart); type with
  30–70 ms jittered per-key delay; scroll with an in-page requestAnimationFrame
  ease. Scroll any target into mid-viewport before clicking — a click at
  coordinates outside the viewport silently misses.
- Never leave the frame frozen while a narration line finishes: drift the pointer
  in a slow small arc during long waits. Keep the longest static stretch under ~2 s.
- Log events as `{t: seconds_since_recording_start, type}`:
  `click`, `key`, `enter`, `scene:<name>`, plus async completions
  (`created`, `upload_done`, …). Write `events.json` at the end.
- Pace: each scene's dwell ≥ its VO duration + ~1 s.

Recurring gotchas: file inputs need `waitForFileChooser` + `accept()` (with
`elementHandle.uploadFile` as fallback); a server bound to `localhost` may be
IPv6-only — browsers cope, Node `fetch` needs `http://[::1]:…`; per-request auth
headers (`setExtraHTTPHeaders`) also cover EventSource and WebSocket upgrades.

### 4. Audio track

Build one master WAV (48 kHz mono) in a script — no DAW:

- Decode each VO mp3 to PCM (`ffmpeg -f f32le -`) and add it into a Float64Array
  at `start = max(scene_start + 0.25, prev_line_end + 0.35)` — anchored to scenes,
  but never overlapping the previous line.
- Synthesize FX and add them at event timestamps:
  - *tick* (clicks/keys): 16–35 ms of decaying sine + noise blend,
    `sin(2πft)·(1−n) + noise·n`, envelope `exp(−5·i/N)`.
  - *chime* (success + closing): two staggered decaying partials, 660 Hz then
    990 Hz, ~0.45 s.
  - Gains per `screencast.json` (`fx.gains`); transitions get **no** sound.
- Use a seeded PRNG for the noise so the track is reproducible.
- Peak-guard to ≤ −0.2 dBFS and write a plain 44-byte-header WAV.

### 5. Loudness

Two-pass loudnorm to **−16 LUFS / −1.5 dBTP / LRA 11**: first pass with
`print_format=json`, second pass feeding the `measured_*` values back with
`linear=true`. Single-pass dynamic mode pumps on speech-with-silence material.

### 6. Assemble

Intro card (light cover art) → recording → outro card (dark cover art), joined
with `xfade`, plus the audio:

```
ffmpeg -loop 1 -t 3.4 -framerate 30 -i cover-light.png -i raw.webm \
       -loop 1 -t 3.4 -framerate 30 -i cover-dark.png -i master.wav -filter_complex "
  [0:v]scale=…,crop=1920:1080,fade=t=in:st=0:d=0.5:color=white[intro];
  [1:v]fps=30,format=yuv420p[main];
  [2:v]scale=…,crop=1920:1080,fade=t=out:st=2.4:d=0.9[outro];
  [intro][main]xfade=transition=fade:duration=0.6:offset=2.8[a];
  [a][outro]xfade=transition=fade:duration=0.6:offset=<2.8+main_len-0.6>[v];
  [3:a]loudnorm=…:linear=true,afade=t=out:st=<end-1.6>:d=1.4[aud]" \
  -map "[v]" -map "[aud]" -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart screencast.mp4
```

Audio placed against the main recording shifts by the intro xfade offset
(`output_t = event_t + offset`). Get the exact main length from the frame count
(`ffprobe -count_frames` ÷ fps) — webm containers often report no duration.

### 7. QA — look and listen before shipping

- Extract frames across the timeline (`-vf fps=1/6`) and *actually inspect them*:
  fonts, emoji, thumbnails, captions, cursor position.
- `silencedetect` the final audio and compare speech regions against the planned
  VO layout.
- Check A/V endpoints: narration must finish before the outro card fade completes.

## Publishing

Don't commit the mp4 — video blobs bloat history permanently. Upload it as a
GitHub attachment (drag into any issue comment box, copy the generated
`user-attachments` URL, discard the draft) and paste that URL on its own bare
line in the README: GitHub renders an inline player. Free-plan video limit
is 10 MB; H.264 recommended.
