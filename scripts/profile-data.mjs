// Content for the generated profile assets. Edit here, then run `npm run render`.
export const PROFILE = {
  name: "Qiran Hu",
  handle: "Edward-H26",
  role: "Research Assistant",
  affiliations: ["Computer Vision and Machine Learning Group, UIUC", "M.S. in Data Science, Columbia University"],
  taglines: ["Advancing Human-Centered Intelligence", "Building Agentic Systems and Computer Vision", "Creating AI That Understands the World"]
}

export const FOCUS = [
  { label: "3D-Aware Generation" },
  { label: "Multi-Agent Systems" },
  { label: "Multimodal LLMs" },
  { label: "World Models" },
  { label: "Continual Learning" },
  { label: "Human-AI Interaction" },
  { label: "Spatial Intelligence" },
  { label: "Agent Evaluation and Safety" }
]

export const FEATURED_PAPER = {
  title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
  venue: "European Conference on Computer Vision (ECCV) 2026",
  status: "Accepted",
  authors: "Eric Ji, Qiran Hu, Wufei Ma, Sarthak Jain, Yingying Li, Minh N. Do, Yaoyao Liu",
  arxiv: "arXiv:2606.31204"
}

export const SKILL_ROWS = [
  [
    ["PyTorch", "ai"], ["JAX", "ai"], ["TensorFlow", "ai"], ["OpenCV", "ai"], ["Diffusion Models", "ai"], ["World Models", "ai"],
    ["3D Reconstruction", "ai"], ["Distributed Training", "ai"], ["CUDA", "ai"], ["PEFT", "ai"], ["LangGraph", "agents"], ["LangChain", "agents"],
    ["GraphRAG", "agents"], ["MCP", "agents"], ["Long-Term Memory", "agents"], ["SAS", "data"], ["Arduino", "infra"]
  ],
  [
    ["Python", "code"], ["C++", "code"], ["TypeScript", "code"], ["JavaScript", "code"], ["Java", "code"], ["Kotlin", "code"], ["Ruby", "code"], ["PHP", "code"], ["R", "code"],
    ["React", "code"], ["Next.js", "code"], ["Vue.js", "code"], ["Angular.js", "code"], ["Node.js", "code"], ["HTML5", "code"], ["Tailwind CSS", "code"],
    ["PostgreSQL", "data"], ["Neo4j", "data"], ["MongoDB", "data"], ["Docker", "infra"], ["Kubernetes", "infra"], ["AWS", "infra"], ["HPC", "infra"], ["Unity", "infra"],
    ["Figma", "infra"], ["Canva", "infra"], ["Adobe Creative Suite", "infra"], ["Microsoft Office", "infra"]
  ]
]

export const SKILL_COLORS = { ai: "accent", agents: "accent", code: "accent2", data: "accent3", infra: "muted" }

// Animated link buttons rendered into assets/link-<id>-<theme>.svg; each is wrapped in one <a> in the README.
export const LINKS = [
  { id: "collab", label: "Open to research collaborations", url: "mailto:qiranhu8@gmail.com", icon: "spark", width: 420 },
  { id: "website", label: "Website", url: "https://edward-h26.github.io/", icon: "globe", width: 176 },
  { id: "scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=4jv03f4AAAAJ&hl=en", icon: "cap", width: 214 },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/qiranhu/", icon: "in", width: 176 },
  { id: "x", label: "X", url: "https://x.com/QiranHu", icon: "x", width: 128 }
]
