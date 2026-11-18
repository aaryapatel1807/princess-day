# Princess Day — Sachi — Full Plan

Saved 18 Nov 2026. Everything for this project lives in `princess-day/`.
Clips and reference images go here when they exist: `character.png`, `crown.png`, `fairyland.png`, `clip1.mp4`–`clip5.mp4`.

## Date check (verified 18 Nov 2026)

- Couple since: **26 March 2025**
- First proposal: **9 February 2026**
- 26 Mar 2025 → 9 Feb 2026 = **320 days**
- 26 Mar 2025 → 18 Nov 2026 (today) = **602 days**
- So the site line "It's been over 600 days" is true if this is sent now / after 16 Nov 2026. It would not have been true on 9 Feb 2026 itself.
- If Princess Day is meant to be 9 Feb 2027 instead, that is 685 days — the line still holds. Confirm the send date before deploying; the date is only text in the site, so it can be fixed later without redoing any video.

## Status (updated 18 Nov 2026 — built, NOT deployed)

- [x] Step 0: Gather 4–5 clear photos of Sachi (done by Aarya)
- [x] Step 1: ChatGPT references — `character.jpg`, `crown.jpg`, `fairyland.jpg` in this folder
- [x] Step 2: Flow clips — `clip1.mp4`–`clip5.mp4` in this folder (do this first; it takes the longest)
- [x] Step 3: Build the site — DONE by Muse (not Kiro). Production build in `film-build/` (95 MB, ready to publish). Vitest 15/15, Playwright 3/3, all scenes screenshotted at 1440×810 and 390×844 in `tests/screenshots/`. See `film-build/README.md`.
- [ ] Step 4: Deploy, test on your own phone, send her the link with "scroll slowly"

⚠️ Before deploying, decide on the watermark: a Flow sparkle watermark IS present in clip 1 (clearly) and clip 3 (faintly) at fixed ~(1700, 920) — see `public/film/README.md`. It was not removed. Also known: she wears a small tiara in clips 1–4 as well as holding the large crown in clips 3–5.

## Before you start

1. Make a folder called `princess-day`. Everything below goes into it.
2. Gather four or five clear photos of Sachi (front, both sides, smiling, plain background) for Step 1.
3. Decide on the proposal date. I've used 9 February 2026 as you gave it. It's only text in the site, so you can fix it later without redoing any video.
4. Do Step 2 first thing, because the clips take the longest. If time runs short, skip the Real-ESRGAN upscale and deploy without it. You can sharpen the site afterwards.

## Step 1: ChatGPT references

Open ChatGPT, upload Sachi's photos, and paste the prompts below in one chat. Regenerate until you like each image. Save them as `character.png`, `crown.png` and `fairyland.png`.

**Prompt A, character:**
```
Using the uploaded photos, create a stylized 3D animated family-film character of this exact person. Preserve the same face shape, skin tone, eyes, eyebrows, nose, lips, smile and hairstyle, with slightly larger expressive eyes and soft rounded features. Outfit: a flowing deep-rose gown with fine silver-and-gold floral embroidery and a soft short cape. Four-view turnaround sheet (front, back, left, right), full body, neutral pose, gentle smile, plain off-white background, soft even studio lighting, very high detail. No text, no logos.
```

**Prompt B, crown:**
```
Stylized 3D animated family-film design of a small silver crown made of delicate tulip and leaf shapes, resting on a deep-blue velvet cushion on a mossy stone pedestal, with tiny glowing motes around it. Three-quarter view, plain light background, design reference sheet, very high detail. No text, no logos.
```

**Prompt C, fairyland:**
```
Stylized 3D animated family-film establishing shot of an original fairyland at dawn: a giant ancient tree with a cottage built into its trunk, a mossy bridge, a forest of oversized glowing tulips and mushrooms, a still crystal lake, and a distant empty hilltop. Soft mist, volumetric light, gentle golden glow, 16:9, very high detail. No text, no logos, no people.
```

## Step 2: Flow clips

Settings are Omni 1.2 Flash, 16:9, 720p, 8 seconds. Add all three images as ingredients on every clip. **Continuity rule (most important): every clip from Clip 2 on must open on the exact last frame of the previous clip — same pose, same framing, same camera angle, same lighting — hold that frame for a beat, then continue the motion. In Flow, set the last frame of the previous clip as the starting frame for the next clip; the prompt wording below reinforces it, but the starting-frame setting is what actually locks the match.** If her face or the crown changes, regenerate that clip before moving on. Save the results as `clip1.mp4` to `clip5.mp4`.

**Clip 1:**
```
Use the uploaded character, crown and fairyland references. Stylized 3D animated family-film look, 16:9, smooth cinematic motion. Dawn inside a cottage built into a giant tree, soft light through round windows, fireflies fading out. The young woman wakes, rises and walks to the door. Slow push-in, warm golden light. End: she steps onto a moss-covered bridge, seen from behind, above a glowing fairyland forest. No text, no words, no logos, no captions, no extra characters.
```

**Clip 2:**
```
Use the uploaded character, crown and fairyland references. Stylized 3D animated family-film look, 16:9, smooth cinematic motion. Start on the exact last frame of Clip 1: she is standing on the moss-covered bridge, seen from behind, above the glowing fairyland forest — same pose, same framing, same warm golden light. Hold that frame for a beat, then she walks down through the forest among oversized glowing tulips and mushrooms as butterflies drift past. Camera follows at shoulder height, soft mist. End: she stops at the edge of a still crystal lake, seen from behind, with stepping stones leading to a small island. Seamless continuation, no jump cut, no change in her face, outfit, or lighting. No text, no words, no logos, no captions, no extra characters.
```

**Clip 3:**
```
Use the uploaded character, crown and fairyland references. Stylized 3D animated family-film look, 16:9, smooth cinematic motion. Start on the exact last frame of Clip 2: she is standing at the edge of the still crystal lake, seen from behind, with stepping stones leading to a small island — same pose, same framing, same lighting. Hold that frame for a beat, then she crosses the stepping stones as hundreds of glowing lanterns rise slowly off the water around her. Gentle crane-up, then settle. End: she stands in front of the mossy pedestal on the island holding the silver tulip crown, medium side view. Seamless continuation, no jump cut, no change in her face, outfit, or lighting. No text, no words, no logos, no captions, no extra characters.
```

**Clip 4:**
```
Use the uploaded character, crown and fairyland references. Stylized 3D animated family-film look, 16:9, smooth cinematic motion. Start on the exact last frame of Clip 3: she is standing in front of the mossy pedestal on the island holding the silver tulip crown, medium side view — same pose, same framing, same lighting. Hold that frame for a beat, then she lifts the crown with both hands and looks at it. The sky shifts from gold to deep blue dusk, and a castle of soft light appears on a far hilltop. She walks up to a stone overlook. End: she is centred on the overlook with the lit castle behind her. Seamless continuation, no jump cut, no change in her face, outfit, or lighting. No text, no words, no logos, no captions, no extra characters.
```

**Clip 5:**
```
Use the uploaded character, crown and fairyland references. Stylized 3D animated family-film look, 16:9, smooth cinematic motion. Start on the exact last frame of Clip 4: she is centred on the stone overlook with the lit castle behind her — same pose, same framing, same deep blue dusk lighting. Hold that frame for a beat, then she lowers the crown onto her head and looks up with a calm smile. The lanterns and fireflies rise into a sky full of stars. Camera slowly pulls back to a wide shot. End: a wide held shot of the overlook, the glowing castle and the starry sky, with open space in the sky for text. Seamless continuation, no jump cut, no change in her face, outfit, or lighting. No text, no words, no logos, no captions, no extra characters.
```

## Step 3: Build the site in Kiro

Put `clip1.mp4` to `clip5.mp4` and the three images in the `princess-day` folder, open it in Kiro, and paste the three prompts below one at a time. Start the next only after the previous one is done and working.

**Stage 1, media:**
```
Join clip1.mp4 to clip5.mp4 (8s each, 720p, in order) with ffmpeg xfade fades of 0.6s at offsets 7.4, 14.8, 22.2 and 29.6. Check the bottom-right corner for the Flow watermark. If there is one, estimate its alpha mask across about 150 frames, reverse the alpha blend on every frame, inpaint only a thin edge ring with OpenCV TELEA, and verify on zoomed crops until it is invisible. Detect the position at this resolution. Extract frames at 15fps. Upscale 2x with Real-ESRGAN as an optional step that can be skipped. Export public/film/hd (1920x1080 WebP q84) and public/film/sd (1280x720 WebP q78) as f0001.webp onward, plus public/film/poster.webp. Add a short README with the run order.
```

**Stage 2, site:**
```
Build a scroll-driven cinematic site with Vite + React + TypeScript, Framer Motion and Lenis, using the frames in public/film. No loader, navbar, sections or autoplay. A fixed full-screen canvas draws the frame for the current scroll position (cover-fit, high-quality smoothing, nearest loaded frame). Load frames coarse to fine (strides 64 down to 1, 6 at a time, prioritising frames near the viewer). Use hd when screen width x devicePixelRatio is over 1400, otherwise sd. Scroll track is 5200vh on desktop and 4200vh on phones. Add a DWELL remap: while any content is fully visible the film advances 3.2x slower, and it plays at normal speed between chapters. The only chrome is a thin rose-to-gold progress line at the bottom and a small scroll hint at the start. Respect prefers-reduced-motion.

LOOK: midnight navy #080a24, gold #f1cf86 and #fff3cf, rose #f6b6d6. Fonts: Cinzel Decorative for big headings, Cinzel for labels, Cormorant Garamond for body, Manrope for small UI. Everything must feel like part of the movie. Each element drifts in from blur (16px to 0) with a slight rise and scale 0.97 to 1, holds, then floats up and blurs out, with lines arriving one beat after another. Big headings rise letter by letter in warm gold with a soft glow. Text sits on soft blurred radial shadow pools with no boxes, and the film dims slightly while content is on screen. Keep text away from the character's face. On phones, move compositions to the bottom at full width.

SCENES (position as a fraction of the 37.6s film, then placement):
- 0.011-0.090, centre: label "Chapter I · Dawn", heading "Good morning, Sachi." Then 0.106-0.186: "Today is Princess Day, and this whole film was made for you."
- 0.213-0.282, lower centre: label "Chapter II · The Enchanted Wood", heading "Walk slowly." Then 0.293-0.378: "Most days are just days. This one has a whole forest of tulips along its path."
- 0.410-0.479, top-left: label "Chapter III · The Lantern Lake", heading "Your best moments." Then 0.489-0.559: "Every lantern on the water holds one of your best moments." Then three lines, one per lantern glow, in order: "26 March 2025. The day we became a couple." / "9 February 2026. The day I first proposed." / "Every ordinary day in between."
- 0.606-0.676, right: label "Chapter IV · The Crown", heading "Made to fit you." Then 0.691-0.777: "A thank-you for being exactly you."
- 0.803-0.878, centre: label "Chapter V · The Night Sky", heading "Happy Princess Day, Sachi."
- 0.888 to the end, stays on screen: "I'm better at building things than at speeches, so I built you a kingdom. It's been over 600 days and I'd choose you the same way I did on 26 March. Happy Princess Day, Sachi." (The small-type "Every frame was drawn by AI…" note that used to sit below it was REMOVED 18 Nov on Aarya's word — no AI mention anywhere on the site now.)

## Pacing fix — 18 Nov (after Aarya watched the live site)
- Problem: the opening 15–20s of scrolling felt slow and not cinematic; the end felt good. Cause: dwell 3.2x over the middle 60% of every scene meant 74% of all scrolling happened inside dwell zones (film barely moved per scroll notch), 15 fps nearest-frame stepping made motion jumpy, and Lenis lerp 0.09 was too floaty.
- Fix: dwell 1.8x over the middle 40% of each scene; scroll track 5200vh → 4000vh desktop, 4200vh → 3200vh phones; frame blending (crossfade between adjacent frames by fractional frame position) + slow Ken Burns zoom 1.00 → 1.07 across the film; Lenis lerp 0.09 → 0.12; canvas only redraws when progress/frame actually changes. Copy and scene timings unchanged.

## Watermark removal — 18 Nov (Aarya: "watermark remove that")
- The Flow sparkle was in clips 1 (clear) and 3 (faint) only, at a fixed spot bottom-right, centre (1740, 905). Removed by reverse-blending: temporal median isolates the overlay, alpha estimated against a TELEA-inpainted background, every frame un-blended. Rejected: ffmpeg delogo (vertical smear) and plain inpainting (grey blob). Film re-joined from the cleaned clips: 37.21 s, 558 frames (was 37.25 s / 559). Residual: a ~1–2 px faint outline visible only in zoomed crops of the corner; invisible at full-frame scale and in motion. Full method + verification in public/film/README.md §3.

Keep all text in src/data/content.ts and scene timings in src/data/film.ts.
```

**Stage 3, testing:**
```
Run the production build. Take Playwright screenshots of every scene at 1440x810 and 390x844, and fix any overlap, clipping or unreadable text. Add Vitest tests for scroll-to-frame mapping including the dwell remap (clamped at 0 and 1), the stride loading order, and the film.ts timings (no overlaps, all between 0 and 1). Log first-frame time and full-load time, and warn if any frame fails to load. Finish with a ready-to-publish folder named film-build containing the build and the frames.
```

## Step 4: Before you send it

1. Deploy `film-build` to Vercel or Netlify and open the link on your own phone. She will most likely open it there.
2. Scroll the whole film slowly and check each chapter is readable, and that all three dates are right.
3. Send her the link today. It works best if she scrolls slowly, so a short message like "scroll slowly" is enough.

## Notes for Muse

- Muse cannot do Step 1 (needs Sachi's photos + ChatGPT) or Step 2 (needs Google Flow) — those are Aarya's steps.
- Step 3 is written for Kiro, but Muse can build the equivalent site here once the clips exist — just say so.
- The playful message ("scroll slowly") is already in the site prompt, in Step 4.
