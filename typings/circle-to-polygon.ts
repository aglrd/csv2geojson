type CircleToPolygon = (coords: number[], radius: number, sides: number) => any;
declare const circleToPolygon: CircleToPolygon;
declare module "circle-to-polygon" {
  export = circleToPolygon;
}
