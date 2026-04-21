export type NotificationChannel = 'in_app' | 'email' | 'telegram' | 'discord' | 'push';

export function buildRealtimeNotifications(items: string[]) {
  return items.map((message, index) => ({
    id: `notif-${index + 1}`,
    title: index === 0 ? 'Recommended next step' : 'Growth insight',
    message,
  }));
}

export function getEnabledNotificationChannels(params: {
  inAppEnabled?: boolean;
  emailEnabled?: boolean;
  telegramEnabled?: boolean;
  discordEnabled?: boolean;
  pushEnabled?: boolean;
}): NotificationChannel[] {
  return [
    params.inAppEnabled !== false ? 'in_app' : null,
    params.emailEnabled ? 'email' : null,
    params.telegramEnabled ? 'telegram' : null,
    params.discordEnabled ? 'discord' : null,
    params.pushEnabled ? 'push' : null,
  ].filter((item): item is NotificationChannel => Boolean(item));
}

export function buildMarketWatchNotifications(params: {
  label?: string | null;
  headline: string;
  strongestMove: string;
  status: 'opportunity' | 'watch' | 'risk';
}) {
  const label = params.label?.trim() || 'Market watch';
  const title = params.status === 'opportunity'
    ? `${label}: upside alert`
    : params.status === 'risk'
      ? `${label}: risk alert`
      : `${label}: watch update`;

  return {
    title,
    message: `${params.headline} ${params.strongestMove}`.trim(),
  };
}

export function buildWeeklyDigestNotification(params: {
  label?: string | null;
  summary: string;
  highlights: string[];
  status: 'opportunity' | 'watch' | 'risk';
}) {
  const label = params.label?.trim() || 'Market watch';
  const title = params.status === 'opportunity'
    ? `${label}: weekly upside digest`
    : params.status === 'risk'
      ? `${label}: weekly risk digest`
      : `${label}: weekly market digest`;

  const message = [params.summary, ...params.highlights.slice(0, 3).map((item) => `• ${item}`)].join(' ');

  return { title, message };
}
