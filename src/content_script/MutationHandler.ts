import { StyleInjector } from "./StyleInjector";

/**
 * DOM変更の監視と動的要素への対応を担当するクラス
 */
export class MutationHandler {
  private observer: MutationObserver | null = null;
  private targetSelector: string = "";
  private styleInjector: StyleInjector;

  constructor(styleInjector: StyleInjector) {
    this.styleInjector = styleInjector;
  }

  /**
   * MutationObserverを開始
   */
  start(targetSelector: string): void {
    this.targetSelector = targetSelector;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            // 要素自体がターゲットかチェック
            if (element.matches && element.matches(this.targetSelector)) {
              this.styleInjector.applyBlurToElement(element);
            }

            // 子要素にターゲットがあるかチェック
            const children = element.querySelectorAll<HTMLElement>(
              this.targetSelector
            );
            children.forEach((child) => {
              this.styleInjector.applyBlurToElement(child);
            });
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * MutationObserverを停止
   */
  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  /**
   * 対象セレクターを更新して再起動
   */
  updateTargetSelector(targetSelector: string): void {
    if (this.observer) {
      this.stop();
      this.start(targetSelector);
    }
  }
}
