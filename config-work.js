/*

Robot manipulation functions (mostly)

*/

// returns a line segment in wrold units that represents
// the arm starting at (wx, wy) with length and angle from 
// the positive horizontal
function arm(x1, y1, theta, len) {
  var dx = Math.cos(theta) * len;
  var dy = Math.sin(theta) * len;
  var x2 = wx + dx;
  var y2 = wy + dy;
  return { x1: wx, y1: wy, x2: wx + dx, y2: wy + dy };
}

// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
function intersects(a, b, c, d, p, q, r, s) {
  var det, gamma, lambda;
  det = (c - a) * (s - q) - (r - p) * (d - b);
  if (det === 0) {
    return false;
  } else {
    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
    return 0 < lambda && lambda < 1 && (0 < gamma && gamma < 1);
  }
}

// returns true if any of the boxes (obstacles) in the workspace
// intersects with line segment
function hitAnyBlock(segment) {
  for (var b = 0; b < blocks.length; b++) {
    if (hitBlock(segment, b)) return true;
  }
  return false;
}

// returns true if the line segment intersects with any of the 
// box's line segments.
function hitBlock(segment, b) {
  var block = blocks[b];
  var bottom = intersects(
    segment.x1,
    segment.y1,
    segment.x2,
    segment.y2,
    block.x1,
    block.y1,
    block.x2,
    block.y1
  );
  var top = intersects(
    segment.x1,
    segment.y1,
    segment.x2,
    segment.y2,
    block.x1,
    block.y2,
    block.x2,
    block.y2
  );
  var left = intersects(
    segment.x1,
    segment.y1,
    segment.x2,
    segment.y2,
    block.x1,
    block.y1,
    block.x1,
    block.y2
  );
  var right = intersects(
    segment.x1,
    segment.y1,
    segment.x2,
    segment.y2,
    block.x2,
    block.y1,
    block.x2,
    block.y2
  );
  return bottom | top | left | right;
}

// returns true if the line segment intersects with any of the 
// the workspace's walls, floor or ceiling.
function hitWall(segment) {
  var left = segment.x2 <= 0;
  var right = segment.x2 >= worldWidth;
  var top = segment.y2 >= worldHeight;
  var bottom = segment.y2 <= 0;
  return left || right || top || bottom;
}
