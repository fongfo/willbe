import { KnowledgeEntry, KnowledgeListFilters } from './knowledge.types';

function cloneEntry(entry: KnowledgeEntry): KnowledgeEntry {
  return {
    ...entry,
    tags: [...entry.tags],
    source: { ...entry.source }
  };
}

export interface KnowledgeRepository {
  list(filters?: KnowledgeListFilters): readonly KnowledgeEntry[];
}

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private readonly entries: readonly KnowledgeEntry[];

  constructor(entries: readonly KnowledgeEntry[]) {
    this.entries = entries.map(cloneEntry);
  }

  list(filters: KnowledgeListFilters = {}): readonly KnowledgeEntry[] {
    return this.entries.filter((entry) => {
      const categoryMatches = !filters.category || entry.category === filters.category;
      const localeMatches = !filters.locale || entry.locale === filters.locale;
      return categoryMatches && localeMatches;
    }).map(cloneEntry);
  }
}
