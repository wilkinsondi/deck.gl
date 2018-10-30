// All utility mehtods needed to implement Marching Squres algorithm
// Ref: https://en.wikipedia.org/wiki/Marching_squares
import assert from 'assert';
import {log} from '@deck.gl/core';

// Table to map code to the intersection offsets
// All offsets are relative to the center of marching cell (which is top right corner of grid-cell)
const OFFSET = {
  N: [0, 0.5], // NORTH
  E: [0.5, 0], // EAST
  S: [0, -0.5], // SOUTH
  W: [-0.5, 0], // WEST
  C: [0, 0] // CURRENT
};

// Note: above wiki page invertes white/black dots for generating the code, we don't
const ISOLINES_CODE_OFFSET_MAP = {
  // key is equal to the code of 4 vertices (invert the code specified in wiki)
  // value can be an array or an Object
  // Array : [line1] or [line1, line2], where each line is [start-point, end-point], and each point is [x, y]
  // Object : to handle saddle cases, whos output depends on mean value of all 4 corners
  //  key: code of mean value (0 or 1)
  //  value: Array , as above defines one or two line segments
  0: [],
  1: [[OFFSET.W, OFFSET.S]],
  2: [[OFFSET.S, OFFSET.E]],
  3: [[OFFSET.W, OFFSET.E]],
  4: [[OFFSET.N, OFFSET.E]],
  5: {
    0: [[OFFSET.W, OFFSET.N], [OFFSET.S, OFFSET.E]],
    1: [[OFFSET.W, OFFSET.S], [OFFSET.N, OFFSET.E]]
  },
  6: [[OFFSET.N, OFFSET.S]],
  7: [[OFFSET.W, OFFSET.N]],
  8: [[OFFSET.W, OFFSET.N]],
  9: [[OFFSET.N, OFFSET.S]],
  10: {
    0: [[OFFSET.W, OFFSET.S], [OFFSET.N, OFFSET.E]],
    1: [[OFFSET.W, OFFSET.N], [OFFSET.S, OFFSET.E]]
  },
  11: [[OFFSET.N, OFFSET.E]],
  12: [[OFFSET.W, OFFSET.E]],
  13: [[OFFSET.S, OFFSET.E]],
  14: [[OFFSET.W, OFFSET.S]],
  15: []
};

const ISOBANDS_CODE_OFFSET_MAP = {
  // Follows the same order as in above mentioned wiki page.
  // Each case has its code on first commented line // T,TR,R,C
  // where T: Top, TR: Top-right, R: Right and C: current, each will be either 0, 1 or 2
  // final code is binary represenation of above code , where takes 2 digits
  // for example:  code 2-2-2-1 => 10-10-10-01 => 10101001 => 169

  // no contours
  // 0000
  0: [],
  170: [], // 2222

  // single triangle

  // 2221
  169: [[OFFSET.C, OFFSET.N, OFFSET.E]]
  // 2212
  // 166:
  // 2122
  // 1222
  // 0001
  // 0010
  // 0100
  // 1000

  // single trapezoid
  // 2220
  // 2202
  // 2022
  // 0222
  // 0002
  // 0020
  // 0200
  // 2000

  // single rectangle
  // 0011
  // 0110
  // 1100
  // 1001
  // 2211
  // 2112
  // 1122
  // 1221
  // 2200
  // 2002
  // 0022
  // 0220

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
  const code = (top << 3) | (topRight << 2) | (right << 1) | current;
  assert(code >= 0 && code < 16);

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
export function getVertices({gridOrigin, cellSize, x, y, code, meanCode}) {
  let offsets = ISOLINES_CODE_OFFSET_MAP[code];

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

  const vertices = [];
  offsets.forEach(xyOffsets => {
    xyOffsets.forEach(offset => {
      const vX = refVertexX + offset[0] * cellSize[0];
      const vY = refVertexY + offset[1] * cellSize[1];
      vertices.push([vX, vY]);
    });
  });

  return vertices;
}

export function generateIsoBands(opts) {}
