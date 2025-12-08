import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apis as apiDefinitions } from "ws-dottie/apis";
import { z } from "zod";
import type { ApiKey } from "@/apiRegistry.js";
import { apis as fetcherModules } from "@/apiRegistry.js";
import { createErrorResponse } from "@/tools/errorHandler.js";

/**
 * Configuration for a single API operation.
 */
type Operation = {
  id: string;
  fetcher: (args?: Record<string, unknown>) => Promise<unknown>;
  inputSchema: z.ZodTypeAny;
  outputSchema: z.ZodTypeAny;
  summary?: string;
  description?: string;
};

/**
 * Configuration for a group of related operations.
 */
type ToolGroup = {
  apiKey: ApiKey;
  groupName: string;
  operations: Operation[];
  summary?: string;
  description?: string;
};

/**
 * Debug information for a tool that will be written to JSON.
 */
type ToolDebugInfo = {
  toolName: string;
  toolTitle: string;
  description: string;
  apiKey: ApiKey;
  groupName: string;
  operationCount: number;
  operations: Array<{
    id: string;
    summary?: string;
    description?: string;
    hasInputSchema: boolean;
    hasOutputSchema: boolean;
  }>;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
};

/**
 * Formats a tag name into a tool name by replacing hyphens with underscores and prefixing with "get_".
 */
const formatToolName = (tag: string): string => `get_${tag.replace(/-/g, "_")}`;

/**
 * Formats an operation ID into a tool name.
 */
const formatOperationName = (operationId: string): string => {
  // Convert camelCase to snake_case and handle special cases
  return operationId
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/_+/g, "_");
};

/**
 * Formats an operation ID into a human-readable title.
 */
const formatOperationTitle = (operationId: string): string => {
  // Convert camelCase to Title Case
  return operationId
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
};

/**
 * Formats a tag name into a human-readable tool title by capitalizing words.
 */
const formatToolTitle = (tag: string): string =>
  `Get ${tag
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")}`;

/**
 * Creates an operation selector schema based on available operations.
 */
const createOperationSelectorSchema = (operationIds: string[]) => {
  if (operationIds.length === 0) {
    return z.string().optional();
  }
  if (operationIds.length === 1) {
    return z.literal(operationIds[0]).optional();
  }
  return z.enum(operationIds as [string, ...string[]]).optional();
};

/**
 * Transforms a Zod schema to replace Date types with string types for JSON serialization.
 * This allows MCP validation to work correctly since structuredContent must be JSON-serializable.
 * Date objects are serialized to ISO strings, so we transform z.date() -> z.string().datetime()
 *
 * Note: This function recursively transforms nested dates in objects and arrays.
 * For top-level dates, we wrap them in an object for MCP compatibility.
 *
 * @param schema - The Zod schema to transform
 * @returns A new schema with Date types replaced by string types
 */
const transformDateSchemaToString = (schema: z.ZodTypeAny): z.ZodTypeAny => {
  const typeName = schema._def.typeName;

  // Handle z.date() -> z.string().datetime() for nested dates
  // Top-level dates are handled separately in the handler
  if (typeName === "ZodDate") {
    return z.string().datetime();
  }

  // Handle z.date().optional() -> unwrap and transform inner type
  if (typeName === "ZodOptional") {
    const innerType = schema._def.innerType;
    const transformed = transformDateSchemaToString(innerType);
    return transformed.optional();
  }

  // Handle z.date().nullable() -> unwrap and transform inner type
  if (typeName === "ZodNullable") {
    const innerType = schema._def.innerType;
    const transformed = transformDateSchemaToString(innerType);
    return transformed.nullable();
  }

  // Handle ZodObject - recursively transform shape
  if (typeName === "ZodObject") {
    const shape = schema._def.shape();
    const transformedShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, value] of Object.entries(shape)) {
      transformedShape[key] = transformDateSchemaToString(
        value as z.ZodTypeAny
      );
    }
    return z.object(transformedShape);
  }

  // Handle ZodArray - recursively transform element type
  if (typeName === "ZodArray") {
    const elementType = schema._def.type;
    const transformedElement = transformDateSchemaToString(elementType);
    return z.array(transformedElement);
  }

  // For other schema types, return as-is
  return schema;
};

/**
 * Builds tool groups directly from ws-dottie API definitions.
 * Each tool group corresponds to an endpoint group and contains all operations for that group.
 */
const buildToolGroups = (): ToolGroup[] => {
  const groups: ToolGroup[] = [];

  // Iterate through each API definition from ws-dottie
  for (const apiDefinition of Object.values(apiDefinitions)) {
    const apiKey = apiDefinition.api.name as ApiKey;
    const fetcherModule = fetcherModules[apiKey] as
      | Record<string, unknown>
      | undefined;

    // Skip APIs that don't have a fetcher module registered
    if (!fetcherModule) {
      continue;
    }

    // Iterate through endpoint groups
    for (const group of apiDefinition.endpointGroups) {
      const operations: Operation[] = [];

      // Iterate through endpoints in this group
      for (const endpoint of group.endpoints) {
        // Find the fetcher function
        const fetcher = fetcherModule[endpoint.functionName];
        if (typeof fetcher !== "function") {
          continue; // Skip endpoints without fetchers
        }

        if (!endpoint.inputSchema) {
          throw new Error(
            `Missing input schema for ${apiKey}::${endpoint.functionName}`
          );
        }

        if (!endpoint.outputSchema) {
          throw new Error(
            `Missing output schema for ${apiKey}::${endpoint.functionName}`
          );
        }

        operations.push({
          id: endpoint.functionName,
          fetcher: fetcher as (
            args?: Record<string, unknown>
          ) => Promise<unknown>,
          inputSchema: endpoint.inputSchema,
          outputSchema: endpoint.outputSchema,
          summary: endpoint.endpointDescription,
          description: endpoint.endpointDescription,
        });
      }

      // Only create a tool group if there are operations
      if (operations.length > 0) {
        groups.push({
          apiKey,
          groupName: group.name,
          operations,
          summary: group.documentation?.summary,
          description: group.documentation?.description,
        });
      }
    }
  }

  return groups;
};

/**
 * Registers all ferry data tools with the MCP server.
 *
 * This creates one MCP tool per operation (not per group), giving each operation
 * its own well-defined input and output schema. Tools are generated dynamically
 * from ws-dottie API definitions to automatically support new endpoints.
 *
 * @param server - The MCP server instance to register tools with
 */
export const registerFerryDataTools = (server: McpServer): void => {
  const toolGroups = buildToolGroups();

  // Collect tool information for debugging
  const toolDebugInfo: ToolDebugInfo[] = [];

  for (const group of toolGroups) {
    for (const operation of group.operations) {
      // Create one tool per operation for clean schemas
      const toolName = formatOperationName(operation.id);
      const toolTitle = formatOperationTitle(operation.id);
      // Use the operation's input schema directly (with .describe() annotations)
      const inputSchema = operation.inputSchema;

      // Build clean description using the operation's summary/description
      // Include information about the output structure for discoverability
      let description =
        operation.description ??
        operation.summary ??
        `${operation.id} operation`;

      // Add output schema information to description for discoverability
      // The actual structuredContent will be a serialized version of the operation's output
      try {
        const outputSchemaDescription = operation.outputSchema._def.description;
        if (outputSchemaDescription) {
          description += `\n\nOutput: ${outputSchemaDescription}`;
        }
      } catch {
        // If we can't extract description, that's okay
      }

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
            hasOutputSchema: !!operation.outputSchema,
          },
        ],
        inputSchema: {
          type: "direct zod schema",
          description:
            "Uses operation's input schema directly with .describe() annotations",
        },
        outputSchema: {
          content: "array of text content blocks",
          structuredContent: "operation's output schema",
        },
      });

      // Transform the operation's outputSchema to handle Date -> string conversion
      // This allows MCP validation to work correctly since structuredContent must be JSON-serializable
      // Date objects are serialized to ISO strings wrapped in objects, so we transform
      // z.date() -> z.object({ value: z.string().datetime() })
      const outputSchema = transformDateSchemaToString(operation.outputSchema);

      // Define handler separately to avoid TypeScript's deep type inference issues
      // with MCP SDK + Zod generics
      const handler = async (params: Record<string, unknown>) => {
        try {
          // Parse and validate input using the operation's schema
          const parsedParams = operation.inputSchema.parse(params);

          // Execute the operation
          const result = await operation.fetcher({
            params: parsedParams,
          });

          // Serialize result to plain object for structuredContent
          // ws-dottie returns Date objects (from z.date() schemas), but MCP requires
          // plain objects. We serialize Dates to ISO strings wrapped in objects, and the
          // outputSchema has been transformed to expect z.object({ value: z.string().datetime() })
          // instead of z.date()
          let structuredContent: Record<string, unknown> | undefined;

          if (result === undefined || result === null) {
            // For optional schemas that return undefined, don't include structuredContent
            structuredContent = undefined;
          } else if (result instanceof Date) {
            // Date objects: Provide ISO string wrapped in object as structuredContent
            // The outputSchema has been transformed to expect z.object({ value: z.string().datetime() })
            // MCP requires structuredContent when an outputSchema is provided
            structuredContent = { value: result.toISOString() };
          } else if (
            result &&
            typeof result === "object" &&
            !Array.isArray(result)
          ) {
            // Plain objects - serialize to handle nested Dates
            try {
              structuredContent = JSON.parse(
                JSON.stringify(result, (_key, value) => {
                  // Convert Date objects to ISO strings during serialization
                  if (value instanceof Date) {
                    return value.toISOString();
                  }
                  return value;
                })
              ) as Record<string, unknown>;
            } catch {
              // If serialization fails, wrap in object
              structuredContent = { value: String(result) };
            }
          } else {
            // For primitives or arrays, wrap in an object
            structuredContent = { value: result };
          }

          // Return MCP protocol response
          // - content: required array of content blocks (text representation)
          // - structuredContent: optional structured data validated against outputSchema by MCP
          //
          // IMPORTANT: MCP validates structuredContent against outputSchema automatically.
          // We don't need to validate the full response ourselves - MCP handles the envelope.
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
            ...(structuredContent !== undefined && { structuredContent }),
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
          outputSchema: outputSchema as z.ZodTypeAny,
        },
        handler
      );
    }
  }

  // Write tool information to JSON file for debugging
  try {
    const outputPath = join(process.cwd(), "tool-debug-info.json");
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          totalTools: toolDebugInfo.length,
          totalOperations: toolDebugInfo.reduce(
            (sum, tool) => sum + tool.operationCount,
            0
          ),
          tools: toolDebugInfo,
        },
        null,
        2
      )
    );
    // Debug info written to file - don't log to stdout as it interferes with MCP JSON-RPC protocol
  } catch (error) {
    console.error("Failed to write tool debug info:", error);
  }
};
