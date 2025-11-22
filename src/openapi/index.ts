import type { OpenAPIV3 } from "openapi-types";
import wsfFares from "ws-dottie/openapi/wsf-fares.json" with { type: "json" };
import wsfSchedule from "ws-dottie/openapi/wsf-schedule.json" with {
  type: "json",
};
import wsfTerminals from "ws-dottie/openapi/wsf-terminals.json" with {
  type: "json",
};
import wsfVessels from "ws-dottie/openapi/wsf-vessels.json" with {
  type: "json",
};

// Type assertion helper: JSON imports are typed as unknown, but we know
// they conform to OpenAPIV3.Document structure from ws-dottie
const asOpenAPIDoc = (spec: unknown): OpenAPIV3.Document =>
  spec as OpenAPIV3.Document;

export const wsfSpecs = {
  "wsf-vessels": asOpenAPIDoc(wsfVessels),
  "wsf-terminals": asOpenAPIDoc(wsfTerminals),
  "wsf-schedule": asOpenAPIDoc(wsfSchedule),
  "wsf-fares": asOpenAPIDoc(wsfFares),
} as const;

export type WsfApiKey = keyof typeof wsfSpecs;

export type OperationSpec = {
  apiKey: WsfApiKey;
  operationId: string;
  tag: string;
  summary?: string;
  description?: string;
  parameters?: (OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject)[];
  method: string;
  path: string;
  operation: OpenAPIV3.OperationObject;
};

/**
 * Lists all operations from a specific WSF API OpenAPI specification.
 * Scans all paths and methods to extract operation details.
 *
 * @param apiKey - The API key identifying which WSF API to scan
 * @returns Array of operation specifications found in the API
 */
export const listOperationsForApi = (
  apiKey: WsfApiKey
): OperationSpec[] => {
  const doc = wsfSpecs[apiKey];
  const operations: OperationSpec[] = [];
  Object.entries(doc.paths ?? {}).forEach(([path, pathSpec]) => {
    if (!pathSpec) return;
    for (const method of Object.keys(pathSpec)) {
      const op = (pathSpec as Record<string, OpenAPIV3.OperationObject>)[
        method
      ];
      if (!op || typeof op !== "object") continue;
      if (!op.operationId) continue;
      const tag = op.tags?.[0] ?? "untagged";
      operations.push({
        apiKey,
        operationId: op.operationId,
        tag,
        summary: op.summary,
        description: op.description,
        parameters: op.parameters,
        method,
        path,
        operation: op,
      });
    }
  });
  return operations;
};

export type TagMetadata = {
  name: string;
  summary?: string;
  description?: string;
  cacheStrategy?: string;
  useCases?: unknown;
  updateFrequency?: string;
};

/**
 * Retrieves metadata for a specific tag (endpoint group) from an API specification.
 * Extracts tag information including description, cache strategy, and update frequency.
 *
 * @param apiKey - The API key identifying which WSF API to query
 * @param tagName - The name of the tag to retrieve metadata for
 * @returns Tag metadata if found, undefined otherwise
 */
export const getTagMetadata = (
  apiKey: WsfApiKey,
  tagName: string
): TagMetadata | undefined => {
  const tag = wsfSpecs[apiKey].tags?.find(
    (entry) => entry.name === tagName
  );
  if (!tag) return undefined;
  const withExtras = tag as TagMetadata & Record<string, unknown>;
  return {
    name: tag.name,
    summary: tag.description,
    description: tag.description,
    cacheStrategy:
      typeof withExtras["x-cacheStrategy"] === "string"
        ? (withExtras["x-cacheStrategy"] as string)
        : undefined,
    useCases: withExtras["x-useCases"],
    updateFrequency:
      typeof withExtras["x-updateFrequency"] === "string"
        ? (withExtras["x-updateFrequency"] as string)
        : undefined,
  };
};

