import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

import {
  wsfSpecs,
  getTagMetadata,
  listOperationsForApi,
} from "../openapi/index.js";
import type { apiKey } from "../wsdottieClient.js";
import { createErrorResponse } from "./createErrorResponse.js";

const apiKeys = Object.keys(wsfSpecs) as apiKey[];
const apiEnum = z.enum(apiKeys as [apiKey, ...apiKey[]]);

/**
 * Registers the documentation tools with the MCP server.
 * Provides tools for retrieving endpoint group documentation and metadata.
 *
 * @param server - The MCP server instance to register tools with
 */
export const registerDocsTools = (server: McpServer): void => {
  server.registerTool(
    "get_ferries_endpoint_group_docs",
    {
      title: "Get Ferries Endpoint Group Docs",
      description:
        "Return metadata and summaries for a ferry endpoint group (tag).",
      inputSchema: z.object({
        api: apiEnum.default("wsf-vessels"),
        groupName: z.string(),
      }),
    },
    async ({ api, groupName }) => {
      try {
        const apiKey = api ?? "wsf-vessels";
        const meta = getTagMetadata(apiKey, groupName);
        if (!meta) {
          return createErrorResponse(
            new Error(`Unknown group ${groupName} for ${apiKey}`)
          );
        }

        const operations = listOperationsForApi(apiKey)
          .filter((op) => op.tag === groupName)
          .map((op) => ({
            operationId: op.operationId,
            summary: op.summary,
            description: op.description,
          }));

        const result = {
          api: apiKey,
          group: meta,
          operations,
        };

        return {
          content: [
            { type: "text" as const, text: JSON.stringify(result, null, 2) },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );

  server.registerTool(
    "get_ferries_workflow_docs",
    {
      title: "Get Ferries Workflow Documentation",
      description: `Get workflow patterns, best practices, and tips for using ws-dottie-mcp tools efficiently.

This tool provides guidance on:
- Efficient workflows (e.g., finding a vessel by name)
- Performance best practices
- When to use list vs. by-ID endpoints
- Common patterns and anti-patterns

Use this tool when you need guidance on how to structure tool calls for optimal performance and to avoid context bloat.`,
      inputSchema: z.object({
        topic: z
          .enum([
            "finding-vessel",
            "performance",
            "common-patterns",
            "all",
          ])
          .optional()
          .describe(
            "Specific workflow topic to retrieve. Omit for all workflows."
          ),
      }),
    },
    async ({ topic }) => {
      try {
        const workflowsPath = join(process.cwd(), "WORKFLOWS.md");
        const workflowsContent = readFileSync(workflowsPath, "utf-8");

        // Parse and structure the workflows
        const workflows = {
          findingVessel: {
            title: "Finding a Specific Vessel's Location",
            pattern: "Two-step approach: list_vessel_basics → get_vessel_locations_by_vessel_id",
            why: "Avoids fetching all vessel locations when you only need one vessel",
            example: {
              question: "Where is the Tacoma?",
              steps: [
                "1. list_vessel_basics → find VesselID: 32 for 'Tacoma'",
                "2. get_vessel_locations_by_vessel_id(VesselID: 32) → get location data",
              ],
            },
          },
          performance: {
            tips: [
              "Use specific endpoints (by-ID) over list endpoints when you know what you're looking for",
              "Cache VesselIDs - they don't change, so you can cache name→ID mappings",
              "Batch operations - use parallel calls to by-ID endpoints rather than filtering large lists",
            ],
          },
          commonPatterns: {
            "where-is-vessel": {
              steps: [
                "list_vessel_basics → find VesselID",
                "get_vessel_locations_by_vessel_id → get location, destination, ETA",
              ],
            },
            "vessels-at-terminal": {
              steps: [
                "list_vessel_locations → filter by AtDock: true and terminal name",
                "Note: This is one case where list endpoint is appropriate",
              ],
            },
            "vessel-specs": {
              steps: [
                "list_vessel_basics → find VesselID",
                "get_vessel_stats_by_vessel_id → get technical specifications",
              ],
            },
          },
        };

        let result: Record<string, unknown>;
        if (topic === "finding-vessel") {
          result = { workflow: workflows.findingVessel };
        } else if (topic === "performance") {
          result = { tips: workflows.performance.tips };
        } else if (topic === "common-patterns") {
          result = { patterns: workflows.commonPatterns };
        } else {
          result = workflows;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
          structuredContent: result,
        };
      } catch (error) {
        return createErrorResponse(error);
      }
    }
  );
};

