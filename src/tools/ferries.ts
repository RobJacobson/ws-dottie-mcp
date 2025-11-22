import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { endpointsByApi } from "ws-dottie/apis";
import {
  fetchCacheFlushDateVessels,
  fetchVesselAccommodations,
  fetchVesselAccommodationsByVesselId,
  fetchVesselBasics,
  fetchVesselBasicsByVesselId,
  fetchVesselHistories,
  fetchVesselHistoriesByVesselNameAndDateRange,
  fetchVesselLocations,
  fetchVesselLocationsByVesselId,
  fetchVesselStats,
  fetchVesselStatsByVesselId,
  fetchVesselsVerbose,
  fetchVesselsVerboseByVesselId,
} from "ws-dottie/wsf-vessels/core";
import { createTool, registerDottieTools } from "../utils/createDottieTool.js";

/**
 * Register ferry-related MCP tools for all wsf-vessels endpoints
 */
export const registerFerriesTools = (server: McpServer) => {
  const endpoints = endpointsByApi["wsf-vessels"];

  const tools = [
    // Cache flush date
    createTool(
      endpoints["cache-flush-date-vessels"].fetchCacheFlushDateVessels,
      fetchCacheFlushDateVessels
    ),
    // Vessel accommodations
    createTool(
      endpoints["vessel-accommodations"].fetchVesselAccommodations,
      fetchVesselAccommodations
    ),
    createTool(
      endpoints["vessel-accommodations"].fetchVesselAccommodationsByVesselId,
      fetchVesselAccommodationsByVesselId
    ),
    // Vessel basics
    createTool(endpoints["vessel-basics"].fetchVesselBasics, fetchVesselBasics),
    createTool(
      endpoints["vessel-basics"].fetchVesselBasicsByVesselId,
      fetchVesselBasicsByVesselId
    ),
    // Vessel histories
    createTool(
      endpoints["vessel-histories"].fetchVesselHistories,
      fetchVesselHistories
    ),
    createTool(
      endpoints["vessel-histories"]
        .fetchVesselHistoriesByVesselNameAndDateRange,
      fetchVesselHistoriesByVesselNameAndDateRange
    ),
    // Vessel locations
    createTool(
      endpoints["vessel-locations"].fetchVesselLocations,
      fetchVesselLocations
    ),
    createTool(
      endpoints["vessel-locations"].fetchVesselLocationsByVesselId,
      fetchVesselLocationsByVesselId
    ),
    // Vessel stats
    createTool(endpoints["vessel-stats"].fetchVesselStats, fetchVesselStats),
    createTool(
      endpoints["vessel-stats"].fetchVesselStatsByVesselId,
      fetchVesselStatsByVesselId
    ),
    // Vessel verbose
    createTool(
      endpoints["vessel-verbose"].fetchVesselsVerbose,
      fetchVesselsVerbose
    ),
    createTool(
      endpoints["vessel-verbose"].fetchVesselsVerboseByVesselId,
      fetchVesselsVerboseByVesselId
    ),
  ];

  registerDottieTools(server, tools);
};
