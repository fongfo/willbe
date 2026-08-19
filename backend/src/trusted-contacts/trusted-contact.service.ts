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
  findAssignmentsForContactUser(contactUserId: string): Promise<TrustedContactAssignment[]>;
  create(userId: string, data: CreateTrustedContactInput): Promise<TrustedContact>;
  update(
    userId: string,
    id: string,
    data: UpdateTrustedContactInput
  ): Promise<TrustedContact | null>;
  delete(userId: string, id: string): Promise<TrustedContact | null>;
  bindToUser(id: string, contactUserId: string): Promise<TrustedContact | null>;
}

const NOT_FOUND_MESSAGE = 'Trusted contact not found';

function normalizeEmail(email: string | null | undefined): string | undefined {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || undefined;
}

export class TrustedContactService {
  constructor(private readonly repository: TrustedContactRepositoryLike) {}

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
    authenticatedEmail: string | null | undefined
  ): Promise<TrustedContact> {
    const contact = await this.repository.findByIdForBinding(id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }

    const contactEmail = normalizeEmail(contact.email);
    const userEmail = normalizeEmail(authenticatedEmail);
    if (!contactEmail || !userEmail || contactEmail !== userEmail) {
      throw new HttpError(403, 'Authenticated email does not match this trusted contact');
    }

    if (contact.contactUserId && contact.contactUserId !== contactUserId) {
      throw new HttpError(409, 'Trusted contact is already bound to another account');
    }

    if (contact.contactUserId === contactUserId && contact.verificationStatus === 'VERIFIED') {
      return contact;
    }

    const bound = await this.repository.bindToUser(id, contactUserId);
    if (!bound) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return bound;
  }
}
