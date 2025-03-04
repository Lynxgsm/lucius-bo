import { useEffect, useRef, useState } from 'react';
import '../styles/VideoCanvas.css';
import {
  AnnotationData,
  fetchAnnotationData,
  getAnnotationsAtTime,
} from '../utils/dataReader';

const COLORS = {
  detection: 'rgba(0, 255, 0, 0.5)',
  damage: 'rgba(255, 0, 0, 0.5)',
};

interface AnnotatedVideoPlayerProps {
  videoSrc: string;
  width?: number;
  height?: number;
}

interface VisibilityOptions {
  showDetections: boolean;
  showDamages: boolean;
}

export default function AnnotatedVideoPlayer({
  videoSrc,
  width = 640,
  height = 480,
}: AnnotatedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [detectionData, setDetectionData] = useState<AnnotationData[]>([]);
  const [damageData, setDamageData] = useState<AnnotationData[]>([]);
  const [visibility, setVisibility] = useState<VisibilityOptions>({
    showDetections: true,
    showDamages: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentAnnotations, setCurrentAnnotations] = useState<{
    detections: AnnotationData[];
    damages: AnnotationData[];
  }>({ detections: [], damages: [] });

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const detections = await fetchAnnotationData('detection');
        const damages = await fetchAnnotationData('damage');
        setDetectionData(detections);
        setDamageData(damages);
      } catch (error) {
        console.error('Error loading annotation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = width;
    canvas.height = height;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleMetadataLoaded = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleMetadataLoaded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleMetadataLoaded);
    };
  }, [width, height]);

  useEffect(() => {
    const currentDetections = visibility.showDetections
      ? getAnnotationsAtTime(detectionData, currentTime)
      : [];

    const currentDamages = visibility.showDamages
      ? getAnnotationsAtTime(damageData, currentTime)
      : [];

    setCurrentAnnotations({
      detections: currentDetections,
      damages: currentDamages,
    });
  }, [currentTime, detectionData, damageData, visibility]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    drawAnnotations(ctx, currentAnnotations.detections, 'detection');

    drawAnnotations(ctx, currentAnnotations.damages, 'damage');
  }, [currentAnnotations, width, height]);

  const drawAnnotations = (
    ctx: CanvasRenderingContext2D,
    annotations: AnnotationData[],
    type: 'detection' | 'damage'
  ) => {
    ctx.strokeStyle = type === 'detection' ? COLORS.detection : COLORS.damage;
    ctx.fillStyle = type === 'detection' ? COLORS.detection : COLORS.damage;
    ctx.lineWidth = 3;

    for (const annotation of annotations) {
      ctx.fillRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );
      ctx.strokeRect(
        annotation.x,
        annotation.y,
        annotation.width,
        annotation.height
      );

      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(
        annotation.label,
        annotation.x,
        annotation.y > 20
          ? annotation.y - 5
          : annotation.y + annotation.height + 15
      );

      ctx.fillStyle = type === 'detection' ? COLORS.detection : COLORS.damage;
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleDetections = () => {
    setVisibility((prev) => ({
      ...prev,
      showDetections: !prev.showDetections,
    }));
  };

  const toggleDamages = () => {
    setVisibility((prev) => ({
      ...prev,
      showDamages: !prev.showDamages,
    }));
  };

  const toggleAll = () => {
    const allVisible = visibility.showDetections && visibility.showDamages;
    setVisibility({
      showDetections: !allVisible,
      showDamages: !allVisible,
    });
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  const detectionCount = currentAnnotations.detections.length;
  const damageCount = currentAnnotations.damages.length;

  return (
    <div className='video-canvas-container'>
      {isLoading && <div className='loading-overlay'>Loading...</div>}

      <video
        ref={videoRef}
        src={videoSrc}
        width={width}
        height={height}
        onClick={togglePlayPause}
      />
      <canvas ref={canvasRef} className='canvas-overlay' />
      <div className='controls-container'>
        <div className='timeline-container'>
          <input
            type='range'
            className='timeline'
            min='0'
            max={duration || 100}
            step='0.1'
            value={currentTime}
            onChange={handleTimelineChange}
          />
          <div className='time-display'>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className='controls'>
          <button onClick={togglePlayPause}>
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={toggleDetections}
            className={visibility.showDetections ? 'active' : ''}
          >
            Detections{' '}
            {visibility.showDetections && detectionCount > 0
              ? `(${detectionCount})`
              : ''}
          </button>
          <button
            onClick={toggleDamages}
            className={visibility.showDamages ? 'active' : ''}
          >
            Damages{' '}
            {visibility.showDamages && damageCount > 0
              ? `(${damageCount})`
              : ''}
          </button>
          <button
            onClick={toggleAll}
            className={
              visibility.showDetections && visibility.showDamages
                ? 'active'
                : ''
            }
          >
            {visibility.showDetections && visibility.showDamages
              ? 'Hide All'
              : 'Show All'}
          </button>
        </div>
      </div>
    </div>
  );
}
