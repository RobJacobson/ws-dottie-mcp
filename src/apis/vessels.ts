import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import { registerTool } from "../utils/createDottieTool.js";

/**
 * Registers every wsf-vessels endpoint as an MCP tool.
 *
 * The concrete fetch functions already validate input/output through ws-dottie,
 * so the surrounding MCP wrapper (see `createDottieTool`) can expose the same
 * schemas and return structuredContent `{ data: ... }` for client consumption.
 */
export const registerVesselsTools = (server: McpServer) => {
  const api = "wsf-vessels" as const;
  const endpoints = endpointsByApi[api];

  registerTool(server, api, endpoints, "cache-flush-date-vessels");
  registerTool(server, api, endpoints, "vessel-accommodations");
  registerTool(server, api, endpoints, "vessel-basics");
  registerTool(server, api, endpoints, "vessel-histories");
  registerTool(server, api, endpoints, "vessel-locations");
  registerTool(server, api, endpoints, "vessel-stats");
  registerTool(server, api, endpoints, "vessel-verbose");
};

