# Bupe Mwansa portfolio

A static portfolio site with no build step. Live at [professormb21.github.io](https://professormb21.github.io).

```
index.html              the page
assets/css/styles.css   all styles; colours and fonts are tokens at the top
assets/js/main.js       hero sky, ring network, theme toggle, menu, chart tooltip, project filters, scroll fades
favicon.svg             tab icon
```

## Editing

- **Text and projects:** edit `index.html`. Sections have the ids `about`, `skills`, `projects`, `record` and `contact`.
- **Add a project:** copy one `<details class="obj">` block and set its `data-lang` (a space-separated list such as `python` or `cpp html`). Add a matching bar to the commits chart, a row to the table view, and update the filter counts. The disc size comes from `--d`, which is the square root of the star count multiplied by `0.9rem`.
- **Colours and fonts:** change the tokens in the first `:root` block of `assets/css/styles.css`. The light theme is the `prefers-color-scheme: light` block and the `[data-theme="light"]` block, and both need the same edits.
- **Motion:** at the top of the motion engine in `assets/js/main.js`, `IDLE_ROT` and `IDLE_DRIFT` set the hero speed, and `RING_DRIFT` sets how fast the page rings rise. Ring count follows the window size.

## Preview locally

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Notes

- GitHub stats (repositories, followers, starred) are fetched dynamically from the GitHub API.
- Your email address appears in `index.html` as plain text for visitors to copy.
- Visitors with reduced motion preference see a still background and no animations.
- The theme toggle stores its choice in the visitor's browser (localStorage). No cookies or trackers.

## Editing

- **Text and projects:** edit `index.html`. Sections have the ids `about`, `skills`, `projects`, `record` and `contact`.
- **Add a project:** copy one `<details class="obj">` block and set its `data-lang` (a space-separated list such as `python` or `cpp html`). Add a matching bar to the commits chart, a row to the table view, and update the filter counts. The disc size comes from `--d`, which is the square root of the star count multiplied by `0.9rem`.
- **Colours and fonts:** change the tokens in the first `:root` block of `assets/css/styles.css`. The light theme is the `prefers-color-scheme: light` block and the `[data-theme="light"]` block, and both need the same edits.
- **Motion:** at the top of the motion engine in `assets/js/main.js`, `IDLE_ROT` and `IDLE_DRIFT` set the hero speed, and `RING_DRIFT` sets how fast the page rings rise. Ring count follows the window size.

## Things to know

- The figures (52 repositories, 419 followers, 327 starred, commit counts, stars and forks) were read from GitHub on 12 and 13 October 2026. They are typed into the page and need updating by hand.
- Your email address, `profbupeeli@gmail.com`, appears in `index.html` as plain text for visitors to copy. Anyone, including automated scrapers, can read it. Remove it or swap it for a contact form if that worries you.
- Visitors whose devices ask for reduced motion see a still background and no fades.
- The theme toggle stores its choice in the visitor's browser (localStorage). There are no cookies or trackers. The only outside request is to Google Fonts, for Italiana, Jost and DM Mono.
