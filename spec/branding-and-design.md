# MIS Department — Master Branding & Design System v1.0
Status: **Visual Baseline Approved**, pending project-specific content and verified real assets.

## Brand
- Public name: **MIS Department**; positioning: **Operational Intelligence, Real Impact.**
- Services: Real-Time Monitoring & Operations; Quality & Performance Management; Dashboards & Advanced Reporting.
- Purpose: executive-ready portfolio with credible case studies, not inflated KPIs or invented testimonials.

## Visual rules
- Hybrid Premium: navy immersive hero and projects; editorial light sections; cinematic large cards; light CMS.
- Hero visible text and CTA appear before any 3D effects. No scroll hijacking.
- Gallery manual navigation on desktop; stacked cards on mobile; individual cases use Challenge → Solution → Media → Delivered Value.
- Typography: Inter for English and IBM Plex Sans Arabic; system fallback, no redistributing font files.
- Tokens: Navy `#071226`, Deep Navy `#0D2142`, Royal Blue `#1D68ED`, Cyan `#3DC8F2`, Pale White `#F5F8FD`, Ink `#10213C`, Secondary `#53657F`, Border `#E5EDF7`.
- Cyan is decorative, not small text on white. Verify all actual text/background pairs at 4.5:1 normal and 3:1 large text.
- Logical CSS properties; HTML `dir` per locale; keep numeric identifiers and emails LTR.

## Breakpoints and acceptance widths
360, 390, 430, 768, 1024, 1440, 1920px. ≤600: one column; 601–860: tablet with toggle navigation; ≥861: desktop. No horizontal overflow or hidden CTA. Touch controls, focus rings, reduced motion.

## Motion storyboard
1. Instant readable headline and CTA.
2. Optional lazy-loaded WebGL art with static/CSS poster for mobile/low power.
3. Soft about text reveal.
4. Hover and keyboard focus on services.
5. Large cinematic project card transition via explicit buttons, no forced horizontal scroll.
6. Impact section with soft reveals; no fictitious counters.
7. Closing CTA.

## Scope note
GitHub Pages static preview currently uses CSS depth and gentle motion, **not** the final GSAP/R3F sequence. Advanced animation implementation and performance proof are Phase 3 work.
