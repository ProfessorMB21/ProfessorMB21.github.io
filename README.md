# Bupe Mwansa portfolio

A static portfolio site with no build step.

```
index.html              the page
assets/css/styles.css   all styles; colours and fonts are tokens at the top
assets/js/main.js       hero sky, ring network, theme toggle, menu, chart tooltip, project filters, scroll fades
favicon.svg             tab icon
404.html                page shown for unknown addresses
.nojekyll               tells GitHub Pages to serve the files as they are
```

## Publish on GitHub Pages

The simplest address is a user site, which needs a repository named after your username.

1. On GitHub, create a new public repository named `ProfessorMB21.github.io`. Leave it empty (no README, no licence).
2. Add the files so that `index.html` sits at the top level of the repository, not inside a folder.
   - In the browser: open the new repository, choose **Add file > Upload files**, drag in the contents of this folder (including the `assets` folder and the hidden `.nojekyll` file), and commit to `main`.
   - Or from a terminal, inside this folder:
     ```
     git init
     git add .
     git commit -m "Add portfolio site"
     git branch -M main
     git remote add origin https://github.com/ProfessorMB21/ProfessorMB21.github.io.git
     git push -u origin main
     ```
3. In the repository, open **Settings > Pages**. Under **Build and deployment**, set **Source** to **Deploy from a branch**, choose branch `main` and folder `/ (root)`, then save.
4. After a minute or two the site is live at `https://professormb21.github.io`. The Pages screen shows the exact address and the progress of the first deployment.

If you would rather use a project repository (for example `portfolio`), the site appears at `https://professormb21.github.io/portfolio/`. Everything in `index.html` uses relative paths and still works. `404.html` uses root paths, so either delete it or change its three `/assets` and `/favicon.svg` links to relative ones.

## Preview on your computer

From this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

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
