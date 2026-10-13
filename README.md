# Bupe Mwansa

Static portfolio site. Live at [professormb21.github.io](https://professormb21.github.io).

## Files

```
index.html              portfolio page
assets/css/styles.css   all styling
assets/js/main.js       animations and interactions
favicon.svg             tab icon
```

## Editing

- **Content:** edit `index.html`
- **Style:** edit `assets/css/styles.css` (colors and fonts at the top in CSS tokens)
- **Motion:** edit `assets/js/main.js` (constants at lines 14-28)

## Local preview

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.


## Editing

- **Text and projects:** edit `index.html`. Sections have the ids `about`, `skills`, `projects`, `record` and `contact`.
- **Add a project:** copy one `<details class="obj">` block and set its `data-lang` (a space-separated list such as `python` or `cpp html`). Add a matching bar to the commits chart, a row to the table view, and update the filter counts. The disc size comes from `--d`, which is the square root of the star count multiplied by `0.9rem`.
- **Colours and fonts:** change the tokens in the first `:root` block of `assets/css/styles.css`. The light theme is the `prefers-color-scheme: light` block and the `[data-theme="light"]` block, and both need the same edits.
- **Motion:** at the top of the motion engine in `assets/js/main.js`, `IDLE_ROT` and `IDLE_DRIFT` set the hero speed, and `RING_DRIFT` sets how fast the page rings rise. Ring count follows the window size.
