import React, { useEffect, useState } from "react";
import { SettingsPanel } from "./components/SettingsPanel";
import { BlurSettings, Message } from "../types";
import "./styles/popup.css";
import { createRoot, Root } from "react-dom/client";

const Popup = () => {
  const [isBlur, setIsBlur] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期設定を読み込み
  useEffect(() => {
    chrome.storage.local.get(["isBlur"], (result) => {
      if (chrome.runtime.lastError) {
        setError("設定の読み込みに失敗しました");
        console.error("[Blur Focus] Storage error:", chrome.runtime.lastError);
        setIsLoading(false);
        return;
      }

      setIsBlur(result.isBlur ?? false);
      setIsLoading(false);
    });
  }, []);

  // ブラーのトグル処理
  const handleToggle = async () => {
    const newIsBlur = !isBlur;

    try {
      // ローカル状態を更新
      setIsBlur(newIsBlur);

      // Storageに保存
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ isBlur: newIsBlur }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // 現在のタブにメッセージを送信（リアルタイム更新）
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        const message: Message = {
          action: "toggleBlur",
          settings: { isBlur: newIsBlur },
        };

        chrome.tabs.sendMessage(tabs[0].id, message, (_response) => {
          if (chrome.runtime.lastError) {
            // Content scriptが読み込まれていない場合は無視
            // （例：chrome://pages や拡張機能ページ）
            console.log(
              "[Blur Focus] Content script not available:",
              chrome.runtime.lastError.message
            );
          }
        });
      }
    } catch (err) {
      setError("設定の保存に失敗しました");
      console.error("[Blur Focus] Toggle error:", err);
      // エラー時は状態を元に戻す
      setIsBlur(!newIsBlur);
    }
  };

  // 設定変更時の処理
  const handleSettingsChange = async (settings: Partial<BlurSettings>) => {
    try {
      // Storageに保存
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set(settings, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // 現在のタブにメッセージを送信
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs[0]?.id) {
        const message: Message = {
          action: "updateSettings",
          settings: settings,
        };

        chrome.tabs.sendMessage(tabs[0].id, message, (_response) => {
          if (chrome.runtime.lastError) {
            console.log(
              "[Blur Focus] Content script not available:",
              chrome.runtime.lastError.message
            );
          }
        });
      }
    } catch (err) {
      setError("設定の保存に失敗しました");
      console.error("[Blur Focus] Settings update error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="popup-container">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      <div className="header">
        <h1 className="title" style={{ filter: isBlur ? "blur(5px)" : "none" }}>
          Blur Focus
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="controls">
        <button
          onClick={handleToggle}
          className={`toggle-button ${isBlur ? "active" : ""}`}
        >
          {isBlur ? "ブラーを無効にする" : "ブラーを有効にする"}
        </button>

        <SettingsPanel onSettingsChange={handleSettingsChange} />

      </div>
    </div>
  );
};

const root: Root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
