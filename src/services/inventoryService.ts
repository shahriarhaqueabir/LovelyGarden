import { supabase } from "../utils/supabase";
import type { InventoryDocument } from "../db/types";

type InventoryRow = {
  id: string;
  owner_id: string;
  catalog_id: string;
  acquired_at: string;
  notes: string | null;
};

const mapRowToInventoryItem = (row: InventoryRow): InventoryDocument => ({
  id: row.id,
  catalogId: row.catalog_id,
  acquiredDate: new Date(row.acquired_at).getTime(),
  notes: row.notes ?? undefined,
});

const toRow = (ownerId: string, item: InventoryDocument) => ({
  id: item.id,
  owner_id: ownerId,
  catalog_id: item.catalogId,
  acquired_at: new Date(item.acquiredDate).toISOString(),
  notes: item.notes ?? null,
  updated_at: new Date().toISOString(),
});

export const listCloudInventory = async (
  ownerId: string,
): Promise<InventoryDocument[]> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("owner_id", ownerId)
    .order("acquired_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as InventoryRow[]).map(mapRowToInventoryItem);
};

export const upsertCloudInventoryItem = async (
  ownerId: string,
  item: InventoryDocument,
): Promise<InventoryDocument> => {
  const { data, error } = await supabase
    .from("inventory_items")
    .upsert(toRow(ownerId, item), { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToInventoryItem(data as InventoryRow);
};

export const deleteCloudInventoryItem = async (
  ownerId: string,
  itemId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("owner_id", ownerId)
    .eq("id", itemId);

  if (error) throw error;
};

export const syncInventoryWithCloud = async (
  ownerId: string,
  localItems: InventoryDocument[],
): Promise<InventoryDocument[]> => {
  const cloudItems = await listCloudInventory(ownerId);

  if (cloudItems.length === 0) {
    return Promise.all(
      localItems.map((item) => upsertCloudInventoryItem(ownerId, item)),
    );
  }

  const cloudItemIds = new Set(cloudItems.map((item) => item.id));
  const localOnlyItems = localItems.filter(
    (item) => !cloudItemIds.has(item.id),
  );

  if (localOnlyItems.length === 0) {
    return cloudItems;
  }

  const uploadedItems = await Promise.all(
    localOnlyItems.map((item) => upsertCloudInventoryItem(ownerId, item)),
  );

  return [...cloudItems, ...uploadedItems];
};
