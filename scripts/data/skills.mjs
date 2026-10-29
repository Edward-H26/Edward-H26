// @ts-check
// Skills: the CV's categories listed in the README, and the chips of the scrolling marquee card.

/** The CV's technical skill categories, listed in the README above the marquee. */
export const SKILL_CATEGORIES = {
  "Programming Languages": ["Python", "C++", "C", "Rust", "Go", "Java", "Swift", "Kotlin", "Ruby", "R"],
  "AI/ML Frameworks": ["PyTorch", "CUDA", "JAX", "TensorFlow", "Triton", "TensorRT", "vLLM", "SGLang", "NeMo", "Megatron-LM", "LangGraph", "NCCL", "GPU/TPU/CPU architecture"],
  "Foundation Model Training": [
    "continual learning",
    "synthetic data generation",
    "distributed training",
    "quantization",
    "context compression",
    "knowledge distillation",
    "pre-training",
    "post-training",
    "reinforcement learning",
    "RLHF",
    "reward modeling",
    "SFT",
    "DPO",
    "PPO",
    "GRPO",
    "RLAIF",
    "RLVF",
    "model alignment and instruction following",
    "test-time training",
    "token pruning",
    "kernel optimization",
    "LoRA",
    "QLoRA",
    "FSDP"
  ],
  "Computer Vision": [
    "diffusion models",
    "3D/4D image and video generation",
    "novel view synthesis",
    "multi-view geometry",
    "3D reconstruction",
    "world models",
    "depth estimation",
    "visual-inertial odometry",
    "SLAM",
    "spatial intelligence",
    "autoregressive models",
    "flow matching",
    "NeRFs",
    "3D Gaussian Splatting",
    "OpenCV"
  ],
  "Agentic AI": [
    "multi-agent orchestration",
    "tool calling",
    "agent harness",
    "long-horizon agent memory",
    "context engineering",
    "RAG",
    "MCP",
    "policy guardrails",
    "sub-agent parallelization",
    "prompt caching",
    "computer-use agents",
    "multi-step autonomous workflows",
    "A2A"
  ],
  "Full-stack Development": ["TypeScript", "JavaScript", "React", "Tailwind CSS", "FastAPI", "HTML5", "Vue", "Angular"],
  "Databases and Infrastructure": ["PostgreSQL", "Neo4j", "MongoDB", "Kafka", "Docker", "Kubernetes", "CI/CD", "cloud platforms (AWS, GCP, Azure)"],
  "Design and Other Tools": ["Figma", "Canva", "Adobe Creative Suite", "Microsoft Office Suite", "Unity"],
  Languages: ["Chinese (native)", "English (native)", "Spanish (limited working proficiency)"]
}

/**
 * Chip colour categories of the marquee, each mapped to a theme colour token.
 * @typedef {"ai" | "agents" | "code" | "data" | "infra"} SkillCategory
 * @type {Record<SkillCategory, "accent" | "accent2" | "accent3" | "muted">}
 */
export const SKILL_COLORS = { ai: "accent", agents: "accent", code: "accent2", data: "accent3", infra: "muted" }

/**
 * One scrolling row per entry of the marquee card, as [label, category] pairs in display order.
 * @type {[string, SkillCategory][][]}
 */
export const SKILL_ROWS = [
  [
    ["PyTorch", "ai"],
    ["CUDA", "ai"],
    ["JAX", "ai"],
    ["TensorFlow", "ai"],
    ["Triton", "ai"],
    ["TensorRT", "ai"],
    ["vLLM", "ai"],
    ["SGLang", "ai"],
    ["NeMo", "ai"],
    ["Megatron-LM", "ai"],
    ["NCCL", "ai"],
    ["LangGraph", "agents"],
    ["distributed training", "ai"],
    ["FSDP", "ai"],
    ["LoRA", "ai"],
    ["QLoRA", "ai"],
    ["quantization", "ai"],
    ["kernel optimization", "ai"],
    ["SFT", "ai"],
    ["RLHF", "ai"],
    ["DPO", "ai"],
    ["GRPO", "ai"],
    ["continual learning", "ai"],
    ["knowledge distillation", "ai"],
    ["synthetic data generation", "ai"]
  ],
  [
    ["world models", "ai"],
    ["diffusion models", "ai"],
    ["flow matching", "ai"],
    ["3D/4D image and video generation", "ai"],
    ["multi-view geometry", "ai"],
    ["3D reconstruction", "ai"],
    ["novel view synthesis", "ai"],
    ["spatial intelligence", "ai"],
    ["NeRFs", "ai"],
    ["3D Gaussian Splatting", "ai"],
    ["SLAM", "ai"],
    ["visual-inertial odometry", "ai"],
    ["depth estimation", "ai"],
    ["OpenCV", "ai"],
    ["multi-agent orchestration", "agents"],
    ["agent harness", "agents"],
    ["context engineering", "agents"],
    ["prompt caching", "agents"],
    ["MCP", "agents"],
    ["A2A", "agents"],
    ["tool calling", "agents"],
    ["long-horizon agent memory", "agents"],
    ["RAG", "agents"],
    ["computer-use agents", "agents"],
    ["policy guardrails", "agents"]
  ],
  [
    ["Python", "code"],
    ["C++", "code"],
    ["C", "code"],
    ["Rust", "code"],
    ["Go", "code"],
    ["Java", "code"],
    ["Swift", "code"],
    ["Kotlin", "code"],
    ["Ruby", "code"],
    ["R", "code"],
    ["TypeScript", "code"],
    ["JavaScript", "code"],
    ["React", "code"],
    ["Vue", "code"],
    ["Angular", "code"],
    ["HTML5", "code"],
    ["Tailwind CSS", "code"],
    ["FastAPI", "code"],
    ["PostgreSQL", "data"],
    ["Neo4j", "data"],
    ["MongoDB", "data"],
    ["Kafka", "data"],
    ["Docker", "infra"],
    ["Kubernetes", "infra"],
    ["CI/CD", "infra"],
    ["AWS", "infra"],
    ["GCP", "infra"],
    ["Azure", "infra"],
    ["Figma", "infra"],
    ["Canva", "infra"],
    ["Adobe Creative Suite", "infra"],
    ["Microsoft Office Suite", "infra"],
    ["Unity", "infra"]
  ]
]
