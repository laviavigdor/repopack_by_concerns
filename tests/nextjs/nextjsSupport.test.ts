import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { generateNextJSRepopacks } from '../../src/nextjs/nextjsSupport.js';

// Mock the modules
vi.mock('globby');
vi.mock('../../src/core/packager.js');

describe('nextjsSupport', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'repopack-test-'));
    
    // Mock the globby function
    vi.mocked(await import('globby')).globby.mockImplementation((pattern: string) => {
      if (pattern.includes('!(app)')) return Promise.resolve(['src/utils/helper.ts']);
      if (pattern.includes('route')) return Promise.resolve(['src/app/api/users/route.ts']);
      if (pattern.includes('page')) return Promise.resolve(['src/app/home/page.tsx']);
      if (pattern.includes('layout')) return Promise.resolve(['src/app/layout.tsx']);
      return Promise.resolve(['src/utils/helper.ts', 'src/app/api/users/route.ts', 'src/app/home/page.tsx', 'src/app/layout.tsx']);
    });
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.resetAllMocks();
  });

  it('should generate repopacks for NextJS 13+ project', async () => {
    await generateNextJSRepopacks({ rootDir: tempDir, outputDir: tempDir });

    const globbyMock = vi.mocked(await import('globby')).globby;
    expect(globbyMock).toHaveBeenCalledTimes(5);
    expect(globbyMock).toHaveBeenCalledWith('src/**/!(app)/**/*', expect.anything());
    expect(globbyMock).toHaveBeenCalledWith('src/app/**/route.{ts,js}', expect.anything());
    expect(globbyMock).toHaveBeenCalledWith('src/app/**/page.{tsx,js}', expect.anything());
    expect(globbyMock).toHaveBeenCalledWith('src/app/**/layout.{tsx,js}', expect.anything());
    expect(globbyMock).toHaveBeenCalledWith('src/**/*', expect.anything());

    const packMock = vi.mocked(await import('../../src/core/packager.js')).pack;
    expect(packMock).toHaveBeenCalledTimes(5);
    expect(packMock).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      output: { filePath: path.join(tempDir, 'repopack-common.txt'), headerText: expect.any(String) },
      include: ['src/utils/helper.ts'],
    }));
    expect(packMock).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      output: { filePath: path.join(tempDir, 'repopack-api-routes.txt'), headerText: expect.any(String) },
      include: ['src/app/api/users/route.ts', 'src/utils/helper.ts'],
    }));
    expect(packMock).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      output: { filePath: path.join(tempDir, 'repopack-pages.txt'), headerText: expect.any(String) },
      include: ['src/app/home/page.tsx', 'src/utils/helper.ts'],
    }));
    expect(packMock).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      output: { filePath: path.join(tempDir, 'repopack-layouts.txt'), headerText: expect.any(String) },
      include: ['src/app/layout.tsx', 'src/utils/helper.ts'],
    }));
    expect(packMock).toHaveBeenCalledWith(tempDir, expect.objectContaining({
      output: { filePath: path.join(tempDir, 'repopack-all.txt'), headerText: expect.any(String) },
      include: ['src/utils/helper.ts', 'src/app/api/users/route.ts', 'src/app/home/page.tsx', 'src/app/layout.tsx'],
    }));
  });
});