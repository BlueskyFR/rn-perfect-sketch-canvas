import type { CompletedPoints, Curves, ID } from '../store';
import { lastKeyInMap, lastValueInMap } from './map-utils';

export default function createHistoryStack(current: Curves) {
  const history: Curves = new Map(current) ?? (new Map() as Curves);
  const undoneCurves: Curves = new Map() as Curves;

  function moveCurve(
    from: Curves,
    to: Curves
  ): [ID, CompletedPoints] | undefined {
    // Successive calls to lastKey/ValueInMap are way faster (~10x)
    // than lastItemInMap alone
    const id = lastKeyInMap(from);
    const curveData = lastValueInMap(from);

    if (!id || !curveData) return undefined;

    to.set(id, curveData);
    from.delete(id);

    return [id, curveData];
  }

  return {
    push: (curveID: ID, completedPoints: CompletedPoints) => {
      history.set(curveID, completedPoints);
    },
    undo: (): ID | undefined => moveCurve(history, undoneCurves)?.[0],
    redo: (): [ID, CompletedPoints] | undefined =>
      moveCurve(undoneCurves, history),
    clear: () => history.clear(),
  };
}
