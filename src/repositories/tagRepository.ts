import type { SnareLabDatabase } from "../database/dexie";
import type { Tag } from "../types";

export interface CreateTagInput {
  id?: string;
  name: string;
  color?: string;
}

export interface UpdateTagInput {
  name: string;
  color?: string;
}

export class TagRepository {
  constructor(private readonly database: SnareLabDatabase) {}

  async findAll(): Promise<Tag[]> {
    return this.database.tags.orderBy("name").toArray();
  }

  async createTag(input: CreateTagInput): Promise<Tag> {
    const now = new Date();
    const tag: Tag = {
      id: input.id ?? crypto.randomUUID(),
      name: input.name,
      color: input.color,
      isPreset: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.tags.add(tag);
    return tag;
  }

  async updateTag(id: string, input: UpdateTagInput): Promise<Tag | undefined> {
    const changed = await this.database.tags.update(id, {
      ...input,
      updatedAt: new Date(),
    });

    return changed === 0 ? undefined : this.database.tags.get(id);
  }

  async deleteTag(id: string): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.tags,
      this.database.sessions,
      async () => {
        await this.database.sessions.where("tagIds").equals(id).modify((session) => {
          session.tagIds = session.tagIds.filter((tagId) => tagId !== id);
          session.updatedAt = new Date();
        });
        await this.database.tags.delete(id);
      },
    );
  }
}
