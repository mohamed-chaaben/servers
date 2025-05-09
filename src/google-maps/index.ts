#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { HttpServerTransport } from "@modelcontextprotocol/sdk/server/http.js"; // changed line
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// [KEEP ALL OTHER CODE INTACT — interfaces, API handlers, tools...]

// (No changes to any of the tool definitions or handler functions)

// Server setup
const server = new Server(
  {
    name: "mcp-server/google-maps",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MAPS_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "maps_geocode": {
        const { address } = request.params.arguments as { address: string };
        return await handleGeocode(address);
      }
      case "maps_reverse_geocode": {
        const { latitude, longitude } = request.params.arguments as {
          latitude: number;
          longitude: number;
        };
        return await handleReverseGeocode(latitude, longitude);
      }
      case "maps_search_places": {
        const { query, location, radius } = request.params.arguments as {
          query: string;
          location?: { latitude: number; longitude: number };
          radius?: number;
        };
        return await handlePlaceSearch(query, location, radius);
      }
      case "maps_place_details": {
        const { place_id } = request.params.arguments as { place_id: string };
        return await handlePlaceDetails(place_id);
      }
      case "maps_distance_matrix": {
        const { origins, destinations, mode } = request.params.arguments as {
          origins: string[];
          destinations: string[];
          mode?: "driving" | "walking" | "bicycling" | "transit";
        };
        return await handleDistanceMatrix(origins, destinations, mode);
      }
      case "maps_elevation": {
        const { locations } = request.params.arguments as {
          locations: Array<{ latitude: number; longitude: number }>;
        };
        return await handleElevation(locations);
      }
      case "maps_directions": {
        const { origin, destination, mode } = request.params.arguments as {
          origin: string;
          destination: string;
          mode?: "driving" | "walking" | "bicycling" | "transit";
        };
        return await handleDirections(origin, destination, mode);
      }
      default:
        return {
          content: [{
            type: "text",
            text: `Unknown tool: ${request.params.name}`
          }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

// ✅ Use HTTP transport with Render-compatible port
async function runServer() {
  const port = parseInt(process.env.PORT || "10000", 10);
  const transport = new HttpServerTransport({ port });
  console.error(`✅ Google Maps MCP Server running on http://0.0.0.0:${port}`);
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("❌ Fatal error running server:", error);
  process.exit(1);
});
