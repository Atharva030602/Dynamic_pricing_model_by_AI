# Twofold in Figma: screens and a clickable prototype

One merged file, twofold-all.html, holds all 74 screens plus the design system (the three separate files are still included). They hold 74 screens captured from the working app, including empty, loading and error states.
`scripter-prototype.ts` turns them into a clickable prototype.

## Steps

1. Create a Figma design file with one page called **Prototype**.
2. Install an HTML-to-Figma import plugin (for example **html.to.design**). Import, into that same page:
   - `twofold-reader-desktop.html`
   - `twofold-creator-desktop.html`
   - `twofold-mobile.html`

   Keep the default "desktop" viewport of the plugin at 1440 or wider so nothing reflows. Photos load from Unsplash during import.
   Fonts used: Newsreader, Schibsted Grotesk and JetBrains Mono (all on Google Fonts, available in Figma).
3. Open the **Scripter** plugin on the same page, paste the whole of `scripter-prototype.ts`, and press Run.
   It reports how many screens it found and how many interactions it wired, and lists anything it couldn't match.
4. Press **Present**. Pick a flow: *Reader, desktop: first visit*, *Reader, desktop: home*, *Creator, desktop: sign in and set up*, or *Phone: reader*.

## Design system frame

Each HTML file opens with a 1440-wide frame, **DS Twofold design system**, above the screens. It lists every colour token (hex, CSS variable, use, contrast on white and paper), the three type families and the full type scale, spacing, radii, borders, elevation, motion, chart rules, and the components (buttons, segmented control, chips, use and status tags, meters, stars, inputs, story card, licence row, licence JSON). Values come from `src/index.css` and `src/ui/kit.tsx`. The Scripter script ignores this frame; the screens are unchanged. `scripts/figma_design_system.py` re-adds it after a re-capture.

## What the script sets up

- Every screen becomes a top-level frame named by its code (for example `D10 Home, For you with welcome note`), sized to the device (1440×900 or 390×844) with vertical scrolling for long pages.
- Click interactions on buttons, links, cards, tabs and headlines (found by their text), with push, dissolve, smart-animate and move-in transitions.
- Overlays: AI reading companion, account menu, publish dialog, and the 5-step studio tour (Next and Back swap the overlay in place, Skip closes it, “Go deeper” swaps to a more detailed step).
- Timed transitions for loading states (connecting an account, studying a channel) and the first-visit tour on the creator hub.
- Scroll-to: the comment count on an article scrolls to the comment box.
- Keyboard: Esc closes any overlay; Backspace goes back.
- Links across flows: the welcome screen leads into creator sign-up, the creator’s publish dialog opens the reader home, and so on.
- Safe to re-run: it clears the interactions it set before.

## Screen inventory

### Reader, desktop (1440)

| Screen | State |
|---|---|
| D01 | Welcome, choose reader or creator |
| D02 | Reader questions, intents picked |
| D03 | Reader questions, topics pop in |
| D04 | Reader questions, this or that |
| D05 | Reader questions, in your own words |
| D06 | Reader questions, connecting an account (loading) |
| D07 | Reader questions, account connected |
| D08 | Reader questions, reading rhythm and report |
| D09 | Reader questions, account (name, email, password) |
| D10 | Home, For you with welcome note |
| D11 | Home, Sports category |
| D12 | Search, direct and indirect results |
| D13 | Search, no results |
| D14 | Saved, empty |
| D15 | Article |
| D16 | Article, AI companion (overlay) |
| D17 | Article as an AI system |
| D18 | Community |
| D19 | Community, new post with link error |
| D20 | Community thread |
| D21 | Reading report, Premium |
| D22 | Reading report, not Premium |
| D23 | Account menu (overlay) |
| D24 | Sign in |
| D25 | Sign in, wrong password |
| D26 | Saved stories |
| D27 | Home, welcome back after sign-in |
| D28 | Accounts database (What we stored) |

### Creator, desktop (1440)

| Screen | State |
|---|---|
| C01 | Creator Studio sign-in (signed in as reader) |
| C02 | Sign-in, wrong password |
| C03 | Sign-in, no creator account for email |
| C04 | Join 1, you (invalid email) |
| C05 | Join 2, your work |
| C06 | Join 3, studying channel (loading) |
| C07 | Join 3, what we learned |
| C08 | Join 4, audience and goals |
| C09 | Join 5, AI terms |
| C10 | Join 6, verify email |
| C11 | Join 6, wrong code |
| C12 | Tour 1, your studio (overlay) |
| C13 | Tour 1, go deeper (overlay) |
| C14 | Tour 2, create a post (overlay) |
| C15 | Tour 3, licence (overlay) |
| C16 | Tour 4, analytics (overlay) |
| C17 | Tour 5, live demo (overlay) |
| C18 | Hub, new creator (empty) |
| C19 | Hub, established creator |
| C20 | Write, new post (blank) |
| C21 | Write, imported PDF with value |
| C22 | Write, new category rejected |
| C23 | Write, new category approved |
| C24 | Write, unsupported file |
| C25 | Licence, for both |
| C26 | Licence, for people, promoted |
| C27 | Published (overlay) |
| C28 | Earnings and audience |
| C29 | Post analysis |
| C30 | Live demo |

### Phone (390)

| Screen | State |
|---|---|
| M01 | Welcome |
| M02 | Reader questions, topics pop in |
| M03 | Reader questions, this or that |
| M04 | Reader questions, account |
| M05 | Home, For you |
| M06 | Search results |
| M07 | Article |
| M08 | AI companion (overlay) |
| M09 | Community |
| M10 | Community thread |
| M11 | Reading report |
| M12 | Saved, empty |
| M13 | Creator Studio sign-in |
| M14 | Creator hub |
| M15 | Sign in |
| M16 | Saved stories |

## Re-capturing after design changes

With the dev server running (`node server/dev.mjs`), run `python3 scripts/figma_export.py`. It replays each state in a headless browser and writes the three HTML files again.
