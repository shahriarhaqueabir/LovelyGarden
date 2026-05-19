import { supabase } from "../utils/supabase";
import type { SettingsDocument } from "../db/types";

export interface UserSettingsPreferences {
  accentColor?: string;
  backgroundColor?: string;
  language?: string;
  notifications?: boolean;
}

export interface CloudUserSettings extends SettingsDocument {
  ownerId: string;
  preferences?: UserSettingsPreferences;
}

type UserSettingsRow = {
  id: string;
  owner_id: string;
  first_load_complete: boolean;
  hemisphere: string | null;
  city: string | null;
  current_day: number;
  xp: number;
  data_version: number;
  preferences: UserSettingsPreferences | null;
};

const mapRowToSettings = (row: UserSettingsRow): CloudUserSettings => ({
  id: "local-user",
  ownerId: row.owner_id,
  firstLoadComplete: row.first_load_complete,
  hemisphere: row.hemisphere ?? undefined,
  city: row.city ?? undefined,
  currentDay: row.current_day,
  xp: row.xp,
  dataVersion: row.data_version,
  preferences: row.preferences ?? undefined,
});

const toRow = (
  ownerId: string,
  settings: Partial<SettingsDocument>,
  preferences?: UserSettingsPreferences,
) => ({
  id: ownerId,
  owner_id: ownerId,
  first_load_complete: settings.firstLoadComplete ?? true,
  hemisphere: settings.hemisphere ?? null,
  city: settings.city ?? null,
  current_day: settings.currentDay ?? 1,
  xp: settings.xp ?? 0,
  data_version: settings.dataVersion ?? 0,
  preferences: preferences ?? null,
});

export const getCloudUserSettings = async (
  ownerId: string,
): Promise<CloudUserSettings | null> => {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRowToSettings(data as UserSettingsRow) : null;
};

export const upsertCloudUserSettings = async (
  ownerId: string,
  settings: Partial<SettingsDocument>,
  preferences?: UserSettingsPreferences,
): Promise<CloudUserSettings> => {
  const { data, error } = await supabase
    .from("user_settings")
    .upsert(toRow(ownerId, settings, preferences), { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToSettings(data as UserSettingsRow);
};

export const ensureCloudUserSettings = async (
  ownerId: string,
  localSettings: SettingsDocument,
  preferences?: UserSettingsPreferences,
): Promise<CloudUserSettings> => {
  const cloudSettings = await getCloudUserSettings(ownerId);
  if (cloudSettings) return cloudSettings;

  return upsertCloudUserSettings(ownerId, localSettings, preferences);
};
