import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import { createRegisterTool } from "../utils/createDottieTool.js";

/**
 * Registers every wsf-schedule endpoint as an MCP tool.
 *
 * The concrete fetch functions already validate input/output through ws-dottie,
 * so the surrounding MCP wrapper (see `createDottieTool`) can expose the same
 * schemas and return structuredContent `{ data: ... }` for client consumption.
 */
export const registerScheduleTools = (server: McpServer) => {
  const api = "wsf-schedule" as const;
  const endpoints = endpointsByApi[api];
  const registerTool = createRegisterTool(server, api, endpoints);

  // Register individual endpoints - one per call
  registerTool("fetchActiveSeasons");
  registerTool("fetchSailingsByRouteID");
  registerTool("fetchAllSailingsBySchedRouteID");
  registerTool("fetchCacheFlushDateSchedule");
  registerTool("fetchRouteDetailsByTripDate");
  registerTool("fetchRouteDetailsByTripDateAndTerminals");
  registerTool("fetchRouteDetailsByTripDateAndRouteId");
  registerTool("fetchRoutesByTripDate");
  registerTool("fetchRoutesByTripDateAndTerminals");
  registerTool("fetchRoutesHavingServiceDisruptionsByTripDate");
  registerTool("fetchScheduleAlerts");
  registerTool("fetchScheduleByTripDateAndRouteId");
  registerTool("fetchScheduleByTripDateAndDepartingTerminalIdAndTerminalIds");
  registerTool("fetchScheduledRoutes");
  registerTool("fetchScheduledRoutesById");
  registerTool("fetchScheduleTodayByRoute");
  registerTool("fetchScheduleTodayByTerminals");
  registerTool("fetchScheduleValidDateRange");
  registerTool("fetchTerminalMatesSchedule");
  registerTool("fetchTerminals");
  registerTool("fetchTerminalsAndMates");
  registerTool("fetchTerminalsAndMatesByRoute");
  registerTool("fetchTimeAdjustments");
  registerTool("fetchTimeAdjustmentsByRoute");
  registerTool("fetchTimeAdjustmentsBySchedRoute");
};
