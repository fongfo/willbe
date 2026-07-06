import type { AnchorRecord } from './anchor.types';

export interface AnchorRepository {
  findLatestByOwner(ownerRef: string): Promise<AnchorRecord | null>;
  save(record: AnchorRecord): Promise<AnchorRecord>;
}

export class InMemoryAnchorRepository implements AnchorRepository {
  private readonly anchors = new Map<string, AnchorRecord>();

  async findLatestByOwner(ownerRef: string): Promise<AnchorRecord | null> {
    return this.anchors.get(ownerRef) ?? null;
  }

  async save(record: AnchorRecord): Promise<AnchorRecord> {
    this.anchors.set(record.ownerRef, record);
    return record;
  }
}

