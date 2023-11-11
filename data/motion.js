document.getElementById("logs").innerHTML = "a";
function start() {
  // Request permission for iOS 13+ devices
  if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
  ) {
    DeviceMotionEvent.requestPermission();
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  let countEntries = 0;
  let timeElapsed = 0;
  let lastTimestamp = Date.now();
  window.addEventListener("devicemotion", (event) => {
    const acceleration = event.acceleration;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(acceleration.x * 10, acceleration.y * 10, 10, 10);
    document.getElementById("logs").innerHTML = JSON.stringify(acceleration);
    countEntries++;
    timeElapsed += Date.now() - lastTimestamp;
    lastTimestamp = Date.now();
    document.getElementById("logs").innerHTML +=
      "<br>" + (countEntries / timeElapsed) * 1000;
    if (recording) data.push(acceleration);
  });
}
let data = [];
let recording = false;
function touchstart() {
  data = [];
  recording = true;
  document.getElementById("record").style.backgroundColor = "red";
}
let gestureNo = 0;
function touchend() {
  recording = false;
  document.getElementById("record").style.backgroundColor = "white";
  gestureNo++;
  const filename = "gesture" + gestureNo + ".csv";
  let csvContent = "data:text/csv;charset=utf-8," + gestureNo + "\n";
  data.forEach(function (dataMember) {
    csvContent += dataMember.x + "," + dataMember.y + "," + dataMember.z;
    csvContent += "\n";
  });

  const element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(csvContent),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
/* <!--
  const [acceleration, setAcceleration] = useState<{
    x: number | null
    y: number | null
    z: number | null
  }>({
    x: null,
    y: null,
    z: null,
  })

  const [orientation, setOrientation] = useState<{
    alpha: number | null
    beta: number | null
    gamma: number | null
  }>({
    alpha: null,
    beta: null,
    gamma: null,
  })

  const handler = (event: DeviceMotionEvent) => {
    const { acceleration } = event
    acceleration && setAcceleration(acceleration)
  }

  const handlerOrientation = (event: DeviceOrientationEvent) => {
    const { alpha, beta, gamma } = event
    setOrientation({ alpha: alpha && (alpha + 360) % 360, beta, gamma })
  }

  useEffect(() => {
    window.addEventListener('devicemotion', handler, true)
    window.addEventListener('deviceorientation', handlerOrientation, true)

    return () => {
      window.removeEventListener('devicemotion', handler, true)
      window.removeEventListener('deviceorientation', handlerOrientation, true)
    }
  }, [])

  return [acceleration, orientation] as const --> */
