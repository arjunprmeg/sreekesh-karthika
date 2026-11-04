# Wedding invitation redesign

This update redesigns the existing invitation while preserving its React/Vite build, event information and GitHub Pages configuration.

Screenshots: [slide-to-open cover](review/cover-390.png) · [mobile hero](review/hero-390.png) · [full mobile invitation](review/full-page-390.png).

## Existing setup

- React 19, TypeScript and Vite; `src/App.tsx` is the homepage and `src/index.css` supplies plain CSS. There is no Tailwind build to preserve.
- `npm run build` runs `tsc -b && vite build`. The separate `app/` directory wraps this same app for Next.js previews; it is not the Pages build.
- Existing fonts are Cormorant Garamond and Noto Serif Malayalam, loaded from Google Fonts.
- GitHub Pages publishes `dist/` via `.github/workflows/deploy.yml`, using the repository subpath `/sreekesh-karthika/`, with Vite's relative base. No custom domain was configured in the preceding deployment.
- Existing features include a tap/swipe cover, transparent couple portrait, Guruvayur blessing, live countdown, looping music, two events, map links, native sharing/copy fallback and calendar downloads.

## Changes

- `src/index.css`: replaced the previous presentation with a narrow navy, antique-gold and ivory invitation, constrained to 620px on desktop; added safe-area spacing, visible keyboard focus and reduced-motion support.
- `src/App.tsx`: layered the supplied decorative artwork and existing couple portrait separately from HTML names/actions; added lazy images, focus handling and an inert closed invitation. The cover now has an iPhone-style draggable thumb: releasing before 90% resets it, completing the slide opens the doors; Enter/Space/End and arrow keys provide keyboard access. The former Copy Link button is now Download Invitation Letter, using the exact supplied `letter-of-invite.jpeg`. Sharing retains its clipboard fallback with an accessible status message.
- `src/index.css`: the date and Malayalam names enter in a staggered fade/rise after opening. Reduced-motion mode disables these animations and the slider label shimmer.
- All `h2` headings have a soft gold glow, and the hero portrait slowly zooms for depth. Four independently isolated lamps swing on both the cover and hero while the arch stays stationary. These animations respect reduced-motion settings.
- Individual bride (`1.png`) and groom (`2.png`) portraits appear above the footer, using optimized WebP copies, gold arch frames and Malayalam names. The footer credits Team KTimes and links to its contact page.
- `src/config.ts`: points the hero and temple imagery to optimized local WebP assets. Wedding/reception information and +05:30 times remain unchanged.
- `src/calendar.ts`: extracted calendar generation for verification, escaped event text and preserved UTC serialization of Asia/Kolkata event times. Downloads now release their object URLs after the click completes.
- `index.html`, `app/layout.tsx`: coordinated browser theme color and supplied a subpath-compatible favicon. Existing SEO and social preview content remains.
- `public/assets/decor/`: arch, lamps, murals and lotus artwork extracted from the supplied reference. No reference names/buttons are used as webpage content.
- `public/assets/bg/`: all seven newly supplied background assets are used as optimized transparent WebP layers: temple, divider, mural, corner ornament, pillar, palm and lotus. Independent motif opacity (typically 24–46%), deeper navy, continuous side pillars and gold section dividers carry the decoration throughout the cover, hero, blessing, countdown, both events and closing. Decorative layers do not receive pointer events; text and controls remain fully opaque.
- `public/assets/couple/bride-groom-portrait.webp`: optimized derivative of the supplied `bride-groomportrait-.png`, preserving its transparent background. Faces, clothing and proportions were not regenerated or retouched.
- `public/assets/temple/`: optimized local copies of the site's existing two temple photographs.
- `scripts/prepare-wedding-art.mjs`: repeatable Sharp crops/masks and portrait optimization; originals are preserved. Sharp is already available in the installed dependency tree; no dependency or package configuration was changed.
- `scripts/prepare-background-art.mjs`: prepares the seven supplied background assets as WebP, preserving original PNGs and transparency.
- `scripts/prepare-individual-portraits.mjs` and `scripts/prepare-lamp-art.mjs`: optimize the bottom portraits and prepare independent lamp layers from the original artwork. Run the lamp preparation after `prepare-wedding-art.mjs` if regenerating assets.
- `scripts/verify-redesign.mjs`: local Chrome checks with the production build served under the repository subpath; screenshots are written to a temporary review directory. Set `REVIEW_BROWSER` if Chrome is installed elsewhere.

## Validation

- Production TypeScript/Vite build passed.
- Headless Chrome checked 375, 390, 430, 768 and 1440px widths: no horizontal overflow, Malayalam names fit, and the desktop invitation remains constrained.
- Mouse and touch dragging open the cover only after completing the slider. An incomplete drag resets the thumb; tapping the cover does not open it. Enter opens it from keyboard focus. Covered page controls are inert until opening.
- Countdown changes every second and includes all four units.
- Both map links match the supplied URLs.
- Wedding calendar: 24 January 2027, 03:00–04:00 UTC = 08:30–09:30 Asia/Kolkata.
- Reception calendar: 26 January 2027, 08:30–10:30 UTC = 14:00–16:00 Asia/Kolkata.
- Both calendar buttons produce the correct downloads. The invitation letter download was saved in Chrome and byte-compared with the supplied JPEG. Share and its clipboard fallback passed with browser API stubs. Native device share-sheet presentation was not tested.
- Date/name animation delay and final visibility passed, and both the entrance animation and slider shimmer disable under reduced motion.
- Browser checks confirmed the lamps change their transform over time, the arch stays stationary and reduced motion disables the lamp swing.
- Audio starts, loops, and pauses with the sticky toggle in Chrome. Mobile browsers may require opening the invitation or tapping Music before playback.
- Reduced-motion styling passed; local assets returned successfully under `/sreekesh-karthika/`, with no browser runtime exceptions.
- Full-page and viewport screenshots were visually reviewed. Physical iPhone/Safari testing remains outside this local Chrome check.

## Reference limitations

The supplied reference is a flattened image. Its arch, lamps, side murals and lotus artwork were recovered using deterministic cropping/masking, without generating new decorations or faces. Clean original isolated artwork would allow more exact edges and positioning.

For a closer match, the remaining assets needed are:

1. A separate transparent jasmine garland/flower accent for independent positioning. The latest supplied portrait already includes traditional attire, jasmine in the bride's hair and a floral accent at the bottom; those are preserved as part of that supplied image.

## Review locally

```sh
npm run dev:vite
```

For production verification:

```sh
npm run build
node scripts/verify-redesign.mjs
```

The build refreshes the existing tracked `dist/` output locally. Existing unrelated working-tree changes were preserved.
