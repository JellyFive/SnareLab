import type { Transaction } from "dexie";

type LegacyRecord = Record<string, unknown>;

export async function migrateV1ToV2(transaction: Transaction): Promise<void> {
  await transaction.table("sessions").toCollection().modify((session: LegacyRecord) => {
    if (!Array.isArray(session.tagIds)) {
      session.tagIds = [];
    }

    if (!session.updatedAt) {
      session.updatedAt = session.createdAt ?? new Date();
    }
  });

  await transaction
    .table("categories")
    .toCollection()
    .modify((category: LegacyRecord) => {
      if (typeof category.isSystem !== "boolean") {
        category.isSystem = false;
      }

      if (!category.updatedAt) {
        category.updatedAt = category.createdAt ?? new Date();
      }
    });
}
