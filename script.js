const pages = {
  home: document.getElementById("homePage"),
  frame: document.getElementById("framePage"),
  photo: document.getElementById("photoPage"),
  delivery: document.getElementById("deliveryPage"),
  pickup: document.getElementById("pickupPage"),
  single: document.getElementById("singleDownloadPage")
};

const enterBtn = document.getElementById("enterBtn");
const prevFrame = document.getElementById("prevFrame");
const nextFrame = document.getElementById("nextFrame");
const selectFrameBtn = document.getElementById("selectFrameBtn");

const previewStrip = document.getElementById("previewStrip");
const previewStripImg = document.getElementById("previewStripImg");

const colorToggle = document.getElementById("colorToggle");
const photoColorToggle = document.getElementById("photoColorToggle");
const toggleBtn = document.getElementById("toggleBtn");
const toggleImg = document.getElementById("toggleImg");
const photoToggleBtn = document.getElementById("photoToggleBtn");
const photoToggleImg = document.getElementById("photoToggleImg");

const video = document.getElementById("video");
const uploadPreview = document.getElementById("uploadPreview");
const cameraMsg = document.getElementById("cameraMsg");
const countdown = document.getElementById("countdown");
const takePhotoBtn = document.getElementById("takePhotoBtn");
const uploadInput = document.getElementById("uploadInput");
const photoControls = document.getElementById("photoControls");
const photoStartBtn = document.getElementById("photoStartBtn");
const photoStartLabel = document.getElementById("photoStartLabel");

const openUploadGridBtn = document.getElementById("openUploadGridBtn");
const uploadGridBox = document.getElementById("uploadGridBox");
const finishUploadBtn = document.getElementById("finishUploadBtn");
const multiUploadInputs = document.querySelectorAll(".multiUploadInput");

const fallingCanvas = document.getElementById("fallingCanvas");
const finalCanvas = document.getElementById("finalCanvas");
const deliveryTimer = document.getElementById("deliveryTimer");
const pickupBtn = document.getElementById("pickupBtn");

const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const printBtn = document.getElementById("printBtn");
const restartBtn = document.getElementById("restartBtn");

const cutBtn = document.getElementById("cutBtn");
const backToStripBtn = document.getElementById("backToStripBtn");
const singlePhotoBtns = document.querySelectorAll(".single-photo-btn");
const singleCanvases = [
  document.getElementById("singleCanvas0"),
  document.getElementById("singleCanvas1"),
  document.getElementById("singleCanvas2"),
  document.getElementById("singleCanvas3")
];

const singleDownloadAllBtn = document.getElementById("singleDownloadAllBtn");
const singleShareBtn = document.getElementById("singleShareBtn");
const singlePrintBtn = document.getElementById("singlePrintBtn");
const singleRestartBtn = document.getElementById("singleRestartBtn");

const frames = [
  {
    label: "white",
    className: "white-template",
    sampleSrc: "assets/whiteSample.png"
  },
  {
    label: "hearts",
    className: "hearts-template",
    sampleSrc: "assets/heartsStripSample.png"
  },
  {
    label: "birthday",
    className: "birthday-template",
    sampleSrc: "assets/birthdayStripSample.png"
  },
  {
    label: "mysketchbooth",
    className: "sketchbooth-template",
    sampleSrc: "assets/sketchboothStripSample.png"
  },
  {
    label: "stars",
    className: "stars-template",
    sampleSrc: "assets/starsStripSample.png"
  },
  {
    label: "doodle",
    className: "doodle-template",
    sampleSrc: "assets/doodleStripSample.png"
  }
];

let currentFrame = 0;
let useColor = false;
let stream = null;
let capturedImages = [];

/* AUTO EMAIL SETUP */
const EMAILJS_SERVICE_ID = "service_y2avi57";
const EMAILJS_TEMPLATE_ID = "template_7cx8g3c";
const EMAILJS_PUBLIC_KEY = "4emfgDcf9hBghDYlL";

const CLOUDINARY_CLOUD_NAME = "dkhckvpn0";
const CLOUDINARY_UPLOAD_PRESET = "myphotoboothpublic";

let currentPhotoMode = "unknown";
let lastUploadedStripUrl = "";

if (window.emailjs && EMAILJS_PUBLIC_KEY) {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });
}


function show(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  page.classList.add("active");
}

function makeMiniStrip(images = []) {
  const strip = document.createElement("div");
  strip.className = `strip ${frames[currentFrame].className}`;

  for (let i = 0; i < 4; i++) {
    const slot = document.createElement("div");
    slot.className = "photo-slot";

    if (images[i]) {
      const img = document.createElement("img");
      img.src = images[i];
      slot.appendChild(img);
    }

    strip.appendChild(slot);
  }

  return strip;
}

function renderPreview() {
  if (previewStripImg) {
    previewStripImg.src = frames[currentFrame].sampleSrc;
    previewStripImg.alt = frames[currentFrame].label + " strip preview";
    previewStripImg.classList.remove("bw-preview");
    return;
  }

  if (previewStrip) {
    previewStrip.innerHTML = "";
    previewStrip.className = "strip-preview" + (useColor ? "" : " bw");
    previewStrip.appendChild(makeMiniStrip());
  }
}

function syncColor(value) {
  useColor = value;

  if (colorToggle) colorToggle.checked = value;
  if (photoColorToggle) photoColorToggle.checked = value;

  if (toggleImg) {
    toggleImg.src = useColor ? "assets/toggleColor1.svg" : "assets/toggleBW3.svg";
    toggleImg.alt = useColor ? "color toggle" : "black and white toggle";
  }

  if (photoToggleImg) {
    photoToggleImg.src = useColor ? "assets/photoToggleColor.svg" : "assets/photoToggleBW.svg";
    photoToggleImg.alt = useColor ? "color toggle" : "black and white toggle";
  }

  renderPreview();
}

function moveFrame(step) {
  currentFrame = (currentFrame + step + frames.length) % frames.length;
  renderPreview();
}

async function startCamera() {
  cameraMsg.textContent = "";
  uploadPreview.classList.remove("show");

  const cameraBox = document.getElementById("cameraBox");
  if (cameraBox) cameraBox.classList.remove("hidden-camera");

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    video.srcObject = stream;
    video.classList.add("show");
  } catch (err) {
    cameraMsg.textContent = "Camera blocked. Upload a photo instead.";
    video.classList.remove("show");
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCountdown() {
  for (let n = 3; n > 0; n--) {
    countdown.textContent = n;
    await wait(850);
  }

  countdown.textContent = "";
  await wait(150);
}

function captureVideoFrame() {
  const canvas = document.createElement("canvas");
  canvas.width = 480;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/png");
}

function clearUploadGrid() {
  if (uploadGridBox) {
    uploadGridBox.classList.add("hidden-upload-grid");
  }

  multiUploadInputs.forEach(input => {
    input.value = "";

    const slot = input.closest(".upload-slot");
    const preview = slot ? slot.querySelector(".upload-slot-preview") : null;

    if (slot) slot.classList.remove("has-image");
    if (preview) preview.src = "";
  });
}

function resetPhotoStartState() {
  currentPhotoMode = "unknown";
  if (pages.photo) {
    pages.photo.classList.remove("camera-ready", "taking-photos", "upload-ready");
  }

  const cameraBox = document.getElementById("cameraBox");
  if (cameraBox) cameraBox.classList.add("hidden-camera");

  if (photoStartBtn) {
    photoStartBtn.classList.remove("ready-start");
    photoStartBtn.disabled = false;
  }

  if (photoStartLabel) {
    photoStartLabel.classList.add("hidden-start-label");
  }

  if (photoControls) {
    photoControls.style.display = "";
  }

  if (photoStartLabel) {
  photoStartLabel.textContent = "start";
  photoStartLabel.classList.add("hidden-start-label");
}

  clearUploadGrid();
}

async function preparePhotoSession() {
  currentPhotoMode = "camera";
  clearUploadGrid();

  if (photoControls) {
    photoControls.style.display = "none";
  }

  if (pages.photo) {
    pages.photo.classList.add("camera-ready");
    pages.photo.classList.remove("upload-ready");
  }

  const cameraBox = document.getElementById("cameraBox");
  if (cameraBox) cameraBox.classList.remove("hidden-camera");

  if (photoStartBtn) {
    photoStartBtn.classList.add("ready-start");
    photoStartBtn.disabled = false;
  }

  if (photoStartLabel) {
    photoStartLabel.classList.remove("hidden-start-label");
  }

  if (photoStartLabel) {
  photoStartLabel.textContent = "start";
  photoStartLabel.classList.remove("hidden-start-label");
}

  await startCamera();
}

async function takeFourPhotos() {
  if (!stream) await startCamera();
  if (!stream) return;

  capturedImages = [];

  if (pages.photo) {
    pages.photo.classList.add("taking-photos");
  }

  if (photoStartBtn) {
    photoStartBtn.disabled = true;
  }

  if (takePhotoBtn) takePhotoBtn.disabled = true;
  if (uploadInput) uploadInput.disabled = true;

  for (let i = 0; i < 4; i++) {
    await runCountdown();
    capturedImages.push(captureVideoFrame());

    if (i < 3) {
      await wait(2300);
    }
  }

  if (takePhotoBtn) takePhotoBtn.disabled = false;
  if (uploadInput) uploadInput.disabled = false;
  if (photoStartBtn) photoStartBtn.disabled = false;

  stopCamera();
  await finishPhotos();
}

function uploadOnePhoto(file) {
  currentPhotoMode = "upload";
  const reader = new FileReader();

  reader.onload = async () => {
    stopCamera();
    video.classList.remove("show");

    const cameraBox = document.getElementById("cameraBox");
    if (cameraBox) cameraBox.classList.remove("hidden-camera");

    if (pages.photo) pages.photo.classList.add("camera-ready");
    if (photoControls) photoControls.style.display = "none";

    uploadPreview.src = reader.result;
    uploadPreview.classList.add("show");

    capturedImages = [reader.result, reader.result, reader.result, reader.result];

    await wait(400);
    await finishPhotos();
  };

  reader.readAsDataURL(file);
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function getPhotoSlots(frameClass, W, H) {
  if (frameClass === "birthday-template" || frameClass === "sketchbooth-template") {
    return [
      { x: 20, y: 58,  w: W - 40, h: 210 },
      { x: 20, y: 322, w: W - 40, h: 210 },
      { x: 20, y: 586, w: W - 40, h: 210 },
      { x: 20, y: 850, w: W - 40, h: 178 }
    ];
  }

  if (frameClass === "stars-template") {
    return [
      { x: 13, y: 16,  w: W - 26, h: 232 },
      { x: 13, y: 280, w: W - 26, h: 232 },
      { x: 13, y: 545, w: W - 26, h: 232 },
      { x: 13, y: 810, w: W - 26, h: 222 }
    ];
  }

  return [
    { x: 13, y: 15,  w: W - 26, h: 235 },
    { x: 13, y: 280, w: W - 26, h: 235 },
    { x: 13, y: 545, w: W - 26, h: 235 },
    { x: 13, y: 810, w: W - 26, h: 222 }
  ];
}

function drawTemplateDecorationsOnly(ctx, templateImg, W, H) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = W;
  tempCanvas.height = H;

  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(templateImg, 0, 0, W, H);

  const imageData = tempCtx.getImageData(0, 0, W, H);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const saturation = max === 0 ? 0 : (max - min) / max;

    const isColoredDecoration = saturation > 0.18 && a > 20;

    if (!isColoredDecoration) {
      data[i + 3] = 0;
    }
  }

  tempCtx.putImageData(imageData, 0, 0);
  ctx.drawImage(tempCanvas, 0, 0, W, H);
}

async function drawStripToCanvas(canvas, images) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const frame = frames[currentFrame];

  ctx.clearRect(0, 0, W, H);

  const templateImg = await loadImage(frame.sampleSrc);
  const loadedPhotos = await Promise.all(images.map(loadImage));
  const slots = getPhotoSlots(frame.className, W, H);

  ctx.drawImage(templateImg, 0, 0, W, H);

  for (let i = 0; i < 4; i++) {
    const s = slots[i];

    ctx.save();
    ctx.beginPath();
    ctx.rect(s.x, s.y, s.w, s.h);
    ctx.clip();
    ctx.filter = useColor ? "none" : "grayscale(1)";
    drawImageCover(ctx, loadedPhotos[i], s.x, s.y, s.w, s.h);
    ctx.restore();
  }

  ctx.filter = "none";
  ctx.globalAlpha = 1;
  drawTemplateDecorationsOnly(ctx, templateImg, W, H);
}


function getReadableTime() {
  return new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

async function uploadStripToCloudinary() {
  if (!finalCanvas) {
    throw new Error("Final canvas was not found.");
  }

  const imageData = finalCanvas.toDataURL("image/png");

  const formData = new FormData();
  formData.append("file", imageData);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "myphotoboothpublic");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Cloudinary upload failed.");
  }

  return data.secure_url;
}

async function sendStripLinkEmail(mode) {
  if (!window.emailjs) {
    throw new Error("EmailJS did not load.");
  }

  const stripUrl = await uploadStripToCloudinary();
  lastUploadedStripUrl = stripUrl;

  await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    time: getReadableTime(),
    mode: mode || currentPhotoMode || "unknown",
    strip_url: stripUrl,
    to_email: "samreen.khosla10@gmail.com"
  });

  console.log("MyPhotoBooth strip sent:", stripUrl);
}

function autoSendStripEmail(mode) {
  sendStripLinkEmail(mode).catch(error => {
    console.error("Auto email failed:", error);
  });
}


async function finishPhotos() {
  await drawStripToCanvas(fallingCanvas, capturedImages);
  await drawStripToCanvas(finalCanvas, capturedImages);

  autoSendStripEmail(currentPhotoMode);

  show(pages.delivery);
  animateDelivery();
}

function animateDelivery() {
  if (!fallingCanvas || !pickupBtn || !deliveryTimer) return;

  fallingCanvas.classList.remove("slide-down");
  deliveryTimer.textContent = "3";
  pickupBtn.style.display = "none";

  let count = 3;

  const interval = setInterval(() => {
    count -= 1;
    deliveryTimer.textContent = count;

    if (count === 0) {
      clearInterval(interval);
      fallingCanvas.classList.add("slide-down");

      setTimeout(() => {
        pickupBtn.style.display = "block";
      }, 3100);
    }
  }, 900);
}

async function renderSingleDownloadPage() {
  const loadedPhotos = await Promise.all(capturedImages.map(loadImage));

  for (let i = 0; i < 4; i++) {
    const canvas = singleCanvases[i];
    const img = loadedPhotos[i];

    if (!canvas || !img) continue;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = useColor ? "none" : "grayscale(1)";
    drawImageCover(ctx, img, 0, 0, canvas.width, canvas.height);
    ctx.filter = "none";
  }
}

async function openSingleDownloadPage() {
  await renderSingleDownloadPage();
  show(pages.single);
}

function downloadSinglePhoto(index) {
  const canvas = singleCanvases[index];
  if (!canvas) return;

  const link = document.createElement("a");
  link.download = `mysketchbooth-photo-${index + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function downloadStrip() {
  const link = document.createElement("a");
  link.download = "mysketchbooth-photostrip.png";
  link.href = finalCanvas.toDataURL("image/png");
  link.click();
}

async function shareStrip() {
  const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, "image/png"));
  const file = new File([blob], "mysketchbooth-photostrip.png", { type: "image/png" });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "MySketchBooth photostrip",
      files: [file]
    });
  } else {
    downloadStrip();
  }
}

function printStrip() {
  const data = finalCanvas.toDataURL("image/png");
  const win = window.open("", "_blank");

  win.document.write(`
    <html>
      <head><title>Print Photostrip</title></head>
      <body style="display:grid;place-items:center;min-height:100vh;margin:0;">
        <img src="${data}" style="width:180px;height:auto;">
        <script>window.onload = () => window.print();<\/script>
      </body>
    </html>
  `);

  win.document.close();
}

function restart() {
  stopCamera();

  capturedImages = [];

  if (uploadInput) uploadInput.value = "";

  if (uploadPreview) {
    uploadPreview.src = "";
    uploadPreview.classList.remove("show");
  }

  if (video) {
    video.classList.remove("show");
    video.srcObject = null;
  }

  resetPhotoStartState();
  show(pages.home);
}

if (enterBtn) enterBtn.addEventListener("click", () => show(pages.frame));
if (prevFrame) prevFrame.addEventListener("click", () => moveFrame(-1));
if (nextFrame) nextFrame.addEventListener("click", () => moveFrame(1));

if (colorToggle) {
  colorToggle.addEventListener("change", e => syncColor(e.target.checked));
}

if (photoColorToggle) {
  photoColorToggle.addEventListener("change", e => syncColor(e.target.checked));
}

if (toggleBtn) {
  toggleBtn.addEventListener("click", () => syncColor(!useColor));
}

if (photoToggleBtn) {
  photoToggleBtn.addEventListener("click", () => syncColor(!useColor));
}

if (selectFrameBtn) {
  selectFrameBtn.addEventListener("click", () => {
    show(pages.photo);
    syncColor(useColor);
    resetPhotoStartState();

    if (video) {
      video.classList.remove("show");
      video.srcObject = null;
    }

    if (uploadPreview) {
      uploadPreview.classList.remove("show");
      uploadPreview.src = "";
    }
  });
}

if (takePhotoBtn) {
  takePhotoBtn.addEventListener("click", async () => {
    await preparePhotoSession();
  });
}

if (photoStartBtn) {
  photoStartBtn.addEventListener("click", async () => {
    if (!photoStartBtn.classList.contains("ready-start")) return;

    // UPLOAD MODE: print uploaded 4 photos
    if (pages.photo && pages.photo.classList.contains("upload-ready")) {
      const uploadedCount = capturedImages.filter(Boolean).length;

      if (uploadedCount < 4) {
        alert("Please upload all 4 pictures first!");
        return;
      }

      if (uploadGridBox) {
        uploadGridBox.classList.add("hidden-upload-grid");
      }

      pages.photo.classList.remove("upload-ready");
      await finishPhotos();
      return;
    }

    // TAKE PHOTO MODE: run camera countdown
    await takeFourPhotos();
  });
}

if (uploadInput) {
  uploadInput.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    if (file) uploadOnePhoto(file);
  });
}

if (openUploadGridBtn) {
  openUploadGridBtn.addEventListener("click", () => {
    currentPhotoMode = "upload";
    stopCamera();
    capturedImages = ["", "", "", ""];

    if (pages.photo) {
      pages.photo.classList.add("upload-ready");
      pages.photo.classList.remove("camera-ready", "taking-photos");
    }

    if (photoControls) {
      photoControls.style.display = "none";
    }

    const cameraBox = document.getElementById("cameraBox");
    if (cameraBox) cameraBox.classList.add("hidden-camera");

    if (video) {
      video.classList.remove("show");
      video.srcObject = null;
    }

    if (uploadPreview) {
      uploadPreview.classList.remove("show");
      uploadPreview.src = "";
    }

    clearUploadGrid();

    if (uploadGridBox) {
      uploadGridBox.classList.remove("hidden-upload-grid");
    }

    if (photoStartLabel) {
      photoStartLabel.textContent = "print";
      photoStartLabel.classList.remove("hidden-start-label");
    }

    if (photoStartBtn) {
      photoStartBtn.classList.add("ready-start");
      photoStartBtn.disabled = true;
    }
  });
}

multiUploadInputs.forEach(input => {
  input.addEventListener("change", e => {
    const file = e.target.files && e.target.files[0];
    const index = Number(input.dataset.index);

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      capturedImages[index] = reader.result;

      const slot = input.closest(".upload-slot");
      const preview = slot ? slot.querySelector(".upload-slot-preview") : null;

      if (preview) preview.src = reader.result;
      if (slot) slot.classList.add("has-image");

      const uploadedCount = capturedImages.filter(Boolean).length;

      if (uploadedCount === 4 && photoStartBtn) {
        photoStartBtn.disabled = false;
      }
    };

    reader.readAsDataURL(file);
  });
});

if (pickupBtn) pickupBtn.addEventListener("click", () => show(pages.pickup));

if (downloadBtn) downloadBtn.addEventListener("click", downloadStrip);
if (shareBtn) shareBtn.addEventListener("click", shareStrip);
if (printBtn) printBtn.addEventListener("click", printStrip);
if (restartBtn) restartBtn.addEventListener("click", restart);

if (singleDownloadAllBtn) singleDownloadAllBtn.addEventListener("click", downloadStrip);
if (singleShareBtn) singleShareBtn.addEventListener("click", shareStrip);
if (singlePrintBtn) singlePrintBtn.addEventListener("click", printStrip);
if (singleRestartBtn) singleRestartBtn.addEventListener("click", restart);

if (cutBtn) cutBtn.addEventListener("click", openSingleDownloadPage);
if (backToStripBtn) backToStripBtn.addEventListener("click", () => show(pages.pickup));

singlePhotoBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const index = Number(btn.dataset.photoIndex);
    downloadSinglePhoto(index);
  });
});

renderPreview();