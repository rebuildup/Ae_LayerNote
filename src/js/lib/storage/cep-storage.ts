/**
 * CEP Persistent Storage Utility
 * Provides a simple interface for storing and retrieving data in CEP extensions
 */

export interface StorageOptions {
  namespace?: string;
  version?: string;
}

class CEPStorage {
  private namespace: string;
  private version: string;

  constructor(options: StorageOptions = {}) {
    this.namespace = options.namespace || 'ae-code-editor';
    this.version = options.version || '1.0';
  }

  private getKey(key: string): string {
    return `${this.namespace}.${this.version}.${key}`;
  }

  /**
   * Store data in CEP persistent storage
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const storageKey = this.getKey(key);

      if (window.cep && window.cep.fs) {
        // Use CEP file system for persistence
        const result = await new Promise<any>((resolve, reject) => {
          window.cep.fs.writeFile(
            this.getStorageFilePath(storageKey),
            serializedValue,
            (err: any, data: any) => {
              if (err) reject(err);
              else resolve(data);
            }
          );
        });
        return result;
      } else {
        // Fallback to localStorage for development
        localStorage.setItem(storageKey, serializedValue);
      }
    } catch (error) {
      console.error('Failed to store data:', error);
      throw new Error(`Storage error: ${error}`);
    }
  }

  /**
   * Retrieve data from CEP persistent storage
   */
  async getItem<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      const storageKey = this.getKey(key);

      if (window.cep && window.cep.fs) {
        // Use CEP file system for persistence
        const result = await new Promise<string>((resolve, reject) => {
          window.cep.fs.readFile(
            this.getStorageFilePath(storageKey),
            (err: any, data: string) => {
              if (err) {
                if (err.err === 2) {
                  // File not found
                  resolve('null');
                } else {
                  reject(err);
                }
              } else {
                resolve(data);
              }
            }
          );
        });

        if (result === 'null' || result === '') {
          return defaultValue || null;
        }

        return JSON.parse(result) as T;
      } else {
        // Fallback to localStorage for development
        const item = localStorage.getItem(storageKey);
        if (item === null) {
          return defaultValue || null;
        }
        return JSON.parse(item) as T;
      }
    } catch (error) {
      console.error('Failed to retrieve data:', error);
      return defaultValue || null;
    }
  }

  /**
   * Remove data from CEP persistent storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      const storageKey = this.getKey(key);

      if (window.cep && window.cep.fs) {
        // Use CEP file system
        await new Promise<void>((resolve, reject) => {
          window.cep.fs.deleteFile(
            this.getStorageFilePath(storageKey),
            (err: any) => {
              if (err && err.err !== 2) {
                // Ignore "file not found" errors
                reject(err);
              } else {
                resolve();
              }
            }
          );
        });
      } else {
        // Fallback to localStorage
        localStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error('Failed to remove data:', error);
      throw new Error(`Storage error: ${error}`);
    }
  }

  /**
   * Clear all data for this namespace
   */
  async clear(): Promise<void> {
    try {
      if (window.cep && window.cep.fs) {
        // List and delete all files in storage directory
        const storageDir = this.getStorageDirectory();
        await new Promise<void>(resolve => {
          window.cep.fs.readdir(storageDir, (err: any, files: string[]) => {
            if (err) {
              resolve(); // ディレクトリがない場合は何もしない
              return;
            }

            const targets = files.filter(file =>
              file.startsWith(`${this.namespace}.${this.version}.`)
            );

            const deletions = targets.map(
              file =>
                new Promise<void>(deleteResolve => {
                  window.cep.fs.deleteFile(`${storageDir}/${file}`,(deleteErr: any) => {
                    // clear はベストエフォート。エラーでも続行
                    deleteResolve();
                  });
                })
            );

            Promise.allSettled(deletions).then(() => resolve());
          });
        });
      } else {
        // Fallback to localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(`${this.namespace}.${this.version}.`)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw new Error(`Storage error: ${error}`);
    }
  }

  /**
   * Get all keys for this namespace
   */
  async getAllKeys(): Promise<string[]> {
    try {
      if (window.cep && window.cep.fs) {
        const storageDir = this.getStorageDirectory();
        return new Promise<string[]>((resolve, _reject) => {
          window.cep.fs.readdir(storageDir, (err: any, files: string[]) => {
            if (err) {
              resolve([]);
              return;
            }

            const keys = files
              .filter(file =>
                file.startsWith(`${this.namespace}.${this.version}.`)
              )
              .map(file => {
                const withoutPrefix = file.replace(
                  `${this.namespace}.${this.version}.`,
                  ''
                );
                return withoutPrefix.replace(/\.json$/i, '');
              });

            resolve(keys);
          });
        });
      } else {
        // Fallback to localStorage
        const keys: string[] = [];
        const prefix = `${this.namespace}.${this.version}.`;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            keys.push(key.replace(prefix, ''));
          }
        }
        return keys;
      }
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  private getStorageDirectory(): string {
    // Use CEP extension data directory
    if (window.cep && window.cep.fs) {
      return `${window.cep.fs.getDataFolder()}/storage`;
    }
    return '';
  }

  private getStorageFilePath(key: string): string {
    return `${this.getStorageDirectory()}/${key}.json`;
  }
}

// Create singleton instance
export const cepStorage = new CEPStorage();

// Export class for custom instances
export { CEPStorage };
