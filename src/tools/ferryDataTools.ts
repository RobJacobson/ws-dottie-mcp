/**
 * Ferry Data Tools - MCP server implementation for Washington State Ferries APIs.
 *
 * This module provides the core functionality for registering Washington State Ferries
 * API operations as Model Context Protocol (MCP) tools. It dynamically generates MCP tools
 * from ws-dottie API definitions, handling input validation, error handling, and
 * debug information collection.
 *
 * Key features:
 * - Dynamic tool registration from API definitions
 * - Input schema validation using Zod
 * - Comprehensive error handling and logging
 * - Debug information generation for development
 * - Consistent naming conventions (get_xyz format)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apis as apiDefinitions } from "ws-dottie/apis";
import type { z } from "zod";
import type { ApiKey } from "@/apiRegistry.js";
import { apis as fetcherModules } from "@/apiRegistry.js";
import { type ToolDebugInfo, writeToolDebugInfo } from "@/tools/debugUtils.js";
import { createErrorResponse } from "@/tools/errorHandler.js";

/**
 * Type definitions for ws-dottie API structures.
 *
 * These interfaces represent the structure of API definitions provided by the
 * ws-dottie library, which are used to dynamically generate MCP tools.
 */
/**
 * Represents a single API endpoint from ws-dottie definitions.
 */
interface WsdEndpoint {
  /** The function name that implements this endpoint */
  functionName: string;
  /** Human-readable description of what this endpoint does */
  endpointDescription?: string;
  /** Zod schema for validating input parameters */
  inputSchema?: z.ZodTypeAny;
}

/**
 * Represents a group of related API endpoints.
 */
interface WsdEndpointGroup {
  /** Unique identifier for this endpoint group */
  name: string;
  /** Documentation and metadata for this group */
  documentation?: {
    /** Brief summary of the group's purpose */
    summary?: string;
    /** Detailed description of the group's functionality */
    description?: string;
  };
  /** Array of endpoints that belong to this group */
  endpoints: WsdEndpoint[];
}

/**
 * Represents a complete API definition from ws-dottie.
 */
interface WsdApiDefinition {
  /** Basic API metadata */
  api: {
    /** The API identifier (e.g., "wsf-fares") */
    name: string;
  };
  /** All endpoint groups provided by this API */
  endpointGroups: WsdEndpointGroup[];
}

/**
 * Represents a single ferry API operation that will be exposed as an MCP tool.
 *
 * Contains all the information needed to create and register an MCP tool,
 * including the fetcher function, validation schemas, and metadata.
 */
type Operation = {
  /** Unique identifier for this operation */
  id: string;
  /** Function that performs the actual API call */
  fetcher: (args?: Record<string, unknown>) => Promise<unknown>;
  /** Zod schema for validating input parameters */
  inputSchema: z.ZodTypeAny;
  /** Short summary of what this operation does */
  summary?: string;
  /** Detailed description of this operation */
  description?: string;
};

/**
 * Represents a group of related ferry operations that share common characteristics.
 *
 * Tool groups are created from ws-dottie endpoint groups and contain all the
 * operations that will be registered as MCP tools for that group.
 */
type ToolGroup = {
  /** Which ferry API this group belongs to */
  apiKey: ApiKey;
  /** Name of the endpoint group */
  groupName: string;
  /** All operations in this group */
  operations: Operation[];
  /** Summary of what this group provides */
  summary?: string;
  /** Detailed description of this group's purpose */
  description?: string;
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
 * Determines if an API has a corresponding fetcher module registered.
 *
 * Checks whether the API registry contains a fetcher module for the given
 * API definition, which is required for creating MCP tools.
 *
 * @param apiDefinition - The ws-dottie API definition to check
 * @returns True if a fetcher module exists for this API
 */
const hasRegisteredFetcher = (apiDefinition: WsdApiDefinition): boolean => {
  const apiKey = apiDefinition.api.name as ApiKey;
  const fetcherModule = fetcherModules[apiKey] as
    | Record<string, unknown>
    | undefined;
  return fetcherModule !== undefined;
};

/**
 * Creates an Operation configuration from a ws-dottie endpoint definition.
 *
 * Validates that the endpoint has a required input schema and a corresponding fetcher function,
 * then creates an Operation object that can be used to register an MCP tool.
 *
 * @param endpoint - The ws-dottie endpoint definition
 * @param apiKey - The API this endpoint belongs to
 * @param fetcherModule - The module containing fetcher functions
 * @returns Operation configuration or null if endpoint is invalid/unavailable
 * @throws Error if input schema is missing
 */
const createOperationFromEndpoint = (
  endpoint: WsdEndpoint,
  apiKey: ApiKey,
  fetcherModule: Record<string, unknown>
): Operation | null => {
  // Find the fetcher function
  const fetcher = fetcherModule[endpoint.functionName];
  if (typeof fetcher !== "function") {
    return null; // Skip endpoints without fetchers
  }

  if (!endpoint.inputSchema) {
    throw new Error(
      `Missing input schema for ${apiKey}::${endpoint.functionName}`
    );
  }

  return {
    id: endpoint.functionName,
    fetcher: fetcher as (args?: Record<string, unknown>) => Promise<unknown>,
    inputSchema: endpoint.inputSchema,
    summary: endpoint.endpointDescription,
    description: endpoint.endpointDescription,
  };
};

/**
 * Extracts all valid operations from a collection of API endpoints.
 *
 * Processes each endpoint in the provided array, validates it has a required
 * input schema and fetcher function, and returns only the successfully validated
 * operations that can be registered as MCP tools.
 *
 * @param endpoints - Array of ws-dottie endpoint definitions
 * @param apiDefinition - The API these endpoints belong to
 * @returns Array of valid Operation configurations
 */
const extractValidOperations = (
  endpoints: WsdEndpoint[],
  apiDefinition: WsdApiDefinition
): Operation[] => {
  const apiKey = apiDefinition.api.name as ApiKey;
  const fetcherModule = fetcherModules[apiKey] as Record<string, unknown>;

  return endpoints
    .map((endpoint) =>
      createOperationFromEndpoint(endpoint, apiKey, fetcherModule)
    )
    .filter((operation): operation is Operation => operation !== null);
};

/**
 * Creates a ToolGroup from an API definition and endpoint group.
 *
 * Processes all endpoints in the group, extracts valid operations, and creates
 * a ToolGroup configuration. Returns null if no valid operations are found,
 * which prevents registering empty tool groups.
 *
 * @param apiDefinition - The ws-dottie API definition
 * @param group - The endpoint group to process
 * @returns ToolGroup configuration or null if no valid operations
 */
const createToolGroupFromApiGroup = (
  apiDefinition: WsdApiDefinition,
  group: WsdEndpointGroup
): ToolGroup | null => {
  const operations = extractValidOperations(group.endpoints, apiDefinition);

  // Only create a tool group if there are operations
  if (operations.length === 0) {
    return null;
  }

  return {
    apiKey: apiDefinition.api.name as ApiKey,
    groupName: group.name,
    operations,
    summary: group.documentation?.summary,
    description: group.documentation?.description,
  };
};

/**
 * Builds all available tool groups from ws-dottie API definitions.
 *
 * Processes all registered APIs, extracts their endpoint groups, and creates
 * ToolGroup configurations for groups that have valid operations. This is the
 * main pipeline that converts ws-dottie API metadata into MCP tool configurations.
 *
 * @returns Array of ToolGroup configurations for all valid API endpoint groups
 */
const buildToolGroups = (): ToolGroup[] => {
  return Object.values(apiDefinitions)
    .filter(hasRegisteredFetcher)
    .flatMap((apiDefinition) =>
      apiDefinition.endpointGroups.map((group) =>
        createToolGroupFromApiGroup(apiDefinition, group)
      )
    )
    .filter((group): group is ToolGroup => group !== null);
};

/**
 * Registers a single ferry operation as an MCP tool.
 *
 * Creates a complete MCP tool configuration including name, title, description,
 * input schema, and request handler. Handles error handling and result serialization.
 *
 * @param server - The MCP server instance to register the tool with
 * @param ferryOperation - The ferry operation configuration to register
 */
const registerFerryOperationAsTool = (
  server: McpServer,
  ferryOperation: Operation
): void => {
  // Create tool names and titles
  const toolName = formatToolName(ferryOperation.id);
  const toolTitle = formatOperationTitle(toolName);

  // Use the operation's input schema directly (with .describe() annotations)
  const inputSchema = ferryOperation.inputSchema;

  // Build clean description using the operation's summary/description
  const description =
    ferryOperation.description ??
    ferryOperation.summary ??
    `${ferryOperation.id} operation`;

  // Define handler separately to avoid TypeScript's deep type inference issues
  // with MCP SDK + Zod generics
  const handler = async (params: unknown) => {
    try {
      // Parse and validate input using the operation's schema
      const parsedParams = ferryOperation.inputSchema.parse(
        params as Record<string, unknown>
      );

      // Execute the operation
      const result = await ferryOperation.fetcher({
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
 * Registers all operations from tool groups with the MCP server and collects debug information.
 *
 * @param server - The MCP server instance to register tools with
 * @param toolGroups - The tool groups containing operations to register
 * @returns Debug information for all registered tools
 */
const registerToolGroupsWithServer = (
  server: McpServer,
  toolGroups: ToolGroup[]
): ToolDebugInfo[] => {
  const toolDebugInfo: ToolDebugInfo[] = [];

  // Register each operation as a separate MCP tool
  for (const group of toolGroups) {
    for (const operation of group.operations) {
      // Create tool names and titles for debug info collection
      const toolName = formatToolName(operation.id);
      const toolTitle = formatOperationTitle(toolName);

      // Build description for debug info (same logic as in registerFerryOperationAsTool)
      const description =
        operation.description ??
        operation.summary ??
        `${operation.id} operation`;

      // Collect tool information for debugging
      toolDebugInfo.push({
        toolName,
        toolTitle,
        description,
        apiKey: group.apiKey,
        groupName: group.groupName,
        operationCount: 1, // One tool per operation
        operations: [
          {
            id: operation.id,
            summary: operation.summary,
            description: operation.description,
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
      registerFerryOperationAsTool(server, operation);
    }
  }

  return toolDebugInfo;
};

/**
 * Registers all Washington State Ferries data tools with an MCP server.
 *
 * This is the main entry point for setting up ferry data access via MCP. It dynamically
 * discovers all available ferry APIs from ws-dottie, creates tool configurations for
 * each operation, and registers them with the MCP server. Each API operation becomes
 * a separate MCP tool with proper input validation and error handling.
 *
 * The function performs three main steps:
 * 1. Build tool groups from API definitions
 * 2. Register all operations as MCP tools
 * 3. Generate debug information for development
 *
 * @param server - The MCP server instance to register ferry tools with
 *
 * @example
 * ```typescript
 * import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
 * import { registerFerryDataTools } from "./tools/ferryDataTools.js";
 *
 * const server = new McpServer({
 *   name: "ws-dottie-mcp",
 *   version: "0.1.0"
 * });
 *
 * registerFerryDataTools(server);
 * // Server now provides access to all ferry data APIs
 * ```
 */
export const registerFerryDataTools = (server: McpServer): void => {
  // Build tool groups from API definitions
  const toolGroups = buildToolGroups();

  // Register tools and collect debug information
  const toolDebugInfo = registerToolGroupsWithServer(server, toolGroups);

  // Write debug information to file
  writeToolDebugInfo(toolDebugInfo);
};
