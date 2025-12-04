import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import { createRegisterTool } from "../utils/createDottieTool.js";

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
  const registerTool = createRegisterTool(server, api, endpoints);

  // Register individual endpoints - one per call
  registerTool("fetchCacheFlushDateVessels");
  registerTool("fetchVesselAccommodations");
  registerTool("fetchVesselAccommodationsByVesselId");
  registerTool("fetchVesselBasics");
  registerTool("fetchVesselBasicsByVesselId");
  // registerTool("fetchVesselHistories");
  registerTool("fetchVesselHistoriesByVesselAndDates");
  registerTool("fetchVesselLocations");
  registerTool("fetchVesselLocationsByVesselId");
  registerTool("fetchVesselStats");
  registerTool("fetchVesselStatsByVesselId");
  registerTool("fetchVesselsVerbose");
  registerTool("fetchVesselsVerboseByVesselId");
};
