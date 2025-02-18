import {
  Canvas,
  Path,
  TouchInfo,
  useCanvasRef,
  useTouchHandler,
} from '@shopify/react-native-skia';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { drawingState, derivedPaths, CurvesDump, ID } from '../../store';
import { useSnapshot } from 'valtio';
import { createHistoryStack, createSvgFromPaths } from '../../utils';
import type { SketchCanvasRef, SketchCanvasProps } from './types';
import { ImageFormat } from './types';
import { STROKE_COLOR, STROKE_STYLE, STROKE_WIDTH } from './constants';

export const SketchCanvas = forwardRef<SketchCanvasRef, SketchCanvasProps>(
  (
    {
      strokeWidth = STROKE_WIDTH,
      strokeColor = STROKE_COLOR,
      strokeStyle = STROKE_STYLE,
      containerStyle,
      children,
      topChildren,
      onDraw,
      onDelete,
      readonly = false,
    },
    ref
  ) => {
    const pathsSnapshot = useSnapshot(derivedPaths);
    const canvasRef = useCanvasRef();
    const history = useMemo(
      () => createHistoryStack(drawingState.completedPoints),
      []
    );

    useEffect(() => {
      drawingState.currentPoints.width = strokeWidth;
    }, [strokeWidth]);

    useImperativeHandle(ref, () => ({
      reset() {
        if (readonly) return;

        drawingState.currentPoints.points = null;

        // .keys() returns an iterator, so we to convert it to an array
        const deletedIDs = Array.from(drawingState.completedPoints.keys());

        drawingState.completedPoints = new Map();
        history.clear();

        // Dispatch event
        onDelete?.(deletedIDs);
      },

      undo() {
        if (readonly) return;

        const id = history.undo();

        if (id === undefined) return;

        drawingState.completedPoints.delete(id);
        // React native does not listen to map/object updates,
        // so we must recreate the map ;
        // this is awful but I am not aware of a better method
        drawingState.completedPoints = new Map(drawingState.completedPoints);
        // Dispatch event
        onDelete?.([id]);
      },

      redo() {
        if (readonly) return;

        const curve = history.redo();
        if (curve === undefined) return;

        drawingState.completedPoints.set(...curve);
        // React native does not listen to map/object updates,
        // so we must recreate the map ;
        // this is awful but I am not aware of a better method
        drawingState.completedPoints = new Map(drawingState.completedPoints);

        // Dispatch event
        onDraw?.(...curve, true);
      },

      toBase64: (format, quality) => {
        const image = canvasRef.current?.makeImageSnapshot();
        if (image) {
          return image.encodeToBase64(
            format ?? ImageFormat.PNG,
            quality ?? 100
          );
        }
        return undefined;
      },

      toImage: () => {
        return canvasRef.current?.makeImageSnapshot();
      },

      toSvg: (width, height, backgroundColor) => {
        return createSvgFromPaths(derivedPaths.completed, {
          width,
          height,
          backgroundColor,
        });
      },

      toPoints: () => Array.from(drawingState.completedPoints.entries()),

      addPoints: (curves: CurvesDump) => {
        drawingState.completedPoints = new Map([
          ...drawingState.completedPoints,
          ...curves,
        ]);
      },

      delete: (ids: ID[]) => {
        for (const id of ids) drawingState.completedPoints.delete(id);

        drawingState.completedPoints = new Map(drawingState.completedPoints);
      },
    }));

    const touchHandler = useTouchHandler(
      {
        onStart: (touchInfo: TouchInfo) => {
          drawingState.isDrawing = true;
          drawingState.currentPoints = {
            ...drawingState.currentPoints,
            id: touchInfo.timestamp,
            points: [[touchInfo.x, touchInfo.y]],
          };

          onDraw?.(
            touchInfo.timestamp,
            {
              points: [[touchInfo.x, touchInfo.y]],
              width: drawingState.currentPoints.width,
              color: strokeColor,
              style: strokeStyle,
            },
            false
          );
        },
        onActive: (touchInfo: TouchInfo) => {
          if (
            !drawingState.isDrawing ||
            drawingState.currentPoints.id === null
          ) {
            return;
          }

          drawingState.currentPoints.points = [
            ...(drawingState.currentPoints.points ?? []),
            [touchInfo.x, touchInfo.y],
          ];

          onDraw?.(
            drawingState.currentPoints.id,
            {
              points: drawingState.currentPoints.points,
              width: drawingState.currentPoints.width,
              color: strokeColor,
              style: strokeStyle,
            },
            false
          );
        },
        onEnd: (_: TouchInfo) => {
          drawingState.isDrawing = false;

          if (
            !drawingState.currentPoints.points ||
            drawingState.currentPoints.id === null
          ) {
            return;
          }

          const curveData = {
            points: drawingState.currentPoints.points,
            width: drawingState.currentPoints.width,
            color: strokeColor,
            style: strokeStyle,
          };

          drawingState.completedPoints.set(
            drawingState.currentPoints.id,
            curveData
          );
          drawingState.currentPoints.points = null;

          history.push(drawingState.currentPoints.id, curveData);
          // Dispatch event
          onDraw?.(drawingState.currentPoints.id, curveData, true);
        },
      },
      [strokeColor, strokeStyle]
    );

    return (
      <Canvas
        ref={canvasRef}
        onTouch={readonly ? undefined : touchHandler}
        style={containerStyle}
      >
        {children}
        {pathsSnapshot.completed.map((path) => (
          <Path
            path={path.path}
            key={path.id}
            style={path.style}
            color={path.color}
          />
        ))}
        {pathsSnapshot.current ? (
          <Path
            path={pathsSnapshot.current}
            color={strokeColor}
            style={strokeStyle}
          />
        ) : (
          <></>
        )}
        {topChildren}
      </Canvas>
    );
  }
);
