import { BlurFocusManager } from "./BlurFocusManager";

/**
 * Blur Focus Content Script Entry Point
 *
 * ページ読み込み後にBlurFocusManagerを初期化
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new BlurFocusManager();
  });
} else {
  new BlurFocusManager();
}
