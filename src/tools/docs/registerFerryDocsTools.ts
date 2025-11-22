import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  ferriesSpecs,
  getTagMetadata,
  listOperationsForApi,
} from "../../openapi/ferries.js";
import type { apiKey } from "../../wsdottieClient.js";
import { createErrorResponse } from "../errorHandler.js";

const apiKeys = Object.keys(ferriesSpecs) as apiKey[];
const apiEnum = z.enum(apiKeys as [apiKey, ...apiKey[]]);

/**
 * Registers the ferry documentation tools with the MCP server.
 * Provides tools for retrieving endpoint group documentation and metadata.
 *
 * @param server - The MCP server instance to register tools with
 */
export const registerFerryDocsTools = (server: McpServer): void => {
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
};
