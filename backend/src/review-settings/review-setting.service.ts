import { CheckInFrequency } from '../generated/prisma/enums';
import type { CloudProvider } from '../generated/prisma/enums';
import type { ReviewSettingModel as ReviewSetting } from '../generated/prisma/models';
import type { UpdateReviewSettingInput } from './review-setting.schema';

// Shape returned by `get()` before the singleton has ever been saved. The persisted
// `ReviewSetting` is a superset (adds id/timestamps), so both satisfy the API consumer.
export interface ReviewSettingView {
  checkInFrequency: CheckInFrequency;
  connectedProviders: CloudProvider[];
}

export interface ReviewSettingRepositoryLike {
  get(userId: string): Promise<ReviewSetting | null>;
  upsert(userId: string, data: UpdateReviewSettingInput): Promise<ReviewSetting>;
}

const DEFAULT_SETTING: ReviewSettingView = {
  checkInFrequency: CheckInFrequency.EVERY_6_MONTHS,
  connectedProviders: []
};

export class ReviewSettingService {
  constructor(private readonly repository: ReviewSettingRepositoryLike) {}

  async get(userId: string): Promise<ReviewSetting | ReviewSettingView> {
    const setting = await this.repository.get(userId);
    return setting ?? DEFAULT_SETTING;
  }

  save(userId: string, input: UpdateReviewSettingInput): Promise<ReviewSetting> {
    return this.repository.upsert(userId, input);
  }
}
