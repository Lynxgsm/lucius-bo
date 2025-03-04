export interface BoundingBox {
  timestamp: number;
  classId: number;
  className: string;
  confidence: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}
