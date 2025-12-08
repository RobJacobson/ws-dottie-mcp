/**
 * Error handling utilities for MCP server operations.
 *
 * Provides standardized error response creation and debug logging functionality
 * for Model Context Protocol (MCP) tool handlers.
 */

import { appendFileSync } from "fs";
import { join } from "path";

/**
 * Logs debug information to both console and a persistent log file.
 *
 * Used for debugging MCP server operations, particularly error handling and
 * response creation. Logs are written to both stderr (for immediate visibility)
 * and a debug log file for persistent storage.
 *
 * @param message - The log message to record
 * @param data - Optional additional data to include in the log entry
 *
 * @example
 * ```typescript
 * debugLog("Processing request", { userId: 123, action: "fetch" });
 * ```
 */
const debugLog = (message: string, data?: unknown): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ` ${JSON.stringify(data, null, 2)}` : ""}\n`;
  try {
    console.error(message, data);
    appendFileSync(join(process.cwd(), "mcp-debug.log"), logMessage);
  } catch (logError) {
    // Silently fail if logging fails
  }
};

/**
 * Creates a standardized error response for MCP tool handlers.
 *
 * Converts any error (Error instances or primitive values) into a properly formatted
 * MCP error response. The response includes both a human-readable error message and
 * structured error details in JSON format. This ensures consistent error handling
 * across all MCP tools.
 *
 * @param error - The error to convert to a response (Error instance, string, or any value)
 * @returns MCP-compliant error response with text content and error flag
 *
 * @example
 * ```typescript
 * try {
 *   // Some operation that might fail
 *   await riskyOperation();
 * } catch (error) {
 *   return createErrorResponse(error);
 * }
 * ```
 */
export const createErrorResponse = (
  error: unknown
): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} => {
  // Write directly to stderr as backup
  const errorMsg = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[ErrorHandler] CREATING ERROR RESPONSE: ${errorMsg}\n`);
  debugLog("[ErrorHandler] Creating error response for", {
    error,
    errorType: typeof error,
    errorName: error instanceof Error ? error.name : undefined,
    errorMessage: error instanceof Error ? error.message : String(error),
  });

  const message = error instanceof Error ? error.message : String(error);
  let errorText: string;
  try {
    errorText = JSON.stringify(
      {
        error: message,
        details: error,
      } satisfies ToolError,
      null,
      2
    );
    debugLog("[ErrorHandler] Error text serialized successfully", {
      length: errorText.length,
    });
  } catch (stringifyError) {
    debugLog("[ErrorHandler] Failed to stringify error", { stringifyError });
    errorText = `{"error": "${message}", "details": "Failed to serialize error details"}`;
  }

  const response: {
    content: Array<{ type: "text"; text: string }>;
    isError: true;
  } = {
    content: [
      {
        type: "text" as const,
        text: errorText,
      },
    ],
    isError: true as const,
  };

  debugLog("[ErrorHandler] Error response created", {
    contentDefined: response.content !== undefined,
    contentLength: response.content.length,
    hasIsError: response.isError === true,
  });

  return response;
};

/**
 * Structured error information for MCP tool responses.
 *
 * Represents error details that are included in MCP error responses.
 * The error field contains a human-readable error message, while details
 * can include additional error context or the original error object.
 */
export type ToolError = {
  /** Human-readable error message */
  error: string;
  /** Optional additional error details or context */
  details?: unknown;
};
