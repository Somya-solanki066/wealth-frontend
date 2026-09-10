export type WriterLaneTool = {
  id: string;
  title: string;
  desc: string;
  icon: string;
};

export type WriterLane = {
  id: string;
  listTitle: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  tools: WriterLaneTool[];
};

export const WRITER_LANES: WriterLane[] = [
  {
    id: "content-freelance",
    listTitle: "Content & Freelance Writing",
    title: "Content & Freelance",
    subtitle: "Blog posts, copywriting, UGC scripts",
    description:
      "Write for money outside fiction — blogs, copy, UGC scripts, ghost posts.",
    icon: "align-left",
    tools: [
      {
        id: "write-something",
        title: "Write Something",
        desc: "Blog, social, newsletter, memo, or UGC — structure then draft.",
        icon: "pencil",
      },
      {
        id: "brief-builder",
        title: "Brief Builder",
        desc: "Turn a client ask into a working brief.",
        icon: "align-left",
      },
      {
        id: "portfolio-builder",
        title: "Portfolio Builder",
        desc: "Turn drafts into a shareable portfolio.",
        icon: "file-text",
      },
      {
        id: "rate-calculator",
        title: "Rate Calculator",
        desc: "Per-word, per-project, retainer pricing.",
        icon: "plus-circle",
      },
      {
        id: "pitch-templates",
        title: "Pitch Templates",
        desc: "Cold outreach and gig applications.",
        icon: "send",
      },
    ],
  },
  {
    id: "short-fiction",
    listTitle: "Short-Form Fiction",
    title: "Short-Form Fiction",
    subtitle: "Flash fiction and one-shot stories",
    description:
      "A complete story arc in minutes — the lightest entry point into Writer's World.",
    icon: "zap",
    tools: [
      {
        id: "flash-prompts",
        title: "Flash Prompts",
        desc: "Daily prompt to write a full story from",
        icon: "zap",
      },
      {
        id: "one-shot-formatter",
        title: "One-Shot Formatter",
        desc: "Format and post a single-chapter story",
        icon: "square",
      },
      {
        id: "sprint-timer",
        title: "Sprint Timer",
        desc: "Timed writing sessions, word goals",
        icon: "clock",
      },
      {
        id: "micro-serial",
        title: "Micro-Serial Mode",
        desc: "5–7 part flash serials, not full-length",
        icon: "align-left",
      },
    ],
  },
  {
    id: "nonfiction-ghost",
    listTitle: "Nonfiction & Ghostwriting",
    title: "Nonfiction & Ghostwriting",
    subtitle: "Memoirs, self-help, business books",
    description:
      "Memoirs, self-help and business books — write your own, or someone else's.",
    icon: "message-square",
    tools: [
      {
        id: "self-interview-builder",
        title: "Interview → Manuscript",
        desc: "Turn recorded interviews into chapters",
        icon: "user",
      },
      {
        id: "outline-builder",
        title: "Outline Builder",
        desc: "Structure a full-length nonfiction book",
        icon: "align-left",
      },
      {
        id: "client-handoff",
        title: "Client Handoff",
        desc: "NDAs, briefs, delivery checklists",
        icon: "message-square",
      },
      {
        id: "pacing-guide",
        title: "Pacing Guide",
        desc: "Chapter length and structure for nonfiction",
        icon: "bar-chart-3",
      },
      {
        id: "publishing-checklist",
        title: "Publishing Checklist",
        desc: "Steps to get KDP-ready and self-publish",
        icon: "square",
      },
    ],
  },
  {
    id: "web3",
    listTitle: "Web3 Writing",
    title: "Web3 Writing",
    subtitle: "Project explainers & on-chain fiction",
    description:
      "Blockchain-native writing — real paid work explaining Web3 projects, and on-chain fiction for readers who want to own what they read.",
    icon: "box",
    tools: [
      {
        id: "explainer-article-builder",
        title: "Explainer Article Builder",
        desc: "Turn a technical concept into a plain-English post",
        icon: "user",
      },
      {
        id: "whitepaper-docs",
        title: "Whitepaper & Docs Assistant",
        desc: "Structure documentation and user guides",
        icon: "align-left",
      },
      {
        id: "social-thread",
        title: "Social Thread Generator",
        desc: "Turn one idea into a Twitter/X thread",
        icon: "align-left",
      },
      {
        id: "community-templates",
        title: "Community Post Templates",
        desc: "Announcements, AMA recaps, updates",
        icon: "send",
      },
      {
        id: "nft-minting",
        title: "NFT Chapter Minting",
        desc: "Mint a chapter or cover as a collectible",
        icon: "hexagon",
      },
      {
        id: "token-gated",
        title: "Token-Gated Release",
        desc: "Unlock chapters by token ownership",
        icon: "wallet",
      },
      {
        id: "dao-vote",
        title: "DAO Vote Tracker",
        desc: "Readers vote on plot direction",
        icon: "align-left",
      },
      {
        id: "wallet-royalties",
        title: "Wallet Royalties",
        desc: "Track earnings paid to a linked wallet",
        icon: "wallet",
      },
    ],
  },
];
