/**
 * CEP Storage Tests
 * Tests for CEP persistent storage functionality
 */

import { CEPStorage, cepStorage } from '../../../lib/storage/cep-storage';
import { mockStorageSuccess, mockStorageError } from '../../test-utils';

describe('CEPStorage', () => {
  let storage: CEPStorage;
  let mockCEP: any;

  beforeEach(() => {
    storage = new CEPStorage({ namespace: 'test', version: '1.0' });
    mockCEP = (window as any).cep;
    mockStorageSuccess();
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      const defaultStorage = new CEPStorage();
      expect(defaultStorage).toBeInstanceOf(CEPStorage);
    });

    it('should create instance with custom options', () => {
      const customStorage = new CEPStorage({
        namespace: 'custom',
        version: '2.0',
      });
      expect(customStorage).toBeInstanceOf(CEPStorage);
    });
  });

  describe('setItem', () => {
    it('should store data successfully with CEP', async () => {
      const testData = { key: 'value', number: 42 };

      await storage.setItem('test-key', testData);

      expect(mockCEP.fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test.1.0.test-key.json'),
        JSON.stringify(testData),
        expect.any(Function)
      );
    });

    it('should fallback to localStorage when CEP is not available', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      const testData = { key: 'value' };
      await storage.setItem('test-key', testData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'test.1.0.test-key',
        JSON.stringify(testData)
      );

      // Restore CEP
      (window as any).cep = originalCEP;
    });

    it('should handle storage errors', async () => {
      mockStorageError('Write failed');

      await expect(
        storage.setItem('test-key', { data: 'test' })
      ).rejects.toThrow('Storage error: Error: Write failed');
    });

    it('should handle serialization errors', async () => {
      const circularData = {};
      (circularData as any).self = circularData;

      await expect(storage.setItem('test-key', circularData)).rejects.toThrow(
        'Storage error:'
      );
    });
  });

  describe('getItem', () => {
    it('should retrieve data successfully with CEP', async () => {
      const testData = { key: 'value', number: 42 };
      mockCEP.fs.readFile.mockImplementation(
        (path: string, callback: Function) => {
          callback(null, JSON.stringify(testData));
        }
      );

      const result = await storage.getItem('test-key');

      expect(result).toEqual(testData);
      expect(mockCEP.fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test.1.0.test-key.json'),
        expect.any(Function)
      );
    });

    it('should return default value when file not found', async () => {
      mockCEP.fs.readFile.mockImplementation(
        (path: string, callback: Function) => {
          callback({ err: 2 }); // File not found error
        }
      );

      const defaultValue = { default: true };
      const result = await storage.getItem('nonexistent-key', defaultValue);

      expect(result).toEqual(defaultValue);
    });

    it('should return null when no default value provided and file not found', async () => {
      mockCEP.fs.readFile.mockImplementation(
        (path: string, callback: Function) => {
          callback({ err: 2 }); // File not found error
        }
      );

      const result = await storage.getItem('nonexistent-key');

      expect(result).toBeNull();
    });

    it('should fallback to localStorage when CEP is not available', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      const testData = { key: 'value' };
      (localStorage.getItem as jest.Mock).mockReturnValue(
        JSON.stringify(testData)
      );

      const result = await storage.getItem('test-key');

      expect(result).toEqual(testData);
      expect(localStorage.getItem).toHaveBeenCalledWith('test.1.0.test-key');

      // Restore CEP
      (window as any).cep = originalCEP;
    });

    it('should handle read errors', async () => {
      mockStorageError('Read failed');

      const result = await storage.getItem('test-key', { default: true });

      expect(result).toEqual({ default: true });
    });

    it('should handle JSON parsing errors', async () => {
      mockCEP.fs.readFile.mockImplementation(
        (path: string, callback: Function) => {
          callback(null, 'invalid json');
        }
      );

      const result = await storage.getItem('test-key', { default: true });

      expect(result).toEqual({ default: true });
    });
  });

  describe('removeItem', () => {
    it('should remove data successfully with CEP', async () => {
      await storage.removeItem('test-key');

      expect(mockCEP.fs.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('test.1.0.test-key.json'),
        expect.any(Function)
      );
    });

    it('should fallback to localStorage when CEP is not available', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      await storage.removeItem('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('test.1.0.test-key');

      // Restore CEP
      (window as any).cep = originalCEP;
    });

    it('should handle file not found errors gracefully', async () => {
      mockCEP.fs.deleteFile.mockImplementation(
        (path: string, callback: Function) => {
          callback({ err: 2 }); // File not found error
        }
      );

      // Should not throw
      await expect(
        storage.removeItem('nonexistent-key')
      ).resolves.toBeUndefined();
    });

    it('should handle other delete errors', async () => {
      mockCEP.fs.deleteFile.mockImplementation(
        (path: string, callback: Function) => {
          callback(new Error('Delete failed'));
        }
      );

      await expect(storage.removeItem('test-key')).rejects.toThrow(
        'Storage error: Error: Delete failed'
      );
    });
  });

  describe('clear', () => {
    it('should clear all data for namespace with CEP', async () => {
      const mockFiles = [
        'test.1.0.key1.json',
        'test.1.0.key2.json',
        'other.1.0.key3.json',
      ];
      mockCEP.fs.readdir.mockImplementation(
        (path: string, callback: Function) => {
          callback(null, mockFiles);
        }
      );

      await storage.clear();

      expect(mockCEP.fs.deleteFile).toHaveBeenCalledTimes(2); // Only test.1.0.* files
      expect(mockCEP.fs.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('test.1.0.key1.json'),
        expect.any(Function)
      );
      expect(mockCEP.fs.deleteFile).toHaveBeenCalledWith(
        expect.stringContaining('test.1.0.key2.json'),
        expect.any(Function)
      );
    });

    it('should handle directory not found gracefully', async () => {
      mockCEP.fs.readdir.mockImplementation(
        (path: string, callback: Function) => {
          callback(new Error('Directory not found'));
        }
      );

      // Should not throw
      await expect(storage.clear()).resolves.toBeUndefined();
    });

    it('should fallback to localStorage when CEP is not available', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      // Mock localStorage.key to return test keys
      (localStorage.key as jest.Mock)
        .mockReturnValueOnce('test.1.0.key1')
        .mockReturnValueOnce('test.1.0.key2')
        .mockReturnValueOnce('other.1.0.key3')
        .mockReturnValueOnce(null);

      Object.defineProperty(localStorage, 'length', { value: 3 });

      await storage.clear();

      expect(localStorage.removeItem).toHaveBeenCalledWith('test.1.0.key1');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test.1.0.key2');
      expect(localStorage.removeItem).not.toHaveBeenCalledWith(
        'other.1.0.key3'
      );

      // Restore CEP
      (window as any).cep = originalCEP;
    });
  });

  describe('getAllKeys', () => {
    it('should get all keys for namespace with CEP', async () => {
      const mockFiles = [
        'test.1.0.key1.json',
        'test.1.0.key2.json',
        'other.1.0.key3.json',
      ];
      mockCEP.fs.readdir.mockImplementation(
        (path: string, callback: Function) => {
          callback(null, mockFiles);
        }
      );

      const keys = await storage.getAllKeys();

      expect(keys).toEqual(['key1', 'key2']);
    });

    it('should return empty array when directory not found', async () => {
      mockCEP.fs.readdir.mockImplementation(
        (path: string, callback: Function) => {
          callback(new Error('Directory not found'));
        }
      );

      const keys = await storage.getAllKeys();

      expect(keys).toEqual([]);
    });

    it('should fallback to localStorage when CEP is not available', async () => {
      // Temporarily remove CEP
      const originalCEP = (window as any).cep;
      delete (window as any).cep;

      (localStorage.key as jest.Mock)
        .mockReturnValueOnce('test.1.0.key1')
        .mockReturnValueOnce('test.1.0.key2')
        .mockReturnValueOnce('other.1.0.key3')
        .mockReturnValueOnce(null);

      Object.defineProperty(localStorage, 'length', { value: 3 });

      const keys = await storage.getAllKeys();

      expect(keys).toEqual(['key1', 'key2']);

      // Restore CEP
      (window as any).cep = originalCEP;
    });
  });

  describe('Singleton Instance', () => {
    it('should provide a singleton instance', () => {
      expect(cepStorage).toBeInstanceOf(CEPStorage);
    });

    it('should use the same instance across imports', () => {
      const {
        cepStorage: importedStorage,
      } = require('../../../lib/storage/cep-storage');
      expect(importedStorage).toBe(cepStorage);
    });
  });
});
