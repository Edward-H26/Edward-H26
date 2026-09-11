// Content for the generated profile assets. Edit here, then run `npm run render`.
export const PROFILE = {
  name: "Qiran Hu",
  handle: "Edward-H26",
  role: "Research Assistant",
  taglines: [
    "Teaching Machines to See in 3D",
    "Diffusion That Respects Geometry",
    "Generating Worlds That Stay Consistent",
    "From Pixels to Spatial Understanding"
  ]
}

export const FOCUS = [
  { label: "3D and 4D Generation" },
  { label: "World Models" },
  { label: "Spatial Intelligence" },
  { label: "Continual Learning" },
  { label: "Multi-Agent Orchestration" },
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
    id: "sv4d",
    title: "SV4D 3.0: Single-Step 3D-Aware Diffusion for Multi-View-Consistent 4D Scene Generation",
    authors: ["Qiran Hu", "Wei Cao", "Yaoyao Liu"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "ac3s",
    title: "AC3S: Adaptive Conditioning for 3D-Aware Synthetic Data Generation",
    authors: ["Eric Ji", "Qiran Hu", "Wufei Ma", "Sarthak Jain", "Yingying Li", "Minh N. Do", "Yaoyao Liu"],
    venue: "European Conference on Computer Vision (ECCV), 2026",
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
    venue: "IEEE International Conference on Data Mining (ICDM), 2026",
    thumbnail: { badge: "ICDM", alt: "Three charts from the paper: online overhead per query across five compressors, F1 change over global truncation on four QA datasets, and the share of queries that re-access a stored document" },
    links: [
      { label: "arXiv", url: "https://arxiv.org/abs/2609.11209" },
      { label: "Code", url: "https://github.com/UIUC-MLSys/REVA" },
      { label: "BibTeX", url: "https://arxiv.org/bibtex/2609.11209" }
    ]
  },
  {
    id: "aisim",
    title: "AISim: Using LLM-Simulation as Epistemic Scaffolds for Early Stage Qualitative Research Design",
    authors: ["Hangyue Zhang", "Qiran Hu", "Ziyi Zhang", "Hyanghee Park", "Yun Huang"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "No public figure yet; this paper is under review" },
    links: []
  },
  {
    id: "alphawise",
    title: "AlphaWiSE: Adaptive Weight Interpolation for Continual Multimodal Representation Learning",
    authors: ["Sarthak Jain", "Qiran Hu", "Zhen Zhu", "Yaoyao Liu"],
    venue: "Under Review",
    thumbnail: { badge: "Under Review", alt: "No public figure yet; this paper is under review" },
    links: []
  }
]

export const PAPER_BUTTONS = [...new Set(PAPERS.flatMap((paper) => paper.links.map((link) => link.label)))]

export const paperButtonId = (label) => `paper-link-${label.toLowerCase().replace(/\W+/g, "-")}`


// The CV's technical skill categories, listed in the README above the marquee.
export const SKILL_CATEGORIES = {
  "Programming Languages": ["Python", "C++", "C", "Rust", "Go", "Java", "Swift", "Kotlin", "Ruby", "R"],
  "AI/ML Frameworks": ["PyTorch", "CUDA", "JAX", "TensorFlow", "Triton", "TensorRT", "vLLM", "SGLang", "NeMo", "Megatron-LM", "LangGraph", "NCCL", "GPU/TPU/CPU Architecture"],
  "Foundation Model Training": ["Pre-training", "Post-training", "Test-time Training", "Reinforcement Learning", "Continual Learning", "SFT", "RLHF", "RLAIF", "RLVF", "PPO", "DPO", "GRPO", "Reward Modeling", "Model Alignment", "Synthetic Data Generation", "Knowledge Distillation", "Quantization", "Context Compression", "Token Pruning", "Kernel Optimization", "LoRA", "QLoRA", "Distributed Training", "FSDP"],
  "Computer Vision": ["World Models", "Diffusion Models", "Autoregressive Models", "Flow Matching", "3D/4D Generation", "Multi-View Geometry", "3D Reconstruction", "Novel View Synthesis", "Spatial Intelligence", "Visual-Inertial Odometry", "Depth Estimation", "NeRFs", "3D Gaussian Splatting", "OpenCV", "SLAM"],
  "Agentic AI": ["Multi-Agent Orchestration", "Sub-Agent Parallelization", "Computer-Use Agents", "Agent Harness", "Policy Guardrails", "Context Engineering", "Prompt Caching", "MCP", "A2A", "Tool Calling", "Autonomous Workflows", "Long-Horizon Memory", "RAG"],
  "Full-stack Development": ["React", "Vue", "Angular", "JavaScript", "TypeScript", "HTML5", "Tailwind CSS", "FastAPI"],
  "Databases and Infrastructure": ["PostgreSQL", "Neo4j", "MongoDB", "Kafka", "Docker", "Kubernetes", "CI/CD", "AWS", "GCP", "Azure"],
  "Design and Other Tools": ["Figma", "Canva", "Adobe Creative Suite", "Microsoft Office Suite", "Unity"],
  Languages: ["Chinese (Native)", "English (Native)", "Spanish (Elementary)"]
}

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
  { id: "scholar", label: "Google Scholar", url: "https://scholar.google.com/citations?user=4jv03f4AAAAJ&hl=en", icon: "scholar" },
  { id: "website", label: "Website", url: "https://edward-h26.github.io/", icon: "website" },
  { id: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/qiranhu/", icon: "linkedin" },
  { id: "email", label: "Email", url: "mailto:qh2332@columbia.edu", icon: "email" },
  { id: "x", label: "X", url: "https://x.com/QiranHu", icon: "x" },
]

export const PHONE = "+1 (347)-957-9176"
