// Types for our data
export interface AnnotationData {
  timestamp: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export type AnnotationType = 'detection' | 'damage';

// Function to fetch and parse the text files
export async function fetchAnnotationData(type: AnnotationType): Promise<AnnotationData[]> {
  try {
    const fileName = type === 'detection' ? 'detection.txt' : 'damage.txt';
    const response = await fetch(`/assets/${fileName}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}`);
    }
    
    const text = await response.text();
    return parseAnnotationData(text);
  } catch (error) {
    console.error(`Error fetching ${type} data:`, error);
    return [];
  }
}

// Function to parse the text file content into structured data
function parseAnnotationData(text: string): AnnotationData[] {
  return text
    .split('\n')
    .filter(line => line.trim() !== '')
    .map(line => {
      const [timestamp, x, y, x2, y2, label] = line.split(',');
      const width = Number(x2) - Number(x);
      const height = Number(y2) - Number(y);
      
      return {
        timestamp: Number(timestamp),
        x: Number(x),
        y: Number(y),
        width,
        height,
        label
      };
    });
}

// Function to get annotations at a specific timestamp
export function getAnnotationsAtTime(
  annotations: AnnotationData[], 
  currentTime: number, 
  timeWindow: number = 0.5
): AnnotationData[] {
  return annotations.filter(
    annotation => 
      currentTime >= annotation.timestamp - timeWindow && 
      currentTime <= annotation.timestamp + timeWindow
  );
} 