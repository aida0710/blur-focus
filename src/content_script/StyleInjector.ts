/**
 * CSSスタイルの注入と管理を担当するクラス
 */
export class StyleInjector {
  private static readonly STYLE_ID = "blur-focus-styles";
  private static readonly BLUR_CLASS = "blur-focus-element";
  private static readonly HOVER_CLASS = "blur-focus-hover";

  /**
   * ページにCSSスタイルを注入
   */
  injectStyles(blurIntensity: number): void {
    // 既存のスタイルを削除
    const existingStyle = document.getElementById(StyleInjector.STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = StyleInjector.STYLE_ID;
    style.textContent = `
      .${StyleInjector.BLUR_CLASS} {
        filter: blur(${blurIntensity}px) !important;
        transition: filter 0.2s ease !important;
      }
      .${StyleInjector.BLUR_CLASS}.${StyleInjector.HOVER_CLASS},
      .${StyleInjector.BLUR_CLASS}.${StyleInjector.HOVER_CLASS} * {
        filter: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 注入したスタイルを削除
   */
  removeStyles(): void {
    const style = document.getElementById(StyleInjector.STYLE_ID);
    if (style) {
      style.remove();
    }
  }

  /**
   * 要素にブラークラスを適用
   */
  applyBlurToElement(element: HTMLElement): void {
    if (!element.classList.contains(StyleInjector.BLUR_CLASS)) {
      element.classList.add(StyleInjector.BLUR_CLASS);
    }
  }

  /**
   * 要素からブラークラスを削除
   */
  removeBlurFromElement(element: HTMLElement): void {
    element.classList.remove(
      StyleInjector.BLUR_CLASS,
      StyleInjector.HOVER_CLASS
    );
  }

  /**
   * すべての要素からブラークラスを削除
   */
  removeBlurFromAllElements(): void {
    const elements = document.querySelectorAll(`.${StyleInjector.BLUR_CLASS}`);
    elements.forEach((element) => {
      element.classList.remove(
        StyleInjector.BLUR_CLASS,
        StyleInjector.HOVER_CLASS
      );
    });
  }

  /**
   * 要素にホバークラスを追加
   */
  addHoverClass(element: HTMLElement): void {
    element.classList.add(StyleInjector.HOVER_CLASS);
  }

  /**
   * 要素からホバークラスを削除
   */
  removeHoverClass(element: HTMLElement): void {
    element.classList.remove(StyleInjector.HOVER_CLASS);
  }

  /**
   * 要素がブラー対象かチェック
   */
  isBlurElement(element: HTMLElement): boolean {
    return element.classList.contains(StyleInjector.BLUR_CLASS);
  }

  /**
   * ブラークラス名を取得
   */
  static getBlurClassName(): string {
    return StyleInjector.BLUR_CLASS;
  }

  /**
   * ホバークラス名を取得
   */
  static getHoverClassName(): string {
    return StyleInjector.HOVER_CLASS;
  }
}
