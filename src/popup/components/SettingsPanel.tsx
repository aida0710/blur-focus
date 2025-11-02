import React, { useState, useEffect } from 'react';
import { BlurSettings, DEFAULT_SETTINGS, SiteRule } from '../../types';
import { IntensityTab } from './IntensityTab';
import { ElementsTab } from './ElementsTab';
import { SitesTab } from './SitesTab';

interface SettingsPanelProps {
  onSettingsChange: (settings: Partial<BlurSettings>) => void;
}

/**
 * 設定パネルコンポーネント（タブコンテナ）
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
        {currentTab === 'intensity' && (
          <IntensityTab
            blurIntensity={blurIntensity}
            onIntensityChange={handleIntensityChange}
          />
        )}

        {currentTab === 'elements' && (
          <ElementsTab
            targetElements={targetElements}
            onElementToggle={handleElementToggle}
          />
        )}

        {currentTab === 'sites' && (
          <SitesTab
            siteList={siteList}
            newSitePattern={newSitePattern}
            onSitePatternChange={setNewSitePattern}
            onAddSiteRule={handleAddSiteRule}
            onRemoveSiteRule={handleRemoveSiteRule}
            onToggleSiteRule={handleToggleSiteRule}
            onAddCurrentSite={handleAddCurrentSite}
          />
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
