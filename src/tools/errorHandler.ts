import { appendFileSync } from "fs";
import { join } from "path";

/**
 * Logs to both console.error and a debug log file
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
 * Extracts the error message and includes both the message and full error details.
 *
 * @param error - The error to convert to a response (Error instance or any value)
 * @returns MCP error response with text content and isError flag
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

export type ToolError = {
  error: string;
  details?: unknown;
};
