import path from 'node:path';
import { expect, test } from '@appsilon/shiny-e2e';

test.describe('an app under apps/ (bare name)', () => {
  test.use({ app: 'counter' });

  test('goto() waits for the slow first render', async ({ page, shiny }) => {
    await shiny.goto();
    // Read once, without retrying: the text must already be there when goto() returns.
    expect(await page.locator('#slow_text').textContent()).toBe('Slow output ready');
    await shiny.expectNoErrors();
  });

  test('the custom input binding sends its value to the server', async ({ page, shiny }) => {
    await shiny.goto();
    expect(await shiny.inputValue('clicks')).toBe(0);
    await page.getByRole('button', { name: 'Click me' }).click();
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.locator('#clicks_text')).toHaveText('Clicks: 2');
    expect(await shiny.inputValue('clicks')).toBe(2);
    await shiny.expectNoErrors();
  });

  test('selectOption() picks a value in a selectize input', async ({ page, shiny }) => {
    await shiny.goto();
    await shiny.selectOption('letter', 'b');
    await expect(page.locator('#letter_text')).toHaveText('Letter: b');
    await shiny.expectNoErrors();
  });
});

test.describe('an app with no server work', () => {
  test.use({ app: 'static' });

  test('goto() returns once the session has been quiet', async ({ page, shiny }) => {
    await shiny.goto();
    await expect(page.getByRole('heading', { name: 'Static page' })).toBeVisible();
    await shiny.expectNoErrors();
  });
});

test.describe('an app given relative to the package root', () => {
  test.use({ app: 'inst/examples/hello' });

  test('starts and runs the installed package', async ({ page, shiny }) => {
    await shiny.goto();
    await page.getByRole('button', { name: 'Click me' }).click();
    await expect(page.locator('#clicks_text')).toHaveText('Clicks: 1');
    await shiny.expectNoErrors();
  });
});

test.describe('an app given as an absolute path to an .R file', () => {
  test.use({ app: path.join(__dirname, '..', 'apps', 'static', 'app.R') });

  test('starts', async ({ page, shiny }) => {
    await shiny.goto();
    await expect(page.getByRole('heading', { name: 'Static page' })).toBeVisible();
    await shiny.expectNoErrors();
  });
});
