/**
 * API Registry for Washington State Ferries data services.
 *
 * This module centralizes the mapping between API identifiers and their corresponding
 * fetcher modules from the ws-dottie library. Each API provides access to different
 * aspects of Washington State Ferries operations.
 */

import * as wsfFares from "ws-dottie/wsf-fares/core";
import * as wsfSchedule from "ws-dottie/wsf-schedule/core";
import * as wsfTerminals from "ws-dottie/wsf-terminals/core";
import * as wsfVessels from "ws-dottie/wsf-vessels/core";

/**
 * Registry of available Washington State Ferries APIs.
 *
 * Maps API keys to their corresponding fetcher modules from ws-dottie.
 * Each module exports functions for making API calls to specific ferry services.
 *
 * @example
 * ```typescript
 * const faresApi = apis["wsf-fares"];
 * const result = await faresApi.fetchFaresValidDateRange();
 * ```
 */
export const apis = {
  /** Vessel information and tracking data */
  "wsf-vessels": wsfVessels,
  /** Terminal locations and facilities information */
  "wsf-terminals": wsfTerminals,
  /** Sailing schedules and route information */
  "wsf-schedule": wsfSchedule,
  /** Fare pricing and ticket information */
  "wsf-fares": wsfFares,
} as const;

/**
 * Valid API keys for Washington State Ferries services.
 *
 * This type ensures type safety when referencing specific APIs and provides
 * autocomplete support in IDEs.
 *
 * @example
 * ```typescript
 * function getApi(key: ApiKey) {
 *   return apis[key];
 * }
 * ```
 */
export type ApiKey = keyof typeof apis;
