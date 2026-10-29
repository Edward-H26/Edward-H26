// @ts-check
// Papers in README order. A paper with a `thumbnail` gets a figure card: its cropped figure
// (assets/papers/figures/<id>.webp) is rendered into assets/papers/<id>.svg with the venue badge.
// Papers under review carry a neutral concept illustration rather than their figures. Each link
// label renders as one keycap button (assets/paper-link-<label>).

/**
 * @typedef {{ label: string, url: string }} PaperLink
 * @typedef {{ badge: string, alt: string }} PaperThumbnail
 * @typedef {{ id: string, title: string, authors: string[], venue: string, thumbnail?: PaperThumbnail, links: PaperLink[] }} Paper
 */

/** Venue text of a paper that has not been accepted yet; such papers get no primary link. */
export const UNDER_REVIEW = "Under review"

/** @type {Paper[]} */
export const PAPERS = [
  {
    id: "ac3s",
    title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
    authors: ["Eric Ji", "Qiran Hu", "Wufei Ma", "Sarthak Jain", "Yingying Li", "Minh N. Do", "Yaoyao Liu"],
    venue: "European Conference on Computer Vision (ECCV) 2026",
    thumbnail: {
      badge: "ECCV",
      alt: "The AC3S pipeline: a CAD model rendered and turned into a canny edge prompt, a modulator that sets the ControlNet conditioning scale, a diffusion generator that returns a photo in the same 3D pose, and a multi-agent vision language model that composes the text prompt"
    },
    links: [
      { label: "arXiv", url: "https://arxiv.org/abs/2606.31204" },
      { label: "Code", url: "https://ac3s.cvmlgroup.web.illinois.edu/" },
      { label: "Video", url: "https://youtu.be/3jOJaT2a8iQ" },
      { label: "BibTeX", url: "https://arxiv.org/bibtex/2606.31204" }
    ]
  },
  {
    id: "reva",
    title: "REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving",
    authors: ["Tuan Nguyen", "Qiran Hu", "Banruo Liu", "Khoa D. Doan", "Kok-Seng Wong", "Fan Lai"],
    venue: "IEEE International Conference on Data Mining (ICDM) 2026",
    thumbnail: {
      badge: "ICDM",
      alt: "The REVA system: past requests leave reusable word scores in a word-score store, and a new request materializes per-document views from them"
    },
    links: [
      { label: "arXiv", url: "https://arxiv.org/abs/2609.11209" },
      { label: "Code", url: "https://github.com/UIUC-MLSys/REVA" },
      { label: "BibTeX", url: "https://arxiv.org/bibtex/2609.11209" }
    ]
  },
  {
    id: "acdn",
    title: "ACDN: Agent-Aware Content Delivery Network",
    authors: ["Tuan Nguyen", "Qiran Hu", "Dibyadeep Saha", "Banruo Liu", "Khoa D. Doan", "Kok-Seng Wong", "Fan Lai"],
    venue: UNDER_REVIEW,
    thumbnail: { badge: UNDER_REVIEW, alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "sv4d",
    title: "SV4D 3.0: Single-Step 3D-Aware Diffusion for Multi-View-Consistent 4D Scene Generation",
    authors: ["Qiran Hu", "Wei Cao", "Yaoyao Liu"],
    venue: UNDER_REVIEW,
    thumbnail: { badge: UNDER_REVIEW, alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "aisim",
    title: "AISim: Using LLM-Simulation as Epistemic Scaffolds for Early Stage Qualitative Research Design",
    authors: ["Hangyue Zhang", "Qiran Hu", "Ziyi Zhang", "Hyanghee Park", "Yun Huang"],
    venue: UNDER_REVIEW,
    thumbnail: { badge: UNDER_REVIEW, alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "alphawise",
    title: "AlphaWiSE: Adaptive Weight Interpolation for Continual Multimodal Representation Learning",
    authors: ["Sarthak Jain", "Qiran Hu", "Zhen Zhu", "Yaoyao Liu"],
    venue: UNDER_REVIEW,
    thumbnail: { badge: UNDER_REVIEW, alt: "No public figure yet; this paper is under review" },
    links: []
  }
]

/** Every distinct link label across the papers, in first-seen order; one button file per label. */
export const PAPER_BUTTONS = [...new Set(PAPERS.flatMap((paper) => paper.links.map((link) => link.label)))]

/**
 * File stem of the button rendered for a link label: "BibTeX" becomes "paper-link-bibtex".
 * @param {string} label
 */
export const paperButtonId = (label) => `paper-link-${label.toLowerCase().replace(/\W+/g, "-")}`
