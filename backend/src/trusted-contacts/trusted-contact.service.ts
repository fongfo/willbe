import { HttpError } from '../shared/http-error';
import type { TrustedContactModel as TrustedContact } from '../generated/prisma/models';
import type {
  CreateTrustedContactInput,
  UpdateTrustedContactInput
} from './trusted-contact.schema';

export interface TrustedContactRepositoryLike {
  findAll(): Promise<TrustedContact[]>;
  findById(id: string): Promise<TrustedContact | null>;
  create(data: CreateTrustedContactInput): Promise<TrustedContact>;
  update(id: string, data: UpdateTrustedContactInput): Promise<TrustedContact | null>;
  delete(id: string): Promise<TrustedContact | null>;
  markVerified(id: string): Promise<TrustedContact | null>;
}

const NOT_FOUND_MESSAGE = 'Trusted contact not found';

export class TrustedContactService {
  constructor(private readonly repository: TrustedContactRepositoryLike) {}

  list(): Promise<TrustedContact[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<TrustedContact> {
    const contact = await this.repository.findById(id);
    if (!contact) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return contact;
  }

  create(input: CreateTrustedContactInput): Promise<TrustedContact> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateTrustedContactInput): Promise<TrustedContact> {
    const updated = await this.repository.update(id, input);
    if (!updated) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
  }

  async verify(id: string): Promise<TrustedContact> {
    const verified = await this.repository.markVerified(id);
    if (!verified) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return verified;
  }
}
