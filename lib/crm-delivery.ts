import { getNotificationSettings } from '@/lib/growth-config';
import { getEnabledNotificationChannels, type NotificationChannel } from '@/lib/notification-engine';
import { supabaseAdmin } from '@/lib/supabase-admin';

type DeliveryProvider = 'none' | 'resend' | 'sendgrid' | 'smtp';
type NotificationSettings = Awaited<ReturnType<typeof getNotificationSettings>>;

type DeliveryTarget = {
  channel: NotificationChannel;
  enabled: boolean;
  ready: boolean;
  label: string;
  target: string | null;
  reason: string | null;
};

function getProvider(env = process.env): DeliveryProvider {
  if (env.RESEND_API_KEY) return 'resend';
  if (env.SENDGRID_API_KEY) return 'sendgrid';
  if (env.SMTP_HOST) return 'smtp';
  return 'none';
}

function normalizeTarget(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function maskTarget(value?: string | null) {
  const trimmed = normalizeTarget(value);
  if (!trimmed) return null;
  if (trimmed.includes('@')) {
    const [local, domain] = trimmed.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  }
  return trimmed.length > 18 ? `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}` : trimmed;
}

export function getNotificationDeliveryTargets(settings: NotificationSettings, env = process.env): DeliveryTarget[] {
  const emailProvider = getProvider(env);
  const enabledChannels = new Set(getEnabledNotificationChannels(settings));
  const emailTarget = normalizeTarget(settings.alertEmailAddress || env.NOTIFICATION_EMAIL_TO || env.ALERT_EMAIL_TO);
  const telegramChatId = normalizeTarget(settings.telegramChatId || env.TELEGRAM_CHAT_ID);
  const discordWebhookUrl = normalizeTarget(settings.discordWebhookUrl || env.DISCORD_WEBHOOK_URL);

  return [
    {
      channel: 'in_app',
      enabled: enabledChannels.has('in_app'),
      ready: enabledChannels.has('in_app'),
      label: 'In-app',
      target: null,
      reason: enabledChannels.has('in_app') ? null : 'Disabled in settings.',
    },
    {
      channel: 'email',
      enabled: enabledChannels.has('email'),
      ready: enabledChannels.has('email') && Boolean(emailTarget) && (emailProvider === 'resend' || emailProvider === 'sendgrid'),
      label: 'Email',
      target: maskTarget(emailTarget),
      reason: !enabledChannels.has('email')
        ? 'Disabled in settings.'
        : !emailTarget
          ? 'Missing alert email address.'
          : emailProvider === 'none'
            ? 'Missing email provider environment variables.'
            : emailProvider === 'smtp'
              ? 'SMTP env detected but adapter transport is not wired yet.'
              : null,
    },
    {
      channel: 'telegram',
      enabled: enabledChannels.has('telegram'),
      ready: enabledChannels.has('telegram') && Boolean(env.TELEGRAM_BOT_TOKEN) && Boolean(telegramChatId),
      label: 'Telegram',
      target: maskTarget(telegramChatId),
      reason: !enabledChannels.has('telegram')
        ? 'Disabled in settings.'
        : !env.TELEGRAM_BOT_TOKEN
          ? 'Missing TELEGRAM_BOT_TOKEN.'
          : !telegramChatId
            ? 'Missing Telegram chat ID.'
            : null,
    },
    {
      channel: 'discord',
      enabled: enabledChannels.has('discord'),
      ready: enabledChannels.has('discord') && Boolean(discordWebhookUrl),
      label: 'Discord',
      target: maskTarget(discordWebhookUrl),
      reason: !enabledChannels.has('discord')
        ? 'Disabled in settings.'
        : !discordWebhookUrl
          ? 'Missing Discord webhook URL.'
          : null,
    },
    {
      channel: 'push',
      enabled: enabledChannels.has('push'),
      ready: false,
      label: 'Push',
      target: null,
      reason: !enabledChannels.has('push') ? 'Disabled in settings.' : 'Push adapter is planned next.',
    },
  ];
}

async function ensureResponseOk(channel: 'email' | 'telegram' | 'discord', response: Response) {
  if (response.ok) return;
  const details = await response.text().catch(() => 'Unknown provider error');
  throw new Error(`${channel} delivery failed: ${details.slice(0, 240)}`);
}

async function sendEmailNotification(provider: DeliveryProvider, settings: NotificationSettings, title: string, message: string) {
  const to = normalizeTarget(settings.alertEmailAddress || process.env.NOTIFICATION_EMAIL_TO || process.env.ALERT_EMAIL_TO);
  const from = process.env.NOTIFICATION_EMAIL_FROM || 'alerts@ufrev.com';

  if (provider === 'resend') {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: title,
        text: message,
      }),
    });
    await ensureResponseOk('email', response);
    return;
  }

  if (provider === 'sendgrid') {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: title,
        content: [{ type: 'text/plain', value: message }],
      }),
    });
    await ensureResponseOk('email', response);
    return;
  }

  throw new Error('Email provider is not configured for direct dispatch.');
}

async function sendTelegramNotification(settings: NotificationSettings, title: string, message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = normalizeTarget(settings.telegramChatId || process.env.TELEGRAM_CHAT_ID);
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: `${title}\n${message}`.trim(),
    }),
  });
  await ensureResponseOk('telegram', response);
}

async function sendDiscordNotification(settings: NotificationSettings, title: string, message: string) {
  const webhookUrl = normalizeTarget(settings.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL);
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: `**${title}**\n${message}`.trim() }),
  });
  await ensureResponseOk('discord', response);
}

export async function dispatchQueuedNotifications(limit = 25) {
  const provider = getProvider();
  const settings = await getNotificationSettings();
  const routing = getNotificationDeliveryTargets(settings);
  const { data: queued } = await supabaseAdmin
    .from('notification_events')
    .select('id, user_id, channel, title, message, status')
    .eq('status', 'queued')
    .limit(limit);

  const results: Array<{
    id: string;
    status: string;
    provider: DeliveryProvider;
    sentChannels: NotificationChannel[];
    failedChannels: Array<{ channel: NotificationChannel; error: string }>;
    skippedChannels: Array<{ channel: NotificationChannel; reason: string }>;
  }> = [];

  for (const item of queued || []) {
    const sentChannels: NotificationChannel[] = [];
    const failedChannels: Array<{ channel: NotificationChannel; error: string }> = [];
    const skippedChannels = routing
      .filter((target) => target.enabled && !target.ready)
      .map((target) => ({ channel: target.channel, reason: target.reason || 'Channel not ready.' }));

    if (routing.some((target) => target.channel === 'email' && target.ready)) {
      try {
        await sendEmailNotification(provider, settings, item.title || 'Notification', item.message || '');
        sentChannels.push('email');
      } catch (error: any) {
        failedChannels.push({ channel: 'email', error: error?.message || 'Email dispatch failed.' });
      }
    }

    if (routing.some((target) => target.channel === 'telegram' && target.ready)) {
      try {
        await sendTelegramNotification(settings, item.title || 'Notification', item.message || '');
        sentChannels.push('telegram');
      } catch (error: any) {
        failedChannels.push({ channel: 'telegram', error: error?.message || 'Telegram dispatch failed.' });
      }
    }

    if (routing.some((target) => target.channel === 'discord' && target.ready)) {
      try {
        await sendDiscordNotification(settings, item.title || 'Notification', item.message || '');
        sentChannels.push('discord');
      } catch (error: any) {
        failedChannels.push({ channel: 'discord', error: error?.message || 'Discord dispatch failed.' });
      }
    }

    if (routing.some((target) => target.channel === 'in_app' && target.enabled)) {
      sentChannels.push('in_app');
    }

    const nextStatus = failedChannels.length
      ? (sentChannels.length ? 'sent_partial' : 'delivery_failed')
      : skippedChannels.length
        ? (sentChannels.length ? 'sent_partial' : 'ready_no_provider')
        : sentChannels.length
          ? 'sent'
          : 'ready_no_provider';

    await supabaseAdmin.from('notification_events').update({ status: nextStatus }).eq('id', item.id);
    await supabaseAdmin.from('crm_events').insert({
      user_id: item.user_id,
      event_type: nextStatus === 'sent'
        ? 'delivery_sent'
        : nextStatus === 'sent_partial'
          ? 'delivery_partial'
          : nextStatus === 'delivery_failed'
            ? 'delivery_failed'
            : 'delivery_pending_provider',
      payload: {
        provider,
        notification_id: item.id,
        title: item.title,
        message: item.message,
        sent_channels: sentChannels,
        failed_channels: failedChannels,
        skipped_channels: skippedChannels,
      },
    });
    results.push({ id: item.id, status: nextStatus, provider, sentChannels, failedChannels, skippedChannels });
  }

  return { provider, processed: results.length, results, routing };
}
