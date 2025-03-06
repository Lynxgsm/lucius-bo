export interface BoundingBox {
  video_size: string;
  timestamp: number;
  classId: number;
  className: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // For polygons (used by damage annotations)
  polygon_points?: { x: number; y: number }[];
}
