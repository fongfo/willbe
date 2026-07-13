import { HttpError } from '../shared/http-error';
import type { FamilyMemberModel as FamilyMember } from '../generated/prisma/models';
import type { CreateFamilyMemberInput, UpdateFamilyMemberInput } from './family-member.schema';

export interface FamilyMemberRepositoryLike {
  findAll(userId: string): Promise<FamilyMember[]>;
  findById(userId: string, id: string): Promise<FamilyMember | null>;
  create(userId: string, data: CreateFamilyMemberInput): Promise<FamilyMember>;
  update(
    userId: string,
    id: string,
    data: UpdateFamilyMemberInput
  ): Promise<FamilyMember | null>;
  delete(userId: string, id: string): Promise<FamilyMember | null>;
}

const NOT_FOUND_MESSAGE = 'Family member not found';

export class FamilyMemberService {
  constructor(private readonly repository: FamilyMemberRepositoryLike) {}

  list(userId: string): Promise<FamilyMember[]> {
    return this.repository.findAll(userId);
  }

  async getById(userId: string, id: string): Promise<FamilyMember> {
    const member = await this.repository.findById(userId, id);
    if (!member) {
      throw new HttpError(404, NOT_FOUND_MESSAGE);
    }
    return member;
  }

  create(userId: string, input: CreateFamilyMemberInput): Promise<FamilyMember> {
    return this.repository.create(userId, input);
  }

  async update(
    userId: string,
    id: string,
    input: UpdateFamilyMemberInput
  ): Promise<FamilyMember> {
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
}
