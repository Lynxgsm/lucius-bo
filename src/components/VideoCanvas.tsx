import { useEffect, useRef, useState } from 'react';
import '../styles/VideoCanvas.css';

interface VideoCanvasProps {
    videoSrc: string;
    width?: number;
    height?: number;
}

export default function VideoCanvas({ videoSrc, width = 640, height = 480 }: VideoCanvasProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

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
        const video = videoRef.current;
        if (!video) return;

        if (video.paused || video.ended) {
            video.play();
        } else {
            video.pause();
        }
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
                onClick={togglePlayPause}
            />
            <div className="controls">
                <button onClick={togglePlayPause}>
                    {isPlaying ? 'Pause' : 'Play'}
                </button>
            </div>
        </div>
    );
} 