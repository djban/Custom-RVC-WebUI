let mediaRecorder;
let chunks = [];
let downloadEventAdded = false;
let isRecording = false;


document.addEventListener('DOMContentLoaded', () => {
  const audioChunks = [];
  const recordButton = document.getElementById('recordButton');
  const stopButton = document.getElementById('stopButton');
  const downloadButton = document.getElementById('downloadButton');

  const audioPlayer = document.getElementById('recordedAudio');
  const playButton = document.getElementById('playButton');
  const convertButton = document.getElementById('convertButton');
  const submitButton = document.getElementById('submitButton');
  
///////////////
recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
downloadButton.addEventListener('click', downloadAudio);
playButton.addEventListener('click', playAudio);
convertButton.addEventListener('click', convertAudio);
submitButton.addEventListener('click', submitSettings);
///////////////

async function submitSettings() {
  const numberInputs = document.getElementsByClassName('numberInput');
  const numbers = [];

  // Iterate through all input fields and collect the numbers
  for (const input of numberInputs) {
    const number = input.value.trim();

    // Check if the user entered a valid number
    if (!isNaN(number)) {
      numbers.push(Number(number));
    }
  }

  if (numbers.length !== 3) {
    alert('Please enter three valid numbers');
    return;
  }

  try {
    // Send the numbers to the backend using a POST request
    const response = await fetch('/saveSettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ numbers }),
    });

    if (response.ok) {
      alert('Numbers saved successfully!');
    } else {
      alert('Failed to save the numbers.');
    }
  } catch (error) {
    console.error('Error saving the numbers:', error);
  }
}

function convertAudio() {
  console.log('convert button pressed');
  if (isRecording) return;

}

function startRecording() {
  console.log('start button pressed')

  if (isRecording) return;
  isRecording = true;
  chunks = [];

  const constraints = { audio: true };
  navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
    const options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 };
    mediaRecorder = new MediaRecorder(stream, options);
    mediaRecorder.ondataavailable = function (event) {
      chunks.push(event.data);
    };
    mediaRecorder.onstop = function () {
      console.log('chunks length before push:', chunks.length);

      const blob = new Blob(chunks, { type: 'audio/webm' });
      chunks.length = 0;
      console.log('audioChunks length before push:', audioChunks.length);

      //////

      const formData = new FormData();
      // Append the recorded audio blob to the FormData object with a specific filename
      formData.append('audio', blob, 'recorded_audio.webm');
      fetch('/upload', {
        method: 'POST',
        body: formData,
      })
        .then((response) => {
          if (response.ok) {
            console.log('Audio file uploaded successfully to the server.');
          } else {
            console.error('Error uploading audio file:', response.statusText);
          }
        })
        .catch((error) => {
          console.error('Error uploading audio file:', error);
        });


      const audioURL = URL.createObjectURL(blob);
      audioChunks.push({ data: blob, url: audioURL });
      console.log('audioChunks length after push:', audioChunks.length);
      console.log(audioChunks.values());
      //////




      downloadButton.classList.add('show'); // Show the download button when recording stops
      playButton.classList.add('show'); 
      convertButton.classList.add('show'); 
      submitButton.classList.add('show');
    };

    mediaRecorder.start();
    document.querySelector('.redDot').style.display = 'inline-block';

    if (!downloadEventAdded) {
      downloadButton.addEventListener('click', downloadAudio);
      downloadEventAdded = true;
    }

    recordButton.disabled = true; // Disable the "Start Recording" button
    stopButton.disabled = false; // Enable the "Stop Recording" button
    downloadButton.classList.remove('show'); // Hide the download button when starting recording
    playButton.classList.remove('show'); 
    convertButton.classList.remove('show'); 
    submitButton.classList.remove('show');

  });
}

async function stopRecording() {
  console.log('stop button pressed')

  if (!isRecording) return;
  isRecording = false;

  mediaRecorder.stop();

  const formData = new FormData();
  formData.append('audio', new Blob(audioChunks.map(chunk => chunk.data), { type: 'audio/webm' }), 'recorded_audio.webm');



  document.querySelector('.redDot').style.display = 'none';
  // Disable the "Stop Recording" button
  stopButton.disabled = true;
  // Enable the "Start Recording" button again
  recordButton.disabled = false;


}

async function downloadAudio() {
  console.log('Download button clicked');

  try {
    const latestAudio = audioChunks[audioChunks.length - 1];
    if (!latestAudio) {
      console.error('No audio data found.');
      return;
    }

  // Create a temporary link element to trigger the download
  const downloadLink = document.createElement('a');
  downloadLink.href = latestAudio.url;
  downloadLink.download = 'recorded_audio.webm';
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);

  // Simulate a click on the Download link to initiate the download
  downloadLink.click();

  // Remove the link from the document after the download
  document.body.removeChild(downloadLink);
  } catch (error) {
    console.error('Error fetching audio file:', error);
  }
  downloadButton.removeEventListener('click', downloadAudio);
  downloadEventAdded = false;
}



// Function to play the recorded audio
async function playAudio() {

  try {
    const latestAudio = audioChunks[audioChunks.length - 1];
    if (!latestAudio) {
      console.error('No audio data found.');
      return;
    }

    // Create a new Audio element and set its source to the recorded audio URL
    const audioElement = new Audio(latestAudio.url);

    // Play the audio
    audioElement.play();

} catch (error) {
  console.error('Error fetching audio file:', error);
  }
}




});

