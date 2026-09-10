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

// Papers in README order. A paper with a `thumbnail` gets a figure card: its cropped figure
// (assets/papers/figures/<id>.webp) is rendered into assets/papers/<id>.svg with the venue badge.
// Papers under review carry a neutral concept illustration rather than their figures. Each link
// label renders as one keycap button (assets/paper-link-<label>).
export const PAPERS = [
  {
    id: "sv4d",
    title: "SV4D 3.0: Single-Step 3D-Aware Diffusion for Multi-View-Consistent 4D Scene Generation",
    authors: ["Qiran Hu", "Wei Cao", "Yaoyao Liu"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "One diffusion step turning noise into a scene that stays consistent across camera views over time" },
    links: []
  },
  {
    id: "ac3s",
    title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
    authors: ["Eric Ji", "Qiran Hu", "Wufei Ma", "Sarthak Jain", "Yingying Li", "Minh N. Do", "Yaoyao Liu"],
    venue: "European Conference on Computer Vision (ECCV), 2026",
    thumbnail: { badge: "ECCV", alt: "AC3S pipeline: visual prompt extractor, adaptive modulator, image generator, and multi-agent VLM" },
    links: [
      { label: "PDF", url: "https://arxiv.org/pdf/2606.31204" },
      { label: "Project Page", url: "https://ac3s.cvmlgroup.web.illinois.edu/" },
      { label: "Video", url: "https://youtu.be/3jOJaT2a8iQ" },
      { label: "BibTeX", url: "https://arxiv.org/bibtex/2606.31204" }
    ]
  },
  {
    id: "reva",
    title: "REVA: Reusable Evidence View Aggregation for Context-Efficient RAG Serving",
    authors: ["Tuan Nguyen", "Qiran Hu", "Banruo Liu", "Khoa D. Doan", "Kok-Seng Wong", "Fan Lai"],
    venue: "IEEE International Conference on Data Mining (ICDM), 2026",
    thumbnail: { badge: "ICDM", alt: "Retrieved documents compressed into a compact context for a model" },
    links: []
  },
  {
    id: "aisim",
    title: "AISim: Using LLM-Simulation as Epistemic Scaffolds for Early Stage Qualitative Research Design",
    authors: ["Hangyue Zhang", "Qiran Hu", "Ziyi Zhang", "Hyanghee Park", "Yun Huang"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "Simulated interview transcripts scaffolding an early-stage qualitative study design" },
    links: []
  },
  {
    id: "alphawise",
    title: "AlphaWiSE: Adaptive Weight Interpolation for Continual Multimodal Representation Learning",
    authors: ["Sarthak Jain", "Qiran Hu", "Zhen Zhu", "Yaoyao Liu"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "Two model checkpoints blended into one fused model" },
    links: []
  }
]

export const PAPER_BUTTONS = [...new Set(PAPERS.flatMap((paper) => paper.links.map((link) => link.label)))]

export const paperButtonId = (label) => `paper-link-${label.toLowerCase().replace(/\W+/g, "-")}`


export const SKILL_ROWS = [
  [
    ["PyTorch", "ai"], ["CUDA", "ai"], ["JAX", "ai"], ["TensorFlow", "ai"], ["Triton", "ai"], ["TensorRT", "ai"], ["vLLM", "ai"], ["SGLang", "ai"], ["NeMo", "ai"], ["Megatron-LM", "ai"], ["NCCL", "ai"], ["LangGraph", "agents"],
    ["Distributed Training", "ai"], ["FSDP", "ai"], ["LoRA", "ai"], ["QLoRA", "ai"], ["Quantization", "ai"], ["Kernel Optimization", "ai"], ["SFT", "ai"], ["RLHF", "ai"], ["DPO", "ai"], ["GRPO", "ai"],
    ["Continual Learning", "ai"], ["Knowledge Distillation", "ai"], ["Synthetic Data Generation", "ai"]
  ],
  [
    ["World Models", "ai"], ["Diffusion Models", "ai"], ["Flow Matching", "ai"], ["3D/4D Generation", "ai"], ["Multi-View Geometry", "ai"], ["3D Reconstruction", "ai"], ["Novel View Synthesis", "ai"],
    ["Spatial Intelligence", "ai"], ["NeRFs", "ai"], ["3D Gaussian Splatting", "ai"], ["SLAM", "ai"], ["Visual-Inertial Odometry", "ai"], ["Depth Estimation", "ai"], ["OpenCV", "ai"],
    ["Multi-Agent Orchestration", "agents"], ["Agent Harness", "agents"], ["Context Engineering", "agents"], ["Prompt Caching", "agents"], ["MCP", "agents"], ["A2A", "agents"], ["Tool Calling", "agents"],
    ["Long-Horizon Memory", "agents"], ["RAG", "agents"], ["Computer-Use Agents", "agents"], ["Policy Guardrails", "agents"]
  ],
  [
    ["Python", "code"], ["C++", "code"], ["C", "code"], ["Rust", "code"], ["Go", "code"], ["Java", "code"], ["Swift", "code"], ["Kotlin", "code"], ["Ruby", "code"], ["R", "code"], ["TypeScript", "code"], ["JavaScript", "code"],
    ["React", "code"], ["Vue", "code"], ["Angular", "code"], ["HTML5", "code"], ["Tailwind CSS", "code"], ["FastAPI", "code"],
    ["PostgreSQL", "data"], ["Neo4j", "data"], ["MongoDB", "data"], ["Kafka", "data"],
    ["Docker", "infra"], ["Kubernetes", "infra"], ["CI/CD", "infra"], ["AWS", "infra"], ["GCP", "infra"], ["Azure", "infra"], ["Figma", "infra"], ["Canva", "infra"], ["Adobe Creative Suite", "infra"], ["Microsoft Office", "infra"], ["Unity", "infra"]
  ]
]

export const SKILL_COLORS = { ai: "accent", agents: "accent", code: "accent2", data: "accent3", infra: "muted" }

// Round icon links rendered into assets/link-<id>-<theme>.svg, like the website's sidebar; the
// README wraps each in one <a>.
export const LINKS = [
  { id: "website", label: "Website", url: "https://edward-h26.github.io/", icon: "globe" },
  { id: "scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=4jv03f4AAAAJ&hl=en", icon: "cap" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/qiranhu/", icon: "in" },
  { id: "x", label: "X", url: "https://x.com/QiranHu", icon: "x" },
  { id: "email", label: "Email", url: "mailto:qh2332@columbia.edu", icon: "mail" }
]

export const PHONE = "+1 (347)-957-9176"
