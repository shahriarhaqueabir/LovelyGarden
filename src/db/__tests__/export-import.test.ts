import { describe, expect, it } from "vitest";

import { importDatabaseFromJson } from "../export-import";

describe("importDatabaseFromJson", () => {
  it("rejects malformed backup payloads before touching the database", async () => {
    const result = await importDatabaseFromJson(
      JSON.stringify({
        version: 2,
        inventory: [{ id: "inv-1", acquiredDate: Date.now() }],
        planted: [],
      }),
    );

    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid backup file format");
    expect(result.message).toContain("inventory.0.catalogId");
  });
});
