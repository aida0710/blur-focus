import { type BlurSettings, DEFAULT_SETTINGS, type StorageResult } from "../types";

/**
 * Chrome Storageとの通信を担当するクラス
 */
export class StorageManager {
  /**
   * Chrome Storageから設定を読み込み
   */
  async loadSettings(): Promise<BlurSettings> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result: StorageResult) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }

        const settings: BlurSettings = {
          isBlur: result.isBlur ?? DEFAULT_SETTINGS.isBlur,
          blurIntensity: result.blurIntensity ?? DEFAULT_SETTINGS.blurIntensity,
          targetElements: result.targetElements ?? DEFAULT_SETTINGS.targetElements,
          siteList: result.siteList ?? DEFAULT_SETTINGS.siteList,
        };

        resolve(settings);
      });
    });
  }

  /**
   * Chrome Storageに設定を保存
   */
  async saveSettings(settings: Partial<BlurSettings>): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve();
      });
    });
  }
}
