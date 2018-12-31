/*
visualization code.  This collection of javascript functions work mostly 
with the direct manipulation of the visualizations in the browser.

*/


// initialize the app.  set the global vars for the canvases and contexts.
// set the widths of the canvases, and attach click listeners.
function init() {
  canWorkspace = document.getElementById("workspace");
  canWorkspace.width = canvasWidth;
  canWorkspace.height = canvasHeight;
  canWorkspace.addEventListener("click", clicked, false);

  ctxWorkspace = canWorkspace.getContext("2d");

  canConfiguration = document.getElementById("configuration-space");
  canConfiguration.width = 300;
  canConfiguration.height = 300;
  ctxConfiguration = canConfiguration.getContext("2d");

  canShoulder = document.getElementById("shoulderControl");
  canShoulder.addEventListener("click", controlClick);
  canShoulder.width = 100;
  canShoulder.height = 100;
  ctxShoulder = canShoulder.getContext("2d");

  canElbow = document.getElementById("elbowControl");
  canElbow.addEventListener("click", controlClick);
  canElbow.width = 100;
  canElbow.height = 100;
  ctxElbow = canElbow.getContext("2d");

  var v = document.getElementById("baseLenCanvas");
  v.addEventListener("click", adjustBaseLength);
  v.width = 200;
  v = document.getElementById("shoulderLenCanvas");
  v.addEventListener("click", adjustShoulderLength);
  v.width = 200;
  v = document.getElementById("elbowLenCanvas");
  v.addEventListener("click", adjustElbowLength);
  v.width = 200;

  drawArm();
  drawConfiguration();
}

// reset the length of the base segment.  This means 
// updating the global var (baseLength) and re-draw it
// in the workpace.
function adjustBaseLength(event) {
  var canvas = document.getElementById("baseLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  baseLength = Math.round(l * 10) / 10;
  drawArm();
  drawConfiguration();
}

function adjustShoulderLength(event) {
  var canvas = document.getElementById("shoulderLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  shoulderLength = Math.round(l * 10) / 10;
  drawArm();
  drawConfiguration();
}

function adjustElbowLength(event) {
  var canvas = document.getElementById("elbowLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  elbowLength = Math.round(l * 10) / 10;
  drawArm();
  drawConfiguration();
}

function drawControls() {
  drawControl(canShoulder, shoulderAngle, "blue", "Shoulder");
  drawControl(canElbow, elbowAngle, "green", "Elbow");

  // now the length bars
  var elm = document.getElementById("baseLenField");
  elm.innerHTML = baseLength.toFixed(1);
  var canvas = document.getElementById("baseLenCanvas");
  var ctx = canvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "darkgray";
  var w = ((baseLength - 1) * canvas.width) / 5;
  ctx.fillRect(0, 0, w, canvas.height);
  ctx.restore();

  elm = document.getElementById("shoulderLenField");
  elm.innerHTML = shoulderLength.toFixed(1);
  canvas = document.getElementById("shoulderLenCanvas");
  ctx = canvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "blue";
  w = ((shoulderLength - 1) * canvas.width) / 5;
  ctx.fillRect(0, 0, w, canvas.height);
  ctx.restore();

  elm = document.getElementById("elbowLenField");
  elm.innerHTML = elbowLength.toFixed(1);
  canvas = document.getElementById("elbowLenCanvas");
  ctx = canvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "green";
  w = ((elbowLength - 1) * canvas.width) / 5;
  ctx.fillRect(0, 0, w, canvas.height);
  ctx.restore();
}

function getMousePos(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function controlClick(event) {
  var canvas = event.currentTarget;
  var pos = getMousePos(canvas, event);

  var ax1 = this.width / 2;
  var ay1 = this.height / 2;
  var ax2 = pos.x;
  var ay2 = pos.y;

  var adx = ax2 - ax1;
  var ady = ay2 - ay1;
  var bdx = this.width;
  var bdy = ay1 - ax1;
  var theta = Math.atan2(adx * bdy - ady * bdx, adx * bdx + ady * bdy);

  if (canvas.id == "shoulderControl") {
    shoulderAngle = theta;
    drawControl(canvas, theta, "blue", "Shoulder");
  } else if (canvas.id == "elbowControl") {
    elbowAngle = theta;
    drawControl(canvas, theta, "green", "Elbow");
  }
  drawArm();
}

function drawControl(canvas, theta, color, name) {
  var ctx = canvas.getContext("2d");

  var x = canvas.width / 2;
  var y = canvas.height / 2;
  var r = y * 0.8;
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "10px Arial";
  ctx.fillText(name, 2, 10);
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.arc(x, y, r, 0, 2 * Math.PI, false);
  ctx.stroke();
  ctx.restore();

  var x2 = x + r * Math.cos(theta);
  var y2 = y - r * Math.sin(theta);
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function start() {
  globalID = requestAnimationFrame(animate);
}

function stop() {
  cancelAnimationFrame(globalID);
}

function reset() {
  elbowAngle = 0;
  shoulderAngle = 0;
  deltaElbowAngle = 0.1;
  deltaElbowDirection = 1;
  blocks = [];
  drawArm();
  drawConfiguration();
}

function clicked(event) {
  var rect = canWorkspace.getBoundingClientRect();
  var cx1 = event.clientX - rect.left;
  var cy1 = event.clientY - rect.top;
  var wx1 = Math.floor(_wx(cx1));
  var wy1 = Math.floor(_wy(cy1));

  var block = _block(wx1, wy1);
  // now remember it in the world model
  var block = { x1: wx1, y1: wy1, x2: wx1 + 1, y2: wy1 + 1 };

  var l = blocks.length;
  var b;
  for (b = 0; b < l; b++) {
    if (wx1 == b.x1 && wx2 == b.x2 && wy1 == b.y1 && wy2 == b.y2) {
      // already here - remove it (toggle effect)
      blocks = blocks.splice(b, 1);
    }
  }
  if (b == l) {
    blocks.push(block);
  }

  // update plot
  drawConfiguration();
}

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

function animate() {
  drawNext();
  globalID = requestAnimationFrame(animate);
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

  drawArm();
}

function drawArm() {
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
      var s =
        ((x - canConfiguration.width / 2) * 2 * Math.PI) /
        canConfiguration.width;
      var e =
        ((y - canConfiguration.height / 2) * 2 * Math.PI) /
        canConfiguration.height;

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

  ctxWorkspace.strokeStyle = "lightblue";
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
