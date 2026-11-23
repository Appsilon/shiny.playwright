import { expect, test } from '@appsilon/shiny-e2e';

// Each test makes the app misbehave and checks that the harness reports it, with the reason.

test.describe('errors in a running app', () => {
  test.use({ app: 'errors' });

  test.beforeEach(async ({ shiny }) => {
    await shiny.goto();
  });

  test('a console error', async ({ page, shiny }) => {
    await page.locator('#console_error').click();
    await expect(shiny.expectNoErrors()).rejects.toThrow(/console: e2e-fixture: deliberate console error/);
  });

  test('an uncaught exception in the page', async ({ page, shiny }) => {
    await page.locator('#page_error').click();
    await expect(shiny.expectNoErrors()).rejects.toThrow(/pageerror: e2e-fixture: deliberate page error/);
  });

  test('an output error', async ({ page, shiny }) => {
    await page.locator('#output_error').click();
    await expect(page.locator('#result')).toHaveText('e2e-fixture: deliberate output error');
    await expect(shiny.expectNoErrors()).rejects.toThrow(/shiny-output-error/);
  });

  test('a server error that ends the session', async ({ page, shiny }) => {
    await page.locator('#server_error').click();
    await expect(shiny.expectNoErrors()).rejects.toThrow(/shiny-disconnected-overlay/);
    // The app's R output is captured.
    await expect.poll(() => shiny.logs()).toContain('e2e-fixture: deliberate server error');
  });

  test('no error: expectNoErrors() passes', async ({ shiny }) => {
    await shiny.expectNoErrors();
  });
});

test.describe('ignoreConsoleErrors', () => {
  test.use({ app: 'errors', ignoreConsoleErrors: [/^e2e-fixture: deliberate console error$/] });

  test('skips matching console errors, every time', async ({ page, shiny }) => {
    await shiny.goto();
    // Several times: a stateful (g or y) RegExp would let every other repeat through.
    for (let i = 0; i < 3; i++) await page.locator('#console_error').click();
    await shiny.expectNoErrors();
  });

  test('still reports other errors', async ({ page, shiny }) => {
    await shiny.goto();
    await page.locator('#page_error').click();
    await expect(shiny.expectNoErrors()).rejects.toThrow(/deliberate page error/);
  });
});

test.describe('an output that appears after the first idle', () => {
  test.use({ app: 'late_error' });

  test('expectNoErrors() waits for it and reports its error', async ({ page, shiny }) => {
    await shiny.goto();
    await expect(shiny.expectNoErrors()).rejects.toThrow(/shiny-output-error/);
    await expect(page.locator('#late')).toHaveText('e2e-fixture: deliberate late output error');
  });
});
