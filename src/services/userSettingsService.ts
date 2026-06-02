import { supabase } from "../utils/supabase";
import type { SettingsDocument } from "../db/types";

export interface UserSettingsPreferences {
  accentColor?: string;
  backgroundColor?: string;
  language?: string;
  notifications?: boolean;
  profile?: PersonalGardenProfile;
}

export type GardenExperienceLevel =
  | "beginner"
  | "learning"
  | "confident"
  | "expert";

export interface PersonalGardenProfile {
  displayName?: string;
  avatar?: string;
  gardenNickname?: string;
  experienceLevel?: GardenExperienceLevel;
  locationLabel?: string;
  hardinessZone?: string;
  growingStyle?: string;
  preferredUnits?: "metric" | "imperial";
  favoritePlants?: string;
  gardenGoals?: string;
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
  dataVersion: row.data_version,
  preferences: row.preferences ?? undefined,
});

const toRow = (
  ownerId: string,
  settings: Partial<SettingsDocument>,
  preferences?: UserSettingsPreferences,
) => {
  const row = {
    id: ownerId,
    owner_id: ownerId,
    first_load_complete: settings.firstLoadComplete ?? true,
    hemisphere: settings.hemisphere ?? null,
    city: settings.city ?? null,
    current_day: settings.currentDay ?? 1,
    data_version: settings.dataVersion ?? 0,
  };

  if (preferences === undefined) {
    return row;
  }

  return {
    ...row,
    preferences,
  };
};

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
    .upsert(toRow(ownerId, settings, preferences), { onConflict: "owner_id" })
    .select("*")
    .single();

  if (error) throw error;
  return mapRowToSettings(data as UserSettingsRow);
};

const mergePreferences = (
  current: UserSettingsPreferences | undefined,
  patch: UserSettingsPreferences,
): UserSettingsPreferences => {
  const merged: UserSettingsPreferences = {
    ...current,
    ...patch,
  };

  if (current?.profile || patch.profile) {
    merged.profile = {
      ...current?.profile,
      ...patch.profile,
    };
  }

  return merged;
};

export const updateCloudUserPreferences = async (
  ownerId: string,
  settings: Partial<SettingsDocument>,
  preferences: UserSettingsPreferences,
): Promise<CloudUserSettings> => {
  const current = await getCloudUserSettings(ownerId);
  return upsertCloudUserSettings(
    ownerId,
    {
      ...(current ?? settings),
      ...settings,
    },
    mergePreferences(current?.preferences, preferences),
  );
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
