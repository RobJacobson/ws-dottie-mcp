/** biome-ignore-all lint/suspicious/noExplicitAny: we need to be able to handle any type of input/output */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Endpoint } from "ws-dottie/apis";
import { type ZodType, type ZodTypeAny, z } from "zod";
import type { apiKey } from "../wsdottieClient.js";
import { apis } from "../wsdottieClient.js";

/**
 * Register a single ws-dottie endpoint as an MCP tool.
 *
 * Converts the ws-dottie output schema into an MCP-friendly shape where the
 * tool always returns `{ data: ... }` as `structuredContent`. This allows the
 * inspector (and other clients) to validate the JSON payload while we still send
 * a formatted string in the conventional `content` array.
 */
const registerEndpointTool = <
  F extends (params: { params: any }) => Promise<any>,
>(
  server: McpServer,
  endpoint: Endpoint<unknown, unknown>,
  fetchFn: F
) => {
  type I = F extends (params: { params: infer I }) => Promise<any> ? I : never;
  type O = F extends (...args: any[]) => Promise<infer O> ? O : never;

  const inputSchema = endpoint.inputSchema as ZodType<object>;
  const baseOutputSchema = endpoint.outputSchema;

  const structuredOutputSchema = baseOutputSchema
    ? z.object({ data: baseOutputSchema as ZodTypeAny })
    : undefined;

  server.registerTool(
    endpoint.functionName,
    {
      title: endpoint.endpointDescription,
      description: endpoint.endpointDescription,
      inputSchema,
      outputSchema: structuredOutputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args: object) => {
      // The schema validates to I, so casting is safe
      const result = await fetchFn({ params: args as I });
      const structuredResult = { data: result };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(structuredResult, null, 2),
          },
        ],
        structuredContent: structuredOutputSchema
          ? structuredResult
          : undefined,
      };
    }
  );
};

/**
 * Register all endpoints in an endpoint group as MCP tools.
 *
 * Automatically matches endpoints to their corresponding fetch functions by
 * function name, eliminating the need to manually pair them.
 *
 * @param server MCP server instance
 * @param api API key (e.g., "wsf-vessels")
 * @param endpoints Endpoints object from endpointsByApi
 * @param endpointGroupName Name of the endpoint group to register (e.g., "vessel-basics")
 */
export const registerTool = <K extends apiKey>(
  server: McpServer,
  api: K,
  endpoints: Record<string, Record<string, Endpoint<unknown, unknown>>>,
  endpointGroupName: string
) => {
  const endpointGroup = endpoints[endpointGroupName];
  if (!endpointGroup) {
    throw new Error(
      `Endpoint group "${endpointGroupName}" not found for API "${api}"`
    );
  }

  const fetchFunctions = apis[api];

  // Iterate through all endpoints in the group and register each one
  for (const [functionName, endpoint] of Object.entries(endpointGroup)) {
    // Get the corresponding fetch function from the API namespace
    const fetchFn = (fetchFunctions as Record<string, any>)[functionName];
    if (!fetchFn) {
      throw new Error(
        `No fetch function found for "${functionName}" in API "${api}"`
      );
    }

    // Register endpoint directly with the fetch function
    registerEndpointTool(server, endpoint, fetchFn);
  }
};

