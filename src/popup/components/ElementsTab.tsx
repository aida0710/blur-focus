import React from "react";

interface ElementsTabProps {
  targetElements: string[];
  onElementToggle: (element: string) => void;
}

/**
 * 対象要素設定タブ
 */
export const ElementsTab: React.FC<ElementsTabProps> = ({
  targetElements,
  onElementToggle,
}) => {
  // 全要素タイプのリスト
  const allElementTypes = [
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
  ];

  return (
    <div className="setting-section">
      <label className="setting-label">ブラーを適用する要素を選択:</label>
      <div className="element-checkboxes">
        {allElementTypes.map((element) => (
          <label key={element} className="checkbox-label">
            <input
              type="checkbox"
              checked={targetElements.includes(element)}
              onChange={() => onElementToggle(element)}
            />
            <span className="element-tag">&lt;{element}&gt;</span>
          </label>
        ))}
      </div>
    </div>
  );
};
