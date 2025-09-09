/**
 * Map platform names to brand colors for icons
 */
export const SOCIAL_PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  GitHub: "#333",
  LinkedIn: "#0A66C2",
  Twitter: "#1DA1F2",
  YouTube: "#FF0000",
  Facebook: "#1877F3",
  Pinterest: "#E60023",
  Telegram: "#0088cc",
  Snapchat: "#FFFC00",
  TikTok: "#69C9D0",
  WhatsApp: "#25D366",
  Discord: "#7289DA",
  "Custom Link": "#6366F1",
};
/**
 * Social platform configuration and utilities
 */

// Import react-icons for social platforms
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaGithub,
  FaTwitter,
  FaPinterest,
  FaTelegramPlane,
  FaSnapchatGhost,
  FaTiktok,
  FaGlobe,
  FaExternalLinkAlt,
  FaWhatsapp,
  FaDiscord
} from "react-icons/fa";
import { IconType } from "react-icons";

/**
 * Map platform names to icon components
 */
export const SOCIAL_PLATFORM_ICONS: Record<string, IconType> = {
  Instagram: FaInstagram,
  GitHub: FaGithub,
  LinkedIn: FaLinkedinIn,
  Twitter: FaTwitter,
  YouTube: FaYoutube,
  Facebook: FaFacebookF,
  Pinterest: FaPinterest,
  Telegram: FaTelegramPlane,
  Snapchat: FaSnapchatGhost,
  TikTok: FaTiktok,
  WhatsApp: FaWhatsapp,
  Discord: FaDiscord,
  "Custom Link": FaExternalLinkAlt,
};

/**
 * Get the icon component for a social platform
 */
export function getSocialIcon(platform: string): IconType {
  return SOCIAL_PLATFORM_ICONS[platform] || FaGlobe;
}

export interface SocialPlatform {
  name: string;
  baseUrl: string;
  usernamePrefix?: string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatform> = {
  Instagram: {
    name: "Instagram",
    baseUrl: "https://instagram.com/",
    placeholder: "username",
  },
  GitHub: {
    name: "GitHub",
    baseUrl: "https://github.com/",
    placeholder: "username",
  },
  LinkedIn: {
    name: "LinkedIn",
    baseUrl: "https://linkedin.com/in/",
    placeholder: "username",
  },
  Twitter: {
    name: "Twitter",
    baseUrl: "https://x.com/",
    placeholder: "username",
  },
  YouTube: {
    name: "YouTube",
    baseUrl: "https://youtube.com/@",
    placeholder: "username",
  },
  Facebook: {
    name: "Facebook",
    baseUrl: "https://facebook.com/",
    placeholder: "username",
  },
  Pinterest: {
    name: "Pinterest",
    baseUrl: "https://pinterest.com/",
    placeholder: "username",
  },
  Snapchat: {
    name: "Snapchat",
    baseUrl: "https://snapchat.com/add/",
    placeholder: "username",
  },
  TikTok: {
    name: "TikTok",
    baseUrl: "https://tiktok.com/@",
    placeholder: "username",
  },
  Telegram: {
    name: "Telegram",
    baseUrl: "https://t.me/",
    placeholder: "username",
  },
  Discord: {
    name: "Discord",
    baseUrl: "https://discord.gg/",
    placeholder: "server-invite",
  },
  WhatsApp: {
    name: "WhatsApp",
    baseUrl: "https://wa.me/",
    placeholder: "phone-number",
  },
  "Custom Link": {
    name: "Custom Link",
    baseUrl: "",
    placeholder: "https://example.com",
  },
};

/**
 * Generate a social media link from platform and username
 */
export function generateSocialLink(platform: string, username: string): string {
  const platformConfig = SOCIAL_PLATFORMS[platform];

  if (!platformConfig) {
    return username.startsWith("http") ? username : `https://${username}`;
  }

  // For custom links, return the username as-is if it's a URL
  if (platform === "Custom Link") {
    return username.startsWith("http") ? username : `https://${username}`;
  }

  // For WhatsApp, handle phone numbers
  if (platform === "WhatsApp") {
    const cleanNumber = username.replace(/[^0-9]/g, "");
    return `${platformConfig.baseUrl}${cleanNumber}`;
  }

  // For all other platforms, combine base URL with username
  return `${platformConfig.baseUrl}${username}`;
}

/**
 * Extract username from a social media URL
 */
export function extractUsernameFromUrl(platform: string, url: string): string {
  const platformConfig = SOCIAL_PLATFORMS[platform];

  if (!platformConfig || platform === "Custom Link") {
    return url;
  }

  // Remove the base URL to get just the username
  if (url.startsWith(platformConfig.baseUrl)) {
    return url.replace(platformConfig.baseUrl, "");
  }

  // If it doesn't match the expected format, return as-is
  return url;
}

/**
 * Get all auto-syncable platforms (excludes WhatsApp, Discord, Custom Link)
 */
export function getAutoSyncablePlatforms(): string[] {
  return Object.keys(SOCIAL_PLATFORMS).filter(
    (platform) => !["WhatsApp", "Discord", "Custom Link"].includes(platform)
  );
}

/**
 * Check if a platform supports auto-sync with global username
 */
export function isPlatformAutoSyncable(platform: string): boolean {
  return getAutoSyncablePlatforms().includes(platform);
}

/**
 * Generate auto-synced social links for a global username
 */
export function generateAutoSyncedLinks(globalUsername: string): Array<{
  platform: string;
  username: string;
  url: string;
  is_auto_synced: boolean;
}> {
  return getAutoSyncablePlatforms().map((platform) => ({
    platform,
    username: globalUsername,
    url: generateSocialLink(platform, globalUsername),
    is_auto_synced: true,
  }));
}
