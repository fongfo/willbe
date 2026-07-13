import { HttpError } from '../shared/http-error';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type {
  CreateTrustedContactInput,
  UpdateTrustedContactInput
} from './trusted-contact.schema';

export interface TrustedContactRepositoryLike {
  findAll(userId: string): Promise<TrustedContact[]>;
  findById(userId: string, id: string): Promise<TrustedContact | null>;
  create(userId: string, data: CreateTrustedContactInput): Promise<TrustedContact>;
  update(
    userId: string,
    id: string,
    data: UpdateTrustedContactInput
  ): Promise<TrustedContact | null>;
  delete(userId: string, id: string): Promise<TrustedContact | null>;
  markVerified(userId: string, id: string): Promise<TrustedContact | null>;
}

const NOT_FOUND_MESSAGE = 'Trusted contact not found';

export class TrustedContactService {
  constructor(private readonly repository: TrustedContactRepositoryLike) {}

  list(userId: string): Promise<TrustedContact[]> {
    return this.repository.findAll(userId);
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

  async verify(userId: string, id: string): Promise<TrustedContact> {
    const verified = await this.repository.markVerified(userId, id);
    if (!verified) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return verified;
  }
}
