import { SiteRule } from '../types';

/**
 * URLパターンマッチング（シンプル版）
 * ワイルドカードを正規表現に変換してマッチングを行う
 */
export function matchPattern(url: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');

  try {
    const regex = new RegExp(regexPattern);
    return regex.test(url);
  } catch {
    return false;
  }
}

/**
 * 現在のサイトでブラー機能が有効かチェック
 */
export function isSiteEnabled(siteList: SiteRule[]): boolean {
  if (siteList.length === 0) {
    return true; // ルールがない場合はすべてのサイトで有効
  }

  const currentUrl = window.location.href;
  const currentHost = window.location.hostname;

  for (const rule of siteList) {
    const pattern = rule.pattern;

    if (
      currentUrl.includes(pattern) ||
      currentHost.includes(pattern) ||
      matchPattern(currentUrl, pattern)
    ) {
      return rule.enabled;
    }
  }

  return true; // デフォルトは有効
}

/**
 * 対象要素の配列からCSSセレクターを生成
 */
export function buildTargetSelector(targetElements: string[]): string {
  return targetElements.join(',');
}
