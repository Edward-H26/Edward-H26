// Content for the generated profile assets. Edit here, then run `npm run render`.
export const PROFILE = {
  name: "Qiran Hu",
  handle: "Edward-H26",
  role: "Research Assistant",
  taglines: [
    "Developing 3D and 4D generation models",
    "Building world models for embodied agents",
    "Advancing multimodal continual learning",
    "Deploying agentic workflows in production"
  ]
}

export const FOCUS = [
  { label: "3D and 4D Generation" },
  { label: "World Models" },
  { label: "Spatial Intelligence" },
  { label: "Continual Learning" },
  { label: "Multi-agent Orchestration" },
  { label: "Long-Horizon Agent Memory" },
  { label: "Context-Efficient RAG" },
  { label: "Video-Language Models" },
]

// Papers in README order. A paper with a `thumbnail` gets a figure card: its cropped figure
// (assets/papers/figures/<id>.webp) is rendered into assets/papers/<id>.svg with the venue badge.
// Papers under review carry a neutral concept illustration rather than their figures. Each link
// label renders as one keycap button (assets/paper-link-<label>).
export const PAPERS = [
  {
    id: "ac3s",
    title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
    authors: ["Eric Ji", "Qiran Hu", "Wufei Ma", "Sarthak Jain", "Yingying Li", "Minh N. Do", "Yaoyao Liu"],
    venue: "European Conference on Computer Vision (ECCV) 2026",
    thumbnail: { badge: "ECCV", alt: "The AC3S pipeline: a CAD model rendered and turned into a canny edge prompt, a modulator that sets the ControlNet conditioning scale, a diffusion generator that returns a photo in the same 3D pose, and a multi-agent vision language model that composes the text prompt" },
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
    thumbnail: { badge: "ICDM", alt: "The REVA system: past requests leave reusable word scores in a word-score store, and a new request materializes per-document views from them" },
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
    venue: "Under review",
    thumbnail: { badge: "Under review", alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "sv4d",
    title: "SV4D 3.0: Single-Step 3D-Aware Diffusion for Multi-View-Consistent 4D Scene Generation",
    authors: ["Qiran Hu", "Wei Cao", "Yaoyao Liu"],
    venue: "Under review",
    thumbnail: { badge: "Under review", alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "aisim",
    title: "AISim: Using LLM-Simulation as Epistemic Scaffolds for Early Stage Qualitative Research Design",
    authors: ["Hangyue Zhang", "Qiran Hu", "Ziyi Zhang", "Hyanghee Park", "Yun Huang"],
    venue: "Under review",
    thumbnail: { badge: "Under review", alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "alphawise",
    title: "AlphaWiSE: Adaptive Weight Interpolation for Continual Multimodal Representation Learning",
    authors: ["Sarthak Jain", "Qiran Hu", "Zhen Zhu", "Yaoyao Liu"],
    venue: "Under review",
    thumbnail: { badge: "Under review", alt: "No public figure yet; this paper is under review" },
    links: []
  }
]

export const PAPER_BUTTONS = [...new Set(PAPERS.flatMap((paper) => paper.links.map((link) => link.label)))]

export const paperButtonId = (label) => `paper-link-${label.toLowerCase().replace(/\W+/g, "-")}`


// The CV's technical skill categories, listed in the README above the marquee.
export const SKILL_CATEGORIES = {
  "Programming Languages": ["Python", "C++", "C", "Rust", "Go", "Java", "Swift", "Kotlin", "Ruby", "R"],
  "AI/ML Frameworks": ["PyTorch", "CUDA", "JAX", "TensorFlow", "Triton", "TensorRT", "vLLM", "SGLang", "NeMo", "Megatron-LM", "LangGraph", "NCCL", "GPU/TPU/CPU architecture"],
  "Foundation Model Training": ["pre-training", "post-training", "test-time training", "reinforcement learning", "continual learning", "SFT", "RLHF", "RLAIF", "RLVF", "PPO", "DPO", "GRPO", "reward modeling", "model alignment and instruction following", "synthetic data generation", "knowledge distillation", "quantization", "context compression", "token pruning", "kernel optimization", "LoRA", "QLoRA", "distributed training", "FSDP"],
  "Computer Vision": ["world models", "diffusion models", "autoregressive models", "flow matching", "3D/4D image and video generation", "multi-view geometry", "3D reconstruction", "novel view synthesis", "spatial intelligence", "visual-inertial odometry", "depth estimation", "NeRFs", "3D Gaussian Splatting", "OpenCV", "SLAM"],
  "Agentic AI": ["multi-agent orchestration", "sub-agent parallelization", "computer-use agents", "agent harness", "policy guardrails", "context engineering", "prompt caching", "MCP", "A2A", "tool calling", "multi-step autonomous workflows", "long-horizon agent memory", "RAG"],
  "Full-stack Development": ["React", "Vue", "Angular", "JavaScript", "TypeScript", "HTML5", "Tailwind CSS", "FastAPI"],
  "Databases and Infrastructure": ["PostgreSQL", "Neo4j", "MongoDB", "Kafka", "Docker", "Kubernetes", "CI/CD", "cloud platforms (AWS, GCP, Azure)"],
  "Design and Other Tools": ["Figma", "Canva", "Adobe Creative Suite", "Microsoft Office Suite", "Unity"],
  Languages: ["Chinese (native)", "English (native)", "Spanish (limited working proficiency)"],
}

export const SKILL_ROWS = [
  [
    ["PyTorch", "ai"], ["CUDA", "ai"], ["JAX", "ai"], ["TensorFlow", "ai"], ["Triton", "ai"], ["TensorRT", "ai"], ["vLLM", "ai"], ["SGLang", "ai"], ["NeMo", "ai"], ["Megatron-LM", "ai"], ["NCCL", "ai"], ["LangGraph", "agents"],
    ["distributed training", "ai"], ["FSDP", "ai"], ["LoRA", "ai"], ["QLoRA", "ai"], ["quantization", "ai"], ["kernel optimization", "ai"], ["SFT", "ai"], ["RLHF", "ai"], ["DPO", "ai"], ["GRPO", "ai"],
    ["continual learning", "ai"], ["knowledge distillation", "ai"], ["synthetic data generation", "ai"]
  ],
  [
    ["world models", "ai"], ["diffusion models", "ai"], ["flow matching", "ai"], ["3D/4D image and video generation", "ai"], ["multi-view geometry", "ai"], ["3D reconstruction", "ai"], ["novel view synthesis", "ai"],
    ["spatial intelligence", "ai"], ["NeRFs", "ai"], ["3D Gaussian Splatting", "ai"], ["SLAM", "ai"], ["visual-inertial odometry", "ai"], ["depth estimation", "ai"], ["OpenCV", "ai"],
    ["multi-agent orchestration", "agents"], ["agent harness", "agents"], ["context engineering", "agents"], ["prompt caching", "agents"], ["MCP", "agents"], ["A2A", "agents"], ["tool calling", "agents"],
    ["long-horizon agent memory", "agents"], ["RAG", "agents"], ["computer-use agents", "agents"], ["policy guardrails", "agents"]
  ],
  [
    ["Python", "code"], ["C++", "code"], ["C", "code"], ["Rust", "code"], ["Go", "code"], ["Java", "code"], ["Swift", "code"], ["Kotlin", "code"], ["Ruby", "code"], ["R", "code"], ["TypeScript", "code"], ["JavaScript", "code"],
    ["React", "code"], ["Vue", "code"], ["Angular", "code"], ["HTML5", "code"], ["Tailwind CSS", "code"], ["FastAPI", "code"],
    ["PostgreSQL", "data"], ["Neo4j", "data"], ["MongoDB", "data"], ["Kafka", "data"],
    ["Docker", "infra"], ["Kubernetes", "infra"], ["CI/CD", "infra"], ["AWS", "infra"], ["GCP", "infra"], ["Azure", "infra"], ["Figma", "infra"], ["Canva", "infra"], ["Adobe Creative Suite", "infra"], ["Microsoft Office Suite", "infra"], ["Unity", "infra"]
  ]
]

export const SKILL_COLORS = { ai: "accent", agents: "accent", code: "accent2", data: "accent3", infra: "muted" }

// Round icon links rendered into assets/link-<id>-<theme>.svg, like the website's sidebar; the
// README wraps each in one <a>.
export const LINKS = [
  { id: "scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=4jv03f4AAAAJ&hl=en", icon: "scholar" },
  { id: "website", label: "Website", url: "https://edward-h26.github.io/", icon: "website" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/qiranhu/", icon: "linkedin" },
  { id: "email", label: "Email", url: "mailto:qh2332@columbia.edu", icon: "email" },
  { id: "x", label: "X", url: "https://x.com/QiranHu", icon: "x" },
]

export const PHONE = "+1 (347) 957-9176"
