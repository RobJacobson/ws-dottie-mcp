/**
 * Ferry API documentation tools for MCP server.
 *
 * Provides MCP tools for accessing metadata and documentation about Washington State
 * Ferries API endpoints. These tools help developers understand available operations,
 * their parameters, and usage patterns without making actual API calls.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apis as apiDefinitions } from "ws-dottie/apis";
import { z } from "zod";
import type { ApiKey } from "@/apiRegistry.js";
import { apis as fetcherModules } from "@/apiRegistry.js";
import { createErrorResponse } from "@/tools/errorHandler.js";

// Create Zod enum for API key validation
const apiKeys = Object.values(apiDefinitions).map(
  (api) => api.api.name
) as ApiKey[];
const apiEnum = z.enum(apiKeys as [ApiKey, ...ApiKey[]]);

/**
 * Retrieves comprehensive metadata for a specific API endpoint group.
 *
 * Extracts documentation, caching strategy, use cases, and other metadata
 * from ws-dottie's API definitions for a given API and group combination.
 *
 * @param apiKey - The API identifier (e.g., "wsf-fares")
 * @param groupName - The endpoint group name (e.g., "cache-flush-date-fares")
 * @returns Group metadata object or undefined if not found
 */
const getGroupMetadata = (
  apiKey: ApiKey,
  groupName: string
):
  | {
      name: string;
      summary?: string;
      description?: string;
      cacheStrategy?: string;
      useCases?: string[];
      updateFrequency?: string;
    }
  | undefined => {
  const apiDefinition = Object.values(apiDefinitions).find(
    (api) => api.api.name === apiKey
  );
  if (!apiDefinition) return undefined;

  const group = apiDefinition.endpointGroups.find((g) => g.name === groupName);
  if (!group) return undefined;

  return {
    name: group.name,
    summary: group.documentation?.summary,
    description: group.documentation?.description,
    cacheStrategy: group.cacheStrategy,
    useCases: group.documentation?.useCases,
    updateFrequency: group.documentation?.updateFrequency,
  };
};

/**
 * Registers ferry API documentation tools with the MCP server.
 *
 * Creates MCP tools that provide access to Washington State Ferries API documentation
 * and metadata. Currently registers one tool: "get_ferries_endpoint_group_docs" which
 * returns comprehensive information about API endpoint groups including available operations,
 * caching strategies, use cases, and documentation.
 *
 * @param server - The MCP server instance to register documentation tools with
 *
 * @example
 * ```typescript
 * const server = new McpServer({ name: "ferry-server", version: "1.0.0" });
 * registerFerryDocsTools(server);
 * // Now provides access to ferry API documentation via MCP
 * ```
 */
export const registerFerryDocsTools = (server: McpServer): void => {
  const inputSchema = z.object({
    api: apiEnum,
    groupName: z.string(),
  });

  const handler = async (args: unknown) => {
    try {
      // Parse and validate input
      const params = inputSchema.parse(args);
      const { api, groupName } = params;
      // Type assertion: api is validated by Zod schema as ApiKey
      const apiKey = api as ApiKey;
      // Get API definition and group
      const apiDefinition = Object.values(apiDefinitions).find(
        (apiDef) => apiDef.api.name === apiKey
      );
      if (!apiDefinition) {
        return createErrorResponse(new Error(`Unknown API: ${api}`));
      }

      const endpointGroup = apiDefinition.endpointGroups.find(
        (g) => g.name === groupName
      );
      if (!endpointGroup) {
        return createErrorResponse(
          new Error(`Unknown group ${groupName} for ${api}`)
        );
      }

      const group = getGroupMetadata(apiKey, groupName);
      const fetcherModule = fetcherModules[apiKey] as Record<string, unknown>;

      const operations = endpointGroup.endpoints
        .filter(
          (endpoint) =>
            typeof fetcherModule[endpoint.functionName] === "function"
        )
        .map((endpoint) => ({
          operationId: endpoint.functionName,
          summary: endpoint.endpointDescription,
          description: endpoint.endpointDescription,
        }));

      const result = {
        api,
        group,
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
  };

  server.registerTool(
    "get_ferries_endpoint_group_docs",
    {
      title: "Get Ferries Endpoint Group Docs",
      description:
        "Return metadata and summaries for a ferry endpoint group (tag).",
      inputSchema: inputSchema as z.ZodTypeAny,
    },
    handler
  );
};
