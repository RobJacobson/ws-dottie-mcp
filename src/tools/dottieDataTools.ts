/**
 * Dottie Data Tools - MCP server implementation for Washington State transportation APIs.
 *
 * This module provides the core functionality for registering Washington State Department
 * of Transportation and Washington State Ferries API operations as Model Context Protocol
 * (MCP) tools. It dynamically generates MCP tools from ws-dottie API definitions,
 * handling input validation, error handling, and debug information collection.
 *
 * Key features:
 * - Dynamic tool registration from API definitions
 * - Input schema validation using Zod
 * - Comprehensive error handling and logging
 * - Debug information generation for development
 * - Consistent naming conventions (get_xyz format)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
/**
 * Type definitions for ws-dottie API structures.
 *
 * These types represent the structure of endpoints provided by the
 * ws-dottie library, which are used to dynamically generate MCP tools.
 */
import type {
  Endpoint,
  EndpointParams,
  EndpointResponse,
  ToolDescription,
} from "ws-dottie/apis";
import { endpointsFlat } from "ws-dottie/apis";
import type { z } from "zod";
import type { ApiKey } from "@/apiRegistry.js";
import { apis as fetcherModules } from "@/apiRegistry.js";
import { type ToolDebugInfo, writeToolDebugInfo } from "@/tools/debugUtils.js";
import { createErrorResponse } from "@/tools/errorHandler.js";

/**
 * Represents a single transportation API operation that will be exposed as an MCP tool.
 *
 * Contains all the information needed to create and register an MCP tool,
 * including the fetcher function, validation schemas, and metadata.
 */
type Operation = {
  /** The ws-dottie endpoint definition */
  endpoint: Endpoint<EndpointParams, EndpointResponse>;
  /** Function that performs the actual API call */
  fetcher: (args?: Record<string, unknown>) => Promise<unknown>;
  /** Zod schema for validating input parameters */
  inputSchema: z.ZodTypeAny;
};

/**
 * Formats an operation ID into a standardized MCP tool name.
 *
 * Converts operation IDs from ws-dottie (typically camelCase starting with "fetch")
 * into consistent snake_case tool names following the "get_xyz" convention.
 *
 * @param operationId - The original operation ID (e.g., "fetchCacheFlushDateFares")
 * @returns Formatted tool name (e.g., "get_cache_flush_date_fares")
 *
 * @example
 * ```typescript
 * formatToolName("fetchCacheFlushDateFares") // → "get_cache_flush_date_fares"
 * formatToolName("fetchTerminalFares") // → "get_terminal_fares"
 * ```
 */
const formatToolName = (operationId: string): string => {
  // Remove "fetch" prefix and convert camelCase to snake_case
  const withoutFetch = operationId.replace(/^fetch/, "");
  const snakeCase = withoutFetch
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/_+/g, "_");

  return `get_${snakeCase}`;
};

/**
 * Formats a tool name into a human-readable title for display.
 *
 * Converts snake_case tool names into Title Case strings with spaces,
 * making them suitable for display in user interfaces and documentation.
 *
 * @param toolName - The snake_case tool name (e.g., "get_cache_flush_date_fares")
 * @returns Human-readable title (e.g., "Get Cache Flush Date Fares")
 *
 * @example
 * ```typescript
 * formatOperationTitle("get_cache_flush_date_fares") // → "Get Cache Flush Date Fares"
 * formatOperationTitle("get_terminal_fares") // → "Get Terminal Fares"
 * ```
 */
const formatOperationTitle = (toolName: string): string => {
  // Convert snake_case to Title Case with spaces
  return toolName
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Compiles a ToolDescription into a single newline-delimited string for MCP.
 *
 * Combines the structured fields from ws-dottie's ToolDescription into a
 * cohesive description string following the standard MCP tool description template.
 * Performs name substitution to replace ws-dottie function names with MCP tool names.
 *
 * @param toolDescription - The structured tool description metadata
 * @returns Compiled description string
 */
const compileToolDescription = (toolDescription: ToolDescription): string => {
  // Helper function to capitalize first letter
  const capitalizeFirst = (str: string): string =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const parts: string[] = [];

  // Purpose (required)
  parts.push(`Purpose: ${toolDescription.purpose}`);

  // Use when (optional, max 3 items)
  if (toolDescription.useWhen && toolDescription.useWhen.length > 0) {
    parts.push(
      `Use when:\n${toolDescription.useWhen.map((item) => `- ${capitalizeFirst(item)}`).join("\n")}`
    );
  }

  // Avoid when (optional, max 2 items)
  if (toolDescription.avoidWhen && toolDescription.avoidWhen.length > 0) {
    parts.push(
      `Avoid when:\n${toolDescription.avoidWhen.map((item) => `- ${capitalizeFirst(item)}`).join("\n")}`
    );
  }

  // Inputs (optional)
  if (toolDescription.inputs && toolDescription.inputs.length > 0) {
    parts.push(
      `Inputs:\n${toolDescription.inputs.map((item) => `- ${item}`).join("\n")}`
    );
  } else {
    parts.push("Inputs: none");
  }

  // Returns (required)
  parts.push(`Returns: ${toolDescription.returns}`);

  // Output highlights (required, 4-8 clauses)
  if (toolDescription.outputHighlights.length > 0) {
    parts.push(
      `Output highlights:\n${toolDescription.outputHighlights.map((item) => `- ${item}`).join("\n")}`
    );
  }

  // Chaining (optional, 1-3 recipes)
  if (toolDescription.chaining && toolDescription.chaining.length > 0) {
    parts.push(
      `Chaining:\n${toolDescription.chaining.map((item) => `- ${item}`).join("\n")}`
    );
  }

  // Compile the description
  let description = parts.join("\n");

  // Perform name substitution: replace function names with tool names
  // Extract all function names from the description (patterns like fetchXxx, get_x, etc.)
  const functionNamePattern = /\b(fetch\w+|get_\w+)\b/g;
  description = description.replace(functionNamePattern, (match) => {
    // Convert the matched name to snake_case tool name
    if (match.startsWith("fetch")) {
      return formatToolName(match);
    } else if (match.startsWith("get_")) {
      // Already in snake_case, keep as-is
      return match;
    }
    return match;
  });

  return description;
};

/**
 * Determines if an endpoint has a corresponding fetcher function registered.
 *
 * Checks whether the API registry contains a fetcher module for the endpoint's API
 * and that the module contains the required fetcher function.
 *
 * @param endpoint - The ws-dottie endpoint to check
 * @returns True if a fetcher function exists for this endpoint
 */
const hasRegisteredFetcher = (
  endpoint: Endpoint<EndpointParams, EndpointResponse>
): boolean => {
  const apiKey = endpoint.api.name as ApiKey;
  const fetcherModule = fetcherModules[apiKey] as
    | Record<string, unknown>
    | undefined;
  if (!fetcherModule) {
    return false;
  }

  const fetcher = fetcherModule[endpoint.functionName];
  return typeof fetcher === "function";
};

/**
 * Creates an Operation configuration from a ws-dottie endpoint.
 *
 * Creates an Operation object that can be used to register an MCP tool,
 * including the fetcher function and validation schemas.
 *
 * @param endpoint - The ws-dottie endpoint definition
 * @returns Operation configuration
 * @throws Error if input schema is missing or fetcher is not found
 */
const createOperationFromEndpoint = (
  endpoint: Endpoint<EndpointParams, EndpointResponse>
): Operation => {
  const apiKey = endpoint.api.name as ApiKey;
  const fetcherModule = fetcherModules[apiKey] as Record<string, unknown>;
  const fetcher = fetcherModule[endpoint.functionName];

  if (typeof fetcher !== "function") {
    throw new Error(
      `Missing fetcher function for ${apiKey}::${endpoint.functionName}`
    );
  }

  if (!endpoint.inputSchema) {
    throw new Error(
      `Missing input schema for ${apiKey}::${endpoint.functionName}`
    );
  }

  return {
    endpoint,
    fetcher: fetcher as (args?: Record<string, unknown>) => Promise<unknown>,
    inputSchema: endpoint.inputSchema,
  };
};

/**
 * Builds all available operations from ws-dottie endpoints.
 *
 * Processes all endpoints from the endpointsFlat array, validates they have
 * corresponding fetcher functions, and creates Operation configurations.
 * This is the main pipeline that converts ws-dottie endpoint metadata into
 * MCP tool configurations.
 *
 * @returns Array of Operation configurations for all valid endpoints
 */
const buildOperations = (): Operation[] => {
  return endpointsFlat
    .filter(hasRegisteredFetcher)
    .map(createOperationFromEndpoint);
};

/**
 * Registers a single transportation operation as an MCP tool.
 *
 * Creates a complete MCP tool configuration including name, title, description,
 * input schema, and request handler. Handles error handling and result serialization.
 *
 * @param server - The MCP server instance to register the tool with
 * @param dottieOperation - The transportation operation configuration to register
 */
const registerDottieOperationAsTool = (
  server: McpServer,
  dottieOperation: Operation
): void => {
  // Create tool names and titles
  const toolName = formatToolName(dottieOperation.endpoint.functionName);
  const toolTitle = formatOperationTitle(toolName);

  // Use the operation's input schema directly (with .describe() annotations)
  const inputSchema = dottieOperation.inputSchema;

  // Build rich description from structured metadata when available
  let description: string;

  // Try to find toolDescription from the endpoint group metadata
  const endpointMeta = dottieOperation.endpoint.group.endpoints.find(
    (endpoint) =>
      endpoint.functionName === dottieOperation.endpoint.functionName
  );

  if (endpointMeta?.toolDescription) {
    // Use new structured ToolDescription metadata
    description = compileToolDescription(endpointMeta.toolDescription);
  } else {
    // Fallback to legacy endpointDescription
    description = dottieOperation.endpoint.endpointDescription;
  }

  // Define handler separately to avoid TypeScript's deep type inference issues
  // with MCP SDK + Zod generics
  const handler = async (params: unknown) => {
    try {
      // Parse and validate input using the operation's schema
      // Handle undefined/null params for tools with no required parameters
      const paramsToParse = params ?? {};

      // Use safeParse to handle validation errors gracefully
      const parseResult = dottieOperation.inputSchema.safeParse(
        paramsToParse as Record<string, unknown>
      );

      if (!parseResult.success) {
        throw new Error(
          `Input validation failed: ${parseResult.error.message}`
        );
      }

      const parsedParams = parseResult.data;

      // Execute the operation
      const result = await dottieOperation.fetcher({
        params: parsedParams,
      });

      // Serialize result to plain objects for structuredContent.
      // ws-dottie returns Date objects, but MCP requires JSON-serializable data.
      // Convert Date objects to ISO strings during serialization.
      const serialized = JSON.parse(
        JSON.stringify(result, (_key, value) =>
          value instanceof Date ? value.toISOString() : value
        )
      );

      // Ensure structuredContent is always an object when provided
      const structuredContent: Record<string, unknown> | undefined =
        serialized !== null &&
        typeof serialized === "object" &&
        !Array.isArray(serialized)
          ? (serialized as Record<string, unknown>)
          : { value: serialized };

      // Return MCP protocol response
      // - content: required array of content blocks (text representation)
      // - structuredContent: provided for client convenience (no schema validation)
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent,
      };
    } catch (error) {
      return createErrorResponse(error);
    }
  };

  // Register tool with MCP server - using explicit handler reference
  // to avoid TypeScript's deep type inference issues with MCP SDK + Zod generics
  server.registerTool(
    toolName,
    {
      title: toolTitle,
      description,
      inputSchema: inputSchema as z.ZodTypeAny,
    },
    handler
  );
};

/**
 * Registers all operations with the MCP server and collects debug information.
 *
 * @param server - The MCP server instance to register tools with
 * @param operations - The operations to register as tools
 * @returns Debug information for all registered tools
 */
const registerOperationsWithServer = (
  server: McpServer,
  operations: Operation[]
): ToolDebugInfo[] => {
  const toolDebugInfo: ToolDebugInfo[] = [];

  // Register each operation as a separate MCP tool
  for (const operation of operations) {
    // Create tool names and titles for debug info collection
    const toolName = formatToolName(operation.endpoint.functionName);
    const toolTitle = formatOperationTitle(toolName);

    // Build description for debug info
    const description = operation.endpoint.endpointDescription;

    // Collect tool information for debugging
    toolDebugInfo.push({
      toolName,
      toolTitle,
      description,
      apiKey: operation.endpoint.api.name as ApiKey,
      groupName: operation.endpoint.group.name,
      operationCount: 1, // One tool per operation
      operations: [
        {
          id: operation.endpoint.functionName,
          summary: operation.endpoint.endpointDescription,
          description: operation.endpoint.endpointDescription,
          hasInputSchema: !!operation.inputSchema,
        },
      ],
      inputSchema: {
        type: "direct zod schema",
        description:
          "Uses operation's input schema directly with .describe() annotations",
      },
    });

    // Register the operation as an MCP tool
    registerDottieOperationAsTool(server, operation);
  }

  return toolDebugInfo;
};

/**
 * Registers all Washington State Department of Transportation data tools with an MCP server.
 *
 * This is the main entry point for setting up transportation data access via MCP. It dynamically
 * discovers all available APIs from ws-dottie, creates tool configurations for
 * each endpoint, and registers them with the MCP server. Each API endpoint becomes
 * a separate MCP tool with proper input validation and error handling.
 *
 * The function performs three main steps:
 * 1. Build operations from all available endpoints
 * 2. Register all operations as MCP tools
 * 3. Generate debug information for development
 *
 * @param server - The MCP server instance to register transportation tools with
 *
 * @example
 * ```typescript
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 * import { registerDottieDataTools } from "./tools/dottieDataTools.js";
 *
 * const server = new McpServer({
 *   name: "ws-dottie-mcp",
 *   version: "0.1.0"
 * });
 *
 * registerDottieDataTools(server);
 * // Server now provides access to all transportation data APIs
 * ```
 */
export const registerDottieDataTools = (server: McpServer): void => {
  // Build operations from all available endpoints
  const operations = buildOperations();

  // Register tools and collect debug information
  const toolDebugInfo = registerOperationsWithServer(server, operations);

  // Write debug information to file
  writeToolDebugInfo(toolDebugInfo);
};
