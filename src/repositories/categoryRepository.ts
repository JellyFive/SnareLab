import type { SnareLabDatabase } from "../database/dexie";
import type { Category } from "../types";

export interface CreateCategoryInput {
  id?: string;
  name: string;
  icon: string;
  color: string;
}

export interface UpdateCategoryInput {
  name: string;
  icon: string;
  color: string;
}

export class SystemCategoryDeletionError extends Error {
  constructor(categoryId: string) {
    super(`System category cannot be deleted: ${categoryId}`);
    this.name = "SystemCategoryDeletionError";
  }
}

export class CategoryRepository {
  constructor(private readonly database: SnareLabDatabase) {}

  async findAll(): Promise<Category[]> {
    return this.database.categories.orderBy("name").toArray();
  }

  async createCategory(input: CreateCategoryInput): Promise<Category> {
    const now = new Date();
    const category: Category = {
      id: input.id ?? crypto.randomUUID(),
      name: input.name,
      icon: input.icon,
      color: input.color,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.categories.add(category);
    return category;
  }

  async updateCategory(
    id: string,
    input: UpdateCategoryInput,
  ): Promise<Category | undefined> {
    const changed = await this.database.categories.update(id, {
      ...input,
      updatedAt: new Date(),
    });

    return changed === 0 ? undefined : this.database.categories.get(id);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.database.transaction(
      "rw",
      this.database.categories,
      this.database.sessions,
      async () => {
        const category = await this.database.categories.get(id);

        if (!category) {
          return;
        }

        if (category.isSystem) {
          throw new SystemCategoryDeletionError(id);
        }

        await this.database.sessions.where("categoryId").equals(id).modify({
          categoryId: "uncategorized",
          updatedAt: new Date(),
        });
        await this.database.categories.delete(id);
      },
    );
  }
}
