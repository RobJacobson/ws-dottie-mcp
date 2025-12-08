import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apis as apiDefinitions } from "ws-dottie/apis";
import { z } from "zod";
import type { ApiKey } from "@/apiRegistry.js";
import { apis as fetcherModules } from "@/apiRegistry.js";
import { createErrorResponse } from "@/tools/errorHandler.js";

const apiKeys = Object.values(apiDefinitions).map(
  (api) => api.api.name
) as ApiKey[];
const apiEnum = z.enum(apiKeys as [ApiKey, ...ApiKey[]]);

/**
 * Gets group metadata directly from ws-dottie's API definitions.
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
 * Registers the ferry documentation tools with the MCP server.
 * Provides tools for retrieving endpoint group documentation and metadata.
 *
 * @param server - The MCP server instance to register tools with
 */
export const registerFerryDocsTools = (server: McpServer): void => {
  const inputSchema = z.object({
    api: apiEnum,
    groupName: z.string(),
  });

  const handler = async (params: { api: string; groupName: string }) => {
    const { api, groupName } = params;
    // Type assertion: api is validated by Zod schema as ApiKey
    const apiKey = api as ApiKey;
    try {
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

  // @ts-expect-error - TS2589: Type instantiation is excessively deep (MCP SDK + Zod)
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
