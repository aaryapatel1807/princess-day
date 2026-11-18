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

## 2. Extract frames at 15 fps

```bash
ffmpeg -i media/joined.mp4 -vf fps=15 -c:v libwebp -quality 84 -threads 4 public/film/hd/f%04d.webp
ffmpeg -i media/joined.mp4 -vf "fps=15,scale=1280:720" -c:v libwebp -quality 78 -threads 4 public/film/sd/f%04d.webp
ffmpeg -ss 2 -i media/joined.mp4 -vframes 1 -c:v libwebp -quality 84 public/film/poster.webp
```

Result: **559 frames** (f0001.webp–f0559.webp) in each of `hd/` and `sd/`.
- `public/film/hd/` — 1920×1080 WebP q84 — **63 MB** (64,067,324 bytes)
- `public/film/sd/` — 1280×720 WebP q78 — **32 MB** (32,054,192 bytes)
- `public/film/poster.webp` — 1920×1080, frame at 2 s — 123 KB

No Real-ESRGAN upscale (clips already 1080p, skipped per plan).

## 3. Watermark re-check — ⚠️ FOUND, NOT REMOVED

The task brief said the clips were verified clean. Re-checking disagrees:

- A semi-transparent white 4-point sparkle (Google/Flow AI watermark) sits at a **fixed position, ~ (1700, 920) in 1920×1080**, bottom-right quadrant.
- It is **clearly visible in clip 1** at 1 s, 4 s and 6 s at the identical pixel position while the scene behind it changes completely (cushion → door → wall) — a fixed overlay, not a scene sparkle. A 16-frame temporal median makes it stand out sharply.
- **Faintly visible in clip 3** (same position, ~20 s in the joined film, over the lake).
- Not visible in the temporal medians of clips 2, 4, 5 (busy/bright backgrounds there may hide it, or it is absent).
- Confirmed on the **joined film**: crop at 4 s shows the star clearly; crop at 20 s shows it faintly.
- Evidence crops: `/tmp/pd-stage1/` (`clip1_median_br.png`, `clip3_median_br.png`, `joined_br_4s.jpg`, `joined_br_20s.jpg`).

No alpha-mask / TELEA removal was done, per the task brief. **Decision needed before shipping:** the opening ~7 s of the film shows this sparkle on dark wood. Either accept it, or run the removal pass from the original plan (estimate alpha mask over ~150 frames, reverse the blend, TELEA-inpaint only a thin edge ring, verify on zoomed crops).

## 4. Known film imperfection (left as-is)

She wears a small tiara in clips 1–4 as well as holding the large tulip crown in clips 3–5. Not fixed in code or in the film.
