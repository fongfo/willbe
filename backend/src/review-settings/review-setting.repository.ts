import { prisma } from '../db/client';
import type { ReviewSettingModel as ReviewSetting } from '../generated/prisma/models';
import type { UpdateReviewSettingInput } from './review-setting.schema';

// `ReviewSetting` is a singleton (one global row, no per-user scoping yet), so the
// repository exposes get/upsert rather than the usual id-keyed CRUD.
export class ReviewSettingRepository {
  get(): Promise<ReviewSetting | null> {
    return prisma.reviewSetting.findFirst();
  }

  async upsert(data: UpdateReviewSettingInput): Promise<ReviewSetting> {
    const existing = await prisma.reviewSetting.findFirst();
    if (existing) {
      return prisma.reviewSetting.update({ where: { id: existing.id }, data });
    }
    return prisma.reviewSetting.create({ data });
  }
}
