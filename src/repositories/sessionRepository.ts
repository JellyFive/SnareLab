import type { SnareLabDatabase } from "../database/dexie";
import type { LogFilter, PracticeSession } from "../types";

export interface SaveSessionInput {
  id?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  categoryId: string;
  tagIds?: string[];
  note?: string;
}

export interface SessionMetadataUpdate {
  categoryId: string;
  tagIds: string[];
  note?: string;
}

export interface SessionRepositoryOptions {
  now?: () => Date;
  createId?: () => string;
}

export class CategoryNotFoundError extends Error {
  constructor(categoryId: string) {
    super(`Category does not exist: ${categoryId}`);
    this.name = "CategoryNotFoundError";
  }
}

export class SessionRepository {
  private readonly now: () => Date;
  private readonly createId: () => string;

  constructor(
    private readonly database: SnareLabDatabase,
    options: SessionRepositoryOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
    this.createId = options.createId ?? (() => crypto.randomUUID());
  }

  async saveSession(input: SaveSessionInput): Promise<PracticeSession> {
    const category = await this.database.categories.get(input.categoryId);

    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    const now = this.now();
    const session: PracticeSession = {
      id: input.id ?? this.createId(),
      startTime: input.startTime,
      endTime: input.endTime,
      duration: input.duration,
      categoryId: input.categoryId,
      tagIds: input.tagIds ?? [],
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };

    await this.database.sessions.add(session);

    return session;
  }

  async updateSessionMetadata(
    id: string,
    input: SessionMetadataUpdate,
  ): Promise<PracticeSession | undefined> {
    const category = await this.database.categories.get(input.categoryId);

    if (!category) {
      throw new CategoryNotFoundError(input.categoryId);
    }

    const changed = await this.database.sessions.update(id, {
      categoryId: input.categoryId,
      tagIds: input.tagIds,
      note: input.note,
      updatedAt: this.now(),
    });

    return changed === 0 ? undefined : this.findById(id);
  }

  async deleteSession(id: string): Promise<void> {
    await this.database.sessions.delete(id);
  }

  async findById(id: string): Promise<PracticeSession | undefined> {
    return this.database.sessions.get(id);
  }

  async findToday(today = new Date()): Promise<PracticeSession[]> {
    return this.findByDate(today);
  }

  async findByDate(date: Date): Promise<PracticeSession[]> {
    return this.findByDateRange(date, date);
  }

  async findByDateRange(start: Date, end: Date): Promise<PracticeSession[]> {
    if (start > end) {
      return [];
    }

    return this.sortByStartTime(
      (await this.database.sessions.toArray()).filter((session) =>
        isInDateRange(session.startTime, start, end),
      ),
    );
  }

  async filterSessions(filters: LogFilter): Promise<PracticeSession[]> {
    return this.sortByStartTime(
      (await this.database.sessions.toArray()).filter((session) =>
        matchesFilter(session, filters),
      ),
    );
  }

  private sortByStartTime(sessions: PracticeSession[]): PracticeSession[] {
    return sessions.sort(
      (left, right) => left.startTime.getTime() - right.startTime.getTime(),
    );
  }
}

function matchesFilter(session: PracticeSession, filters: LogFilter): boolean {
  if (
    filters.categoryIds?.length &&
    !filters.categoryIds.includes(session.categoryId)
  ) {
    return false;
  }

  if (
    filters.tagIds?.length &&
    !filters.tagIds.some((tagId) => session.tagIds.includes(tagId))
  ) {
    return false;
  }

  if (
    filters.startDate &&
    filters.endDate &&
    !isInDateRange(session.startTime, filters.startDate, filters.endDate)
  ) {
    return false;
  }

  if (filters.startDate && !filters.endDate && session.startTime < startOfDay(filters.startDate)) {
    return false;
  }

  if (filters.endDate && !filters.startDate && session.startTime >= nextDay(filters.endDate)) {
    return false;
  }

  if (
    filters.minDuration !== undefined &&
    session.duration < filters.minDuration
  ) {
    return false;
  }

  if (
    filters.maxDuration !== undefined &&
    session.duration > filters.maxDuration
  ) {
    return false;
  }

  return true;
}

function isInDateRange(value: Date, start: Date, end: Date): boolean {
  return value >= startOfDay(start) && value < nextDay(end);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function nextDay(date: Date): Date {
  const next = startOfDay(date);
  next.setDate(next.getDate() + 1);

  return next;
}
