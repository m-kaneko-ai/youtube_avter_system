import { test, expect } from '@playwright/test';

// E2E-RES-C001: 未認証でアクセス → ログインページにリダイレクト
test('E2E-RES-C001: 未認証でアクセス → ログインページにリダイレクト', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{type: string, text: string}> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{url: string, status: number}> = [];
  page.on('response', (response) => {
    networkLogs.push({
      url: response.url(),
      status: response.status()
    });
  });

  await test.step('セッションストレージとローカルストレージをクリア', async () => {
    await page.goto('http://localhost:5173');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  await test.step('未認証状態で /research にアクセス', async () => {
    await page.goto('http://localhost:5173/research');
  });

  await test.step('ログインページにリダイレクトされることを確認', async () => {
    // URLが /login に変わることを確認
    await page.waitForURL('**/login', { timeout: 5000 });
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  await test.step('ログインページの要素が表示されることを確認', async () => {
    // ログインページタイトルを確認
    const pageTitle = await page.textContent('h1');
    expect(pageTitle).toBeTruthy();
  });

  // テスト失敗時のログ出力用（Playwrightが自動収集）
  test.info().attach('console-logs', {
    body: JSON.stringify(consoleLogs, null, 2),
    contentType: 'application/json'
  });

  test.info().attach('network-logs', {
    body: JSON.stringify(networkLogs, null, 2),
    contentType: 'application/json'
  });
});

// E2E-RES-C002: 認証済みでアクセス → リサーチページが表示される
test.only('E2E-RES-C002: 認証済みでアクセス → リサーチページが表示される', async ({ page }) => {
  // ブラウザコンソールログを収集
  const consoleLogs: Array<{type: string, text: string}> = [];
  page.on('console', (msg) => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  // ネットワークログを収集
  const networkLogs: Array<{url: string, status: number, method: string}> = [];
  page.on('request', (request) => {
    networkLogs.push({
      url: request.url(),
      status: 0,
      method: request.method()
    });
  });
  page.on('response', (response) => {
    const existingLog = networkLogs.find(log => log.url === response.url() && log.status === 0);
    if (existingLog) {
      existingLog.status = response.status();
    }
  });

  await test.step('ログインページにアクセス', async () => {
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
  });

  await test.step('認証情報を入力してログイン', async () => {
    // メールアドレス入力
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill('admin@example.com');

    // パスワード入力
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('admin123');

    // ログインボタンをクリック
    const loginButton = page.locator('button[type="submit"]');
    await expect(loginButton).toBeVisible();
    await loginButton.click();

    // ログイン完了を待機（ダッシュボードまたはホームページへのリダイレクト）
    await page.waitForURL(/\/(dashboard|home|research)/, { timeout: 10000 });
  });

  await test.step('認証状態で /research にアクセス', async () => {
    await page.goto('http://localhost:5173/research');
    await page.waitForLoadState('networkidle');
  });

  await test.step('リサーチページが表示されることを確認', async () => {
    // URLが /research であることを確認
    const currentUrl = page.url();
    expect(currentUrl).toContain('/research');

    // ページタイトルを確認
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toBeVisible({ timeout: 5000 });
    const titleText = await pageTitle.textContent();
    expect(titleText).toBeTruthy();
  });

  await test.step('リサーチページの主要要素を確認', async () => {
    // タブナビゲーションボタンが表示されることを確認
    const competitorTab = page.locator('button', { hasText: '競合リサーチ' });
    const trendTab = page.locator('button', { hasText: 'トレンド分析' });
    const commentTab = page.locator('button', { hasText: 'コメント分析' });

    await expect(competitorTab).toBeVisible({ timeout: 5000 });
    await expect(trendTab).toBeVisible({ timeout: 5000 });
    await expect(commentTab).toBeVisible({ timeout: 5000 });
  });

  // テスト失敗時のログ出力用（Playwrightが自動収集）
  test.info().attach('console-logs', {
    body: JSON.stringify(consoleLogs, null, 2),
    contentType: 'application/json'
  });

  test.info().attach('network-logs', {
    body: JSON.stringify(networkLogs, null, 2),
    contentType: 'application/json'
  });
});
