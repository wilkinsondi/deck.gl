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
const ONE6TH = 1/6;
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

// NOTE: vertices are ordered in CCW direction, starting from NW corner

// Triangles
const SW_TRIANGLE = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5];
const SE_TRIANGLE = [OFFSET.S5, OFFSET.S5E5, OFFSET.E5];
const NE_TRIANGLE = [OFFSET.E5, OFFSET.N5E5, OFFSET.N5];
const NW_TRIANGLE = [OFFSET.N5W5, OFFSET.W5, OFFSET.N5];

// Trapezoids
const SW_TRAPEZOID = [[-HALF, ONE6TH], [-HALF, -ONE6TH], [-ONE6TH, -HALF], [ONE6TH, -HALF]];
const SE_TRAPEZOID = [[-ONE6TH, -HALF], [ONE6TH, -HALF], [HALF, -ONE6TH], [HALF, ONE6TH]];
const NE_TRAPEZOID = [[HALF, -ONE6TH], [HALF, ONE6TH], [ONE6TH, HALF], [-ONE6TH, HALF]];
const NW_TRAPEZOID = [[-HALF, ONE6TH], [-HALF, -ONE6TH], [ONE6TH, HALF], [-ONE6TH, HALF]];

// Rectangles
const S_RECTANGLE = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5E5, OFFSET.E5];
const E_RECTANGLE = [OFFSET.S5, OFFSET.S5E5, OFFSET.N5E5, OFFSET.N5];
const N_RECTANGLE = [OFFSET.N5W5, OFFSET.W5, OFFSET.E5, OFFSET.N5E5];
const W_RECTANGLE = [OFFSET.N5W5, OFFSET.S5W5, OFFSET.S5, OFFSET.N5];
const EW_RECTANGEL = [[-HALF, ONE6TH], [-HALF, -ONE6TH], [HALF, -ONE6TH], [HALF, ONE6TH]];
const SN_RECTANGEL = [[-ONE6TH, -HALF], [ONE6TH, -HALF], [ONE6TH, HALF], [-ONE6TH, HALF]];

// Square
const SQUARE = [OFFSET.N5W5, OFFSET.S5W5, OFFSET.S5E5, OFFSET.N5E5];

// Pentagons
const SW_PENTAGON = [OFFSET.N5W5, OFFSET.S5W5, OFFSET.S5E5, OFFSET.E5, OFFSET.N5];
const SE_PENTAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5E5, OFFSET.N5E5, OFFSET.N5];
const NE_PENTAGON = [OFFSET.N5W5, OFFSET.W5, OFFSET.S5, OFFSET.S5E5, OFFSET.N5E5];
const NW_PENTAGON = [OFFSET.N5W5, OFFSET.S5W5, OFFSET.S5, OFFSET.E5, OFFSET.N5E5];

const NW_N_PENTAGON = [OFFSET.N5W5, OFFSET.W5, [HALF, -ONE6TH], [HALF, ONE6TH], OFFSET.N5];
const NE_E_PENTAGON = [[-ONE6TH, -HALF], [ONE6TH, -HALF], OFFSET.E5, OFFSET.N5E5, OFFSET.N5];
const SE_S_PENTAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], OFFSET.S5, OFFSET.S5E5, OFFSET.E5];
const SW_W_PENTAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5, [ONE6TH, HALF], [-ONE6TH, HALF]];

const NW_W_PENTAGON = [OFFSET.N5W5, OFFSET.W5, [-ONE6TH, -HALF], [ONE6TH, -HALF], OFFSET.N5];
const NE_N_PENTAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], OFFSET.E5, OFFSET.N5E5, OFFSET.N5];
const SE_E_PENTAGON = [OFFSET.S5, OFFSET.S5E5, OFFSET.E5, [ONE6TH, HALF], [-ONE6TH, HALF]];
const SW_S_PENTAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5, [HALF, -ONE6TH], [HALF, ONE6TH]];

// Hexagon
const S_HEXAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5E5, OFFSET.E5, [ONE6TH, HALF], [-ONE6TH, HALF]];
const E_HEXAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], OFFSET.S5, OFFSET.S5E5, OFFSET.N5E5, OFFSET.N5];
const N_HEXAGON = [OFFSET.N5W5, OFFSET.W5, [-ONE6TH, -HALF], [ONE6TH, -HALF], OFFSET.E5, OFFSET.N5E5];
const W_HEXAGON = [OFFSET.N5W5, OFFSET.S5W5, OFFSET.S5, [HALF, -ONE6TH], [HALF, ONE6TH], OFFSET.N5];
const SW_NE_HEXAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5, OFFSET.E5, OFFSET.N5E5, OFFSET.N5];
const NW_SE_HEXAGON = [OFFSET.N5W5, OFFSET.W5, OFFSET.S5, OFFSET.S5E5, OFFSET.E5, OFFSET.N5];

// Heptagon (7-sided)
const NE_HEPTAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], [-ONE6TH, -HALF], [ONE6TH, -HALF], OFFSET.E5, OFFSET.N5E5, OFFSET.N5];
const SW_HEPTAGON = [OFFSET.W5, OFFSET.S5W5, OFFSET.S5, [HALF, -ONE6TH], [HALF, ONE6TH], [ONE6TH, HALF], [-ONE6TH, HALF]];
const NW_HEPTAGON = [OFFSET.N5W5, OFFSET.W5, [-ONE6TH, -HALF], [ONE6TH, -HALF], [HALF, -ONE6TH], [HALF, ONE6TH], OFFSET.N5];
const SE_HEPTAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], OFFSET.S5, OFFSET.S5E5, OFFSET.E5, [ONE6TH, HALF], [-ONE6TH, HALF]];

// Octagon
const OCTAGON = [[-HALF, ONE6TH], [-HALF, -ONE6TH], [-ONE6TH, -HALF], [ONE6TH, -HALF], [HALF, -ONE6TH], [HALF, ONE6TH], [ONE6TH, HALF], [-ONE6TH, HALF]];

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
  169: [SW_TRIANGLE],
  // 2212
  166: [SE_TRIANGLE],
  // 2122
  154: [NE_TRIANGLE],
  // 1222
  106: [NW_TRIANGLE],
  // 0001
  1: [SW_TRIANGLE],
  // 0010
  4: [SE_TRIANGLE],
  // 0100
  16: [NE_TRIANGLE],
  // 1000
  64: [NW_TRIANGLE],

  // single trapezoid
  // 2220
  168: [SW_TRAPEZOID],
  // 2202
  162: [SE_TRAPEZOID],
  // 2022
  138: [NE_TRAPEZOID],
  // 0222
  42: [NW_TRAPEZOID],
  // 0002
  2: [SW_TRAPEZOID],
  // 0020
  8: [SE_TRAPEZOID],
  // 0200
  32: [NE_TRAPEZOID],
  // 2000
  128: [NW_TRAPEZOID],

  // single rectangle
  // 0011
  5: [S_RECTANGLE],
  // 0110
  20: [E_RECTANGLE],
  // 1100
  80: [N_RECTANGLE],
  // 1001
  65: [W_RECTANGLE],
  // 2211
  165: [S_RECTANGLE],
  // 2112
  150: [E_RECTANGLE],
  // 1122
  90: [N_RECTANGLE],
  // 1221
  105: [W_RECTANGLE],
  // 2200
  160: [EW_RECTANGEL],
  // 2002
  130: [SN_RECTANGEL],
  // 0022
  10: [EW_RECTANGEL],
  // 0220
  40: [SN_RECTANGEL],

  // single square
  // 1111
  85: [SQUARE],

  // single pentagon
  // 1211
  101: [SW_PENTAGON],

  // 2111
  149: [SE_PENTAGON],

  // 1112
  86: [NE_PENTAGON],

  // 1121
  89: [NW_PENTAGON],

  // 1011
  69: [SW_PENTAGON],

  // 0111
  21: [SE_PENTAGON],

  // 1110
  84: [NE_PENTAGON],

  // 1101
  81: [NW_PENTAGON],

  // 1200
  96: [NW_N_PENTAGON],

  // 0120
  24: [NE_E_PENTAGON],

  // 0012
  6: [SE_S_PENTAGON],

  // 2001
  129: [SW_W_PENTAGON],

  // 1022
  74: [NW_N_PENTAGON],

  // 2102
  146: [NE_E_PENTAGON],

  // 2210
  164: [SE_S_PENTAGON],

  // 0221
  41: [SW_W_PENTAGON],

  // 1002
  66: [NW_W_PENTAGON],

  // 2100
  144: [NE_N_PENTAGON],

  // 0210
  36: [SE_E_PENTAGON],

  // 0021
  9: [SW_S_PENTAGON],

  // 1220
  104: [NW_W_PENTAGON],

  // 0122
  26: [NE_N_PENTAGON],

  // 2012
  134: [SE_E_PENTAGON],

  // 2201
  161: [SW_S_PENTAGON],

  // single hexagon
  // 0211
  37: [S_HEXAGON],

  // 2110
  148: [E_HEXAGON],

  // 1102
  82: [N_HEXAGON],

  // 1021
  73: [W_HEXAGON],

  // 2011
  133: [S_HEXAGON],

  // 0112
  22: [E_HEXAGON],

  // 1120
  88: [N_HEXAGON],

  // 1201
  97: [W_HEXAGON],

  // 2101
  145: [SW_NE_HEXAGON],

  // 0121
  25: [SW_NE_HEXAGON],

  // 1012
  70: [NW_SE_HEXAGON],

  // 1210
  100: [NW_SE_HEXAGON],


  // 6-sided polygons based on mean weight
  // NOTE: merges mean value codes for extreme changes (as per above Wiki doc)
  // 0101
  17: {
    0: [SW_TRIANGLE, NE_TRIANGLE],
    1: [SW_NE_HEXAGON],
    2: [SW_NE_HEXAGON]
  },

  // 1010
  68: {
    0: [NW_TRIANGLE, SE_TRIANGLE],
    1: [NW_SE_HEXAGON],
    2: [NW_SE_HEXAGON]
  },

  // 2121
  153: {
    0: [SW_NE_HEXAGON],
    1: [SW_NE_HEXAGON],
    2: [SW_TRIANGLE, NE_TRIANGLE]
  },


  // 1212
  102: {
    0: [NW_SE_HEXAGON],
    1: [NW_SE_HEXAGON],
    2: [NW_TRIANGLE, SE_TRIANGLE]
  },

  // 7-sided polygons based on mean weight
  // 2120
  152: {
    0: [NE_HEPTAGON],
    1: [NE_HEPTAGON],
    2: [SW_TRAPEZOID, NE_TRIANGLE]
  },


  // 2021
  137: {
    0: [SW_HEPTAGON],
    1: [SW_HEPTAGON],
    2: [SW_TRIANGLE, NE_TRAPEZOID]
  },

  // 1202
  98: {
    0: [NW_HEPTAGON],
    1: [NW_HEPTAGON],
    2: [NW_TRIANGLE, SE_TRAPEZOID]
  },

  // 0212
  38: {
    0: [SE_HEPTAGON],
    1: [SE_HEPTAGON],
    2: [SE_TRIANGLE, NW_TRAPEZOID]
  },

  // 0102
  18: {
    0: [SW_TRAPEZOID, NE_TRIANGLE],
    1: [NE_HEPTAGON],
    2: [NE_HEPTAGON]
  },

  // 0201
  33: {
    0: [SW_TRIANGLE, NE_TRAPEZOID],
    1: [SW_HEPTAGON],
    2: [SW_HEPTAGON]
  },

  // 1020
  72: {
    0: [NW_TRIANGLE, SE_TRAPEZOID],
    1: [NW_HEPTAGON],
    2: [NW_HEPTAGON]
  },

  // 2010
  132: {
    0: [SE_TRIANGLE, NW_TRAPEZOID],
    1: [SE_HEPTAGON],
    2: [SE_HEPTAGON]
  },

  // 8-sided polygons based on mean weight
  // 2020
  136: {
    0: [NW_TRAPEZOID, SE_TRAPEZOID],
    1: [OCTAGON],
    2: [SW_TRAPEZOID, NE_TRAPEZOID]
  },

  // 0202
  34: {
    0: [NE_TRAPEZOID, SW_TRAPEZOID],
    1: [OCTAGON],
    2: [NW_TRAPEZOID, SE_TRAPEZOID]
  }
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
    // code = 130;
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

// ----HACK----
let _hackIndex = 0;
//const _codeArray = Object.keys(ISOBANDS_CODE_OFFSET_MAP).map(x => parseInt(x, 10));
// const _codeArray = [];
// for (const key in ISOBANDS_CODE_OFFSET_MAP) {
//   _codeArray.push(key);
// }
let _meanCode = 0;
const _codeArray = [
  // 0, 170,
  169, 166, 154, 106, /* 1, 4, 16, 64, */
  168, 162, 138, 42, /* 2, 8, 32, 128,*/
  5, 20, 80, 65, /* 165, 150, 90, 105,*/ 160, 130, /* 10, 40,*/
  85,
  101, 149, 86, 89, /* 69, 21, 84, 81,*/ 96, 24, 6, 129, /* 74, 146, 164, 41,*/ 66, 144, 36, 9, /* 104, 26, 134, 161,*/
  37, 148, 82, 73, /* 133, 22, 88, 97,*/ 145, 25, 70, 100,
  17, 68, 153, 102,
  152, 137, 98, 38, /* 18, 33, 72, 132,*/
  136/*, 34*/
]
const ENABLE_HACK = false;
function getHackedOffsets(offsets) {
  if (ENABLE_HACK) {
    console.log(`code: ${_codeArray[_hackIndex]} : ${Math.abs(_codeArray[_hackIndex]).toString(4)} index: ${_hackIndex}`);
    const _code = _codeArray[_hackIndex];
    // _code = 1; // single line segment
    // _code = 5; // two line segments
    // _code = 169; // single polygon
    //_code = 17; // Multi polygon

    offsets = ISOBANDS_CODE_OFFSET_MAP[_code];

    if (!Array.isArray(offsets)) {
      offsets = offsets[_meanCode];
      _meanCode++;
      if (_meanCode > 2) {
        _meanCode = 0;
        _hackIndex++;
      }
    } else {
      _hackIndex++;
    }
    if (_hackIndex >= _codeArray.length) {
      _hackIndex = 0;
    }
    return offsets;
  }
  return offsets;
}
// ----HACK----

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

  offsets = getHackedOffsets(offsets);
  assert(Array.isArray(offsets));
  // console.log(`offsets: ${offsets}`);
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
  console.log(`vertices: ${results}`);

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
