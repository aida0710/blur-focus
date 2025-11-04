/**
 * Blur Focus Chrome Extension - Type Definitions
 */

/**
 * サイトごとのルール設定
 */
export interface SiteRule {
  /** URLパターン (例: "example.com", "*://docs.*.com/*") */
  pattern: string;
  /** このパターンでブラーを有効にするか */
  enabled: boolean;
}

/**
 * 拡張機能の全設定
 */
export interface BlurSettings {
  /** ブラー機能の有効/無効 */
  isBlur: boolean;
  /** ブラーの強度 (px単位, 2-15) */
  blurIntensity: number;
  /** ブラーを適用する要素のセレクター配列 */
  targetElements: string[];
  /** サイトごとのルール設定 */
  siteList: SiteRule[];
}

/**
 * デフォルト設定値
 */
export const DEFAULT_SETTINGS: BlurSettings = {
  isBlur: false,
  blurIntensity: 5,
  targetElements: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "span",
    "ul",
    "li",
    "label",
    "code",
  ],
  siteList: [],
};

/**
 * Content scriptへのメッセージタイプ
 */
export type MessageAction = "toggleBlur" | "updateSettings";

/**
 * Content scriptへ送信するメッセージ
 */
export interface Message {
  action: MessageAction;
  settings?: Partial<BlurSettings>;
}

/**
 * Chrome Storage から設定を取得する際のレスポンス型
 */
export type StorageResult = {
  [K in keyof BlurSettings]?: BlurSettings[K];
};
