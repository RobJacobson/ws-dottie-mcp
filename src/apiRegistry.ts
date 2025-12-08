import * as wsfFares from "ws-dottie/wsf-fares/core";
import * as wsfSchedule from "ws-dottie/wsf-schedule/core";
import * as wsfTerminals from "ws-dottie/wsf-terminals/core";
import * as wsfVessels from "ws-dottie/wsf-vessels/core";

/**
 * Map of API keys to their fetcher function modules.
 * These modules export the actual fetch functions for each endpoint.
 */
export const apis = {
  "wsf-vessels": wsfVessels,
  "wsf-terminals": wsfTerminals,
  "wsf-schedule": wsfSchedule,
  "wsf-fares": wsfFares,
} as const;

export type ApiKey = keyof typeof apis;
