import { BlurSettings, DEFAULT_SETTINGS, Message, StorageResult } from './types';

/**
 * Blur Focus Content Script
 *
 * パフォーマンス最適化とリアルタイム設定更新に対応
 */
class BlurFocusManager {
  private settings: BlurSettings = DEFAULT_SETTINGS;
  private mutationObserver: MutationObserver | null = null;
  private isActive: boolean = false;
  private targetSelector: string = '';
  private hoveredElement: HTMLElement | null = null;

  constructor() {
    this.init();
  }

  /**
   * 初期化処理
   */
  private async init(): Promise<void> {
    try {
      // 設定を読み込み
      await this.loadSettings();

      // サイトルールのチェック
      if (!this.isSiteEnabled()) {
        return;
      }

      // メッセージリスナーを設定
      this.setupMessageListener();

      // ブラー機能を適用
      if (this.settings.isBlur) {
        this.activate();
      }

      // キーボードショートカットのリスナー
      this.setupKeyboardShortcut();
    } catch (error) {
      console.error('[Blur Focus] Initialization error:', error);
    }
  }

  /**
   * Chrome Storageから設定を読み込み
   */
  private async loadSettings(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result: StorageResult) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        this.settings = {
          isBlur: result.isBlur ?? DEFAULT_SETTINGS.isBlur,
          blurIntensity: result.blurIntensity ?? DEFAULT_SETTINGS.blurIntensity,
          targetElements: result.targetElements ?? DEFAULT_SETTINGS.targetElements,
          siteList: result.siteList ?? DEFAULT_SETTINGS.siteList,
        };

        this.updateTargetSelector();
        resolve();
      });
    });
  }

  /**
   * 現在のサイトでブラー機能が有効かチェック
   */
  private isSiteEnabled(): boolean {
    if (this.settings.siteList.length === 0) {
      return true; // ルールがない場合はすべてのサイトで有効
    }

    const currentUrl = window.location.href;
    const currentHost = window.location.hostname;

    for (const rule of this.settings.siteList) {
      const pattern = rule.pattern;

      // シンプルなパターンマッチング
      if (
        currentUrl.includes(pattern) ||
        currentHost.includes(pattern) ||
        this.matchPattern(currentUrl, pattern)
      ) {
        return rule.enabled;
      }
    }

    return true; // デフォルトは有効
  }

  /**
   * URLパターンマッチング（シンプル版）
   */
  private matchPattern(url: string, pattern: string): boolean {
    // ワイルドカードを正規表現に変換
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    try {
      const regex = new RegExp(regexPattern);
      return regex.test(url);
    } catch {
      return false;
    }
  }

  /**
   * 対象要素のセレクターを更新
   */
  private updateTargetSelector(): void {
    this.targetSelector = this.settings.targetElements.join(',');
  }

  /**
   * ブラー機能を有効化
   */
  private activate(): void {
    if (this.isActive) {
      return;
    }

    this.isActive = true;

    // CSSトランジションを追加
    this.injectStyles();

    // 既存の要素にブラーを適用
    this.applyBlurToExistingElements();

    // イベントデリゲーションを設定
    this.setupEventDelegation();

    // MutationObserverを開始
    this.startMutationObserver();
  }

  /**
   * ブラー機能を無効化
   */
  private deactivate(): void {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;

    // すべての要素からブラーを削除
    this.removeBlurFromAllElements();

    // イベントリスナーを削除
    this.removeEventDelegation();

    // MutationObserverを停止
    this.stopMutationObserver();
  }

  /**
   * CSSスタイルをページに注入
   */
  private injectStyles(): void {
    const styleId = 'blur-focus-styles';

    // 既存のスタイルを削除
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .blur-focus-element {
        filter: blur(${this.settings.blurIntensity}px) !important;
        transition: filter 0.2s ease !important;
      }
      .blur-focus-element.blur-focus-hover,
      .blur-focus-element.blur-focus-hover * {
        filter: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 既存の要素にブラーを適用
   */
  private applyBlurToExistingElements(): void {
    if (!this.targetSelector) {
      return;
    }

    const elements = document.querySelectorAll<HTMLElement>(this.targetSelector);
    elements.forEach((element) => {
      this.applyBlurToElement(element);
    });
  }

  /**
   * 単一の要素にブラーを適用
   */
  private applyBlurToElement(element: HTMLElement): void {
    if (!element.classList.contains('blur-focus-element')) {
      element.classList.add('blur-focus-element');
    }
  }

  /**
   * 単一の要素からブラーを削除
   */
  private removeBlurFromElement(element: HTMLElement): void {
    element.classList.remove('blur-focus-element', 'blur-focus-hover');
  }

  /**
   * すべての要素からブラーを削除
   */
  private removeBlurFromAllElements(): void {
    const elements = document.querySelectorAll('.blur-focus-element');
    elements.forEach((element) => {
      element.classList.remove('blur-focus-element', 'blur-focus-hover');
    });

    // 注入したスタイルも削除
    const style = document.getElementById('blur-focus-styles');
    if (style) {
      style.remove();
    }
  }

  /**
   * イベントデリゲーションを設定（パフォーマンス最適化）
   */
  private setupEventDelegation(): void {
    document.addEventListener('mouseover', this.handleMouseOver);
    document.addEventListener('mouseout', this.handleMouseOut);
  }

  /**
   * イベントリスナーを削除
   */
  private removeEventDelegation(): void {
    document.removeEventListener('mouseover', this.handleMouseOver);
    document.removeEventListener('mouseout', this.handleMouseOut);
  }

  /**
   * マウスオーバーイベントハンドラー
   */
  private handleMouseOver = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    // 対象要素かチェック
    if (!target.classList.contains('blur-focus-element')) {
      return;
    }

    // ホバー中の要素を記録
    this.hoveredElement = target;

    // ブラーを解除
    target.classList.add('blur-focus-hover');
  };

  /**
   * マウスアウトイベントハンドラー
   */
  private handleMouseOut = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;

    // 対象要素かチェック
    if (!target.classList.contains('blur-focus-element')) {
      return;
    }

    // マウスが要素の外に出たかチェック
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    if (relatedTarget && target.contains(relatedTarget)) {
      return; // 子要素に移動しただけなので無視
    }

    // ブラーを再適用
    target.classList.remove('blur-focus-hover');
    this.hoveredElement = null;
  };

  /**
   * MutationObserverを開始（動的要素に対応）
   */
  private startMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            // 要素自体がターゲットかチェック
            if (element.matches && element.matches(this.targetSelector)) {
              this.applyBlurToElement(element);
            }

            // 子要素にターゲットがあるかチェック
            const children = element.querySelectorAll<HTMLElement>(this.targetSelector);
            children.forEach((child) => {
              this.applyBlurToElement(child);
            });
          }
        });
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * MutationObserverを停止
   */
  private stopMutationObserver(): void {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * メッセージリスナーを設定（リアルタイム更新）
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      if (message.action === 'toggleBlur' || message.action === 'updateSettings') {
        this.handleSettingsUpdate(message.settings || {})
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('[Blur Focus] Settings update error:', error);
            sendResponse({ success: false, error: error.message });
          });
        return true; // 非同期レスポンスを示す
      }
    });
  }

  /**
   * 設定更新を処理
   */
  private async handleSettingsUpdate(partialSettings: Partial<BlurSettings>): Promise<void> {
    // 設定をマージ
    this.settings = {
      ...this.settings,
      ...partialSettings,
    };

    this.updateTargetSelector();

    // サイトルールのチェック
    if (!this.isSiteEnabled()) {
      this.deactivate();
      return;
    }

    // ブラー状態に応じて有効化/無効化
    if (this.settings.isBlur) {
      // 既にアクティブな場合は再適用
      if (this.isActive) {
        this.deactivate();
      }
      this.activate();
    } else {
      this.deactivate();
    }
  }

  /**
   * キーボードショートカットのリスナー
   */
  private setupKeyboardShortcut(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      // Ctrl+Shift+B (Mac: Command+Shift+B)
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'B') {
        event.preventDefault();
        this.toggleBlur();
      }
    });
  }

  /**
   * ブラー機能のトグル
   */
  private toggleBlur(): void {
    this.settings.isBlur = !this.settings.isBlur;

    // Storageに保存
    chrome.storage.local.set({ isBlur: this.settings.isBlur }, () => {
      if (chrome.runtime.lastError) {
        console.error('[Blur Focus] Storage error:', chrome.runtime.lastError);
        return;
      }

      // 適用/解除
      if (this.settings.isBlur) {
        this.activate();
      } else {
        this.deactivate();
      }
    });
  }
}

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BlurFocusManager();
  });
} else {
  new BlurFocusManager();
}
