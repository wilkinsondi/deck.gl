// All utility mehtods needed to implement Marching Squres algorithm
// Ref: https://en.wikipedia.org/wiki/Marching_squares
import assert from 'assert';
import {log} from '@deck.gl/core';

export const CONTOUR_TYPE = {
  ISO_LINES: 1,
  ISO_BANDS: 2
};

// Table to map code to the intersection offsets
// All offsets are relative to the center of marching cell (which is top right corner of grid-cell, and center of marching-square)
const HALF = 0.5;
const ONE3RD = 0.3
const TWO3RD = 0.6;
const OFFSET = {
  // NORTH
  N5: [0, HALF],
  N3: [0, ONE3RD],
  N6: [0, TWO3RD],

  // EAST
  E5: [HALF, 0],
  E3: [ONE3RD, 0],
  E6: [TWO3RD, 0],

  // SOUTH
  S5: [0, -HALF],
  S3: [0, -ONE3RD],
  S6: [0, -TWO3RD],

  // WEST
  W5: [-HALF, 0],
  W3: [-ONE3RD, 0],
  W6: [-TWO3RD, 0],

  // CORNERS
  // TODO: WE NEED all combinations like N3E5, N6E5 etc
  N5E5: [HALF, HALF],
  N5W5: [-HALF, HALF],
  S5E5: [HALF, -HALF],
  S5W5: [-HALF, -HALF]
};

// Note: above wiki page invertes white/black dots for generating the code, we don't
const ISOLINES_CODE_OFFSET_MAP = {
  // key is equal to the code of 4 vertices (invert the code specified in wiki)
  // value can be an array or an Object
  // Array : [linE3] or [linE3, linE6], where each line is [start-point, end-point], and each point is [x, y]
  // Object : to handle saddle cases, whos output depends on mean value of all 4 corners
  //  key: code of mean value (0 or 1)
  //  value: Array , as above defines one or two line segments
  0: [],
  1: [[OFFSET.W5, OFFSET.S5]],
  2: [[OFFSET.S5, OFFSET.E5]],
  3: [[OFFSET.W5, OFFSET.E5]],
  4: [[OFFSET.N5, OFFSET.E5]],
  5: {
    0: [[OFFSET.W5, OFFSET.N5], [OFFSET.S5, OFFSET.E5]],
    1: [[OFFSET.W5, OFFSET.S5], [OFFSET.N5, OFFSET.E5]]
  },
  6: [[OFFSET.N5, OFFSET.S5]],
  7: [[OFFSET.W5, OFFSET.N5]],
  8: [[OFFSET.W5, OFFSET.N5]],
  9: [[OFFSET.N5, OFFSET.S5]],
  10: {
    0: [[OFFSET.W5, OFFSET.S5], [OFFSET.N5, OFFSET.E5]],
    1: [[OFFSET.W5, OFFSET.N5], [OFFSET.S5, OFFSET.E5]]
  },
  11: [[OFFSET.N5, OFFSET.E5]],
  12: [[OFFSET.W5, OFFSET.E5]],
  13: [[OFFSET.S5, OFFSET.E5]],
  14: [[OFFSET.W5, OFFSET.S5]],
  15: []
};

const ISOBANDS_CODE_OFFSET_MAP = {
  // Below list of cases, follow the same order as in above mentioned wiki page.
  // Each case has its code on first commented line // T,TR,R,C
  // where T: Top, TR: Top-right, R: Right and C: current, each will be either 0, 1 or 2
  // final code is binary represenation of above code , where takes 2 digits
  // for example:  code 2-2-2-1 => 10-10-10-01 => 10101001 => 169

  // no contours

  // 0000
  0: [],
  // 2222
  170: [],

  // single triangle

  // 2221
  169: [[OFFSET.S5, OFFSET.S5W5, OFFSET.W5]],
  // 2212
  166: [[OFFSET.E5, OFFSET.S5E5, OFFSET.S5]],
  // 2122
  154: [[OFFSET.N5, OFFSET.N5E5, OFFSET.E5]],
  // 1222
  106: [[OFFSET.N5W5, OFFSET.N5, OFFSET.W5]],
  // 0001
  1: [[OFFSET.S5, OFFSET.S5W5, OFFSET.W5]],
  // 0010
  4: [[OFFSET.E5, OFFSET.S5E5, OFFSET.S5]],
  // 0100
  16: [[OFFSET.N5, OFFSET.N5E5, OFFSET.E5]],
  // 1000
  64: [[OFFSET.N5W5, OFFSET.N5, OFFSET.W5]],

  // single trapezoid
  // 2220
  168: [[OFFSET.E3, OFFSET.N3, OFFSET.N6, OFFSET.E6]],
  // 2202
  162: [[OFFSET.W6, OFFSET.N6, OFFSET.N3, OFFSET.W3]],
  // 2022
  138: [[OFFSET.W6, OFFSET.N6, OFFSET.S3, OFFSET.S6]],
  // 0222
  42: [[OFFSET.E3, OFFSET.E6, OFFSET.S6, OFFSET.S3]],
  // 0002
  2: [[OFFSET.E3, OFFSET.N3, OFFSET.N6, OFFSET.E6]],
  // 0020
  8: [[OFFSET.W6, OFFSET.N6, OFFSET.N3, OFFSET.W3]],
  // 0200
  32: [[OFFSET.W6, OFFSET.N6, OFFSET.S3, OFFSET.S6]],
  // 2000
  128: [[OFFSET.E3, OFFSET.E6, OFFSET.S6, OFFSET.S3]],

  // // single rectangle
  // // 0011
  // 5: [[OFFSET.C, OFFSET.N5, OFFSET.S6, OFFSET.S3]],
  // // 0110
  // 20:
  // // 1100
  // 80:
  // // 1001
  // 65:
  // // 2211
  // 165:
  // // 2112
  // 150:
  // // 1122
  // 90:
  // // 1221
  // 105:
  // // 2200
  // 160:
  // // 2002
  // 130:
  // // 0022
  // 10:
  // // 0220
  // 40:

  // single square
  // 1111

  // single pentagon
  // 1211
  // 2111
  // 1112
  // 1121
  // 1011
  // 0111
  // 1110
  // 1101
  // 1200
  // 0120
  // 0012
  // 2001
  // 1022
  // 2102
  // 2210
  // 0221
  // 1002
  // 2100
  // 0210
  // 0021
  // 1220
  // 0122
  // 2012
  // 2201

  // single hexagon
  // 0211
  // 2110
  // 1102
  // 1021
  // 2011
  // 0112
  // 1120
  // 1201
  // 2101
  // 0121
  // 1012
  // 1210

  // 6-sided polygons based on mean weight
  // 0101
  // 1010
  // 2121
  // 1212

  // 7-sided polygons based on mean weight
  // 2120
  // 2021
  // 1202
  // 0212
  // 0102
  // 0201
  // 1020
  // 2010

  // 8-sided polygons based on mean weight
  // 2020
  // 0202
};

// Utility methods

function getVertexCode({weight, threshold}) {
  // threshold must be a single value or a range (array of size 2)
  assert(Number.isFinite(threshold) || (Array.isArray(threshold) && threshold.length > 1));

  // Iso-bands
  if (Array.isArray(threshold)) {
    if (weight < threshold[0]) {
      return 0;
    }
    return weight <= threshold[1] ? 1 : 2;
  }
  // Iso-lines
  return weight >= threshold ? 1 : 0;
}

// Returns marching square code for given cell
/* eslint-disable complexity, max-statements*/
export function getCode(opts) {
  // Assumptions
  // Origin is on bottom-left , and X increase to right, Y to top
  // When processing one cell, we process 4 cells, by extending row to top and on column to right
  // to create a 2X2 cell grid
  const {cellWeights, x, y, width, height} = opts;
  let threshold = opts.threshold;
  if (opts.thresholdValue) {
    log.deprecated('thresholdValue', 'threshold')();
    threshold = opts.thresholdValue;
  }

  assert(x >= -1 && x < width);
  assert(y >= -1 && y < height);

  const isLeftBoundary = x < 0;
  const isRightBoundary = x >= width - 1;
  const isBottomBoundary = y < 0;
  const isTopBoundary = y >= height - 1;
  const isBoundary = isLeftBoundary || isRightBoundary || isBottomBoundary || isTopBoundary;

  const weights = {};
  const codes = {};

  // TOP
  if (isLeftBoundary || isTopBoundary) {
    codes.top = 0;
  } else {
    weights.top = cellWeights[(y + 1) * width + x];
    codes.top = getVertexCode({weight: weights.top, threshold});
  }

  // TOP-RIGHT
  if (isRightBoundary || isTopBoundary) {
    codes.topRight = 0;
  } else {
    weights.topRight = cellWeights[(y + 1) * width + x + 1];
    codes.topRight = getVertexCode({weight: weights.topRight, threshold});
  }

  // RIGHT
  if (isRightBoundary) {
    codes.right = 0;
  } else {
    weights.right = cellWeights[y * width + x + 1];
    codes.right = getVertexCode({weight: weights.right, threshold});
  }

  // CURRENT
  if (isLeftBoundary || isBottomBoundary) {
    codes.current = 0;
  } else {
    weights.current = cellWeights[y * width + x];
    codes.current = getVertexCode({weight: weights.current, threshold});
  }

  const {top, topRight, right, current} = codes;
  let code = -1;
  if (Number.isFinite(threshold)) {
    code = (top << 3) | (topRight << 2) | (right << 1) | current;
    // // _HACK-
    // code = 7;
  }
  if (Array.isArray(threshold)) {
    code = (top << 6) | (topRight << 4) | (right << 2) | current;
    // // _HACK_
    // code = 106;
  }
  assert(code >= 0);
  // let codeIsValid = false;
  // if (Number.isFinite(threshold)) {
  //   codeIsValid = code >= 0 && code < 16;
  // }
  // if (Array.isArray(threshold)) {
  //   codeIsValid =
  // }

  let meanCode = 0;
  // meanCode is only needed for saddle cases, and they should
  // only occur when we are not processing a cell on boundary
  // because when on a boundary either, bottom-row, top-row, left-column or right-column will have both 0 codes
  if (!isBoundary) {
    assert(
      Number.isFinite(weights.top) &&
        Number.isFinite(weights.topRight) &&
        Number.isFinite(weights.right) &&
        Number.isFinite(weights.current)
    );
    meanCode = getVertexCode({
      weight: (weights.top + weights.topRight + weights.right + weights.current) / 4,
      threshold
    });
  }

  return {code, meanCode};
}
/* eslint-enable complexity, max-statements*/

// Returns intersection vertices for given cellindex
// [x, y] refers current marchng cell, reference vertex is always top-right corner
export function getVertices(opts) {
  const {gridOrigin, cellSize, x, y, code, meanCode, type = CONTOUR_TYPE.ISO_LINES} = opts;
  let offsets;

  switch(type) {
    case CONTOUR_TYPE.ISO_LINES:
      offsets = ISOLINES_CODE_OFFSET_MAP[code];
    break;
    case CONTOUR_TYPE.ISO_BANDS:
      offsets = ISOBANDS_CODE_OFFSET_MAP[code];
    break;
    default:
      assert(false);
  };

  assert(offsets);
  // handle saddle cases
  if (!Array.isArray(offsets)) {
    offsets = offsets[meanCode];
  }

  assert(Array.isArray(offsets));

  // Reference vertex is at top-right move to top-right corner
  assert(x >= -1);
  assert(y >= -1);

  const rX = (x + 1) * cellSize[0];
  const rY = (y + 1) * cellSize[1];

  const refVertexX = gridOrigin[0] + rX;
  const refVertexY = gridOrigin[1] + rY;

  // offsets format
  // ISO_LINES: [[1A, 1B], [2A, 2B]],
  // ISO_BANDS: [[1A, 1B, 1C, ...], [2A, 2B, 2C, ...]],

  // vertices format

  // ISO_LINES: [[x1A, y1A], [x1B, y1B], [x2A, x2B], ...],

  // ISO_BANDS:  => confirms to SolidPolygonLayer's simple polygon format
  //      [
  //        [[x1A, y1A], [x1B, y1B], [x1C, y1C] ... ],
  //        ...
  //      ]

  let results;
  switch(type) {
    case CONTOUR_TYPE.ISO_LINES:
      const vertices = [];
      offsets.forEach(xyOffsets => {
        xyOffsets.forEach(offset => {
          const vX = refVertexX + offset[0] * cellSize[0];
          const vY = refVertexY + offset[1] * cellSize[1];
          vertices.push([vX, vY]);
        });
      });
      results = vertices;
    break;
    case CONTOUR_TYPE.ISO_BANDS:
    const polygons = [];
      offsets.forEach(polygonOffsets => {
        const polygon = [];
        polygonOffsets.forEach(xyOffset => {
          const vX = refVertexX + xyOffset[0] * cellSize[0];
          const vY = refVertexY + xyOffset[1] * cellSize[1];
          polygon.push([vX, vY]);
        });
        polygons.push(polygon);
      });
      results = polygons;
    break;
    default:
      assert(false);
    break;
  }
  return results;
}

export function getTriangles(opts) {
  const {gridOrigin, cellSize, x, y, code, meanCode} = opts;
  let offsets = ISOBANDS_CODE_OFFSET_MAP[code];

  // handle saddle cases
  if (!Array.isArray(offsets)) {
    offsets = offsets[meanCode];
  }

  assert(Array.isArray(offsets));

  // Reference vertex is at top-right move to top-right corner
  assert(x >= -1);
  assert(y >= -1);

  const rX = (x + 1) * cellSize[0];
  const rY = (y + 1) * cellSize[1];

  const refVertexX = gridOrigin[0] + rX;
  const refVertexY = gridOrigin[1] + rY;

  const triangles = [];
  // offsets: [[OFFSET.C, OFFSET.N5, OFFSET.E]],
  offsets.forEach(triangleOffsets => {
    const triangle = [];
    triangleOffsets.forEach(xyOffset => {
      const vX = refVertexX + xyOffset[0] * cellSize[0];
      const vY = refVertexY + xyOffset[1] * cellSize[1];
      triangle.push([vX, vY]);
    });
    triangles.push(triangle);
  });

  return triangles;
}
