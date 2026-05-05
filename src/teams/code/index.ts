import type { TeamDefinition } from "../../types.js";
import { codeGithubTools } from "./github.js";
import { codeE2bTools } from "./e2b.js";
import { codeSonarTools } from "./sonarqube.js";

export const codeTeam: TeamDefinition = {
  name: "code",
  description: "EQUIPA 1 — Código: GitHub, E2B sandboxes, SonarQube análise",
  tools: [...codeGithubTools, ...codeE2bTools, ...codeSonarTools],
};
