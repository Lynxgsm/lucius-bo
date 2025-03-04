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
            const [timestamp, classId, className, confidence, x1, y1, x2, y2] =
              line.split(',');
            return {
              timestamp: parseFloat(timestamp),
              classId: parseInt(classId),
              className,
              confidence: parseFloat(confidence),
              x1: parseFloat(x1),
              y1: parseFloat(y1),
              x2: parseFloat(x2),
              y2: parseFloat(y2),
            };
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

      setOriginalDimensions({
        width: DEFAULT_ORIGINAL_WIDTH,
        height: DEFAULT_ORIGINAL_HEIGHT,
      });

      console.log(
        `Using provided video dimensions: ${DEFAULT_ORIGINAL_WIDTH}x${DEFAULT_ORIGINAL_HEIGHT}`
      );
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
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawBoxes = (boxes: BoundingBox[], color: string) => {
      const threshold = 0.01;
      const matchingBoxes = boxes.filter(
        (box) => Math.abs(box.timestamp - currentTimestamp) <= threshold
      );

      const scaleX = videoDimensions.width / originalDimensions.width;
      const scaleY = videoDimensions.height / originalDimensions.height;

      matchingBoxes.forEach((box) => {
        const scaledX1 = box.x1 * scaleX;
        const scaledY1 = box.y1 * scaleY;
        const scaledX2 = box.x2 * scaleX;
        const scaledY2 = box.y2 * scaleY;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.rect(scaledX1, scaledY1, scaledX2 - scaledX1, scaledY2 - scaledY1);
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '12px Arial';
        ctx.fillText(
          `${box.className} (${Math.round(box.confidence * 100)}%)`,
          scaledX1,
          scaledY1 - 5
        );
      });
    };

    if (damages.length > 0 && showDamage) {
      drawBoxes(damages, 'red');
    }

    if (detections.length > 0 && showDetection) {
      drawBoxes(detections, 'blue');
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
