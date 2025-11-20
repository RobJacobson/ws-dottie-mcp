import type { ZodObject, ZodTypeAny } from "zod";

import { listOperationsForApi, type OperationSpec } from "@/openapi/ferries.js";
import { buildInputSchemaFromOpenAPI } from "@/utils/openapiToZod.js";
import type { apiKey } from "@/wsdottieClient.js";
import { apis } from "@/wsdottieClient.js";

type Fetcher = (args?: Record<string, unknown>) => Promise<unknown>;

/**
 * Configuration for a single API operation, extending OperationSpec with
 * runtime-specific fields (fetcher function and validation schema).
 */
export type OperationConfig = OperationSpec & {
  fetcher: Fetcher;
  inputSchema: ZodObject<Record<string, ZodTypeAny>>;
};

/**
 * Builds a map of operation configurations grouped by API and tag.
 * Scans all ferries modules, discovers available operations from OpenAPI specs,
 * and creates operation configs for each available fetcher function.
 *
 * @returns A map keyed by "apiKey::tag" containing arrays of operation configs
 */
export const buildOperationConfigs = (): Map<string, OperationConfig[]> => {
  const grouped = new Map<string, OperationConfig[]>();

  (Object.keys(apis) as apiKey[]).forEach((apiKey) => {
    const moduleExports = apis[apiKey] as Record<string, unknown>;
    const operations = listOperationsForApi(apiKey);

    operations.forEach((operation) => {
      const fetcher = moduleExports[operation.operationId];
      if (typeof fetcher !== "function") {
        return;
      }

      // Build Zod 3 schema directly from OpenAPI (no Zod 4 conversion needed)
      const inputSchema = buildInputSchemaFromOpenAPI(operation.operation);

      const bucketKey = `${apiKey}::${operation.tag}`;
      const list = grouped.get(bucketKey) ?? [];
      list.push({
        ...operation,
        fetcher: fetcher as Fetcher,
        inputSchema,
      });
      grouped.set(bucketKey, list);
    });
  });

  return grouped;
};
