import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "RLS_TEST_USER_A_EMAIL",
  "RLS_TEST_USER_A_PASSWORD",
  "RLS_TEST_USER_B_EMAIL",
  "RLS_TEST_USER_B_PASSWORD",
];

const missing = requiredEnv.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required env vars: ${missing.join(", ")}`);
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const createUserClient = () =>
  createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

const signIn = async (client, email, password) => {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  if (!data.user) throw new Error(`No user returned for ${email}`);
  return data.user;
};

const assertNoRows = (label, rows) => {
  if ((rows ?? []).length !== 0) {
    throw new Error(`${label}: expected no rows, received ${rows.length}`);
  }
  console.log(`PASS ${label}`);
};

const assertDenied = (label, result) => {
  if (!result.error) {
    throw new Error(`${label}: expected an RLS denial/error`);
  }
  console.log(`PASS ${label}`);
};

const main = async () => {
  const userAClient = createUserClient();
  const userBClient = createUserClient();

  const [userA, userB] = await Promise.all([
    signIn(
      userAClient,
      process.env.RLS_TEST_USER_A_EMAIL,
      process.env.RLS_TEST_USER_A_PASSWORD,
    ),
    signIn(
      userBClient,
      process.env.RLS_TEST_USER_B_EMAIL,
      process.env.RLS_TEST_USER_B_PASSWORD,
    ),
  ]);

  if (userA.id === userB.id) {
    throw new Error("RLS test users must be two different accounts.");
  }

  const runId = `rls-${Date.now()}`;
  const { data: catalogRows, error: catalogError } = await userAClient
    .from("plant_catalog")
    .select("id")
    .limit(1);

  if (catalogError) throw catalogError;
  const catalogId = catalogRows?.[0]?.id;
  if (!catalogId) throw new Error("No plant_catalog rows available for test.");

  const gardenId = `${runId}-garden`;
  const inventoryId = `${runId}-inventory`;
  const plantId = `${runId}-plant`;
  const logbookId = `${runId}-log`;

  try {
    const seedRows = [
      userAClient.from("gardens").insert({
        id: gardenId,
        owner_id: userA.id,
        name: "RLS Verification Garden",
        type: "test",
        grid_width: 2,
        grid_height: 2,
      }),
      userAClient.from("inventory_items").insert({
        id: inventoryId,
        owner_id: userA.id,
        catalog_id: catalogId,
      }),
      userAClient.from("logbook_entries").insert({
        id: logbookId,
        owner_id: userA.id,
        type: "user_purchase",
        item_name: "RLS Verification Entry",
        category: "test",
      }),
    ];

    for (const result of await Promise.all(seedRows)) {
      if (result.error) throw result.error;
    }

    const planted = await userAClient.from("planted_plants").insert({
      id: plantId,
      owner_id: userA.id,
      garden_id: gardenId,
      catalog_id: catalogId,
      grid_x: 0,
      grid_y: 0,
    });
    if (planted.error) throw planted.error;

    for (const table of [
      "gardens",
      "inventory_items",
      "planted_plants",
      "logbook_entries",
    ]) {
      const { data, error } = await userBClient
        .from(table)
        .select("*")
        .eq("owner_id", userA.id);
      if (error) throw error;
      assertNoRows(`${table} cross-user select`, data);
    }

    const crossUserInsert = await userBClient.from("gardens").insert({
      id: `${runId}-bad-garden`,
      owner_id: userA.id,
      name: "Should fail",
      type: "test",
      grid_width: 1,
      grid_height: 1,
    });
    assertDenied("gardens cross-user insert", crossUserInsert);

    const { data: updateData, error: updateError } = await userBClient
      .from("gardens")
      .update({ name: "Cross-user update should not apply" })
      .eq("owner_id", userA.id)
      .eq("id", gardenId)
      .select("*");
    if (updateError) throw updateError;
    assertNoRows("gardens cross-user update", updateData);

    const { data: deleteData, error: deleteError } = await userBClient
      .from("gardens")
      .delete()
      .eq("owner_id", userA.id)
      .eq("id", gardenId)
      .select("*");
    if (deleteError) throw deleteError;
    assertNoRows("gardens cross-user delete", deleteData);

    console.log("RLS verification completed successfully.");
  } finally {
    await userAClient
      .from("planted_plants")
      .delete()
      .eq("owner_id", userA.id)
      .eq("id", plantId);
    await userAClient
      .from("inventory_items")
      .delete()
      .eq("owner_id", userA.id)
      .eq("id", inventoryId);
    await userAClient
      .from("logbook_entries")
      .delete()
      .eq("owner_id", userA.id)
      .eq("id", logbookId);
    await userAClient
      .from("gardens")
      .delete()
      .eq("owner_id", userA.id)
      .eq("id", gardenId);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
