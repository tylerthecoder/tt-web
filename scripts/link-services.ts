import { $ } from 'bun';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to switch tt-services dependency back to local linked version
 * Usage: npm run link-services
 */

const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const LOCAL_LINK_VERSION = 'link:tt-services';

async function linkServices() {
  try {
    console.log('🔗 Switching tt-services to local linked version...');

    // Read current package.json
    const packageJsonContent = fs.readFileSync(PACKAGE_JSON_PATH, 'utf8');
    const packageJson = JSON.parse(packageJsonContent);

    // Check current version
    const currentVersion = packageJson.dependencies?.['tt-services'];
    if (!currentVersion) {
      console.error('❌ tt-services dependency not found in package.json');
      process.exit(1);
    }

    console.log(`📦 Current tt-services version: ${currentVersion}`);

    // Check if already linked
    if (currentVersion === LOCAL_LINK_VERSION) {
      console.log('✅ tt-services is already using local linked version');
      return;
    }

    // Update to linked version
    packageJson.dependencies['tt-services'] = LOCAL_LINK_VERSION;

    // Write back to file with proper formatting
    const updatedContent = JSON.stringify(packageJson, null, 2) + '\n';
    fs.writeFileSync(PACKAGE_JSON_PATH, updatedContent);

    console.log(`✅ Successfully switched tt-services to: ${LOCAL_LINK_VERSION}`);

    // Run bun install
    await $`bun install`;
  } catch (error) {
    console.error('❌ Error updating package.json:', error);
    process.exit(1);
  }
}

// Run the script
linkServices();
