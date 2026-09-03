// Content for the generated profile assets. Edit here, then run `npm run render`.
export const PROFILE = {
  name: "Qiran Hu",
  handle: "Edward-H26",
  role: "Research Assistant",
  affiliations: ["Computer Vision and Machine Learning Group, UIUC", "M.S. in Data Science, Columbia University"],
  taglines: ["Advancing Human-Centered Intelligence", "Building Agentic Systems and Computer Vision", "Creating AI That Understands the World"]
}

export const FOCUS = [
  { label: "3D-Aware Generation", ring: 1 },
  { label: "Multi-Agent Systems", ring: 1 },
  { label: "Multimodal LLMs", ring: 1 },
  { label: "World Models", ring: 2 },
  { label: "Continual Learning", ring: 2 },
  { label: "Human-AI Interaction", ring: 2 },
  { label: "Spatial Intelligence", ring: 2 },
  { label: "Agent Evaluation and Safety", ring: 2 }
]

export const FEATURED_PAPER = {
  title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
  venue: "European Conference on Computer Vision (ECCV) 2026",
  status: "Accepted",
  authors: "Eric Ji, Qiran Hu, Wufei Ma, Sarthak Jain, Yingying Li, Minh N. Do, Yaoyao Liu",
  arxiv: "arXiv:2606.31204"
}

export const TIMELINE = [
  { date: "2022.08", label: "B.S. Data Science and Information Science", detail: "University of Illinois Urbana-Champaign", kind: "education" },
  { date: "2023.08", label: "Teaching Assistant", detail: "CS 107 Data Science Discovery, 2,000+ students", kind: "teaching" },
  { date: "2025.05", label: "Research Assistant", detail: "Computer Vision and Machine Learning Group", kind: "research" },
  { date: "2026.02", label: "NVIDIA Academic Grant", detail: "32,000 A100 GPU-hours for multimodal continual learning", kind: "award" },
  { date: "2026.06", label: "AC3S accepted to ECCV 2026", detail: "3D-aware synthetic data generation", kind: "paper" },
  { date: "2026.08", label: "M.S. Data Science", detail: "Columbia University, Fu Foundation School of Engineering", kind: "education" }
]

export const SKILL_ROWS = [
  [
    ["PyTorch", "ai"], ["JAX", "ai"], ["TensorFlow", "ai"], ["OpenCV", "ai"], ["Diffusion Models", "ai"], ["World Models", "ai"],
    ["3D Reconstruction", "ai"], ["Distributed Training", "ai"], ["CUDA", "ai"], ["PEFT", "ai"], ["LangGraph", "agents"], ["LangChain", "agents"],
    ["GraphRAG", "agents"], ["MCP", "agents"], ["Long-Term Memory", "agents"]
  ],
  [
    ["Python", "code"], ["C++", "code"], ["TypeScript", "code"], ["React", "code"], ["Next.js", "code"], ["Node.js", "code"], ["R", "code"],
    ["PostgreSQL", "data"], ["Neo4j", "data"], ["MongoDB", "data"], ["Docker", "infra"], ["Kubernetes", "infra"], ["AWS", "infra"], ["HPC", "infra"], ["Unity", "infra"]
  ]
]

export const SKILL_COLORS = { ai: "accent", agents: "accent4", code: "accent2", data: "accent3", infra: "muted" }
