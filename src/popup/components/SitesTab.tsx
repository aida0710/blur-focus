import React from "react";
import { SiteRule } from "../../types";

interface SitesTabProps {
  siteList: SiteRule[];
  newSitePattern: string;
  onSitePatternChange: (pattern: string) => void;
  onAddSiteRule: () => void;
  onRemoveSiteRule: (index: number) => void;
  onToggleSiteRule: (index: number) => void;
  onAddCurrentSite: () => void;
}

/**
 * サイトルール設定タブ
 */
export const SitesTab: React.FC<SitesTabProps> = ({
  siteList,
  newSitePattern,
  onSitePatternChange,
  onAddSiteRule,
  onRemoveSiteRule,
  onToggleSiteRule,
  onAddCurrentSite,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onAddSiteRule();
    }
  };

  return (
    <div className="setting-section">
      <label className="setting-label">サイトごとの設定:</label>
      <div className="site-input-group">
        <input
          type="text"
          value={newSitePattern}
          onChange={(e) => onSitePatternChange(e.target.value)}
          placeholder="例: example.com"
          className="site-input"
          onKeyDown={handleKeyDown}
        />
        <button onClick={onAddSiteRule} className="add-button">
          追加
        </button>
        <button onClick={onAddCurrentSite} className="current-site-button">
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
                  onChange={() => onToggleSiteRule(index)}
                />
                <span
                  className={`site-pattern ${rule.enabled ? "" : "disabled"}`}
                >
                  {rule.pattern}
                </span>
              </label>
              <button
                onClick={() => onRemoveSiteRule(index)}
                className="remove-button"
              >
                削除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
