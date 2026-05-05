import { getDatabase } from "./index";
import { z } from "zod";
import { PlantSpeciesSchema } from "../schema/zod-schemas";

/**
 * EXPORT / IMPORT UTILITIES
 */

// 1. Export entire DB state to JSON
export const exportDatabaseToJson = async () => {
  const db = await getDatabase();

  const inventory = await db.inventory.find().exec();
  const planted = await db.planted.find().exec();
  const settings = await db.settings.find().exec();

  const data = {
    version: 1,
    timestamp: new Date().toISOString(),
    inventory: inventory.map((d) => d.toJSON()),
    planted: planted.map((d) => d.toJSON()),
    settings: settings.map((d) => d.toJSON()),
  };

  return JSON.stringify(data, null, 2);
};

// 2. Export specific collections to CSV
export const exportCollectionToCsv = async (
  collectionName: "inventory" | "planted",
) => {
  const db = await getDatabase();
  const collection = db[collectionName];
  if (!collection) return "";

  const docs = await collection.find().exec();
  if (docs.length === 0) return "";

  const data = docs.map((d) => d.toJSON());

  // Extract headers
  const headers = Object.keys(data[0]);

  // CSV content
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) => {
      return headers
        .map((fieldName) => {
          const val = row[fieldName];
          // Handle strings with commas, nulls, etc.
          if (val === null || val === undefined) return "";
          if (typeof val === "object")
            return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          const str = String(val);
          return str.includes(",") ? `"${str}"` : str;
        })
        .join(",");
    }),
  ].join("\n");

  return csvRows;
};

// 3. Import / Restore from JSON
const ImportPayloadSchema = z.object({
  version: z.number(),
  inventory: z.array(PlantSpeciesSchema),
  planted: z.array(z.object({}).passthrough()),
  settings: z.array(z.object({}).passthrough()).optional(),
});

export const importDatabaseFromJson = async (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);

    // Validate against Zod schema
    const result = ImportPayloadSchema.safeParse(data);
    if (!result.success) {
      const errorMessages = result.error.issues
        .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
        .join("; ");
      throw new Error(`Invalid backup file format: ${errorMessages}`);
    }

    const db = await getDatabase();

    // Strategy: Upsert (merge/overwrite).
    // To do a full restore, we might want to clear existing?
    // Let's settle on Upsert for safety against wiping, but maybe prompt user?
    // For now, simple Upsert.

    // Inventory
    await db.inventory.bulkUpsert(result.data.inventory);

    // Planted
    await db.planted.bulkUpsert(result.data.planted);

    // Settings
    if (result.data.settings && result.data.settings.length > 0) {
      await db.settings.bulkUpsert(result.data.settings);
    }

    return { success: true, message: "Data imported successfully" };
  } catch (error) {
    console.error("Import failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Helper: Download a string as a file
export const downloadFile = (
  content: string,
  fileName: string,
  contentType: string,
) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
