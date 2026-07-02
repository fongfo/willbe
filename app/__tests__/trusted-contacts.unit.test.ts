import { evaluateContacts } from '../src/trusted-contacts/evaluateContacts';
import { getRoleLabel, ROLE_OPTIONS } from '../src/trusted-contacts/roles';
import { trustedContactFormSchema } from '../src/trusted-contacts/trustedContact.schema';
import type { TrustedContact } from '../src/trusted-contacts/trustedContact.types';

function makeContact(overrides: Partial<TrustedContact> = {}): TrustedContact {
  return {
    id: 'c1',
    name: 'Sara Abdullah',
    relation: 'SIBLING',
    role: 'BACKUP',
    phone: '+60123456789',
    email: null,
    verificationStatus: 'PENDING',
    detail: null,
    createdAt: '2026-07-02T00:00:00.000Z',
    updatedAt: '2026-07-02T00:00:00.000Z',
    ...overrides
  };
}

describe('trustedContactFormSchema', () => {
  const base = { name: 'Sara', relation: 'SIBLING', role: 'BACKUP', phone: '+60123456789' };

  it('accepts a valid contact and drops empty optionals', () => {
    const result = trustedContactFormSchema.safeParse({ ...base, email: '  ', detail: '' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.detail).toBeUndefined();
    }
  });

  it('keeps a valid email', () => {
    const result = trustedContactFormSchema.safeParse({ ...base, email: 'sara@example.com' });
    expect(result.success && result.data.email).toBe('sara@example.com');
  });

  it('rejects an invalid phone number', () => {
    const result = trustedContactFormSchema.safeParse({ ...base, phone: '12-34' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Enter a valid phone number');
    }
  });

  it('rejects an invalid email when provided', () => {
    const result = trustedContactFormSchema.safeParse({ ...base, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name and an unknown role', () => {
    expect(trustedContactFormSchema.safeParse({ ...base, name: '' }).success).toBe(false);
    expect(trustedContactFormSchema.safeParse({ ...base, role: 'OWNER' }).success).toBe(false);
  });
});

describe('roles', () => {
  it('exposes primary and backup options with labels', () => {
    expect(ROLE_OPTIONS.map((option) => option.value)).toEqual(['PRIMARY', 'BACKUP']);
    expect(getRoleLabel('PRIMARY')).toBe('Primary');
  });
});

describe('evaluateContacts', () => {
  it('warns when there are no contacts', () => {
    const result = evaluateContacts([]);
    expect(result.level).toBe('warn');
    expect(result.hasEnough).toBe(false);
    expect(result.message).toMatch(/at least two/);
  });

  it('warns to add one more when only one exists', () => {
    const result = evaluateContacts([makeContact({ role: 'PRIMARY' })]);
    expect(result.level).toBe('warn');
    expect(result.hasEnough).toBe(false);
    expect(result.message).toMatch(/one more/);
  });

  it('warns to mark a primary when two backups exist', () => {
    const result = evaluateContacts([
      makeContact({ id: 'a', role: 'BACKUP' }),
      makeContact({ id: 'b', role: 'BACKUP' })
    ]);
    expect(result.level).toBe('warn');
    expect(result.hasEnough).toBe(true);
    expect(result.hasPrimary).toBe(false);
    expect(result.message).toMatch(/primary/);
  });

  it('is satisfied with two contacts including a primary', () => {
    const result = evaluateContacts([
      makeContact({ id: 'a', role: 'PRIMARY' }),
      makeContact({ id: 'b', role: 'BACKUP' })
    ]);
    expect(result.level).toBe('success');
    expect(result.hasEnough).toBe(true);
    expect(result.hasPrimary).toBe(true);
  });
});
