import { familyMemberFormSchema } from '../src/family-members/familyMember.schema';
import { getInitials } from '../src/family-members/initials';
import { getRelationLabel, RELATION_OPTIONS } from '../src/family-members/relations';

describe('familyMemberFormSchema', () => {
  it('accepts a valid member and drops an empty detail', () => {
    const result = familyMemberFormSchema.safeParse({
      name: '  Imran Rahman ',
      relation: 'SPOUSE',
      detail: '  '
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Imran Rahman');
      expect(result.data.detail).toBeUndefined();
    }
  });

  it('rejects an empty name', () => {
    const result = familyMemberFormSchema.safeParse({ name: '   ', relation: 'CHILD' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Name is required');
    }
  });

  it('rejects an unknown relation', () => {
    const result = familyMemberFormSchema.safeParse({ name: 'Ada', relation: 'COUSIN' });
    expect(result.success).toBe(false);
  });

  it('rejects an over-long detail', () => {
    const result = familyMemberFormSchema.safeParse({
      name: 'Ada',
      relation: 'OTHER',
      detail: 'x'.repeat(281)
    });
    expect(result.success).toBe(false);
  });
});

describe('relations', () => {
  it('exposes all six relation options with labels', () => {
    expect(RELATION_OPTIONS).toHaveLength(6);
    expect(RELATION_OPTIONS.map((option) => option.value)).toContain('SIBLING');
  });

  it('maps relation codes to friendly labels', () => {
    expect(getRelationLabel('SELF')).toBe('You');
    expect(getRelationLabel('SPOUSE')).toBe('Spouse');
  });
});

describe('getInitials', () => {
  it('takes first and last initials for multi-word names', () => {
    expect(getInitials('Aisyah Rahman')).toBe('AR');
    expect(getInitials('  Nur  Aina  Rahman ')).toBe('NR');
  });

  it('takes up to two letters for a single name', () => {
    expect(getInitials('Ada')).toBe('AD');
  });

  it('falls back to a placeholder for a blank name', () => {
    expect(getInitials('   ')).toBe('?');
  });
});
