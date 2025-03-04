import AnnotatedVideoPlayer from './components/AnnotatedVideoPlayer';
import './App.css';

export default function App() {
  const sampleVideoUrl = 'video.mp4';

  return (
    <div className='app-container'>
      <h1>Video Canvas Demo</h1>
      <div className='video-demo-container'>
        <AnnotatedVideoPlayer videoSrc={sampleVideoUrl} />
      </div>
    </div>
  );
}
