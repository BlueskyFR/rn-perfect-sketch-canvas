import type { Color, SkImage } from '@shopify/react-native-skia';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ID, CompletedPoints, CurvesDump } from '../../store';

export enum ImageFormat {
  PNG,
  JPEG,
  WEBP,
}

export type StrokeStyle = 'stroke' | 'fill';

export interface SketchCanvasRef {
  reset: () => void;
  undo: () => void;
  redo: () => void;
  toBase64: (format?: ImageFormat, quality?: number) => string | undefined;
  toImage: () => SkImage | undefined;
  toSvg: (width: number, height: number, backgroundColor?: string) => string;
  toPoints: () => CurvesDump;
  addPoints: (curves: CurvesDump) => void;
  delete: (ids: ID[]) => void;
}

export interface SketchCanvasProps {
  strokeWidth?: number;
  strokeColor?: Color;
  strokeStyle?: 'stroke' | 'fill';
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  topChildren?: React.ReactNode;
  onDraw?: (id: ID, points: CompletedPoints, finished: boolean) => void;
  onDelete?: (ids: ID[]) => void;
}

export type Point = [number, number];
