import getStroke from 'perfect-freehand';
import { STROKE_WIDTH } from '../components/SketchCanvas/constants';
import type {
  Point,
  SketchCanvasProps,
} from '../components/SketchCanvas/types';
import { getSvgPathFromStroke } from '../utils';
import { proxy } from 'valtio';
import { derive } from 'valtio/utils';

export type ID = number;

export interface CompletedPoints {
  points: Point[];
  color: SketchCanvasProps['strokeColor'];
  width: SketchCanvasProps['strokeWidth'];
  style: SketchCanvasProps['strokeStyle'];
}

export type Curves = Map<ID, CompletedPoints>;
export type CurvesDump = [ID, CompletedPoints][];

export const drawingState = proxy({
  isDrawing: false,
  currentPoints: { id: null, points: null, strokeWidth: STROKE_WIDTH } as {
    id: number | null;
    points: Point[] | null;
    width?: SketchCanvasProps['strokeWidth'];
  },
  completedPoints: new Map() as Curves,
});

export const derivedPaths = derive({
  current: (get) =>
    get(drawingState).currentPoints.points !== null
      ? getSvgPathFromStroke(
          getStroke(get(drawingState).currentPoints.points!, {
            size: get(drawingState).currentPoints.width,
          })
        )
      : null,
  completed: (get) => {
    return Array.from(
      get(drawingState).completedPoints.entries(),
      ([id, curveData]) => {
        const { points, width, ...rest } = curveData;
        return {
          path: getSvgPathFromStroke(
            getStroke(points, {
              size: width,
            })
          ),
          id,
          ...rest,
        };
      }
    );
  },
});
