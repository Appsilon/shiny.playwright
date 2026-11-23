import { test } from '@appsilon/shiny-playwright';

// Expected failures (test.fail()): each test passes only if it fails. If the harness stopped reporting one of
// these problems, the test would pass its body and be reported as "expected to fail, but passed".

test.describe('an app that fails at startup', () => {
  test.use({ app: 'broken' });

  test.fail('fails the test', async ({ shiny }) => {
    await shiny.goto();
  });
});

test.describe('an app error', () => {
  test.use({ app: 'errors' });

  test.fail('a console error fails expectNoErrors()', async ({ page, shiny }) => {
    await shiny.goto();
    await page.locator('#console_error').click();
    await shiny.expectNoErrors();
  });

  test.fail('a server error fails expectNoErrors()', async ({ page, shiny }) => {
    await shiny.goto();
    await page.locator('#server_error').click();
    await shiny.expectNoErrors();
  });
});

test.describe('a stateful ignoreConsoleErrors pattern', () => {
  test.use({ app: 'errors', ignoreConsoleErrors: [/deliberate console error/g] });

  test.fail('is rejected', async ({ shiny }) => {
    await shiny.goto();
  });
});
