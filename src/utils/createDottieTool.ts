import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Endpoint } from "ws-dottie/apis";
import type { ZodType } from "zod";

/**
 * Tool definition with endpoint metadata and fetch function
 */
export type ToolDefinition<I, O> = {
  endpoint: Endpoint<I, O>;
  fetchFn: (input: I) => Promise<O>;
};

/**
 * Create a tool definition from an endpoint and fetch function.
 * Infers input/output types from the fetch function signature, eliminating
 * the need for manual type annotations.
 *
 * @param endpoint - The endpoint metadata from ws-dottie (will be validated to match fetchFn)
 * @param fetchFn - The fetch function that takes { params: I } and returns Promise<O>
 * @returns A ToolDefinition with inferred types
 */
export const createTool = <I extends object, O>(
  endpoint: Endpoint<unknown, unknown>,
  fetchFn: (options: { params: I }) => Promise<O>
): ToolDefinition<I, O> => ({
  endpoint: endpoint as Endpoint<I, O>,
  fetchFn: async (input: I) => {
    return await fetchFn({ params: input });
  },
});

/**
 * Internal registration function with proper type constraints
 */
const registerDottieToolInternal = <I extends object, O>(
  server: McpServer,
  tool: ToolDefinition<I, O>
) => {
  const { endpoint, fetchFn } = tool;
  server.registerTool(
    endpoint.functionName,
    {
      title: endpoint.endpointDescription,
      description: endpoint.endpointDescription,
      inputSchema: endpoint.inputSchema as ZodType<object> | undefined,
      outputSchema: endpoint.outputSchema as ZodType<object> | undefined,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (args: object) => {
      // The schema validates to I, so casting is safe
      const result = await fetchFn(args as I);

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }
  );
};

/**
 * Register a single tool with endpoint metadata.
 * Infers types from the tool definition.
 *
 * @param server - The MCP server instance
 * @param tool - Tool definition with endpoint metadata and fetch function
 */
export const registerDottieTool = <I extends object, O>(
  server: McpServer,
  tool: ToolDefinition<I, O>
) => {
  registerDottieToolInternal(server, tool);
};

/**
 * Register multiple tools in batch.
 * Handles heterogeneous arrays where each tool may have different input/output types.
 *
 * @param server - The MCP server instance
 * @param tools - Array of tool definitions with potentially different types
 */
export const registerDottieTools = (
  server: McpServer,
  tools: ToolDefinition<object, unknown>[]
) => {
  tools.forEach((tool) => {
    // TypeScript properly narrows types inside registerDottieToolInternal
    registerDottieToolInternal(server, tool);
  });
};
