import { useEffect, useRef, useState } from 'react';
import '../styles/VideoCanvas.css';

interface CanvasDrawDemoProps {
    videoSrc: string;
    width?: number;
    height?: number;
}

export default function CanvasDrawDemo({ videoSrc, width = 640, height = 480 }: CanvasDrawDemoProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPosRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas) return;

        // Set canvas dimensions to match video
        canvas.width = width;
        canvas.height = height;

        // Handle video play/pause state
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);

        return () => {
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
        };
    }, [width, height]);

    const togglePlayPause = () => {
        if (isDrawMode) return; // Don't toggle play/pause in draw mode

        const video = videoRef.current;
        if (!video) return;

        if (video.paused || video.ended) {
            video.play();
        } else {
            video.pause();
        }
    };

    const toggleDrawMode = () => {
        setIsDrawMode(!isDrawMode);

        // Update canvas pointer events
        if (canvasRef.current) {
            canvasRef.current.style.pointerEvents = !isDrawMode ? 'auto' : 'none';
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, width, height);
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawMode) return;

        setIsDrawing(true);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        lastPosRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawMode || !isDrawing) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;

        const rect = canvas.getBoundingClientRect();
        const currentPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Draw line
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke();

        lastPosRef.current = currentPos;
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
    };

    return (
        <div className="video-canvas-container">
            <video
                ref={videoRef}
                src={videoSrc}
                width={width}
                height={height}
                onClick={togglePlayPause}
            />
            <canvas
                ref={canvasRef}
                className="canvas-overlay"
                onClick={isDrawMode ? undefined : togglePlayPause}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
            <div className="controls">
                <button onClick={togglePlayPause} disabled={isDrawMode}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button onClick={toggleDrawMode}>
                    {isDrawMode ? 'Exit Draw Mode' : 'Draw Mode'}
                </button>
                <button onClick={clearCanvas} disabled={!isDrawMode}>
                    Clear Canvas
                </button>
            </div>
        </div>
    );
} 