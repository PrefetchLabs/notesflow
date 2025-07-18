// Import package.json
// This ensures version is available in all environments without needing env vars
import packageJson from '../../package.json';

// Export formatted version string
export const APP_VERSION = `v${packageJson.version}`;

// Export raw version for other uses
export const VERSION = packageJson.version;

// Semantic version parts
const [major, minor, patch] = packageJson.version.split('.');
export const VERSION_PARTS = {
  major: parseInt(major) || 0,
  minor: parseInt(minor) || 0,
  patch: parseInt(patch) || 0,
};