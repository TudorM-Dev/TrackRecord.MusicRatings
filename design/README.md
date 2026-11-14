# Design

Static comps, outside the app build. Open any file in a browser.

The first interface was assembled rather than designed: three separate controls for one
score, an `ALBUM` tag on every row of a list where everything is an album, album art
rendered at 52px in a product whose content *is* album art, and a 44px horizontal
overflow at 375px. Rather than patch it, I drew three directions and picked one.

| File | Direction |
| --- | --- |
| `a-ledger.html` | Paper ledger. Scores in a fixed tabular column, one ruler-style control, year right-aligned. |
| `b-sleeve.html` | Cover art leads. Grid of sleeves, score set on the artwork, release page tinted by the record. |
| `c-console.html` | Dense instrument. A shape column that shows the distribution of a taste at a glance, keyboard-first. |
| `b2-tint.html` | Picking the background level, with the tint extracted live from real covers. |

**Sleeve shipped.** A recruiter meets this project as a 400px screenshot, and the cover
art is the only strong visual material already in the database. The typographic
discipline from Ledger came along: one stable score column, a single rating control, and
no kicker labels above headings.

## Colour

There is no fixed accent on a release page. `client/src/tint.ts` samples the cover at
28&times;28, bins the pixels by hue, drops anything too dark, too pale or too grey, and
takes the heaviest bin, then clamps saturation and lightness so the result stays legible
on the background. That hex is set as `--tint` on `:root`, so the wordmark, nav underline,
focus ring, caret and text selection all follow the record you are looking at. A
black-and-white cover yields a neutral grey rather than an invented colour.

Backgrounds were chosen by rendering them, not by argument. `#141210`: deep and warm,
with the worst-case cover tint still at 3.58:1 against it.
