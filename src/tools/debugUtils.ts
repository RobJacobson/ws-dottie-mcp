/**
 * Debug utilities for MCP server development and monitoring.
 *
 * Provides functionality for collecting and persisting debug information about
 * registered MCP tools. This helps with development, testing, and monitoring
 * of the ferry data APIs.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ApiKey } from "@/apiRegistry.js";

/**
 * Comprehensive debug information for a single MCP tool.
 *
 * Captures all relevant metadata about a registered tool for debugging and
 * development purposes. This includes naming, API associations, schema info,
 * and operational details.
 */
export type ToolDebugInfo = {
  /** Machine-readable tool name (e.g., "get_cache_flush_date_fares") */
  toolName: string;
  /** Human-readable tool title (e.g., "Get Cache Flush Date Fares") */
  toolTitle: string;
  /** Detailed description of what the tool does */
  description: string;
  /** Which ferry API this tool belongs to (e.g., "wsf-fares") */
  apiKey: ApiKey;
  /** API endpoint group name (e.g., "cache-flush-date-fares") */
  groupName: string;
  /** Number of operations this tool represents (usually 1) */
  operationCount: number;
  /** Details of the operations included in this tool */
  operations: Array<{
    /** Operation identifier */
    id: string;
    /** Short operation summary */
    summary?: string;
    /** Detailed operation description */
    description?: string;
    /** Whether the operation has input validation schema */
    hasInputSchema: boolean;
    /** Whether the operation has output validation schema */
    hasOutputSchema: boolean;
  }>;
  /** Input schema metadata for debugging */
  inputSchema: Record<string, unknown>;
  /** Output schema metadata for debugging (optional for void operations) */
  outputSchema?: Record<string, unknown>;
};

/**
 * Writes comprehensive tool debug information to a JSON file.
 *
 * Creates a timestamped debug file containing metadata about all registered MCP tools.
 * This includes tool counts, operation details, schema information, and generation metadata.
 * The file is written to `tool-debug-info.json` in the current working directory.
 *
 * @param toolDebugInfo - Array of tool debug information to write to the file
 *
 * @example
 * ```typescript
 * const debugData = collectToolDebugInfo(registeredTools);
 * writeToolDebugInfo(debugData);
 * // Creates tool-debug-info.json with complete tool metadata
 * ```
 */
export const writeToolDebugInfo = (toolDebugInfo: ToolDebugInfo[]): void => {
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
