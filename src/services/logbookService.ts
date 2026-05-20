import { supabase } from "../utils/supabase";
import type { LogbookDocument } from "../db/types";

type LogbookRow = {
  id: string;
  owner_id: string;
  type: string;
  item_name: string;
  category: string | null;
  quantity: number | null;
  price: number | string | null;
  currency: string | null;
  vendor: string | null;
  occurred_at: string;
  notes: string | null;
  catalog_id: string | null;
  garden_id: string | null;
};

const mapRowToLogbookEntry = (row: LogbookRow): LogbookDocument => ({
  id: row.id,
  type: row.type,
  itemName: row.item_name,
  category: row.category ?? undefined,
  quantity: row.quantity ?? undefined,
  price: row.price === null ? undefined : Number(row.price),
  currency: row.currency ?? undefined,
  vendor: row.vendor ?? undefined,
  date: new Date(row.occurred_at).getTime(),
  notes: row.notes ?? undefined,
  catalogId: row.catalog_id ?? "manual-entry",
  bedId: row.garden_id ?? "main-garden",
});

const toRow = (ownerId: string, entry: LogbookDocument) => ({
  id: entry.id,
  owner_id: ownerId,
  type: entry.type,
  item_name: entry.itemName,
  category: entry.category ?? null,
  quantity: entry.quantity ?? null,
  price: entry.price ?? null,
  currency: entry.currency ?? null,
  vendor: entry.vendor ?? null,
  occurred_at: new Date(entry.date).toISOString(),
  notes: entry.notes ?? null,
  catalog_id:
    !entry.catalogId || entry.catalogId === "manual-entry"
      ? null
      : entry.catalogId,
  garden_id: entry.bedId ?? "main-garden",
  updated_at: new Date().toISOString(),
});

export const listCloudLogbookEntries = async (
  ownerId: string,
): Promise<LogbookDocument[]> => {
  const { data, error } = await supabase
    .from("logbook_entries")
    .select("*")
    .eq("owner_id", ownerId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as LogbookRow[]).map(mapRowToLogbookEntry);
};

export const upsertCloudLogbookEntry = async (
  ownerId: string,
  entry: LogbookDocument,
): Promise<LogbookDocument> => {
  const { data, error } = await supabase
    .from("logbook_entries")
    .upsert(toRow(ownerId, entry), { onConflict: "owner_id,id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToLogbookEntry(data as LogbookRow);
};

export const deleteCloudLogbookEntry = async (
  ownerId: string,
  entryId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("logbook_entries")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", entryId);

  if (error) throw error;
};

export const syncLogbookWithCloud = async (
  ownerId: string,
  localEntries: LogbookDocument[],
): Promise<LogbookDocument[]> => {
  const cloudEntries = await listCloudLogbookEntries(ownerId);

  if (cloudEntries.length === 0) {
    return Promise.all(
      localEntries.map((entry) => upsertCloudLogbookEntry(ownerId, entry)),
    );
  }

  const cloudEntryIds = new Set(cloudEntries.map((entry) => entry.id));
  const localOnlyEntries = localEntries.filter(
    (entry) => !cloudEntryIds.has(entry.id),
  );

  if (localOnlyEntries.length === 0) return cloudEntries;

  const uploadedEntries = await Promise.all(
    localOnlyEntries.map((entry) => upsertCloudLogbookEntry(ownerId, entry)),
  );

  return [...cloudEntries, ...uploadedEntries].sort((a, b) => b.date - a.date);
};
