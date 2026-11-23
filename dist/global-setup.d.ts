import type { FullConfig } from '@playwright/test';
/**
 * Install the package from the current source into a throwaway library, once per run.
 * Every app process puts this library first on its library path, so apps always
 * test the code in this checkout, never a previously installed version.
 * Each run gets its own library, so two runs from the same checkout don't interfere.
 */
export default function globalSetup(config: FullConfig): () => void;
