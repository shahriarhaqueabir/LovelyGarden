import { getDatabase } from "./index";
import { z } from "zod";

/**
 * EXPORT / IMPORT UTILITIES
 */

// 1. Export entire DB state to JSON
export const exportDatabaseToJson = async () => {
  const db = await getDatabase();

  const inventory = await db.inventory.find().exec();
  const planted = await db.planted.find().exec();
  const gardens = await db.gardens.find().exec();
  const logbook = await db.logbook.find().exec();
  const settings = await db.settings.find().exec();

  const data = {
    version: 2,
    timestamp: new Date().toISOString(),
    gardens: gardens.map((d) => d.toJSON()),
    inventory: inventory.map((d) => d.toJSON()),
    planted: planted.map((d) => d.toJSON()),
    logbook: logbook.map((d) => d.toJSON()),
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
const InventoryImportSchema = z
  .object({
    id: z.string(),
    catalogId: z.string(),
    acquiredDate: z.number(),
  })
  .passthrough();

const PlantedImportSchema = z
  .object({
    id: z.string(),
    bedId: z.string(),
    catalogId: z.string(),
    gridX: z.number(),
    gridY: z.number(),
    plantedDate: z.number(),
  })
  .passthrough();

const GardenImportSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    gridWidth: z.number(),
    gridHeight: z.number(),
  })
  .passthrough();

const LogbookImportSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    itemName: z.string(),
    category: z.string(),
    date: z.number(),
  })
  .passthrough();

const ImportPayloadSchema = z.object({
  version: z.number(),
  gardens: z.array(GardenImportSchema).optional(),
  inventory: z.array(InventoryImportSchema),
  planted: z.array(PlantedImportSchema),
  logbook: z.array(LogbookImportSchema).optional(),
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

    // Gardens
    if (result.data.gardens && result.data.gardens.length > 0) {
      await db.gardens.bulkUpsert(result.data.gardens);
    }

    // Inventory
    await db.inventory.bulkUpsert(result.data.inventory);

    // Planted
    await db.planted.bulkUpsert(result.data.planted);

    // Logbook
    if (result.data.logbook && result.data.logbook.length > 0) {
      await db.logbook.bulkUpsert(result.data.logbook);
    }

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
