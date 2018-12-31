function _cx(wrX) {
  return (wrX * canvasWidth) / worldWidth;
}

function _cy(wrY) {
  return canvasHeight - (wrY * canvasHeight) / worldHeight;
}

function _wx(cvX) {
  return (cvX * worldWidth) / canvasWidth;
}

function _wy(cvY) {
  return (worldHeight * (canvasHeight - cvY)) / canvasHeight;
}

function _block(wx, wy) {
  var x1 = _cx(wx);
  var y1 = _cy(wy);
  var w = canvasWidth / worldWidth;
  var h = -canvasHeight / worldHeight;
  ctxWorkspace.save();
  ctxWorkspace.fillStyle = "darkgray";
  ctxWorkspace.fillRect(x1, y1, w, h);
  ctxWorkspace.restore();
}

function rectangle(p1x, p1y, p2x, p2y, color) {
  ctxWorkspace.save();
  ctxWorkspace.strokeStyle = color;
  var x1 = _cx(p1x);
  var y1 = _cy(p1y);
  var w = _cx(p2x) - x1;
  var h = _cy(p2y) - y1;
  ctxWorkspace.strokeRect(x1, y1, w, h);
  ctxWorkspace.restore();
}

function circle(wx, wy, wr, color) {
  ctxWorkspace.save();
  ctxWorkspace.beginPath();
  var x = _cx(wx);
  var y = _cy(wy);
  var r = _cx(wr); // since a circle doesn't matter skew
  ctxWorkspace.strokeStyle = color;
  ctxWorkspace.arc(x, y, r, 0, 2 * Math.PI, false);
  ctxWorkspace.stroke();
  ctxWorkspace.restore();
}

function line(px1, py1, px2, py2, color) {
  var x1 = _cx(px1);
  var y1 = _cy(py1);
  var x2 = _cx(px2);
  var y2 = _cy(py2);
  ctxWorkspace.save();
  ctxWorkspace.strokeStyle = color;
  ctxWorkspace.beginPath();
  ctxWorkspace.moveTo(x1, y1);
  ctxWorkspace.lineTo(x2, y2);
  ctxWorkspace.stroke();
  ctxWorkspace.restore();
}

function point(wx, wy, color) {
  ctxWorkspace.save();
  ctxWorkspace.beginPath();
  var x = _cx(wx);
  var y = _cy(wy);
  ctxWorkspace.strokeStyle = color;
  ctxWorkspace.fillStyle = color;
  ctxWorkspace.arc(x, y, 2, 0, 2 * Math.PI, false);
  ctxWorkspace.fill();
  ctxWorkspace.stroke();
  ctxWorkspace.restore();
}

function drawArm(a, color) {
  var cx1 = _cx(a.x1);
  var cy1 = _cy(a.y1);
  var cx2 = _cx(a.x2);
  var cy2 = _cy(a.y2);

  ctxWorkspace.save();
  ctxWorkspace.strokeStyle = color;
  ctxWorkspace.beginPath();
  ctxWorkspace.moveTo(cx1, cy1);
  ctxWorkspace.lineTo(cx2, cy2);
  ctxWorkspace.stroke();
  ctxWorkspace.restore();

  ctxWorkspace.beginPath();
  ctxWorkspace.strokeStyle = "red";
  ctxWorkspace.fillStyle = "red";
  ctxWorkspace.arc(cx2, cy2, 2, 0, 2 * Math.PI, false);
  ctxWorkspace.fill();
  ctxWorkspace.stroke();
}

function arm(wx, wy, angle, len) {
  var x1 = wx;
  var y1 = wy;
  var dx = Math.cos(angle) * len;
  var dy = Math.sin(angle) * len;
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

function animate() {
  drawNext();
  globalID = requestAnimationFrame(animate);
}

function hitAnyBlock(segment) {
  for (var b = 0; b < blocks.length; b++) {
    if (hitBlock(segment, b)) return true;
  }
  return false;
}

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
    block.y1,
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

function hitWall(segment) {
  var left = segment.x2 <= 0;
  var right = segment.x2 >= worldWidth;
  var top = segment.y2 >= worldHeight;
  var bottom = segment.y2 <= 0;
  return left || right || top || bottom;
}

function drawNext() {
  if (elbowAngle > Math.PI * 2) {
    elbowAngle = 0;
  } else {
    elbowAngle = elbowAngle + deltaElbowDirection * deltaElbowAngle;
  }
  if (shoulderAngle > Math.PI * 2) {
    shoulderAngle = 0;
  } else {
    shoulderAngle = shoulderAngle + deltaShoulderDirection * deltaShoulderAngle;
  }

  animateArm();
}

function animateArm() {
  ctxWorkspace.clearRect(0, 0, canWorkspace.width, canWorkspace.height);
  drawWorkspace();
  // put in blocks
  for (b = 0; b < blocks.length; b++) {
    var block = blocks[b];
    _block(block.x1, block.y1);
  }

  var bs = arm(worldWidth / 2, 0, Math.PI / 2, baseLength);
  var sh = arm(bs.x2, bs.y2, shoulderAngle, shoulderLength);
  var el = arm(sh.x2, sh.y2, elbowAngle, elbowLength);

  if (hitWall(sh) || hitAnyBlock(sh)) {
    shoulderAngle = shoulderAngle - deltaShoulderDirection * deltaShoulderAngle; // back off
    sh = arm(bs.x2, bs.y2, shoulderAngle, shoulderLength);
    deltaShoulderDirection = -deltaShoulderDirection;
  } else if (hitWall(el) || hitAnyBlock(el)) {
    elbowAngle = elbowAngle - deltaElbowDirection * deltaElbowAngle; // back off
    el = arm(sh.x2, sh.y2, elbowAngle, elbowLength);
    deltaElbowDirection = -deltaElbowDirection; // change direction

    shoulderAngle = shoulderAngle - deltaShoulderDirection * deltaShoulderAngle; // back shoulder too
    sh = arm(bs.x2, bs.y2, shoulderAngle, shoulderLength);
  }

  drawArm(bs, "black");
  drawArm(sh, "blue");
  drawArm(el, "green");
  drawControls();
}

function drawConfiguration() {
  for (var x = 0; x < canConfiguration.width; x++) {
    for (var y = 0; y < canConfiguration.height; y++) {
      var s = ((x - canConfiguration.width / 2) * 2 * Math.PI) / canConfiguration.width;
      var e = ((y - canConfiguration.height / 2) * 2 * Math.PI) / canConfiguration.height;

      var bs = arm(worldWidth / 2, 0, Math.PI / 2, baseLength, "black");
      var sh = arm(bs.x2, bs.y2, s, shoulderLength, "blue");
      var el = arm(sh.x2, sh.y2, e, elbowLength, "green");

      var color = "lightgray";
      if (hitWall(el)) {
        color = "red";
      } else if (hitAnyBlock(sh)) {
        color = "blue";
      } else if (hitAnyBlock(el)) {
        color = "green";
      }

      ctxConfiguration.save();
      ctxConfiguration.beginPath();
      ctxConfiguration.fillStyle = color;
      ctxConfiguration.fillRect(x, y, 1, 1);
      ctxConfiguration.fill();
      ctxConfiguration.restore();
    }
  }
  ctxConfiguration.save();
  ctxConfiguration.beginPath();
  var x = (canConfiguration.width * (shoulderAngle + Math.PI)) / (2 * Math.PI);
  var y = (canConfiguration.height * (elbowAngle + Math.PI)) / (2 * Math.PI);

  ctxConfiguration.strokeStyle = "black";
  ctxConfiguration.fillStyle = "black";
  ctxConfiguration.arc(x, y, 2, 0, 2 * Math.PI, false);
  ctxConfiguration.fill();
  ctxConfiguration.stroke();
  ctxConfiguration.restore();
}

function drawWorkspace() {
    drawGridLines();
    circle(worldWidth / 2, baseLength, shoulderLength, "lightgray");
}

function drawGridLines() {

  var dx = canvasWidth / worldWidth;
  var dy = canvasHeight / worldHeight;

  ctxWorkspace.strokeStyle = 'lightblue';
  ctxWorkspace.lineWidth = 1;

  var ticks;

  ctxWorkspace.save();
  ctxWorkspace.beginPath();

  ticks = Math.floor(canWorkspace.width / dx);

  for (var i = 1; i <= ticks; i++) {
    var x = i * dx;
    ctxWorkspace.moveTo(x, 0);
    ctxWorkspace.lineTo(x, canWorkspace.height);
    ctxWorkspace.stroke();
  }

  ticks = Math.floor(canWorkspace.height / dy);

  for (var i = 1; i <= ticks; i++) {
    var y = i * dy;
    ctxWorkspace.moveTo(0, y);
    ctxWorkspace.lineTo(canWorkspace.width, y);
    ctxWorkspace.stroke();
  }

  ctxWorkspace.closePath();
  ctxWorkspace.restore();

  return;
}
