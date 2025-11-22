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
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            error: message,
            details: error,
          } satisfies ToolError,
          null,
          2
        ),
      },
    ],
    isError: true,
  };
};

export type ToolError = {
  error: string;
  details?: unknown;
};

