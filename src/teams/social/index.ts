import type { TeamDefinition } from "../../types";
import { socialFacebookTools } from "./facebook";
import { socialInstagramTools } from "./instagram";
import { socialTwitterTools } from "./twitter";
import { socialLinkedinTools } from "./linkedin";
import { socialTiktokTools } from "./tiktok";
import { socialYoutubeTools } from "./youtube";

export const socialTeam: TeamDefinition = {
  name: "social",
  description:
    "EQUIPA 4 — Redes Sociais: Facebook (16 tools), Instagram, Twitter/X, LinkedIn, TikTok, YouTube",
  tools: [
    ...socialFacebookTools,
    ...socialInstagramTools,
    ...socialTwitterTools,
    ...socialLinkedinTools,
    ...socialTiktokTools,
    ...socialYoutubeTools,
  ],
};
