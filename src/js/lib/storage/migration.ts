/**
 * Data Migration Utilities
 * Handles migration of settings and data between different versions
 */

import {
  UserSettings,
  defaultUserSettings,
  validateSettings,
} from '../../types/settings';
import { cepStorage } from './cep-storage';

export interface MigrationResult {
  success: boolean;
  version: string;
  migratedData?: any;
  errors?: string[];
}

export class DataMigration {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly MIGRATION_KEY = 'migration_info';

  /**
   * Check if migration is needed
   */
  static async needsMigration(): Promise<boolean> {
    try {
      const migrationInfo = await cepStorage.getItem<{ version: string }>(
        this.MIGRATION_KEY
      );
      if (!migrationInfo) {
        return true; // First time setup
      }
      return migrationInfo.version !== this.CURRENT_VERSION;
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return true; // Assume migration needed on error
    }
  }

  /**
   * Perform data migration
   */
  static async migrate(): Promise<MigrationResult> {
    try {
      const migrationInfo = await cepStorage.getItem<{ version: string }>(
        this.MIGRATION_KEY
      );
      const currentVersion = migrationInfo?.version || '0.0.0';

      console.log(
        `Migrating from version ${currentVersion} to ${this.CURRENT_VERSION}`
      );

      let migratedData: any = {};
      const errors: string[] = [];

      // Migration from 0.0.0 (first install) to 1.0.0
      if (this.compareVersions(currentVersion, '1.0.0') < 0) {
        const result = await this.migrateToV1_0_0();
        if (!result.success) {
          errors.push(...(result.errors || []));
        } else {
          migratedData = { ...migratedData, ...result.migratedData };
        }
      }

      // Save migration info
      await cepStorage.setItem(this.MIGRATION_KEY, {
        version: this.CURRENT_VERSION,
        migratedAt: new Date().toISOString(),
        previousVersion: currentVersion,
      });

      return {
        success: errors.length === 0,
        version: this.CURRENT_VERSION,
        migratedData,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        version: this.CURRENT_VERSION,
        errors: [`Migration failed: ${error}`],
      };
    }
  }

  /**
   * Migration to version 1.0.0
   */
  private static async migrateToV1_0_0(): Promise<MigrationResult> {
    try {
      const migratedData: any = {};

      // Check for legacy editor config
      const legacyEditorConfig = await cepStorage.getItem('editorConfig');
      if (legacyEditorConfig) {
        console.log('Migrating legacy editor config');

        // Convert legacy config to new settings format
        const newSettings: Partial<UserSettings> = {
          editor: {
            ...defaultUserSettings.editor,
            ...(legacyEditorConfig as any),
          },
        };

        // Save new settings
        await cepStorage.setItem('userSettings', validateSettings(newSettings));

        // Remove legacy config
        await cepStorage.removeItem('editorConfig');

        migratedData.editorConfig = newSettings.editor;
      }

      // Check for legacy notes data
      const legacyNotes = await cepStorage.getItem('notes');
      if (legacyNotes) {
        console.log('Migrating legacy notes');

        // Notes format should be compatible, but validate structure
        if (Array.isArray(legacyNotes)) {
          await cepStorage.setItem('notes', legacyNotes);
          migratedData.notes = legacyNotes;
        }
      }

      // Initialize default settings if none exist
      const existingSettings =
        await cepStorage.getItem<UserSettings>('userSettings');
      if (!existingSettings) {
        console.log('Initializing default settings');
        await cepStorage.setItem('userSettings', defaultUserSettings);
        migratedData.settings = defaultUserSettings;
      }

      return {
        success: true,
        version: '1.0.0',
        migratedData,
      };
    } catch (error) {
      return {
        success: false,
        version: '1.0.0',
        errors: [`Failed to migrate to v1.0.0: ${error}`],
      };
    }
  }

  /**
   * Compare version strings
   */
  private static compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] || 0;
      const bPart = bParts[i] || 0;

      if (aPart < bPart) return -1;
      if (aPart > bPart) return 1;
    }

    return 0;
  }

  /**
   * Backup current data before migration
   */
  static async createBackup(): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupKey = `backup_${timestamp}`;

      // Get all current data
      const allKeys = await cepStorage.getAllKeys();
      const backupData: Record<string, any> = {};

      for (const key of allKeys) {
        backupData[key] = await cepStorage.getItem(key);
      }

      // Save backup
      await cepStorage.setItem(backupKey, {
        timestamp,
        data: backupData,
        version: this.CURRENT_VERSION,
      });

      console.log(`Backup created: ${backupKey}`);
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  /**
   * Clean up old backups (keep only last 5)
   */
  static async cleanupBackups(): Promise<void> {
    try {
      const allKeys = await cepStorage.getAllKeys();
      const backupKeys = allKeys
        .filter(key => key.startsWith('backup_'))
        .sort()
        .reverse(); // Most recent first

      // Remove old backups (keep only 5 most recent)
      const keysToRemove = backupKeys.slice(5);
      for (const key of keysToRemove) {
        await cepStorage.removeItem(key);
        console.log(`Removed old backup: ${key}`);
      }
    } catch (error) {
      console.error('Failed to cleanup backups:', error);
    }
  }
}
