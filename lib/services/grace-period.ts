import { addDays, differenceInDays, isAfter } from 'date-fns';

export const GRACE_PERIOD_DAYS = 7;

export interface GracePeriodInfo {
  isInGracePeriod: boolean;
  gracePeriodEndsAt: Date | null;
  daysRemaining: number;
  hoursRemaining: number;
}

export function calculateGracePeriod(userCreatedAt: Date | string): GracePeriodInfo {
  const createdDate = new Date(userCreatedAt);
  const gracePeriodEndsAt = addDays(createdDate, GRACE_PERIOD_DAYS);
  const now = new Date();
  
  const isInGracePeriod = !isAfter(now, gracePeriodEndsAt);
  const daysRemaining = Math.max(0, differenceInDays(gracePeriodEndsAt, now));
  const hoursRemaining = Math.max(0, Math.floor((gracePeriodEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return {
    isInGracePeriod,
    gracePeriodEndsAt: isInGracePeriod ? gracePeriodEndsAt : null,
    daysRemaining,
    hoursRemaining,
  };
}

export function shouldShowGracePeriodBanner(gracePeriodInfo: GracePeriodInfo): boolean {
  // Show banner if in grace period and less than 3 days remaining
  return gracePeriodInfo.isInGracePeriod && gracePeriodInfo.daysRemaining <= 3;
}

export function getGracePeriodMessage(daysRemaining: number): string {
  if (daysRemaining === 0) {
    return 'Your free trial ends today!';
  } else if (daysRemaining === 1) {
    return 'Your free trial ends tomorrow!';
  } else {
    return `Your free trial ends in ${daysRemaining} days`;
  }
}

export function getGracePeriodUrgency(daysRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
  if (daysRemaining > 3) return 'low';
  if (daysRemaining > 1) return 'medium';
  if (daysRemaining === 1) return 'high';
  return 'critical';
}