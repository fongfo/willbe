import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { HttpError } from '../shared/http-error';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type { UserModel as User } from '../generated/prisma/models';
import type {
  CreateTrustedContactInput,
  UpdateTrustedContactInput
} from './trusted-contact.schema';

export interface TrustedContactAssignment extends TrustedContact {
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface TrustedContactRepositoryLike {
  findAll(userId: string): Promise<TrustedContact[]>;
  findById(userId: string, id: string): Promise<TrustedContact | null>;
  findByIdForBinding(id: string): Promise<TrustedContact | null>;
  findByInviteTokenHashForBinding(inviteTokenHash: string): Promise<TrustedContact | null>;
  findAssignmentsForContactUser(contactUserId: string): Promise<TrustedContactAssignment[]>;
  create(userId: string, data: CreateTrustedContactInput): Promise<TrustedContact>;
  storeInvite(
    userId: string,
    id: string,
    tokenHash: string,
    expiresAt: Date,
    sentAt: Date
  ): Promise<TrustedContact | null>;
  clearInvite(userId: string, id: string): Promise<TrustedContact | null>;
  update(
    userId: string,
    id: string,
    data: UpdateTrustedContactInput
  ): Promise<TrustedContact | null>;
  delete(userId: string, id: string): Promise<TrustedContact | null>;
  bindToUser(
    id: string,
    contactUserId: string,
    inviteTokenUsedAt: Date
  ): Promise<TrustedContact | null>;
}

const NOT_FOUND_MESSAGE = 'Trusted contact not found';
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface TrustedContactInvite {
  contact: TrustedContact;
  inviteToken: string;
  expiresAt: Date;
}

function normalizeEmail(email: string | null | undefined): string | undefined {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || undefined;
}

function hashInviteToken(inviteToken: string): string {
  return createHash('sha256').update(inviteToken).digest('hex');
}

function inviteTokenMatches(inviteToken: string, tokenHash: string): boolean {
  const actual = Buffer.from(hashInviteToken(inviteToken), 'hex');
  const expected = Buffer.from(tokenHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export class TrustedContactService {
  constructor(
    private readonly repository: TrustedContactRepositoryLike,
    private readonly now: () => Date = () => new Date(),
    private readonly generateInviteToken: () => string = () => randomBytes(32).toString('base64url')
  ) {}

  list(userId: string): Promise<TrustedContact[]> {
    return this.repository.findAll(userId);
  }

  listAssignments(contactUserId: string): Promise<TrustedContactAssignment[]> {
    return this.repository.findAssignmentsForContactUser(contactUserId);
  }

  async getById(userId: string, id: string): Promise<TrustedContact> {
    const contact = await this.repository.findById(userId, id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return contact;
  }

  create(userId: string, input: CreateTrustedContactInput): Promise<TrustedContact> {
    return this.repository.create(userId, input);
  }

  async createInvite(userId: string, id: string): Promise<TrustedContactInvite> {
    const contact = await this.repository.findById(userId, id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    if (!normalizeEmail(contact.email)) {
      throw new HttpError(400, 'Trusted contact email is required before sending an invite');
    }

    const inviteToken = this.generateInviteToken();
    const sentAt = this.now();
    const expiresAt = new Date(sentAt.getTime() + INVITE_TTL_MS);
    const updated = await this.repository.storeInvite(
      userId,
      id,
      hashInviteToken(inviteToken),
      expiresAt,
      sentAt
    );
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return { contact: updated, inviteToken, expiresAt };
  }

  async revokeInvite(userId: string, id: string): Promise<TrustedContact> {
    const contact = await this.repository.findById(userId, id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    if (contact.verificationStatus === 'VERIFIED') {
      throw new HttpError(409, 'Verified trusted contact invites cannot be revoked');
    }

    const updated = await this.repository.clearInvite(userId, id);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async update(
    userId: string,
    id: string,
    input: UpdateTrustedContactInput
  ): Promise<TrustedContact> {
    const updated = await this.repository.update(userId, id, input);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.repository.delete(userId, id);
    if (!deleted) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
  }

  async bindAuthenticatedContact(
    id: string,
    contactUserId: string,
    authenticatedEmail: string | null | undefined,
    inviteToken: string
  ): Promise<TrustedContact> {
    const contact = await this.repository.findByIdForBinding(id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }

    return this.validateAndBindContact(contact, contactUserId, authenticatedEmail, inviteToken);
  }

  async bindAuthenticatedContactByInviteToken(
    contactUserId: string,
    authenticatedEmail: string | null | undefined,
    inviteToken: string
  ): Promise<TrustedContact> {
    const contact = await this.repository.findByInviteTokenHashForBinding(
      hashInviteToken(inviteToken)
    );
    if (!contact) {
      throw new HttpError(403, 'Trusted contact invite token is invalid');
    }

    return this.validateAndBindContact(contact, contactUserId, authenticatedEmail, inviteToken);
  }

  private async validateAndBindContact(
    contact: TrustedContact,
    contactUserId: string,
    authenticatedEmail: string | null | undefined,
    inviteToken: string
  ): Promise<TrustedContact> {
    const contactEmail = normalizeEmail(contact.email);
    const userEmail = normalizeEmail(authenticatedEmail);
    if (!contactEmail || !userEmail || contactEmail !== userEmail) {
      throw new HttpError(403, 'Authenticated email does not match this trusted contact');
    }

    if (contact.contactUserId && contact.contactUserId !== contactUserId) {
      throw new HttpError(409, 'Trusted contact is already bound to another account');
    }

    if (contact.inviteTokenUsedAt) {
      throw new HttpError(409, 'Trusted contact invite has already been used');
    }

    if (!contact.inviteTokenHash || !contact.inviteTokenExpiresAt) {
      throw new HttpError(403, 'Trusted contact invite is missing or expired');
    }

    if (contact.inviteTokenExpiresAt <= this.now()) {
      throw new HttpError(403, 'Trusted contact invite is missing or expired');
    }

    if (!inviteTokenMatches(inviteToken, contact.inviteTokenHash)) {
      throw new HttpError(403, 'Trusted contact invite token is invalid');
    }

    const bound = await this.repository.bindToUser(contact.id, contactUserId, this.now());
    if (!bound) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return bound;
  }
}
