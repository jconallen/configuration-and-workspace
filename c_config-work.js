/*
visualization code.  This collection of javascript functions work mostly 
with the direct manipulation of the visualizations in the browser.

*/

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

  animateArm();
  drawConfiguration();
}

function adjustBaseLength(event) {
  var canvas = document.getElementById("baseLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  baseLength = Math.round(l * 10) / 10;
  animateArm();
  drawConfiguration();
}

function adjustShoulderLength(event) {
  var canvas = document.getElementById("shoulderLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  shoulderLength = Math.round(l * 10) / 10;
  animateArm();
  drawConfiguration();
}

function adjustElbowLength(event) {
  var canvas = document.getElementById("elbowLenCanvas");
  var pos = getMousePos(canvas, event);
  var width = this.width;
  var l = (pos.x / width) * 5 + 1;
  elbowLength = Math.round(l * 10) / 10;
  animateArm();
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
  var x1 = this.width / 2;
  var y1 = this.height / 2;
  var canvas = event.currentTarget;
  var pos = getMousePos(canvas, event);
  var x2 = pos.x;
  var y2 = pos.y;

  //find vector components
  var A1x = x1;
  var A1y = y1;
  var A2x = x2;
  var A2y = y2;
  var B1x = 0;
  var B1y = x1;
  var B2x = this.width;
  var B2y = y1;

  var dAx = A2x - A1x;
  var dAy = A2y - A1y;
  var dBx = B2x - B1x;
  var dBy = B2y - B1y;
  var theta = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);
  //if(angle < 0) {angle = angle * -1;}

  if (canvas.id == "shoulderControl") {
    shoulderAngle = theta;
    drawControl(canvas, theta, "blue", "Shoulder");
  } else if (canvas.id == "elbowControl") {
    elbowAngle = theta;
    drawControl(canvas, theta, "green", "Elbow");
  }
  animateArm();
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
  animateArm();
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
