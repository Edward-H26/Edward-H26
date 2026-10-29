# Development

This repository is the source of the GitHub profile README at
[github.com/Edward-H26](https://github.com/Edward-H26). `README.md` is the public page; everything
inside its HTML comment markers, and every image it embeds, is generated from the data under
`scripts/data/`. Edit the data, run the renderer, commit the result.

## Getting started

```bash
nvm use    # Node 24 (.nvmrc); the workflow runs on Node 20
npm ci
npm run render          # static cards into assets/ and the README blocks
npm run preview:dynamic # the live cards into dist/ from the recorded fixture, no network
```

| Script                    | What it does                                                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run render`          | Writes the static cards (hero, link icons, paper buttons and thumbnails, skills marquee) to `assets/` and regenerates the marked blocks of `README.md` |
| `npm run render:dynamic`  | Fetches the live GitHub data with `GH_TOKEN` and writes the stats, code, and 3D contribution cards to `dist/`                                          |
| `npm run preview:dynamic` | The same cards from `scripts/fixtures/github.json`, so they can be checked without a token                                                             |
| `npm run fixture`         | Refreshes the recorded fixture from the network                                                                                                        |
| `npm run scenes -- hero`  | Renders a three.js scene (`hero` or `planet`) to an animated WebP under `assets/scenes/`; `--still 2.5` writes one PNG frame instead                   |
| `npm test`                | Node's test runner over every `*.test.mjs` under `scripts/`                                                                                            |
| `npm run lint`            | ESLint over `scripts/`, `scenes/`, and the config files                                                                                                |
| `npm run format`          | Prettier, rewrites files                                                                                                                               |
| `npm run format:check`    | Prettier, reports only (what CI runs)                                                                                                                  |

The scene renderer needs Playwright's Chromium (`npx playwright install chromium` inside `scenes/`)
and `img2webp` from libwebp on the PATH. The island reuses the models and textures of the sibling
`PersonalWebsite` checkout when it sits next to this repository, and falls back to the published
site otherwise.

## Directory map

```
README.md                      the profile page; generated blocks sit between <!-- name:start --> and <!-- name:end -->
assets/                        committed cards and figures the README embeds (SVG, so GitHub's image proxy serves them)
assets/badges/                 hand-written badge SVGs linked from the experience sections
assets/scenes/                 the hero and research planet loops rendered from scenes/
dist/                          live cards, written by the Profile Assets workflow to the output branch; ignored by git
scripts/render-assets.mjs      command line entry: static render, or --dynamic with --fixture or --save-fixture
scripts/data/                  the content: profile, focus areas, papers, skills, links (no Node imports, the scenes load them too)
scripts/cards/                 one renderer per card; contributions-3d/ holds the skyline, radar and donut of the 3D card
scripts/github/                GitHub GraphQL client (api, queries) and the pure summarizers (contributions, languages, code, summary)
scripts/readme.mjs             renders the README blocks (links, featured papers, paper list, skills, views)
scripts/render-static.mjs      registry of the committed cards: which renderer writes which assets/ file
scripts/render-dynamic.mjs     registry of the live cards written to dist/
scripts/svg.mjs                themes, SVG helpers and XML escaping shared by every card
scripts/materials.mjs          gradients, glows and glass effects reused across cards
scripts/color.mjs              hex colour shading and mixing
scripts/numbers.mjs            number formatting for labels
scripts/paths.mjs              absolute paths of the files the renderers read and write
scripts/fixtures/github.json   recorded GitHub API response for tests and previews
scripts/normalize-paper-figures.py  places every paper figure on one 16:9 canvas before it is embedded
scenes/hero.js, planet.js      the two three.js scenes, driven by scenes/render.mjs in headless Chromium
scenes/lib/island/             the island of the hero scene: terrain, road, vegetation, lighthouse, foam, mist, birds
scenes/lib/sky/                day and night skies: dome, stars, aurora, clouds, lights, shooting stars
scenes/lib/                    shared scene pieces: stage, sea, planet, network, textures, assets, periodic timing
.github/workflows/             ci.yml (lint, format, tests, stale check) and profile-assets.yml (live cards every six hours)
```

## How the README is produced

1. `scripts/data/*.mjs` hold the facts: name and bio, research focus, papers with authors, venue and
   links, skill rows, profile links. They are plain data modules so the scenes can import them in
   the browser as well.
2. `npm run render` calls every renderer in `scripts/render-static.mjs`, writes the SVG files to
   `assets/`, then rewrites the marked blocks of `README.md` through `scripts/readme.mjs`. Text outside
   the markers is written by hand.
3. The Profile Assets workflow runs every six hours and on every push to `main`: it tests the
   renderers, renders the live cards from the GitHub API, draws the contribution snake, keeps the
   previous copy of anything that failed to render, and pushes `dist/` to the `output` branch, which
   the README loads from.
4. CI runs on every push and pull request: lint, format check, tests, then `npm run render` followed
   by `git diff --exit-code -- README.md assets`, so a data edit that was not rendered fails the build.

The scenes are rendered by hand (`npm run scenes -- hero` or `planet`) because they need a GPU, and
their WebP loops are committed. Hero renders differ slightly from run to run (the GPU is not
deterministic); the planet is reproducible.

## Testing

`scripts/render-assets.test.mjs` covers the static cards, the GitHub summarizers against the
fixture, and the live cards, including edge cases such as an account with no contributions and
hostile repository names. `scripts/helpers.test.mjs` covers the number and colour helpers. Every
renderer is pure, so tests never touch the network.

## Conventions

- Formatting is Prettier's job (`.prettierrc`): no semicolons, double quotes, 140 columns, no
  trailing commas. `README.md`, `assets/`, `dist/`, the fixtures, the scene HTML overlays and the
  lockfiles are not formatted.
- ESLint runs the recommended rules plus `eqeqeq`, `no-var` and `prefer-const`; scripts get Node
  globals, scenes get browser globals.
- Every module starts with `// @ts-check` and a comment on what it is for; exported functions carry
  JSDoc with parameter types, so editors type-check the JavaScript without a build step.
- Tuned numbers are named constants with a comment on why they have the value they do; comments
  explain why, not what.
- Third-party GitHub Actions are pinned to commit SHAs with the tag in a trailing comment.
