// @ts-check
// Absolute paths of the repository and of the files the renderers read and write.
import path from "node:path"
import { fileURLToPath } from "node:url"

/** The repository root, the parent of scripts/. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

/** Committed static cards, paper thumbnails, and the cropped paper figures they embed. */
export const ASSETS_DIR = path.join(ROOT, "assets")
export const FIGURES_DIR = path.join(ASSETS_DIR, "papers/figures")

/** Live cards, published to the output branch by the Profile Assets workflow; ignored by git. */
export const DIST_DIR = path.join(ROOT, "dist")

export const README_PATH = path.join(ROOT, "README.md")

/** Recorded GitHub API response used by `--fixture` and the tests. */
export const FIXTURE_PATH = path.join(ROOT, "scripts/fixtures/github.json")
