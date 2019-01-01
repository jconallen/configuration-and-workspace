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
  canWorkspace.addEventListener("click", clickedWorkspace, false);

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

  drawWorkspace();
  drawConfiguration();
}


// begins animation by requesting a animation frame, which calls the animate function
// at regiular intervals.  The handle is kept in the globalId var so that it can be stopped 
// by the user via the stop button.
function start() {
  globalID = requestAnimationFrame(animate);
}

// stops the currently running animation.
function stop() {
  cancelAnimationFrame(globalID);
}

// update the workspace view with the next pose of robot 
// in the workspace view
function animate() {
  drawNext();
  globalID = requestAnimationFrame(animate);
}


// resets the arm variables (joint and lengths), and removes 
// any obstacles from the workspace.
function reset() {
  shoulderAngle = 0;
  shoulderLength = 2;
  deltaShoulderAngle = 0.01; 
  deltaShoulderDirection = 1;

  elbowAngle = 0;
  elbowLength = 3;
  deltaElbowAngle = 0.1;
  deltaElbowDirection = 1;

  blocks = [];

  drawWorkspace();
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
  drawWorkspace();
  drawConfiguration();
}

// change the length of the shoulder segment of the arm
// get the value from the control canvas then redraw the 
// the arm and update the configuration view
function adjustShoulderLength(event) {
  var canvas = document.getElementById("shoulderLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  shoulderLength = Math.round(l * 10) / 10;
  drawWorkspace();
  drawConfiguration();
}

// change the length of the elbow segment of the arm
// get the value from the control canvas then redraw the 
// the arm and update the configuration view
function adjustElbowLength(event) {
  var canvas = document.getElementById("elbowLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  elbowLength = Math.round(l * 10) / 10;
  drawWorkspace();
  drawConfiguration();
}

// draw the all the controls (shoulder and elbow joint, and the three length
// controls for base, shoulder, and elbow segment 
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

// convert absolute mouse click location to relative coordinates. 
// Returns a JSON object with the (x,y) coordinates
// in pixels relative to the client area of the canvas.
function getMousePos(canvas, event) {
  var rect = canvas.getBoundingClientRect();
  return { "x": event.clientX - rect.left, "y": event.clientY - rect.top };
}

// handle click event in one of the angle controls.
// This function violates one design goal, by embedding the name 
// of the controls in this function.  Hopefully future refactoring will
// get rid of this (without just simply duplicating the code for each contol).
function controlClick(event) {
  var canvas = event.currentTarget;
  var pos = getMousePos(canvas, event);

  var a_x1 = this.width / 2;
  var a_y1 = this.height / 2;
  var a_x2 = pos.x;
  var a_y2 = pos.y;

  var a_dx = a_x2 - a_x1;
  var a_dy = a_y2 - a_y1;
  var b_dx = this.width;
  var b_dy = a_y1 - a_x1;
  var theta = Math.atan2(a_dx * b_dy - a_dy * b_dx, a_dx * b_dx + a_dy * b_dy);

  if (canvas.id == "shoulderControl") {
    shoulderAngle = theta;
    drawControl(canvas, theta, "blue", "Shoulder");
  } else if (canvas.id == "elbowControl") {
    elbowAngle = theta;
    drawControl(canvas, theta, "green", "Elbow");
  }
  drawWorkspace();
}

// draws one of thge angle controls.
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

// user clicked in workspace.  This will place a block (obstacle) in the 
// grid location that the user clicked in.
function clickedWorkspace(event) {
  var rect = canWorkspace.getBoundingClientRect();
  var cx1 = event.clientX - rect.left;
  var cy1 = event.clientY - rect.top;
  var wx1 = Math.floor(_wx(cx1));
  var wy1 = Math.floor(_wy(cy1));

  var block = drawBlock(wx1, wy1);
  // now remember it in the world model
  var block = { "x1": wx1, "y1": wy1, "x2": wx1 + 1, "y2": wy1 + 1 };

  var l = blocks.length;
  var i;
  for (i = 0; i < l; i++) {
    var b = blocks[i];
    if (wx1 == b.x1 && (wx1+1) == b.x2 && wy1 == b.y1 && (wy1+1) == b.y2) {
      // already here - remove it (toggle effect)
      blocks.splice(i, 1);
      break;
    }
  }
  if (i >= l) {
    blocks.push(block);
  }

  // update 
  drawWorkspace();
  drawConfiguration();
}

// convert world x coordinates to canvas coordinates (pixels) 
function _cx(wrX) {
  return (wrX * canvasWidth) / worldWidth;
}

// convert world y coordinates to canvas coordinates (pixels) 
function _cy(wrY) {
  return canvasHeight - (wrY * canvasHeight) / worldHeight;
}

// convert canvas x coordinates (pixels) to world coordinates
function _wx(cvX) {
  return (cvX * worldWidth) / canvasWidth;
}

// convert canvas y coordinates (pixels) to world coordinates
function _wy(cvY) {
  return (worldHeight * (canvasHeight - cvY)) / canvasHeight;
}

// draws a block (obsrtacle in the workspace with world coordinates)
function drawBlock(wx, wy) {
  var x1 = _cx(wx);
  var y1 = _cy(wy);
  var w = canvasWidth / worldWidth;
  var h = -canvasHeight / worldHeight;
  ctxWorkspace.save();
  ctxWorkspace.fillStyle = "darkgray";
  ctxWorkspace.fillRect(x1, y1, w, h);
  ctxWorkspace.restore();
}

// draws a circle in workspace view in world coordinates
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


// draws one segment of an arm (and puts a red dot at the end)
function drawArmSegment(a, color) {
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

// draws the frame in the workspace animation.
function drawNext() {
  updateWorkspace();  // update the current state of the robot arm.
  drawWorkspace();    // redraw
}

// draws the workspace view based on the current robot pose and 
// obstacles.
function drawWorkspace() {
  ctxWorkspace.clearRect(0, 0, canWorkspace.width, canWorkspace.height);
  drawWorkspaceGrid();
  // put in blocks
  for (b = 0; b < blocks.length; b++) {
    var block = blocks[b];
    drawBlock(block.x1, block.y1);
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

  drawArmSegment(bs, "black");
  drawArmSegment(sh, "blue");
  drawArmSegment(el, "green");
  drawControls();
}

// draws the configuration  view based on the current robot pose (positions)
// of the two joints, and locations of obstacles.
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
        color = "black";
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

  ctxConfiguration.strokeStyle = "red";
  ctxConfiguration.moveTo(x-5, y);
  ctxConfiguration.lineTo(x+5, y);
  ctxConfiguration.moveTo(x, y-5);
  ctxConfiguration.lineTo(x, y+5);
  ctxConfiguration.stroke();
  ctxConfiguration.restore();
}

// draw the gridlines and shoulder circle in the workspace view
function drawWorkspaceGrid() {
  drawGridLines();
  circle(worldWidth / 2, baseLength, shoulderLength, "lightgray");
}

// draw the gridlines in the workspace view
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
