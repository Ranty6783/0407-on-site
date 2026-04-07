let centerPoints = [];
const numPoints = 18;
let gameState = "START"; // START, PLAYING, LOSE, WIN

let pathThickness = 34;
let startCircle;
let goalCircle;
let playerTrail = [];
let obstacles = [];

// 隨機路線控制參數
let seedOffset = 0;
let waveSeed1 = 0;
let waveSeed2 = 0;
let waveSeed3 = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("sans-serif");
  generateLevel();
}

function draw() {
  background(20);

  drawTitle();
  drawTrack();
  updateObstacles();
  drawObstacles();
  drawStartGoal();

  if (gameState === "START") {
    drawHint("點擊綠色起點開始遊戲");
    drawCursorDot();
  } 
  else if (gameState === "PLAYING") {
    drawPlayerTrail();
    drawCursorDot();
    checkWallCollision();
    checkObstacleCollision();
    checkGoalReached();
  } 
  else if (gameState === "LOSE") {
    drawPlayerTrail();
    drawCursorDot();
    drawOverlay("失敗", "按空白鍵重新開始");
  } 
  else if (gameState === "WIN") {
    drawPlayerTrail();
    drawCursorDot();
    drawOverlay("成功", "按空白鍵挑戰新關卡");
  }
}

function generateLevel() {
  generatePath();
  updateStartGoal();
  generateObstacles();
}

function generatePath() {
  centerPoints = [];

  seedOffset = random(1000, 99999);
  waveSeed1 = random(0.7, 1.6);
  waveSeed2 = random(1.8, 3.4);
  waveSeed3 = random(3.6, 5.8);

  let leftX = width * 0.09;
  let rightX = width * 0.91;
  let usableWidth = rightX - leftX;
  let spacing = usableWidth / (numPoints - 1);

  let centerY = height * random(0.4, 0.6);
  let ampBase = min(height * random(0.14, 0.22), 150);

  for (let i = 0; i < numPoints; i++) {
    let x = leftX + i * spacing;

    let wave1 = sin(i * waveSeed1 + random(-0.4, 0.4)) * ampBase * random(0.18, 0.34);
    let wave2 = sin(i * waveSeed2 + seedOffset * 0.001) * ampBase * random(0.12, 0.24);
    let wave3 = cos(i * waveSeed3 + seedOffset * 0.0007) * ampBase * random(0.08, 0.18);

    let noiseOffset = map(noise(i * 0.32 + seedOffset), 0, 1, -ampBase * 0.45, ampBase * 0.45);
    let randomOffset = random(-28, 28);

    let y = centerY + wave1 + wave2 + wave3 + noiseOffset + randomOffset;
    y = constrain(y, height * 0.18, height * 0.82);

    centerPoints.push({ x, y });
  }

  for (let i = 1; i < centerPoints.length - 1; i++) {
    centerPoints[i].y += random(-24, 24);
    centerPoints[i].y = constrain(centerPoints[i].y, height * 0.18, height * 0.82);
  }
}

function updateStartGoal() {
  if (centerPoints.length === 0) return;

  startCircle = {
    x: centerPoints[0].x - 10,
    y: centerPoints[0].y,
    r: 22
  };

  goalCircle = {
    x: centerPoints[centerPoints.length - 1].x + 10,
    y: centerPoints[centerPoints.length - 1].y,
    r: 22
  };
}

function generateObstacles() {
  obstacles = [];

  let obstacleCount = floor(random(2, 4)); // 2~3個

  for (let i = 0; i < obstacleCount; i++) {
    let segIndex = floor(random(2, centerPoints.length - 3));
    let p1 = centerPoints[segIndex];
    let p2 = centerPoints[segIndex + 1];

    let baseT = random(0.15, 0.85);
    let baseX = lerp(p1.x, p2.x, baseT);
    let baseY = lerp(p1.y, p2.y, baseT);

    obstacles.push({
      segIndex: segIndex,
      baseT: baseT,
      x: baseX,
      y: baseY,
      size: random(12, 18),
      moveRange: random(8, pathThickness * 0.28),
      speed: random(0.015, 0.035),
      phase: random(TWO_PI),
      dir: random() < 0.5 ? -1 : 1
    });
  }
}

function updateObstacles() {
  for (let obs of obstacles) {
    let p1 = centerPoints[obs.segIndex];
    let p2 = centerPoints[obs.segIndex + 1];

    let baseX = lerp(p1.x, p2.x, obs.baseT);
    let baseY = lerp(p1.y, p2.y, obs.baseT);

    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;
    let len = sqrt(dx * dx + dy * dy);

    if (len === 0) continue;

    let nx = -dy / len;
    let ny = dx / len;

    let offset = sin(frameCount * obs.speed + obs.phase) * obs.moveRange * obs.dir;

    obs.x = baseX + nx * offset;
    obs.y = baseY + ny * offset;
  }
}

function drawTitle() {
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(width * 0.035, 34));
  text("電流急急棒", width / 2, height * 0.22);
}

function drawHint(msg) {
  fill(235);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(width * 0.028, 22));
  text(msg, width / 2, height * 0.34);
}

function drawOverlay(title, subtitle) {
  fill(0, 0, 0, 140);
  rect(0, 0, width, height);

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(width * 0.05, 44));
  text(title, width / 2, height * 0.42);

  textSize(min(width * 0.026, 22));
  text(subtitle, width / 2, height * 0.52);
}

function drawTrack() {
  noFill();
  strokeCap(ROUND);
  strokeJoin(ROUND);

  stroke(85);
  strokeWeight(pathThickness);

  beginShape();
  let first = centerPoints[0];
  let last = centerPoints[centerPoints.length - 1];

  curveVertex(first.x, first.y);
  for (let p of centerPoints) {
    curveVertex(p.x, p.y);
  }
  curveVertex(last.x, last.y);
  endShape();
}

function drawObstacles() {
  noStroke();

  for (let obs of obstacles) {
    fill(255, 170, 0);
    ellipse(obs.x, obs.y, obs.size * 1.8);

    fill(255, 230, 120);
    ellipse(obs.x, obs.y, obs.size);
  }
}

function drawStartGoal() {
  noStroke();

  fill(0, 255, 70);
  ellipse(startCircle.x, startCircle.y, startCircle.r * 2);
  fill(0);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("START", startCircle.x, startCircle.y + 1);

  fill(255, 40, 70);
  ellipse(goalCircle.x, goalCircle.y, goalCircle.r * 2);
  fill(255);
  textSize(16);
  text("GOAL", goalCircle.x, goalCircle.y + 1);
}

function drawCursorDot() {
  fill(255);
  noStroke();
  ellipse(mouseX, mouseY, 10, 10);
}

function mousePressed() {
  if (gameState === "START") {
    if (dist(mouseX, mouseY, startCircle.x, startCircle.y) <= startCircle.r) {
      gameState = "PLAYING";
      playerTrail = [];
      playerTrail.push({ x: mouseX, y: mouseY });
    }
  }
}

function drawPlayerTrail() {
  if (playerTrail.length < 2) return;

  noFill();
  stroke(255, 255, 255, 110);
  strokeWeight(2);
  beginShape();
  for (let p of playerTrail) {
    vertex(p.x, p.y);
  }
  endShape();
}

function checkWallCollision() {
  playerTrail.push({ x: mouseX, y: mouseY });

  if (mouseX < startCircle.x - 5 || mouseX > goalCircle.x + 5) {
    gameState = "LOSE";
    return;
  }

  let d = distanceToPolyline(mouseX, mouseY, centerPoints);

  if (d > pathThickness * 0.42) {
    gameState = "LOSE";
  }
}

function checkObstacleCollision() {
  for (let obs of obstacles) {
    if (dist(mouseX, mouseY, obs.x, obs.y) <= obs.size * 0.9) {
      gameState = "LOSE";
      return;
    }
  }
}

function checkGoalReached() {
  if (dist(mouseX, mouseY, goalCircle.x, goalCircle.y) <= goalCircle.r) {
    gameState = "WIN";
  }
}

function distanceToPolyline(px, py, pts) {
  let minD = Infinity;

  for (let i = 0; i < pts.length - 1; i++) {
    let a = pts[i];
    let b = pts[i + 1];
    let d = pointToSegmentDistance(px, py, a.x, a.y, b.x, b.y);
    if (d < minD) minD = d;
  }

  return minD;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  let A = px - x1;
  let B = py - y1;
  let C = x2 - x1;
  let D = y2 - y1;

  let dot = A * C + B * D;
  let lenSq = C * C + D * D;
  let t = 0;

  if (lenSq !== 0) {
    t = dot / lenSq;
  }

  t = constrain(t, 0, 1);

  let ex = x1 + t * C;
  let ey = y1 + t * D;

  return dist(px, py, ex, ey);
}

function keyPressed() {
  if (key === ' ' && (gameState === "LOSE" || gameState === "WIN")) {
    gameState = "START";
    playerTrail = [];
    generateLevel();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  generateLevel();
}