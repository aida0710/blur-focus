import React from "react";

interface IntensityTabProps {
  blurIntensity: number;
  onIntensityChange: (value: number) => void;
}

/**
 * ブラー強度設定タブ
 */
export const IntensityTab: React.FC<IntensityTabProps> = ({
  blurIntensity,
  onIntensityChange,
}) => {
  return (
    <div className="setting-section">
      <label className="setting-label">ブラー強度: {blurIntensity}px</label>
      <input
        type="range"
        min="2"
        max="15"
        value={blurIntensity}
        onChange={(e) => onIntensityChange(Number(e.target.value))}
        className="intensity-slider"
      />
      <div className="intensity-preview">
        <p style={{ filter: `blur(${blurIntensity}px)` }}>プレビューテキスト</p>
      </div>
    </div>
  );
};
