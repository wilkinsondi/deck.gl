import * as MarchingSquares from './marching-squares';
import assert from 'assert';

// Given all the cell weights, generates contours for each threshold.
/* eslint-disable max-depth */
export function generateContours({
  thresholds,
  colors,
  cellWeights,
  gridSize,
  gridOrigin,
  cellSize
}) {
  const contourSegments = [];
  const contourTriangles = [];
  const width = gridSize[0];
  const height = gridSize[1];

  thresholds.forEach((threshold, index) => {
    for (let x = -1; x < width; x++) {
      for (let y = -1; y < height; y++) {
        // Get the MarchingSquares code based on neighbor cell weights.
        const {code, meanCode} = MarchingSquares.getCode({
          cellWeights,
          threshold,
          x,
          y,
          width,
          height
        });
        const opts = {
          gridOrigin,
          cellSize,
          x,
          y,
          width,
          height,
          code,
          meanCode
        };
        if (Array.isArray(threshold)) {
          const triangles = MarchingSquares.getTriangles(opts);
          contourTriangles.push({
            vertices: triangles,
            threshold
          });
        } else {
          // Get the intersection vertices based on MarchingSquares code.
          const vertices = MarchingSquares.getVertices(opts);
          // We should always get even number of vertices
          assert(vertices.length % 2 === 0);
          for (let i = 0; i < vertices.length; i += 2) {
            contourSegments.push({
              start: vertices[i],
              end: vertices[i + 1],
              threshold
            });
          }
        }
      }
    }
  });
  return {contourSegments, contourTriangles};
}
/* eslint-enable max-depth */
