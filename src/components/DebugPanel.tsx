import React from 'react';
import { BoundingBox } from '@/types';

interface DebugPanelProps {
  originalDimensions: { width: number; height: number };
  videoDimensions: { width: number; height: number };
  currentTimestamp: number;
  showDamage: boolean;
  showDetection: boolean;
  damages: BoundingBox[];
  detections: BoundingBox[];
  onOriginalWidthChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOriginalHeightChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  originalDimensions,
  videoDimensions,
  currentTimestamp,
  showDamage,
  showDetection,
  damages,
  detections,
  onOriginalWidthChange,
  onOriginalHeightChange,
}) => {
  return (
    <div className='debug-panel'>
      <h3>Debug Info</h3>
      <p>
        <strong>Original Video Size</strong>: {originalDimensions.width}x
        {originalDimensions.height} (as provided by user)
      </p>
      <div>
        <label>
          Adjust Width:
          <input
            type='number'
            value={originalDimensions.width}
            onChange={onOriginalWidthChange}
          />
        </label>
        <label style={{ marginLeft: '10px' }}>
          Adjust Height:
          <input
            type='number'
            value={originalDimensions.height}
            onChange={onOriginalHeightChange}
          />
        </label>
      </div>
      <p>
        Current Video Size: {videoDimensions.width}x{videoDimensions.height}
      </p>
      <p>
        Scale Factors: X:{' '}
        {(videoDimensions.width / originalDimensions.width).toFixed(2)}, Y:{' '}
        {(videoDimensions.height / originalDimensions.height).toFixed(2)}
      </p>
      <p>Current Timestamp: {currentTimestamp.toFixed(3)}</p>
      <p>
        Visibility: {showDamage ? 'Damages ✓' : 'Damages ✗'} |{' '}
        {showDetection ? 'Detections ✓' : 'Detections ✗'}
      </p>

      <div>
        <p>
          Active Boxes:{' '}
          {(showDamage
            ? damages.filter(
                (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
              ).length
            : 0) +
            (showDetection
              ? detections.filter(
                  (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
                ).length
              : 0)}
        </p>

        {showDamage &&
          damages.filter(
            (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
          ).length > 0 && (
            <div className='debug-box-info'>
              <p>
                <strong>First Active Damage Box:</strong>
              </p>
              {(() => {
                const box = damages.filter(
                  (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
                )[0];
                const scaleX = videoDimensions.width / originalDimensions.width;
                const scaleY =
                  videoDimensions.height / originalDimensions.height;
                return (
                  <>
                    <p>
                      Class: {box.className} (ID: {box.classId})
                    </p>
                    <p>
                      Original Coords: x1={box.x1.toFixed(1)}, y1=
                      {box.y1.toFixed(1)}, x2={box.x2.toFixed(1)}, y2=
                      {box.y2.toFixed(1)}
                    </p>
                    <p>
                      Scaled Coords: x1={(box.x1 * scaleX).toFixed(1)}, y1=
                      {(box.y1 * scaleY).toFixed(1)}, x2=
                      {(box.x2 * scaleX).toFixed(1)}, y2=
                      {(box.y2 * scaleY).toFixed(1)}
                    </p>
                  </>
                );
              })()}
            </div>
          )}

        {showDetection &&
          detections.filter(
            (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
          ).length > 0 && (
            <div className='debug-box-info'>
              <p>
                <strong>First Active Detection Box:</strong>
              </p>
              {(() => {
                const box = detections.filter(
                  (box) => Math.abs(box.timestamp - currentTimestamp) <= 0.01
                )[0];
                const scaleX = videoDimensions.width / originalDimensions.width;
                const scaleY =
                  videoDimensions.height / originalDimensions.height;
                return (
                  <>
                    <p>
                      Class: {box.className} (ID: {box.classId})
                    </p>
                    <p>
                      Original Coords: x1={box.x1.toFixed(1)}, y1=
                      {box.y1.toFixed(1)}, x2={box.x2.toFixed(1)}, y2=
                      {box.y2.toFixed(1)}
                    </p>
                    <p>
                      Scaled Coords: x1={(box.x1 * scaleX).toFixed(1)}, y1=
                      {(box.y1 * scaleY).toFixed(1)}, x2=
                      {(box.x2 * scaleX).toFixed(1)}, y2=
                      {(box.y2 * scaleY).toFixed(1)}
                    </p>
                  </>
                );
              })()}
            </div>
          )}
      </div>
    </div>
  );
};

export default DebugPanel;
