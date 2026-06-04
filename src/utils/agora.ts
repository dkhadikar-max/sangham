import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

// Agora token generation (simplified — production uses RtcTokenBuilder from agora-token package)
export function generateAgoraChannelName(): string {
  return `sangham_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
}

export function getAgoraConfig() {
  return {
    appId: env.AGORA_APP_ID,
    // In production: use agora-token package to generate RTC tokens
    // token = RtcTokenBuilder.buildTokenWithUid(appId, certificate, channel, uid, role, expiry)
  };
}
