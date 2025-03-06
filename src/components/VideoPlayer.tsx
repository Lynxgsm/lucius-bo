import { useEffect, useRef, useState } from 'react';
import DebugPanel from './DebugPanel';
import { BoundingBox } from '@/types';

const DEFAULT_ORIGINAL_WIDTH = 480;
const DEFAULT_ORIGINAL_HEIGHT = 848;

const VideoPlayer = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [damages, setDamages] = useState<BoundingBox[]>([]);
  const [detections, setDetections] = useState<BoundingBox[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [originalDimensions, setOriginalDimensions] = useState({
    width: DEFAULT_ORIGINAL_WIDTH,
    height: DEFAULT_ORIGINAL_HEIGHT,
  });
  const [showDebug, setShowDebug] = useState(true);
  const [showDamage, setShowDamage] = useState(true);
  const [showDetection, setShowDetection] = useState(true);

  useEffect(() => {
    const parseBoundingBoxes = async (
      filePath: string
    ): Promise<BoundingBox[]> => {
      try {
        const response = await fetch(filePath);
        const text = await response.text();
        return text
          .split('\n')
          .filter((line) => line.trim() !== '')
          .map((line) => {
            const basicParts = line.split(',');

            const video_size = basicParts[0];

            const timestamp = parseFloat(basicParts[1]);
            const classId = parseInt(basicParts[2]);
            const className = basicParts[3];
            const confidence = parseFloat(basicParts[4]);
            const x1 = parseFloat(basicParts[5]);
            const y1 = parseFloat(basicParts[6]);
            const x2 = parseFloat(basicParts[7]);
            const y2 = parseFloat(basicParts[8]);

            const boundingBox: BoundingBox = {
              video_size,
              timestamp,
              classId,
              className,
              confidence,
              x1,
              y1,
              x2,
              y2,
            };

            if (filePath.includes('damage.txt')) {
              const polygonPart = line.substring(
                line.indexOf(basicParts[8]) + basicParts[8].length
              );

              if (polygonPart.includes(';')) {
                const polygonString = polygonPart.startsWith(',')
                  ? polygonPart.substring(1)
                  : polygonPart;
                const pointPairs = polygonString.split(';');

                const polygonPoints = pointPairs.map((pair) => {
                  const [x, y] = pair.split(',');
                  return {
                    x: parseFloat(x),
                    y: parseFloat(y),
                  };
                });

                boundingBox.polygon_points = polygonPoints;
              }
            }

            return boundingBox;
          });
      } catch (error) {
        console.error(`Error loading data from ${filePath}:`, error);
        return [];
      }
    };

    const loadData = async () => {
      const damageData = await parseBoundingBoxes('./assets/damage.txt');
      const detectionData = await parseBoundingBoxes('./assets/detection.txt');
      setDamages(damageData);
      setDetections(detectionData);

      if (damageData.length > 0) {
        const [width, height] = damageData[0].video_size.split('x').map(Number);

        setOriginalDimensions({
          width,
          height,
        });

        console.log(
          `Using video dimensions from damage.txt: ${width}x${height}`
        );
      } else {
        setOriginalDimensions({
          width: DEFAULT_ORIGINAL_WIDTH,
          height: DEFAULT_ORIGINAL_HEIGHT,
        });

        console.log(
          `Using default video dimensions: ${DEFAULT_ORIGINAL_WIDTH}x${DEFAULT_ORIGINAL_HEIGHT}`
        );
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTimestamp = () => {
      setCurrentTimestamp(video.currentTime);
    };

    video.addEventListener('timeupdate', updateTimestamp);

    return () => {
      video.removeEventListener('timeupdate', updateTimestamp);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateVideoDimensions = () => {
      setVideoDimensions({
        width: video.clientWidth,
        height: video.clientHeight,
      });
    };

    video.addEventListener('loadedmetadata', updateVideoDimensions);
    window.addEventListener('resize', updateVideoDimensions);

    return () => {
      video.removeEventListener('loadedmetadata', updateVideoDimensions);
      window.removeEventListener('resize', updateVideoDimensions);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBoxes = (
      boxes: BoundingBox[],
      color: string,
      isDamage: boolean
    ) => {
      const threshold = 0.01;
      const matchingBoxes = boxes.filter(
        (box) => Math.abs(box.timestamp - currentTimestamp) <= threshold
      );

      const scaleX = videoDimensions.width / originalDimensions.width;
      const scaleY = videoDimensions.height / originalDimensions.height;

      matchingBoxes.forEach((box) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.fillStyle = color;

        if (isDamage && box.polygon_points && box.polygon_points.length > 0) {
          ctx.beginPath();
          const firstPoint = box.polygon_points[0];
          ctx.moveTo(firstPoint.x * scaleX, firstPoint.y * scaleY);

          for (let i = 1; i < box.polygon_points.length; i++) {
            const point = box.polygon_points[i];
            ctx.lineTo(point.x * scaleX, point.y * scaleY);
          }

          ctx.closePath();
          ctx.stroke();
          ctx.fill();

          ctx.font = '12px Arial';
          ctx.fillText(
            `${box.className} (${Math.round(box.confidence * 100)}%)`,
            box.polygon_points[0].x * scaleX,
            box.polygon_points[0].y * scaleY - 5
          );
        } else {
          const scaledX1 = box.x1 * scaleX;
          const scaledY1 = box.y1 * scaleY;
          const scaledX2 = box.x2 * scaleX;
          const scaledY2 = box.y2 * scaleY;

          ctx.beginPath();
          ctx.rect(
            scaledX1,
            scaledY1,
            scaledX2 - scaledX1,
            scaledY2 - scaledY1
          );
          ctx.stroke();

          ctx.font = '12px Arial';
          ctx.fillText(
            `${box.className} (${Math.round(box.confidence * 100)}%)`,
            scaledX1,
            scaledY1 - 5
          );
        }
      });
    };

    if (damages.length > 0 && showDamage) {
      drawBoxes(damages, 'red', true);
    }

    if (detections.length > 0 && showDetection) {
      drawBoxes(detections, 'blue', false);
    }
  }, [
    currentTimestamp,
    damages,
    detections,
    videoDimensions,
    originalDimensions,
    showDamage,
    showDetection,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const resizeCanvas = () => {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
    };

    video.addEventListener('loadedmetadata', resizeCanvas);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      video.removeEventListener('loadedmetadata', resizeCanvas);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleOriginalWidthChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOriginalDimensions({
      ...originalDimensions,
      width: parseInt(e.target.value) || DEFAULT_ORIGINAL_WIDTH,
    });
  };

  const handleOriginalHeightChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setOriginalDimensions({
      ...originalDimensions,
      height: parseInt(e.target.value) || DEFAULT_ORIGINAL_HEIGHT,
    });
  };

  return (
    <div>
      <div className='video-container' style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          src='./video.mp4'
          controls
          style={{ width: '100%' }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      <div className='controls'>
        <div className='toggle-control'>
          <label>
            <input
              type='checkbox'
              checked={showDamage}
              onChange={() => setShowDamage(!showDamage)}
            />
            <div
              className='color-box'
              style={{
                backgroundColor: 'red',
                width: '15px',
                height: '15px',
                display: 'inline-block',
                marginRight: '5px',
                border: '1px solid #333',
              }}
            ></div>
            Show Damages
          </label>
        </div>

        <div className='toggle-control'>
          <label>
            <input
              type='checkbox'
              checked={showDetection}
              onChange={() => setShowDetection(!showDetection)}
            />
            <div
              className='color-box'
              style={{
                backgroundColor: 'blue',
                width: '15px',
                height: '15px',
                display: 'inline-block',
                marginRight: '5px',
                border: '1px solid #333',
              }}
            ></div>
            Show Detections
          </label>
        </div>

        <button
          onClick={() => {
            setShowDamage(true);
            setShowDetection(true);
          }}
        >
          Show All
        </button>

        <button
          onClick={() => {
            setShowDamage(false);
            setShowDetection(false);
          }}
        >
          Hide All
        </button>
      </div>

      <button className='debug-toggle' onClick={() => setShowDebug(!showDebug)}>
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>

      {showDebug && (
        <DebugPanel
          originalDimensions={originalDimensions}
          videoDimensions={videoDimensions}
          currentTimestamp={currentTimestamp}
          showDamage={showDamage}
          showDetection={showDetection}
          damages={damages}
          detections={detections}
          onOriginalWidthChange={handleOriginalWidthChange}
          onOriginalHeightChange={handleOriginalHeightChange}
        />
      )}
    </div>
  );
};

export default VideoPlayer;
