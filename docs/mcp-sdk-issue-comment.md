# MCP SDK Issue Comment

**Date:** December 11, 2025

**Issue:** [#1149 - output schema has unnecessary restriction type=object](https://github.com/modelcontextprotocol/typescript-sdk/issues/1149)

**Comment:** https://github.com/modelcontextprotocol/typescript-sdk/issues/1149#issuecomment-3644855960

## Summary

Added a comment to the MCP SDK issue documenting:

1. **The crash we encountered:** `TypeError: Cannot read properties of undefined (reading '_zod')`
2. **Root cause:** `validateToolOutput()` passes `undefined` to `safeParseAsync()` when `outputSchema` is not an object type
3. **Proposed fix:** 4-line null check after `normalizeObjectSchema()`
4. **Workaround:** Always use object schemas (what we implemented in `schemaUtils.ts`)

## Related Files

- `docs/zod-mcp-compatibility-fix.md` - Full technical analysis
- `docs/mcp-sdk-pr-draft.md` - PR draft if maintainers want a contribution
- `src/tools/schemaUtils.ts` - Our workaround implementation

## Status

⏳ Waiting for maintainer response
