import type { TeamDefinition } from "../../types";
import { codeGithubTools } from "./github";
import { codeE2bTools } from "./e2b";
import { codeSonarTools } from "./sonarqube";

export const codeTeam: TeamDefinition = {
  name: "code",
  description: "EQUIPA 1 — Código: GitHub, E2B sandboxes, SonarQube análise",
  tools: [...codeGithubTools, ...codeE2bTools, ...codeSonarTools],
};
