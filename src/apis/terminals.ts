import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import { createRegisterTool } from "../utils/createDottieTool.js";

/**
 * Registers every wsf-terminals endpoint as an MCP tool.
 *
 * The concrete fetch functions already validate input/output through ws-dottie,
 * so the surrounding MCP wrapper (see `createDottieTool`) can expose the same
 * schemas and return structuredContent `{ data: ... }` for client consumption.
 */
export const registerTerminalsTools = (server: McpServer) => {
  const api = "wsf-terminals" as const;
  const endpoints = endpointsByApi[api];
  const registerTool = createRegisterTool(server, api, endpoints);

  // Register individual endpoints - one per call
  registerTool("fetchCacheFlushDateTerminals");
  registerTool("fetchTerminalBasics");
  registerTool("fetchTerminalBasicsByTerminalId");
  registerTool("fetchTerminalBulletins");
  registerTool("fetchTerminalBulletinsByTerminalId");
  registerTool("fetchTerminalLocations");
  registerTool("fetchTerminalLocationsByTerminalId");
  registerTool("fetchTerminalSailingSpace");
  registerTool("fetchTerminalSailingSpaceByTerminalId");
  registerTool("fetchTerminalTransports");
  registerTool("fetchTerminalTransportsByTerminalId");
  registerTool("fetchTerminalVerbose");
  registerTool("fetchTerminalVerboseByTerminalId");
  registerTool("fetchTerminalWaitTimes");
  registerTool("fetchTerminalWaitTimesByTerminalId");
};
