import { test, expect } from "@playwright/test";
test("real peer connection, verification, unsupported capture, disconnect", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const receiver = await ctx.newPage();
  await receiver.goto("/");
  await expect(receiver.locator("#copy")).toBeEnabled({ timeout: 25000 });
  await receiver.locator("#copy").click();
  const link = await receiver.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("#join=");
  const sender = await ctx.newPage();
  await sender.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      value: undefined,
      configurable: true,
    });
  });
  await sender.goto(link);
  await sender.locator("#join").click();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 25000 });
  expect(await receiver.locator("#verify-code").textContent()).toBe(
    await sender.locator("#sender-code").textContent(),
  );
  await receiver.locator("#accept").click();
  await expect(sender.locator("#capability")).toBeVisible();
  await expect(receiver.locator("#status")).toContainText(
    "ekran aktarımı desteklenmiyor",
  );
  await expect(receiver.locator("#viewer")).toBeHidden();
  await sender.close();
  await expect(receiver.locator("#status")).toContainText("kapattı", {
    timeout: 10000,
  });
  await ctx.close();
});
test("expired QR fails without opening an unauthenticated session", async ({
  page,
}) => {
  await page.goto(
    "/#join=12345678-1234-1234-1234-123456789012&key=12345678-1234-1234-1234-123456789012&expires=1",
  );
  await expect(page.locator("#sender-status")).toContainText("geçersiz");
  await expect(page.locator("#join")).toBeHidden();
});
test("mobile layout stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
test("media travels over WebRTC and ending the session stops capture", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const receiver = await ctx.newPage();
  await receiver.goto("/");
  await expect(receiver.locator("#copy")).toBeEnabled({ timeout: 25000 });
  await receiver.locator("#copy").click();
  const link = await receiver.evaluate(() => navigator.clipboard.readText());
  const sender = await ctx.newPage();
  await sender.addInitScript(() => {
    Object.defineProperty(navigator.mediaDevices, "getDisplayMedia", {
      value: async () => {
        const c = document.createElement("canvas");
        c.width = 320;
        c.height = 640;
        const g = c.getContext("2d");
        g.fillStyle = "green";
        g.fillRect(0, 0, 320, 640);
        window.testStream = c.captureStream(10);
        const paint = setInterval(() => { g.fillStyle = `hsl(${Date.now() % 360}, 70%, 40%)`; g.fillRect(0, 0, 320, 640); }, 100);
        window.testStream.getVideoTracks()[0].addEventListener("ended", () => clearInterval(paint));
        return window.testStream;
      },
      configurable: true,
    });
  });
  await sender.goto(link);
  await sender.locator("#join").click();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 25000 });
  await receiver.locator("#accept").click();
  await sender.locator("#share").click();
  await expect(receiver.locator("#viewer")).toBeVisible({ timeout: 25000 });
  await expect
    .poll(() => receiver.locator("#video").evaluate((v) => v.videoWidth))
    .toBe(320);
  await receiver.locator("#stop").click();
  await expect
    .poll(() =>
      sender.evaluate(() => window.testStream.getTracks()[0].readyState),
    )
    .toBe("ended");
  await ctx.close();
});
test("slow iPhone negotiation is not closed by the hello deadline", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const receiver = await ctx.newPage();
  await receiver.addInitScript(() => {
    const original = RTCPeerConnection.prototype.createAnswer;
    RTCPeerConnection.prototype.createAnswer = async function (...args) {
      await new Promise((resolve) => setTimeout(resolve, 12000));
      return original.apply(this, args);
    };
  });
  await receiver.goto("/");
  await expect(receiver.locator("#copy")).toBeEnabled({ timeout: 25000 });
  await receiver.locator("#copy").click();
  const url = await receiver.evaluate(() => navigator.clipboard.readText());
  const sender = await ctx.newPage();
  await sender.goto(url);
  await sender.locator("#join").click();
  await expect(sender.locator("#sender-code")).toBeEmpty();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 30000 });
  await receiver.locator("#accept").click();
  await expect(sender.locator("#sender-title")).toHaveText("Tablet bağlandı");
  await ctx.close();
});
test("signaling interruption preserves an established device session", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const receiver = await ctx.newPage();
  await receiver.addInitScript(() => {
    const Original = window.WebSocket;
    window.testSockets = [];
    window.WebSocket = class extends Original {
      constructor(...args) {
        super(...args);
        window.testSockets.push(this);
      }
    };
  });
  await receiver.goto("/");
  await expect(receiver.locator("#copy")).toBeEnabled({ timeout: 25000 });
  await receiver.locator("#copy").click();
  const url = await receiver.evaluate(() => navigator.clipboard.readText());
  const sender = await ctx.newPage();
  await sender.goto(url);
  await sender.locator("#join").click();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 25000 });
  await receiver.locator("#accept").click();
  await expect(sender.locator("#sender-title")).toHaveText("Tablet bağlandı");
  await receiver.evaluate(() => window.testSockets.filter(s => s.url.includes("peerjs.com")).at(-1).close());
  await expect
    .poll(() => receiver.evaluate(() => window.testSockets.filter(s => s.url.includes("peerjs.com") && s.readyState === WebSocket.OPEN).length), {
      timeout: 10000,
    })
    .toBe(1);
  await expect(receiver.locator("#status")).toContainText("Eşleştirildi");
  await expect(sender.locator("#share")).toBeVisible();
  await ctx.close();
});
test("sender can retry a rejected connection without scanning again", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const receiver = await ctx.newPage();
  await receiver.goto("/");
  await expect(receiver.locator("#copy")).toBeEnabled({ timeout: 25000 });
  await receiver.locator("#copy").click();
  const url = await receiver.evaluate(() => navigator.clipboard.readText());
  const sender = await ctx.newPage();
  await sender.goto(url);
  await sender.locator("#join").click();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 25000 });
  await receiver.locator("#reject").click();
  await expect(sender.locator("#join")).toBeEnabled();
  await expect(sender.locator("#join")).toHaveText("Tekrar bağlan");
  await sender.locator("#join").click();
  await expect(receiver.locator("#consent")).toBeVisible({ timeout: 25000 });
  await receiver.locator("#accept").click();
  await expect(sender.locator("#sender-title")).toHaveText("Tablet bağlandı");
  await ctx.close();
});
