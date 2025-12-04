import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import { createRegisterTool } from "../utils/createDottieTool.js";

/**
 * Registers every wsf-fares endpoint as an MCP tool.
 *
 * The concrete fetch functions already validate input/output through ws-dottie,
 * so the surrounding MCP wrapper (see `createDottieTool`) can expose the same
 * schemas and return structuredContent `{ data: ... }` for client consumption.
 */
export const registerFaresTools = (server: McpServer) => {
  const api = "wsf-fares" as const;
  const endpoints = endpointsByApi[api];
  const registerTool = createRegisterTool(server, api, endpoints);

  // Register individual endpoints - one per call
  registerTool("fetchCacheFlushDateFares");
  registerTool("fetchFaresValidDateRange");
  registerTool("fetchTerminalFares");
  registerTool("fetchTerminalMatesFares");
  registerTool("fetchTerminalComboFares");
  registerTool("fetchTerminalComboFaresVerbose");
  registerTool("fetchFareLineItemsBasic");
  registerTool("fetchFareLineItemsVerbose");
  registerTool("fetchFareLineItemsByTripDateAndTerminals");
  registerTool("fetchFareTotalsByTripDateAndRoute");
};
