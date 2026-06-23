import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export function generateAgoraChannelName(): string {
  return `sangham_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
}

export function getAgoraConfig() {
  return { appId: env.AGORA_APP_ID };
}

export function isAgoraConfigured(): boolean {
  return Boolean(env.AGORA_APP_ID && env.AGORA_APP_CERTIFICATE);
}

/**
 * Generates a short-lived RTC token for a specific channel + role.
 * Returns null when Agora credentials are not configured (env vars not set).
 */
export function generateRtcToken(channel: string, uid: number, role: 'host' | 'audience'): string | null {
  if (!env.AGORA_APP_ID || !env.AGORA_APP_CERTIFICATE) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { RtcTokenBuilder, RtcRole } = require('agora-token');
    const rtcRole = role === 'host' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    const expiry = Math.floor(Date.now() / 1000) + 3600; // 1-hour window
    return RtcTokenBuilder.buildTokenWithUid(
      env.AGORA_APP_ID,
      env.AGORA_APP_CERTIFICATE,
      channel,
      uid,
      rtcRole,
      expiry,
      expiry,
    ) as string;
  } catch {
    return null;
  }
}
