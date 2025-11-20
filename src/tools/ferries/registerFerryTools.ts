import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import { getTagMetadata } from "@/openapi/ferries.js";
import { createErrorResponse } from "@/tools/errorHandler.js";
import type { apiKey } from "@/wsdottieClient.js";
import {
  buildOperationConfigs,
  type OperationConfig,
} from "./operationConfig.js";

const groupedOperations = buildOperationConfigs();

/**
 * Registers all ferry data tools with the MCP server.
 * Groups operations by API and tag, creating a tool for each group.
 * Each tool can execute one or more operations from the same endpoint group.
 *
 * @param server - The MCP server instance to register tools with
 */
export const registerFerryDataTools = (server: McpServer): void => {
  groupedOperations.forEach((operations, compositeKey) => {
    const [apiKey, tag] = compositeKey.split("::") as [apiKey, string];
    const toolName = formatToolName(tag);
    const toolTitle = formatToolTitle(tag);
    const opIds = operations.map((op) => op.operationId);
    const tagMeta = getTagMetadata(apiKey, tag);
    const description =
      tagMeta?.description ?? operations[0]?.summary ?? `${tag} operations`;
    const inputSchema = z.object({
      operation: createOperationSelector(opIds),
      params: z.record(z.any()).optional(),
    });

    server.registerTool(
      toolName,
      {
        title: toolTitle,
        description,
        inputSchema,
      },
      async ({
        operation,
        params,
      }: {
        operation?: string;
        params?: Record<string, unknown>;
      }) => {
        try {
          const selected = selectOperation(operations, operation);
          return await executeOperation(selected, params ?? {});
        } catch (error) {
          return createErrorResponse(error);
        }
      }
    );
  });
};

/**
 * Formats a tag name into a tool name by replacing hyphens with underscores and prefixing with "get_".
 */
const formatToolName = (tag: string) => `get_${tag.replace(/-/g, "_")}`;

/**
 * Formats a tag name into a human-readable tool title by capitalizing words.
 */
const formatToolTitle = (tag: string) =>
  `Get ${tag
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")}`;

/**
 * Creates the operation selector schema based on available operation IDs.
 */
const createOperationSelector = (operationIds: string[]) => {
  if (operationIds.length === 0) {
    return z.string().optional();
  }
  if (operationIds.length === 1) {
    return z.literal(operationIds[0]).optional();
  }
  return z.enum(operationIds as [string, ...string[]]).optional();
};

/**
 * Gets a comma-separated string of available operation IDs for error messages.
 */
const getAvailableOpsString = (ops: OperationConfig[]): string =>
  ops.map((op) => op.operationId).join(", ");

/**
 * Selects an operation from a list of available operations.
 */
const selectOperation = (
  operations: OperationConfig[],
  operationId: string | undefined
): OperationConfig => {
  if (operations.length === 0) {
    throw new Error("No operations available");
  }

  if (operations.length === 1) {
    return operations[0];
  }

  if (!operationId) {
    const availableOps = getAvailableOpsString(operations);
    throw new Error(
      `Multiple operations available. Specify 'operation': ${availableOps}`
    );
  }

  const selected = operations.find((op) => op.operationId === operationId);
  if (!selected) {
    const availableOps = getAvailableOpsString(operations);
    throw new Error(
      `Unknown operation "${operationId}". Available: ${availableOps}`
    );
  }

  return selected;
};

/**
 * Executes an operation using the provided configuration and parameters.
 */
const executeOperation = async (
  config: OperationConfig,
  params: Record<string, unknown>
) => {
  const parsedParams = config.inputSchema.parse(params ?? {});

  const result = await config.fetcher({ params: parsedParams });
  const structuredContent =
    typeof result === "object" && result !== null
      ? (result as Record<string, unknown>)
      : { value: result };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    structuredContent,
  };
};
