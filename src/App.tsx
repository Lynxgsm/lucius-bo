import { useState } from 'react';
import VideoCanvas from './components/VideoCanvas';
import CanvasDrawDemo from './components/CanvasDrawDemo';
import AnnotatedVideoPlayer from './components/AnnotatedVideoPlayer';
import './App.css';

type DemoMode = 'basic' | 'draw' | 'annotated';

export default function App() {
  const [demoMode, setDemoMode] = useState<DemoMode>('basic');

  const sampleVideoUrl = "video.mp4";

  return (
    <div className="app-container">
      <h1>Video Canvas Demo</h1>

      <div className="demo-selector">
        <button
          className={demoMode === 'basic' ? 'active' : ''}
          onClick={() => setDemoMode('basic')}
        >
          Basic Video + Canvas
        </button>
        <button
          className={demoMode === 'draw' ? 'active' : ''}
          onClick={() => setDemoMode('draw')}
        >
          Drawing Demo
        </button>
        <button
          className={demoMode === 'annotated' ? 'active' : ''}
          onClick={() => setDemoMode('annotated')}
        >
          Annotations Demo
        </button>
      </div>

      <div className="video-demo-container">
        {demoMode === 'basic' ? (
          <div>
            <h2>Basic Video with Canvas Overlay</h2>
            <p>This demo shows a video with a transparent canvas overlay.</p>
            <VideoCanvas videoSrc={sampleVideoUrl} />
          </div>
        ) : demoMode === 'draw' ? (
          <div>
            <h2>Drawing on Video Demo</h2>
            <p>Click "Draw Mode" to enable drawing on the canvas. Click "Clear Canvas" to erase all drawings.</p>
            <CanvasDrawDemo videoSrc={sampleVideoUrl} />
          </div>
        ) : (
          <div>
            <h2>Video with Detections and Damages</h2>
            <p>This demo shows a video with detection and damage annotations from text files. Use the buttons to toggle visibility.</p>
            <AnnotatedVideoPlayer videoSrc={sampleVideoUrl} />
          </div>
        )}
      </div>

      <div className="instructions">
        <h3>How it works:</h3>
        {demoMode === 'basic' && (
          <p>
            This demo showcases how to position a canvas element directly on top of a video element.
            The canvas is absolutely positioned with the same dimensions as the video, allowing for
            interactive overlays, annotations, or effects.
          </p>
        )}
        {demoMode === 'draw' && (
          <p>
            In the drawing demo, you can toggle between normal video playback and a drawing mode
            where you can annotate the video with red lines.
          </p>
        )}
        {demoMode === 'annotated' && (
          <p>
            The annotations demo reads detection and damage data from text files in the assets folder.
            Each file contains timestamp and coordinate data that indicates when and where to draw rectangles.
            The buttons let you toggle between showing detection rectangles (green), damage rectangles (red),
            both types, or none at all.
          </p>
        )}
      </div>
    </div>
  );
}