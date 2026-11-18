# Stage 1 — Media (run order)

Source clips (all 1920×1080 h264, 24fps, in `~/workspace/princess-day/`):

| clip | duration |
| --- | --- |
| clip1.mp4 | 7.930000 s |
| clip2.mp4 | 7.916667 s |
| clip3.mp4 | 7.916667 s |
| clip4.mp4 | 7.930000 s |
| clip5.mp4 | 7.930000 s |

## 1. Join (xfade 0.6s)

```bash
ffmpeg -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 -i clip4.mp4 -i clip5.mp4 \
  -filter_complex "[0:v][1:v]xfade=transition=fade:duration=0.6:offset=7.33[x1];[x1][2:v]xfade=transition=fade:duration=0.6:offset=14.646667[x2];[x2][3:v]xfade=transition=fade:duration=0.6:offset=21.963334[x3];[x3][4:v]xfade=transition=fade:duration=0.6:offset=29.293334[vout]" \
  -map "[vout]" -c:v libx264 -pix_fmt yuv420p -crf 16 -preset slow -an media/joined.mp4
```

Offsets are dur−0.6 cumulative: 7.33, 14.646667, 21.963334, 29.293334.
Result: `media/joined.mp4`, **37.25 s** (ffprobe), 1920×1080, 42 MB.
Expected total = 39.623334 − 4×0.6 = 37.223334 s; the 37.25 s ffprobe value is frame rounding at 24 fps. `src/data/film.ts` uses 37.25.
(18 Nov watermark removal re-join: cleaned clips 1 & 3 are 7.916667 s, so
offsets became 7.316667, 14.633334, 21.95, 29.28; joined 37.208 s, 558
frames; film.ts now 37.21 s / 558. See §3.)

## 2. Extract frames at 15 fps

```bash
ffmpeg -i media/joined.mp4 -vf fps=15 -c:v libwebp -quality 84 -threads 4 public/film/hd/f%04d.webp
ffmpeg -i media/joined.mp4 -vf "fps=15,scale=1280:720" -c:v libwebp -quality 78 -threads 4 public/film/sd/f%04d.webp
ffmpeg -ss 2 -i media/joined.mp4 -vframes 1 -c:v libwebp -quality 84 public/film/poster.webp
```

Result: **558 frames** (f0001.webp–f0558.webp) in each of `hd/` and `sd/`.
(Was 559 before the 18 Nov watermark-removal re-join; the join is 42 ms
shorter now.)
- `public/film/hd/` — 1920×1080 WebP q84 — **63 MB** (64,067,324 bytes)
- `public/film/sd/` — 1280×720 WebP q78 — **32 MB** (32,054,192 bytes)
- `public/film/poster.webp` — 1920×1080, frame at 2 s — 123 KB

No Real-ESRGAN upscale (clips already 1080p, skipped per plan).

## 3. Watermark — REMOVED 18 Nov (on Aarya's word, reversing the deploy-as-is call)

The Flow sparkle (semi-transparent white 4-point star, centre (1740, 905),
spanning x 1705–1775, y 875–935) was present in clips 1 (clear, alpha ~0.3)
and 3 (faint, alpha ~0.2) only — median-residual checks on clips 2/4/5 were
~0, so they were left untouched.

Method (script `/tmp/clean_watermark.py`, cv2 in a venv — no cv2 on the
system python): temporal median over every 6th frame isolates the fixed
overlay; background = TELEA inpaint of the median with a dilated star mask;
alpha = (median − bg) / (255 − bg), clipped [0, 0.85], zero outside the star
box, Gaussian σ0.5, low-alpha fringe suppressed (× clip(alpha/0.15)) so the
reverse-blend doesn't draw a dark outline. Every frame:
recovered = (observed − alpha·255) / (1 − alpha). Re-encoded libx264 crf 16.
Rejected first: ffmpeg delogo (left a vertical smear) and plain TELEA
inpaint (left a grey blob). Residual: a ~1–2 px faint outline visible only
in zoomed crops of the corner; at full-frame scale and in motion it is
invisible, and the bright star is gone. Verified on crops at joined 4 s
and 20 s, and on a full 1440×810 frame.

Re-join (cleaned clips are 7.916667 s each, 13 ms shorter): offsets
7.316667, 14.633334, 21.95, 29.28. Result: `media/joined.mp4`, **37.208 s**,
**558 frames** at 15 fps — `src/data/film.ts` updated to 37.21 s / 558
frames (was 37.25 s / 559).

## 4. Known film imperfection (left as-is)

She wears a small tiara in clips 1–4 as well as holding the large tulip crown in clips 3–5. Not fixed in code or in the film.
