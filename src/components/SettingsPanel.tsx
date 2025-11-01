import React, { useState, useEffect } from 'react';
import { BlurSettings, DEFAULT_SETTINGS, SiteRule } from '../types';

interface SettingsPanelProps {
  onSettingsChange: (settings: Partial<BlurSettings>) => void;
}

/**
 * 設定パネルコンポーネント
 */
export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSettingsChange }) => {
  const [blurIntensity, setBlurIntensity] = useState(DEFAULT_SETTINGS.blurIntensity);
  const [targetElements, setTargetElements] = useState<string[]>(DEFAULT_SETTINGS.targetElements);
  const [siteList, setSiteList] = useState<SiteRule[]>(DEFAULT_SETTINGS.siteList);
  const [newSitePattern, setNewSitePattern] = useState('');
  const [currentTab, setCurrentTab] = useState<'intensity' | 'elements' | 'sites'>('intensity');

  // 設定を読み込み
  useEffect(() => {
    chrome.storage.local.get(null, (result) => {
      if (chrome.runtime.lastError) {
        console.error('[Blur Focus] Settings load error:', chrome.runtime.lastError);
        return;
      }

      if (result.blurIntensity !== undefined) {
        setBlurIntensity(result.blurIntensity);
      }
      if (result.targetElements) {
        setTargetElements(result.targetElements);
      }
      if (result.siteList) {
        setSiteList(result.siteList);
      }
    });
  }, []);

  // ブラー強度の変更
  const handleIntensityChange = (value: number) => {
    setBlurIntensity(value);
    onSettingsChange({ blurIntensity: value });
  };

  // 対象要素のトグル
  const handleElementToggle = (element: string) => {
    const newElements = targetElements.includes(element)
      ? targetElements.filter((e) => e !== element)
      : [...targetElements, element];

    setTargetElements(newElements);
    onSettingsChange({ targetElements: newElements });
  };

  // サイトルールの追加
  const handleAddSiteRule = () => {
    if (!newSitePattern.trim()) {
      return;
    }

    const newRule: SiteRule = {
      pattern: newSitePattern.trim(),
      enabled: true,
    };

    const newSiteList = [...siteList, newRule];
    setSiteList(newSiteList);
    setNewSitePattern('');
    onSettingsChange({ siteList: newSiteList });
  };

  // サイトルールの削除
  const handleRemoveSiteRule = (index: number) => {
    const newSiteList = siteList.filter((_, i) => i !== index);
    setSiteList(newSiteList);
    onSettingsChange({ siteList: newSiteList });
  };

  // サイトルールの有効/無効切り替え
  const handleToggleSiteRule = (index: number) => {
    const newSiteList = [...siteList];
    newSiteList[index].enabled = !newSiteList[index].enabled;
    setSiteList(newSiteList);
    onSettingsChange({ siteList: newSiteList });
  };

  // 現在のサイトを追加
  const handleAddCurrentSite = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        setNewSitePattern(url.hostname);
      }
    });
  };

  // 全要素タイプのリスト
  const allElementTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'span', 'ul', 'li', 'label', 'code'];

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          className={`tab-button ${currentTab === 'intensity' ? 'active' : ''}`}
          onClick={() => setCurrentTab('intensity')}
        >
          強度
        </button>
        <button
          className={`tab-button ${currentTab === 'elements' ? 'active' : ''}`}
          onClick={() => setCurrentTab('elements')}
        >
          対象要素
        </button>
        <button
          className={`tab-button ${currentTab === 'sites' ? 'active' : ''}`}
          onClick={() => setCurrentTab('sites')}
        >
          サイト
        </button>
      </div>

      <div className="settings-content">
        {/* ブラー強度設定 */}
        {currentTab === 'intensity' && (
          <div className="setting-section">
            <label className="setting-label">
              ブラー強度: {blurIntensity}px
            </label>
            <input
              type="range"
              min="2"
              max="15"
              value={blurIntensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="intensity-slider"
            />
            <div className="intensity-preview">
              <p style={{ filter: `blur(${blurIntensity}px)` }}>
                プレビューテキスト
              </p>
            </div>
          </div>
        )}

        {/* 対象要素設定 */}
        {currentTab === 'elements' && (
          <div className="setting-section">
            <label className="setting-label">
              ブラーを適用する要素を選択:
            </label>
            <div className="element-checkboxes">
              {allElementTypes.map((element) => (
                <label key={element} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={targetElements.includes(element)}
                    onChange={() => handleElementToggle(element)}
                  />
                  <span className="element-tag">&lt;{element}&gt;</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* サイトルール設定 */}
        {currentTab === 'sites' && (
          <div className="setting-section">
            <label className="setting-label">
              サイトごとの設定:
            </label>
            <div className="site-input-group">
              <input
                type="text"
                value={newSitePattern}
                onChange={(e) => setNewSitePattern(e.target.value)}
                placeholder="例: example.com"
                className="site-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddSiteRule();
                  }
                }}
              />
              <button onClick={handleAddSiteRule} className="add-button">
                追加
              </button>
              <button onClick={handleAddCurrentSite} className="current-site-button">
                現在のサイト
              </button>
            </div>

            <div className="site-list">
              {siteList.length === 0 ? (
                <p className="empty-message">
                  サイトルールがありません。すべてのサイトで有効です。
                </p>
              ) : (
                siteList.map((rule, index) => (
                  <div key={index} className="site-rule-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleSiteRule(index)}
                      />
                      <span className={`site-pattern ${rule.enabled ? '' : 'disabled'}`}>
                        {rule.pattern}
                      </span>
                    </label>
                    <button
                      onClick={() => handleRemoveSiteRule(index)}
                      className="remove-button"
                    >
                      削除
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <p className="shortcut-hint">
          ショートカット: <kbd>Ctrl+Shift+B</kbd> (Mac: <kbd>⌘+Shift+B</kbd>)
        </p>
      </div>
    </div>
  );
};
