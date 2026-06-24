import { getDashboardSnapshot } from "./dashboard";
import { searchCatalogTool } from "./products";
import {
  getCategoryPerformanceTool,
  getSalesTimeseriesTool,
  getTopProductsTool,
} from "./sales";
import { getSessionHealthTool } from "./sessions";

export const tools = [
  getDashboardSnapshot,
  getSalesTimeseriesTool,
  getTopProductsTool,
  getCategoryPerformanceTool,
  getSessionHealthTool,
  searchCatalogTool,
];
