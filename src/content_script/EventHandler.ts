import type { StyleInjector } from "./StyleInjector";

/**
 * マウスイベントの処理を担当するクラス
 */
export class EventHandler {
  private styleInjector: StyleInjector;
  private hoveredElement: HTMLElement | null = null;

  constructor(styleInjector: StyleInjector) {
    this.styleInjector = styleInjector;
  }

  /**
   * イベントデリゲーションを設定
   */
  setupEventListeners(): void {
    document.addEventListener("mouseover", this.handleMouseOver);
    document.addEventListener("mouseout", this.handleMouseOut);
  }

  /**
   * イベントリスナーを削除
   */
  removeEventListeners(): void {
    document.removeEventListener("mouseover", this.handleMouseOver);
    document.removeEventListener("mouseout", this.handleMouseOut);
  }

  /**
   * マウスオーバーイベントハンドラー
   */
  private handleMouseOver = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    // 最も内側の対象要素を見つけ、その祖先の対象要素も収集
    let currentElement: HTMLElement | null = target;
    const blurElements: HTMLElement[] = [];

    while (currentElement && currentElement !== document.body) {
      if (this.styleInjector.isBlurElement(currentElement)) {
        blurElements.push(currentElement);
      }
      currentElement = currentElement.parentElement;
    }

    if (blurElements.length === 0) {
      return;
    }

    // 最も内側の要素を取得
    const targetElement = blurElements[0];

    // 既にホバー中の要素と同じ場合はスキップ
    if (this.hoveredElement === targetElement) {
      return;
    }

    // 前のホバー要素とその祖先のブラーを再適用
    if (this.hoveredElement) {
      let element: HTMLElement | null = this.hoveredElement;
      while (element && element !== document.body) {
        if (this.styleInjector.isBlurElement(element)) {
          this.styleInjector.removeHoverClass(element);
        }
        element = element.parentElement;
      }
    }

    // 新しい要素とその祖先のホバー状態を設定
    this.hoveredElement = targetElement;
    blurElements.forEach((element) => {
      this.styleInjector.addHoverClass(element);
    });
  };

  /**
   * マウスアウトイベントハンドラー
   */
  private handleMouseOut = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement | null;

    // 対象要素かチェック
    if (!this.styleInjector.isBlurElement(target)) {
      return;
    }

    // ホバー中の要素でない場合は処理しない
    if (this.hoveredElement !== target) {
      return;
    }

    // マウスが移動した先を確認
    if (relatedTarget) {
      // 子要素に移動した場合は何もしない
      if (target.contains(relatedTarget)) {
        return;
      }

      // 移動先もblur-focus-element要素かチェック
      let checkElement: HTMLElement | null = relatedTarget;
      while (checkElement && checkElement !== document.body) {
        if (this.styleInjector.isBlurElement(checkElement)) {
          // 別のblur-focus-element要素に移動した場合は
          // mouseoverで処理されるのでここでは何もしない
          return;
        }
        checkElement = checkElement.parentElement;
      }
    }

    // blur-focus-element要素の外に完全に出た場合
    // 要素とその祖先からblur-focus-hoverクラスを削除
    let element: HTMLElement | null = this.hoveredElement;
    while (element && element !== document.body) {
      if (this.styleInjector.isBlurElement(element)) {
        this.styleInjector.removeHoverClass(element);
      }
      element = element.parentElement;
    }
    this.hoveredElement = null;
  };
}
