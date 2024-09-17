import fs from 'node:fs/promises';
import path from 'node:path';
import { globby } from 'globby';
import type { RepopackConfigFile } from '../config/configTypes.js';
import { pack } from '../core/packager.js';
import { logger } from '../shared/logger.js';

export interface NextJSRepopackOptions {
  rootDir: string;
  outputDir: string;
}

export async function generateNextJSRepopacks(options: NextJSRepopackOptions): Promise<void> {
  const { rootDir, outputDir } = options;

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Find common files
  const commonFiles = await globby('src/**/!(app)/**/*', { cwd: rootDir });

  // Generate repopack for common files
  await generateRepopack(rootDir, commonFiles, path.join(outputDir, 'repopack-common.txt'), 'Common files shared across all NextJS 13+ concerns');

  // Find and generate repopacks for API routes
  const apiRoutes = await globby('src/app/**/route.{ts,js}', { cwd: rootDir });
  await generateRepopack(rootDir, [...apiRoutes, ...commonFiles], path.join(outputDir, 'repopack-api-routes.txt'), 'NextJS 13+ API routes and common files');

  // Find and generate repopacks for pages
  const pages = await globby('src/app/**/page.{tsx,js}', { cwd: rootDir });
  await generateRepopack(rootDir, [...pages, ...commonFiles], path.join(outputDir, 'repopack-pages.txt'), 'NextJS 13+ pages and common files');

  // Find and generate repopacks for layouts
  const layouts = await globby('src/app/**/layout.{tsx,js}', { cwd: rootDir });
  await generateRepopack(rootDir, [...layouts, ...commonFiles], path.join(outputDir, 'repopack-layouts.txt'), 'NextJS 13+ layouts and common files');

  // Generate repopack for all files
  const allFiles = await globby('src/**/*', { cwd: rootDir });
  await generateRepopack(rootDir, allFiles, path.join(outputDir, 'repopack-all.txt'), 'All NextJS 13+ project files');
}

async function generateRepopack(rootDir: string, files: string[], outputFile: string, description: string): Promise<void> {
  const config: RepopackConfigFile = {
    output: {
      filePath: outputFile,
      headerText: description,
    },
    include: files,
  };

  await pack(rootDir, config);
  logger.info(`Generated repopack: ${outputFile}`);
}