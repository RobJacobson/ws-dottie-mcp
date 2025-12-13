/**
 * API Registry for Washington State Department of Transportation data services.
 *
 * This module centralizes the mapping between API identifiers and their corresponding
 * fetcher modules from the ws-dottie library. Each API provides access to different
 * aspects of Washington State transportation data including ferries, highways, and weather.
 */

import * as wsdotBorderCrossings from "ws-dottie/wsdot-border-crossings/core";
import * as wsdotBridgeClearances from "ws-dottie/wsdot-bridge-clearances/core";
import * as wsdotCommercialVehicleRestrictions from "ws-dottie/wsdot-commercial-vehicle-restrictions/core";
import * as wsdotHighwayAlerts from "ws-dottie/wsdot-highway-alerts/core";
import * as wsdotHighwayCameras from "ws-dottie/wsdot-highway-cameras/core";
import * as wsdotMountainPassConditions from "ws-dottie/wsdot-mountain-pass-conditions/core";
import * as wsdotTollRates from "ws-dottie/wsdot-toll-rates/core";
import * as wsdotTrafficFlow from "ws-dottie/wsdot-traffic-flow/core";
import * as wsdotTravelTimes from "ws-dottie/wsdot-travel-times/core";
import * as wsdotWeatherInformation from "ws-dottie/wsdot-weather-information/core";
import * as wsdotWeatherReadings from "ws-dottie/wsdot-weather-readings/core";
import * as wsdotWeatherStations from "ws-dottie/wsdot-weather-stations/core";
import * as wsfFares from "ws-dottie/wsf-fares/core";
import * as wsfSchedule from "ws-dottie/wsf-schedule/core";
import * as wsfTerminals from "ws-dottie/wsf-terminals/core";
import * as wsfVessels from "ws-dottie/wsf-vessels/core";

/**
 * Registry of available Washington State Department of Transportation APIs.
 *
 * Maps API keys to their corresponding fetcher modules from ws-dottie.
 * Each module exports functions for making API calls to specific transportation services.
 *
 * @example
 * ```typescript
 * const borderCrossingsApi = apis["wsdot-border-crossings"];
 * const result = await borderCrossingsApi.fetchBorderCrossings();
 * ```
 */
export const apis = {
  /** Border crossing wait times and information */
  "wsdot-border-crossings": wsdotBorderCrossings,
  /** Bridge clearance information */
  "wsdot-bridge-clearances": wsdotBridgeClearances,
  /** Commercial vehicle restrictions */
  "wsdot-commercial-vehicle-restrictions": wsdotCommercialVehicleRestrictions,
  /** Highway alerts and incidents */
  "wsdot-highway-alerts": wsdotHighwayAlerts,
  /** Highway camera feeds */
  "wsdot-highway-cameras": wsdotHighwayCameras,
  /** Mountain pass conditions */
  "wsdot-mountain-pass-conditions": wsdotMountainPassConditions,
  /** Toll rates and pricing */
  "wsdot-toll-rates": wsdotTollRates,
  /** Traffic flow data */
  "wsdot-traffic-flow": wsdotTrafficFlow,
  /** Travel time information */
  "wsdot-travel-times": wsdotTravelTimes,
  /** Weather information */
  "wsdot-weather-information": wsdotWeatherInformation,
  /** Weather readings and measurements */
  "wsdot-weather-readings": wsdotWeatherReadings,
  /** Weather station locations */
  "wsdot-weather-stations": wsdotWeatherStations,
  /** Washington State Ferries fare information */
  "wsf-fares": wsfFares,
  /** Washington State Ferries schedule information */
  "wsf-schedule": wsfSchedule,
  /** Washington State Ferries terminal information */
  "wsf-terminals": wsfTerminals,
  /** Washington State Ferries vessel information */
  "wsf-vessels": wsfVessels,
} as const;

/**
 * Valid API keys for Washington State Department of Transportation services.
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
