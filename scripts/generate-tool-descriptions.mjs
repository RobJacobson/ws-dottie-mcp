#!/usr/bin/env node
/**
 * Generate tool-descriptions.md from current MCP tool registrations
 *
 * This script extracts the actual tool descriptions as they would be
 * registered with the MCP server and generates a comprehensive
 * documentation file.
 */

import { writeFileSync } from 'fs';
import { registerDottieDataTools } from '../dist/tools/dottieDataTools.js';

const capturedTools = [];

const mockServer = {
  registerTool: (name, config, handler) => {
    capturedTools.push({
      name,
      title: config.title,
      description: config.description
    });
  }
};

console.log('Extracting tool descriptions from MCP server registration...');
registerDottieDataTools(mockServer);
console.log(`Captured ${capturedTools.length} tools`);

// Generate markdown
const markdown = `# MCP Tool Descriptions

This document contains the descriptions for all MCP tools provided by ws-dottie-mcp.

${capturedTools.map(tool => `## ${tool.name}

**Title:** ${tool.title}

${tool.description}

---`).join('\n\n')}

`;

// Write to file
writeFileSync('tool-descriptions.md', markdown);
console.log('Generated tool-descriptions.md with current tool descriptions');
