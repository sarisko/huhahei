console.log("detector loaded");
// Here are some global variables which are used as state storage
let debugCountEntries = 0;
let debugTimeElapsed = 0;
let lastAccTimestamp = 0;
let data = []; // this array contains the acceleration data, it is also wiped to [] everytime we find a gesture
let dataRot = []; // same for deviceorientation event (angular velocity)
let recording = false; // This is essentially true all the time after we get permissions
let inGame = false;

// This is the main function which runs 60xps, captures acc data
function motionHandler(event) {
  if (lastAccTimestamp === 0) lastAccTimestamp = Date.now();

  const acceleration = event.acceleration;
  debugCountEntries++;
  debugTimeElapsed += Date.now() - lastAccTimestamp;
  lastAccTimestamp = Date.now();

  if (recording) data.push(acceleration);
}

// This function runs on setInterval below, and detects calibration/later gestures from data
let lastDetectTimestamp = 0;
// CONSTANTS - SETTINGS
const gestLength = 80;
const gestThreshold = 500;
const gameLengthMs = document.getElementById("playModal").dataset.captureTimeMs;
// TRRRRR
//
const repr = {
  up: null,
  side: null,
  forward: null,
};
// don't kill me for globals plz
let onCalibrated = null;
let onFinishedPlaying = null;

let currentGameGestures = []; // [['up', 0], ['side', 200]] (first timestamp is always 0)
let lastGestureTimestamp = null;
let gameStartTimestamp = 0;

const styleChangeThrottle = 900;
let lastStyleChange = 0;
function dataDetection() {
  if (!recording) return;
  if (data.length < gestLength) return;

  if (Date.now() - lastStyleChange > styleChangeThrottle) {
    const gameTimePercentage = gameStartTimestamp
      ? Math.round(((Date.now() - gameStartTimestamp) / gameLengthMs) * 100)
      : 0;
    document.getElementById("playingModalContent").style = ` 
    background: rgb(0,0,0);
    background: linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${
      gameTimePercentage - 3
    }%, rgba(147,7,58,1) ${gameTimePercentage}%, rgba(147,7,58,1) 100%);
    `;
    lastStyleChange = Date.now();
  }

  const magnitude = getMagnitude(data.length - gestLength, data.length);
  if (magnitude < gestThreshold) {
    return;
  }

  detection: {
    if (repr.up === null || repr.side === null || repr.forward === null)
      break detection;
    if (!inGame) break detection;
    const closest = getClosest();
    if (currentGameGestures.length === 0) {
      lastGestureTimestamp = Date.now();
      gameStartTimestamp = Date.now();
      currentGameGestures.push([closest[0], 0]);
      setTimeout(() => {
        onFinishedPlaying(currentGameGestures);
        currentGameGestures = [];
        inGame = false;
      }, gameLengthMs);
    } else {
      currentGameGestures.push([closest[0], Date.now() - gameStartTimestamp]);
      lastGestureTimestamp = Date.now();
    }
    // in case debugging is needed
    /* document.getElementById("playingModalContent").innerHTML +=
      "<br>" +
      closest[0] +
      "! " +
      Math.round((gameLengthMs - (Date.now() - gameStartTimestamp)) / 1000) +
      " seconds left!"; */

    switch (closest[0]) {
      case "up":
        document.getElementById("huAudio").play();
        break;
      case "side":
        document.getElementById("haAudio").play();
        break;
      case "forward":
        document.getElementById("heiAudio").play();
        break;
    }

    console.log("closest", closest);
  }

  // If we do not have repr filled, it means we are in a calibration stage, so
  // every time we detect a gesture we want to fill another repr. entry
  calibration: {
    if (repr.up === null) {
      repr.up = [
        zeroMeanUnitVarianceNormalization(
          data.slice(data.length - gestLength, data.length),
        ),
        zeroMeanUnitVarianceNormalization(
          dataRot.slice(dataRot.length - gestLength, dataRot.length),
        ),
      ];
      document.getElementById("calibrationModalContent").innerHTML +=
        "<br>Move to the side now!";
      document.getElementById("huAudio").play();
      break calibration;
    }
    if (repr.side === null) {
      document.getElementById("calibrationModalContent").innerHTML +=
        "<br>Move forward now!";
      document.getElementById("haAudio").play();
      repr.side = [
        zeroMeanUnitVarianceNormalization(
          data.slice(data.length - gestLength, data.length),
        ),
        zeroMeanUnitVarianceNormalization(
          dataRot.slice(dataRot.length - gestLength, dataRot.length),
        ),
      ];
      break calibration;
    }
    if (repr.forward === null) {
      document.getElementById("heiAudio").play();
      repr.forward = [
        zeroMeanUnitVarianceNormalization(
          data.slice(data.length - gestLength, data.length),
        ),
        zeroMeanUnitVarianceNormalization(
          dataRot.slice(dataRot.length - gestLength, dataRot.length),
        ),
      ];
      if (onCalibrated) {
        onCalibrated();
        onCalibrated = null;
      }
      break calibration;
    }
  }
  // cleanup after ourselves, just a memory thing, we anyway look only
  // at the last 50 entries.
  data = [];
  dataRot = [];
  lastDetectTimestamp = Date.now();
}
setInterval(dataDetection, 1000 / 6);

// helper function for gesture detection
function getMagnitude(i_start, i_end) {
  // gets the total magnitude between indices from data
  let sum = 0;
  for (let i = i_start; i < i_end; i++) {
    sum += Math.sqrt(
      data[i].x * data[i].x + data[i].y * data[i].y + data[i].z * data[i].z,
    );
  }
  return Math.round(sum, 3);
}

function getDistance(reprName) {
  const reprRef = repr[reprName];
  const startIndex = data.length - gestLength;
  let dist = 0;
  let distRot = 0;

  // Normalize acceleration and rotation data
  const normalizedData = zeroMeanUnitVarianceNormalization(
    data.slice(startIndex, data.length),
  );
  const normalizedDataRot = zeroMeanUnitVarianceNormalization(
    dataRot.slice(startIndex, dataRot.length),
  );

  // Cosine distance from normalized acc data
  /* for (let i = 0; i < normalizedData.length; ++i) {
            const dotProduct = (
                normalizedData[i].x * reprRef[0][i].x +
                normalizedData[i].y * reprRef[0][i].y +
                normalizedData[i].z * reprRef[0][i].z
            );
            dist += Math.abs(dotProduct)
        } */
  // Euclidean distance from normalized acc data
  for (let i = 0; i < normalizedData.length; ++i) {
    dist += Math.sqrt(
      Math.pow(normalizedData[i].x - reprRef[0][i].x, 2) +
        Math.pow(normalizedData[i].y - reprRef[0][i].y, 2) +
        Math.pow(normalizedData[i].z - reprRef[0][i].z, 2),
    );
  }

  // Euclidean distance from normalized rotation data
  for (let i = 0; i < normalizedDataRot.length; ++i) {
    distRot += Math.sqrt(
      Math.pow(normalizedDataRot[i].x - reprRef[1][i].x, 2) +
        Math.pow(normalizedDataRot[i].y - reprRef[1][i].y, 2) +
        Math.pow(normalizedDataRot[i].z - reprRef[1][i].z, 2),
    );
  }
  console.log("reprName", reprName, "dist", dist, "distRot", distRot);
  return [dist, distRot];
}
// helper function to get distances from three representatives and return the label of the closest
function getClosest() {
  const [distUpAcc, distUpRot] = getDistance("up");
  const [distSideAcc, distSideRot] = getDistance("side");
  const [distForwardAcc, distForwardRot] = getDistance("forward");
  // if the euclidean distance on acc is <100 we just slap it on straight away.
  if (distUpAcc < 100 || distSideAcc < 100 || distForwardAcc < 100) {
    if (distUpAcc < distSideAcc && distUpAcc < distForwardAcc)
      return ["up", distUpAcc, "side", distSideAcc, "forward", distForwardAcc];
    if (distSideAcc < distUpAcc && distSideAcc < distForwardAcc)
      return ["side", distSideAcc, "up", distUpAcc, "forward", distForwardAcc];
    return ["forward", distForwardAcc, "up", distUpAcc, "side", distSideAcc];
  }
  // same for rot
  if (distUpRot < 100 || distSideRot < 100 || distForwardRot < 100) {
    if (distUpRot < distSideRot && distUpRot < distForwardRot)
      return ["up", distUpRot, "side", distSideRot, "forward", distForwardRot];
    if (distSideRot < distUpRot && distSideRot < distForwardRot)
      return ["side", distSideRot, "up", distUpRot, "forward", distForwardRot];
    return ["forward", distForwardRot, "up", distUpRot, "side", distSideRot];
  }
  //otherwise weigh half half
  const distUp = distUpAcc + distUpRot;
  const distSide = distSideAcc + distSideRot;
  const distForward = distForwardAcc + distForwardRot;
  if (distUp < distSide && distUp < distForward)
    return ["up", distUp, "side", distSide, "forward", distForward];
  if (distSide < distUp && distSide < distForward)
    return ["side", distSide, "up", distUp, "forward", distForward];
  return ["forward", distForward, "up", distUp, "side", distSide];
}

function zeroMeanUnitVarianceNormalization(data) {
  const mean = { x: 0, y: 0, z: 0 };
  const variance = { x: 0, y: 0, z: 0 };

  for (const vector of data) {
    mean.x += vector.x;
    mean.y += vector.y;
    mean.z += vector.z;
  }

  mean.x /= data.length;
  mean.y /= data.length;
  mean.z /= data.length;

  for (const vector of data) {
    variance.x += Math.pow(vector.x - mean.x, 2);
    variance.y += Math.pow(vector.y - mean.y, 2);
    variance.z += Math.pow(vector.z - mean.z, 2);
  }

  variance.x /= data.length;
  variance.y /= data.length;
  variance.z /= data.length;

  const standardDeviation = {
    x: Math.sqrt(variance.x),
    y: Math.sqrt(variance.y),
    z: Math.sqrt(variance.z),
  };

  const normalizedData = data.map((vector) => ({
    x: (vector.x - mean.x) / standardDeviation.x,
    y: (vector.y - mean.y) / standardDeviation.y,
    z: (vector.z - mean.z) / standardDeviation.z,
  }));

  return normalizedData;
}

let permissionRequested = false;
function requestPermission() {
  // Request permission for iOS 13+ devices
  // this needs to happen after user interaction, otherwise iphones
  // won't let you record accelerometer data
  try {
    if (
      DeviceMotionEvent &&
      typeof DeviceMotionEvent.requestPermission === "function" &&
      !permissionRequested
    ) {
      DeviceMotionEvent.requestPermission();
      permissionRequested = true;
      // ignore the case of denial :D
    }
  } catch {
    permissionRequested = true;
  }
}
