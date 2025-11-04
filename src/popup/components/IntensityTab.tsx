import type { FC } from "react";

interface IntensityTabProps {
  blurIntensity: number;
  onIntensityChange: (value: number) => void;
}

/**
 * ブラー強度設定タブ
 */
export const IntensityTab: FC<IntensityTabProps> = ({ blurIntensity, onIntensityChange }) => {
  return (
    <div className="setting-section">
      <label className="setting-label">
        ブラー強度: {blurIntensity}px
        <input
          type="range"
          min="2"
          max="15"
          value={blurIntensity}
          onChange={(e) => onIntensityChange(Number(e.target.value))}
          className="intensity-slider"
        />
      </label>
      <div className="intensity-preview">
        <p style={{ filter: `blur(${blurIntensity}px)` }}>プレビューテキスト</p>
      </div>
    </div>
  );
};
