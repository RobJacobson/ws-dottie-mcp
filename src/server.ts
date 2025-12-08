/**
 * MCP Server for Washington State Ferries data via ws-dottie APIs.
 *
 * This server provides Model Context Protocol (MCP) tools for accessing Washington State
 * Ferries data including schedules, fares, terminals, and vessel information.
 *
 * The server registers two main tool groups:
 * - Ferry data tools: Direct API access to ferry operations
 * - Ferry docs tools: Metadata and documentation for API endpoints
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerFerryDocsTools } from "@/tools/docs/registerFerryDocsTools.js";
import { registerFerryDataTools } from "@/tools/ferryDataTools.js";

/**
 * Main entry point for the MCP server.
 *
 * Initializes the MCP server, registers all ferry-related tools, and establishes
 * communication via stdio transport for MCP client connections.
 *
 * @returns Promise that resolves when the server is fully initialized and connected
 * @throws Will exit the process with code 1 if server initialization fails
 */
const main = async (): Promise<void> => {
  const server = new McpServer({ name: "ws-dottie-mcp", version: "0.1.0" });

  registerFerryDataTools(server);
  registerFerryDocsTools(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
};

// Initialize the server and handle any startup errors
main().catch((error) => {
  console.error("ws-dottie-mcp server failed:", error);
  process.exit(1);
});
