import React from "react";
import {
  BadgeCheck,
  Cloud,
  Leaf,
  MapPin,
  Save,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { getDatabase } from "../db";
import { useAuth } from "../hooks/useAuth";
import { showError, showSuccess } from "../lib/toast";
import {
  ensureCloudUserSettings,
  updateCloudUserPreferences,
  type GardenExperienceLevel,
  type PersonalGardenProfile,
} from "../services/userSettingsService";
import type { SettingsDocument } from "../db/types";

const avatarOptions = [
  { id: "leaf", label: "Leaf", className: "bg-garden-500 text-stone-950" },
  { id: "moss", label: "Moss", className: "bg-emerald-800 text-emerald-50" },
  { id: "sky", label: "Sky", className: "bg-sky-500 text-stone-950" },
  { id: "sun", label: "Sun", className: "bg-amber-400 text-stone-950" },
  { id: "rose", label: "Rose", className: "bg-rose-500 text-white" },
];

const experienceOptions: Array<{
  value: GardenExperienceLevel;
  label: string;
  description: string;
}> = [
  {
    value: "beginner",
    label: "Beginner",
    description: "Starting a first garden or learning the basics.",
  },
  {
    value: "learning",
    label: "Learning",
    description: "Growing regularly and building seasonal confidence.",
  },
  {
    value: "confident",
    label: "Confident",
    description: "Comfortable planning beds, timing, and harvests.",
  },
  {
    value: "expert",
    label: "Expert",
    description: "Advanced grower managing complex garden systems.",
  },
];

const growingStyles = [
  "Balcony",
  "Container",
  "Raised beds",
  "In-ground",
  "Greenhouse",
  "Indoor",
  "Mixed",
];

const defaultProfile = (email?: string | null): PersonalGardenProfile => ({
  displayName: email?.split("@")[0] ?? "",
  avatar: "leaf",
  gardenNickname: "My Lovely Garden",
  experienceLevel: "beginner",
  locationLabel: "",
  hardinessZone: "",
  growingStyle: "Mixed",
  preferredUnits: "metric",
  favoritePlants: "",
  gardenGoals: "",
});

export const ProfileTab: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<PersonalGardenProfile>(() =>
    defaultProfile(user?.email),
  );
  const [settings, setSettings] = React.useState<SettingsDocument | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const selectedAvatar =
    avatarOptions.find((option) => option.id === profile.avatar) ??
    avatarOptions[0];

  React.useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const db = await getDatabase();
        const settingsDoc = await db.settings.findOne("local-user").exec();
        if (!settingsDoc) {
          throw new Error("Local settings are not ready yet.");
        }

        const localSettings = settingsDoc.toJSON();
        let syncedProfile: PersonalGardenProfile | undefined;
        let nextSettings = localSettings;

        if (user) {
          const cloudSettings = await ensureCloudUserSettings(
            user.id,
            localSettings,
          );
          syncedProfile = cloudSettings.preferences?.profile;
          nextSettings = {
            ...localSettings,
            firstLoadComplete: cloudSettings.firstLoadComplete,
            hemisphere: cloudSettings.hemisphere ?? localSettings.hemisphere,
            city: cloudSettings.city ?? localSettings.city,
            currentDay: cloudSettings.currentDay ?? localSettings.currentDay,
            dataVersion: cloudSettings.dataVersion ?? localSettings.dataVersion,
          };
          await db.settings.upsert({ ...nextSettings, id: "local-user" });
        }

        if (cancelled) return;
        setSettings(nextSettings);
        setProfile({
          ...defaultProfile(user?.email),
          locationLabel: nextSettings.city ?? "",
          ...syncedProfile,
        });
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Could not load profile.";
        showError(message);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateProfile = <Key extends keyof PersonalGardenProfile>(
    key: Key,
    value: PersonalGardenProfile[Key],
  ) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    if (!user || !settings) return;

    setIsSaving(true);
    try {
      const db = await getDatabase();
      const latestSettingsDoc = await db.settings.findOne("local-user").exec();
      const latestSettings = latestSettingsDoc?.toJSON() ?? settings;

      await updateCloudUserPreferences(user.id, latestSettings, {
        profile,
      });
      showSuccess("Profile synced across your garden devices.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save profile.";
      showError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c0a09] text-stone-100">
        <div className="flex flex-col items-center gap-4">
          <UserCircle className="h-8 w-8 animate-pulse text-garden-500" />
          <span className="text-sm font-black uppercase tracking-widest text-stone-500">
            Loading Profile
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-[#0c0a09] p-4 pb-24 text-stone-100 sm:p-6 lg:pb-6">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-black ${selectedAvatar.className}`}
              >
                {(profile.displayName || user?.email || "G")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-garden-500">
                  Garden Profile
                </p>
                <h1 className="text-2xl font-black tracking-tight text-stone-100 sm:text-3xl">
                  {profile.displayName || "Your profile"}
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-sm font-semibold leading-6 text-stone-400">
              Personalize your garden identity, growing context, and sync
              preferences across mobile and desktop.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-garden-500 px-5 text-xs font-black uppercase tracking-widest text-stone-950 hover:bg-garden-400 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving" : "Save Profile"}
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 sm:p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-500">
              <UserCircle className="h-4 w-4 text-garden-400" />
              Personal Details
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Display Name
                </span>
                <input
                  value={profile.displayName ?? ""}
                  onChange={(event) =>
                    updateProfile("displayName", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="Garden keeper"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Garden Nickname
                </span>
                <input
                  value={profile.gardenNickname ?? ""}
                  onChange={(event) =>
                    updateProfile("gardenNickname", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="Balcony Eden"
                />
              </label>
            </div>

            <div className="mt-4">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                Avatar
              </span>
              <div className="grid grid-cols-5 gap-2">
                {avatarOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => updateProfile("avatar", option.id)}
                    className={`flex h-12 items-center justify-center rounded-xl border text-xs font-black ${
                      profile.avatar === option.id
                        ? "border-garden-400"
                        : "border-stone-800"
                    } ${option.className}`}
                    title={option.label}
                  >
                    {(profile.displayName || option.label)
                      .slice(0, 1)
                      .toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 sm:p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-500">
              <BadgeCheck className="h-4 w-4 text-garden-400" />
              Experience
            </h2>
            <div className="grid gap-2">
              {experienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateProfile("experienceLevel", option.value)}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    profile.experienceLevel === option.value
                      ? "border-garden-500/50 bg-garden-950/30"
                      : "border-stone-800 bg-stone-900/60 hover:border-stone-700"
                  }`}
                >
                  <span className="block text-sm font-black text-stone-100">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-stone-500">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 sm:p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-500">
              <MapPin className="h-4 w-4 text-garden-400" />
              Location Profile
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Location Label
                </span>
                <input
                  value={profile.locationLabel ?? ""}
                  onChange={(event) =>
                    updateProfile("locationLabel", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="Berlin balcony"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Hardiness Zone
                </span>
                <input
                  value={profile.hardinessZone ?? ""}
                  onChange={(event) =>
                    updateProfile("hardinessZone", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="USDA 8a / RHS H5"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Growing Style
                </span>
                <select
                  value={profile.growingStyle ?? "Mixed"}
                  onChange={(event) =>
                    updateProfile("growingStyle", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                >
                  {growingStyles.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Preferred Units
                </span>
                <select
                  value={profile.preferredUnits ?? "metric"}
                  onChange={(event) =>
                    updateProfile(
                      "preferredUnits",
                      event.target
                        .value as PersonalGardenProfile["preferredUnits"],
                    )
                  }
                  className="h-11 w-full rounded-xl border border-stone-800 bg-stone-900 px-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                >
                  <option value="metric">Metric</option>
                  <option value="imperial">Imperial</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-800 bg-stone-950/70 p-4 sm:p-5">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-500">
              <Leaf className="h-4 w-4 text-garden-400" />
              Preferences
            </h2>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Favorite Plants
                </span>
                <textarea
                  value={profile.favoritePlants ?? ""}
                  onChange={(event) =>
                    updateProfile("favoritePlants", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-stone-800 bg-stone-900 px-3 py-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="Tomatoes, basil, strawberries..."
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-500">
                  Garden Goals
                </span>
                <textarea
                  value={profile.gardenGoals ?? ""}
                  onChange={(event) =>
                    updateProfile("gardenGoals", event.target.value)
                  }
                  rows={3}
                  className="w-full resize-none rounded-xl border border-stone-800 bg-stone-900 px-3 py-3 text-sm text-stone-100 outline-none focus:border-garden-500"
                  placeholder="Grow herbs for cooking, reduce waste, learn seasonal planning..."
                />
              </label>

              <div className="rounded-xl border border-garden-500/20 bg-garden-950/20 p-3">
                <div className="flex items-start gap-3">
                  <Cloud className="mt-0.5 h-4 w-4 shrink-0 text-garden-400" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-garden-300">
                      Sync Enabled
                    </p>
                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Profile details are saved to Supabase preferences for this
                      account and restored on other devices.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-stone-800 bg-stone-900/70 p-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-stone-300">
                      Account
                    </p>
                    <p className="mt-1 break-all text-xs leading-5 text-stone-500">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
