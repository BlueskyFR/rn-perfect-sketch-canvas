export const lastItemInMap = (map: Map<any, any>) => Array.from(map).pop();
export const lastKeyInMap = (map: Map<any, any>) => [...map.keys()].pop();
export const lastValueInMap = (map: Map<any, any>) => [...map.values()].pop();
