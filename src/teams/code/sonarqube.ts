import { z } from "zod";
import type { ToolDefinition, ToolResponse } from "../../types";
import { httpGet, httpPost, makeSuccessResponse, makeErrorResponse } from "../../utils";
import { v4 as uuidv4 } from "uuid";

function sqHeaders(): Record<string, string> {
  return {
    Authorization: `Basic ${Buffer.from(`${process.env.SONARQUBE_TOKEN}:`).toString("base64")}`,
  };
}

function sqUrl(path: string): string {
  return `${process.env.SONARQUBE_URL}/api${path}`;
}

export const codeSonarAnalyze: ToolDefinition = {
  name: "code_sonar_analyze",
  description: "Analisar qualidade de código com SonarQube",
  inputSchema: z.object({
    projectKey: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpGet(
        sqUrl("/measures/component"),
        {
          component: input.projectKey,
          metricKeys: "bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density",
        },
        sqHeaders()
      );
      return makeSuccessResponse(taskId, { analysis: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeSonarCreateProject: ToolDefinition = {
  name: "code_sonar_create_project",
  description: "Criar projeto no SonarQube",
  inputSchema: z.object({
    name: z.string(),
    projectKey: z.string(),
  }),
  execute: async (input): Promise<ToolResponse> => {
    const taskId = uuidv4();
    try {
      const data = await httpPost(
        sqUrl("/projects/create"),
        { name: input.name, project: input.projectKey },
        sqHeaders()
      );
      return makeSuccessResponse(taskId, { project: data });
    } catch (err) {
      return makeErrorResponse(taskId, String(err));
    }
  },
};

export const codeSonarTools: ToolDefinition[] = [
  codeSonarAnalyze,
  codeSonarCreateProject,
];
