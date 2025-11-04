import type { BlurSettings, Message } from "../types";
import { EventHandler } from "./EventHandler";
import { MutationHandler } from "./MutationHandler";
import { StorageManager } from "./StorageManager";
import { StyleInjector } from "./StyleInjector";
import { buildTargetSelector, isSiteEnabled } from "./utils";

/**
 * ブラーフォーカス機能全体を管理するメインクラス
 */
export class BlurFocusManager {
  private settings!: BlurSettings;
  private readonly styleInjector: StyleInjector;
  private eventHandler: EventHandler;
  private mutationHandler: MutationHandler;
  private storageManager: StorageManager;
  private isActive: boolean = false;
  private targetSelector: string = "";

  constructor() {
    this.styleInjector = new StyleInjector();
    this.eventHandler = new EventHandler(this.styleInjector);
    this.mutationHandler = new MutationHandler(this.styleInjector);
    this.storageManager = new StorageManager();

    this.init();
  }

  /**
   * 初期化処理
   */
  private async init(): Promise<void> {
    try {
      console.log("[Blur Focus] 初期化開始");

      // 設定を読み込み
      await this.loadSettings();
      console.log("[Blur Focus] 設定読み込み完了:", this.settings);

      // サイトルールのチェック
      if (!isSiteEnabled(this.settings.siteList)) {
        console.log("[Blur Focus] このサイトでは無効です");
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
      console.log("[Blur Focus] キーボードショートカットリスナーを設定しました");
    } catch (error) {
      console.error("[Blur Focus] Initialization error:", error);
    }
  }

  /**
   * Chrome Storageから設定を読み込み
   */
  private async loadSettings(): Promise<void> {
    this.settings = await this.storageManager.loadSettings();
    this.updateTargetSelector();
  }

  /**
   * 対象要素のセレクターを更新
   */
  private updateTargetSelector(): void {
    this.targetSelector = buildTargetSelector(this.settings.targetElements);
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
    this.styleInjector.injectStyles(this.settings.blurIntensity);

    // 既存の要素にブラーを適用
    this.applyBlurToExistingElements();

    // イベントデリゲーションを設定
    this.eventHandler.setupEventListeners();

    // MutationObserverを開始
    this.mutationHandler.start(this.targetSelector);
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
    this.styleInjector.removeBlurFromAllElements();

    // イベントリスナーを削除
    this.eventHandler.removeEventListeners();

    // MutationObserverを停止
    this.mutationHandler.stop();

    // スタイルを削除
    this.styleInjector.removeStyles();
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
      this.styleInjector.applyBlurToElement(element);
    });
  }

  /**
   * メッセージリスナーを設定（リアルタイム更新）
   */
  private setupMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
      if (message.action === "toggleBlur" || message.action === "updateSettings") {
        this.handleSettingsUpdate(message.settings || {})
          .then(() => {
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error("[Blur Focus] Settings update error:", error);
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
    if (!isSiteEnabled(this.settings.siteList)) {
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
    document.addEventListener("keydown", (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        this.toggleBlur();
      }
    });
  }

  /**
   * ブラー機能のトグル
   */
  private async toggleBlur(): Promise<void> {
    this.settings.isBlur = !this.settings.isBlur;

    try {
      // Storageに保存
      await this.storageManager.saveSettings({ isBlur: this.settings.isBlur });

      // 適用/解除
      if (this.settings.isBlur) {
        this.activate();
      } else {
        this.deactivate();
      }
    } catch (error) {
      console.error("[Blur Focus] Storage error:", error);
    }
  }
}
