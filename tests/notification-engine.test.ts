import { describe, expect, it } from 'vitest';
import { buildMarketWatchNotifications, buildWeeklyDigestNotification, getEnabledNotificationChannels } from '@/lib/notification-engine';

describe('notification engine', () => {
  it('builds a market-watch alert notification', () => {
    const notification = buildMarketWatchNotifications({
      label: 'Main watchlist',
      headline: 'The market is opening up.',
      strongestMove: 'A competitor raised price by 8%.',
      status: 'opportunity',
    });

    expect(notification.title).toContain('upside');
    expect(notification.message).toContain('raised price');
  });

  it('builds a weekly digest notification with highlights', () => {
    const notification = buildWeeklyDigestNotification({
      label: 'Main watchlist',
      summary: 'Two market shifts were detected this week.',
      highlights: ['Competitor A dropped stock.', 'Competitor B raised price.'],
      status: 'watch',
    });

    expect(notification.title).toContain('weekly');
    expect(notification.message).toContain('Competitor A dropped stock.');
  });

  it('lists enabled premium notification channels in delivery order', () => {
    const channels = getEnabledNotificationChannels({
      inAppEnabled: true,
      emailEnabled: true,
      telegramEnabled: true,
      discordEnabled: false,
      pushEnabled: false,
    });

    expect(channels).toEqual(['in_app', 'email', 'telegram']);
  });
});
