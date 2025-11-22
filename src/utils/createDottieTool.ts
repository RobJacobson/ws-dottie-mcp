/** biome-ignore-all lint/suspicious/noExplicitAny: we need to be able to handle any type of input/output */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Endpoint } from "ws-dottie/apis";
import { type ZodType, type ZodTypeAny, z } from "zod";
import type { apiKey } from "../wsdottieClient.js";
import { apis } from "../wsdottieClient.js";

/**
 * Creates a higher-order function for registering individual endpoints as MCP tools.
 *
 * Returns a function that registers a single endpoint by function name (e.g., "fetchVesselLocations").
 * The server, api, and endpoints are stored in the closure, so they don't need to be
 * passed on each call.
 *
 * @param server MCP server instance
 * @param api API key (e.g., "wsf-vessels")
 * @param endpoints Endpoints object from endpointsByApi
 * @returns A function that registers a single endpoint by function name
 */
export const createRegisterTool = <K extends apiKey>(
  server: McpServer,
  api: K,
  endpoints: Record<string, Record<string, Endpoint<unknown, unknown>>>
) => {
  const fetchFunctions = apis[api];

  /**
   * Register a single endpoint as an MCP tool by function name.
   *
   * @param endpointName The function name of the endpoint to register (e.g., "fetchVesselLocations")
   */
  return (endpointName: string) => {
    // Flatten all endpoint groups into a single array and find the matching endpoint
    const endpointEntry = Object.values(endpoints)
      .flatMap((group) => Object.entries(group))
      .find(([name]) => name === endpointName);

    if (!endpointEntry) {
      throw new Error(`Endpoint "${endpointName}" not found for API "${api}"`);
    }

    const [, endpoint] = endpointEntry;

    // Get the corresponding fetch function from the API namespace
    const fetchFn = (fetchFunctions as Record<string, any>)[endpointName];
    if (!fetchFn) {
      throw new Error(
        `No fetch function found for "${endpointName}" in API "${api}"`
      );
    }

    // Register endpoint directly with the fetch function
    registerEndpointTool(server, endpoint, fetchFn);
  };
};

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

  // Extract description from the output schema's describe() annotation if available
  const outputDescription =
    baseOutputSchema && "_def" in baseOutputSchema
      ? (baseOutputSchema._def as { description?: string }).description
      : undefined;

  const structuredOutputSchema = baseOutputSchema
    ? z.object({ data: baseOutputSchema as ZodTypeAny })
    : undefined;

  const toolName = toMcpToolName(
    endpoint.functionName,
    baseOutputSchema as ZodTypeAny | undefined
  );

  server.registerTool(
    toolName,
    {
      title: endpoint.endpointDescription,
      description: outputDescription ?? endpoint.endpointDescription,
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
 * Converts a camelCase function name to snake_case and replaces "fetch" with
 * "get" (for single items) or "list" (for arrays) based on the output schema.
 *
 * @param functionName - The camelCase function name (e.g., "fetchVesselLocations")
 * @param outputSchema - The Zod output schema to determine if it returns an array
 * @returns The snake_case tool name (e.g., "list_vessel_locations" or "get_vessel_location_by_vessel_id")
 */
const toMcpToolName = (
  functionName: string,
  outputSchema: ZodTypeAny | undefined
): string => {
  // Convert camelCase to snake_case
  const snakeCase = functionName
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, ""); // Remove leading underscore if present

  // Determine if the output is an array
  const isArray =
    outputSchema &&
    "_def" in outputSchema &&
    (outputSchema._def as { typeName?: string }).typeName === "ZodArray";

  // Replace "fetch" with "get" or "list"
  if (snakeCase.startsWith("fetch_")) {
    const prefix = isArray ? "list" : "get";
    return snakeCase.replace(/^fetch_/, `${prefix}_`);
  }

  return snakeCase;
};
