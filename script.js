const video = document.getElementById("video");
/* !IMPORTANT! 
    The name of the folder must be the same as the label
    Add your name in the labels array;

    TODO: need optimisation. If loaded multiple pictures(models) will crash.
*/
const labels = ["Tiberiu"];

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
]).then(startVideo);

async function startVideo() {
  Promise.all(
    labels.map(async label => {
      const descriptions = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `http://127.0.0.1:5500/labeled_images/${label}/${i}.jpg`
        );
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }

      navigator.getUserMedia(
        { video: {} },
        stream => (video.srcObject = stream),
        err => console.error(err)
      );

      let data = new faceapi.LabeledFaceDescriptors(label, descriptions);
      const labeledFaceDescriptors = data;
      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      video.addEventListener("play", () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.body.append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);
        setInterval(async () => {
          canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
          const detections = await faceapi
            .detectAllFaces(video)
            .withFaceLandmarks()
            .withFaceDescriptors();
          const resizedDetections = faceapi.resizeResults(
            detections,
            displaySize
          );
          const results = resizedDetections.map(d =>
            faceMatcher.findBestMatch(d.descriptor)
          );
          results.forEach((result, i) => {
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, {
              label: result.toString()
            });
            drawBox.draw(canvas);
          });
        }, 1000);
      });
    })
  );
}

function loadLabeledImages() {}
