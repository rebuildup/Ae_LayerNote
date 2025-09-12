// Lightweight FS bridge over CEP

// type Callback<T = any> = (err: any, data?: T) => void; // not used

const cepFs: any =
  (typeof window !== 'undefined' && (window as any).cep?.fs) || null;

const join = (a: string, b: string) =>
  a.endsWith('/') || a.endsWith('\\') ? a + b : a + '/' + b;

export const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-zA-Z0-9-_\s\.]/g, '_');

export const fsBridge = {
  async readdir(dir: string): Promise<string[]> {
    if (!cepFs) return [];
    return new Promise((resolve, reject) =>
      cepFs.readdir(dir, (err: any, files?: string[]) =>
        err ? reject(err) : resolve(files || [])
      )
    );
  },

  async selectFolder(
    dialogTitle: string = 'Select folder'
  ): Promise<string | null> {
    const fsAny: any = cepFs;
    if (!fsAny) return null;
    try {
      if (typeof fsAny.showOpenDialogEx === 'function') {
        const res = fsAny.showOpenDialogEx(true, true, dialogTitle, '', []);
        if (
          res &&
          res.err === 0 &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          return res.data[0];
        }
      } else if (typeof fsAny.showOpenDialog === 'function') {
        const res = fsAny.showOpenDialog(true);
        if (
          res &&
          res.err === 0 &&
          Array.isArray(res.data) &&
          res.data.length > 0
        ) {
          return res.data[0];
        }
      }
    } catch (e) {
      // swallow and return null to indicate no selection
      return null;
    }
    return null;
  },

  async readFile(path: string): Promise<string> {
    if (!cepFs) return '';
    return new Promise((resolve, reject) =>
      cepFs.readFile(path, (err: any, data?: string) =>
        err ? reject(err) : resolve(data || '')
      )
    );
  },

  async writeFile(path: string, data: string): Promise<void> {
    if (!cepFs) return;
    return new Promise((resolve, reject) =>
      cepFs.writeFile(path, data, (err: any) => (err ? reject(err) : resolve()))
    );
  },

  async deletePath(path: string): Promise<void> {
    if (!cepFs) return;
    return new Promise((resolve, reject) =>
      cepFs.deleteFile(path, (err: any) => (err ? reject(err) : resolve()))
    );
  },

  async makeDir(dirPath: string): Promise<void> {
    // Some CEP builds expose makedir; otherwise create a placeholder file then delete
    if (cepFs?.makedir) {
      return new Promise((resolve, reject) =>
        cepFs.makedir(dirPath, (err: any) => (err ? reject(err) : resolve()))
      );
    }
    // Fallback: create .keep file to force folder creation if available in env
    await fsBridge.writeFile(join(dirPath, '.keep'), '');
    await fsBridge.deletePath(join(dirPath, '.keep'));
  },

  join,
};
