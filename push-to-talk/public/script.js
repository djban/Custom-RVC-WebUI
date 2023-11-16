let mediaRecorder;
let chunks = [];
let downloadEventAdded = false;
let isRecording = false;


document.addEventListener('DOMContentLoaded', () => {
  const audioChunks = [];
  const recordButton = document.getElementById('recordButton');
  const stopButton = document.getElementById('stopButton');
  const downloadButton = document.getElementById('downloadButton');

  const playButton = document.getElementById('playButton');
  const convertButton = document.getElementById('convertButton');
  const submitButton = document.getElementById('submitButton');
  const playbackButton = document.getElementById('playbackButton');

  const scriptStatusElement = document.getElementById('scriptStatus');
  scriptStatusElement.textContent = 'Script Status: Waiting...';


///////////////
recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
downloadButton.addEventListener('click', downloadAudio);
playButton.addEventListener('click', playRealAudio);
convertButton.addEventListener('click', convertAudio);
submitButton.addEventListener('click', submitSettings);
playbackButton.addEventListener('click', playConvertedAudio);


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

  const dropdownMenu = document.getElementById('pthDropdown');
  const selectedFile = dropdownMenu.value;


  const data = {
    numbers: numbers,
    selectedFile: selectedFile,
    // Add any other data you want to send to the server here
  };

  try {
    const response = await fetch('/saveSettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('Settings submitted successfully.');
    } else {
      console.error('Error submitting settings:', response.statusText);
    }
  } catch (error) {
    console.error('Error submitting settings:', error);
  }
}

function convertAudio() {
  console.log('convert button pressed');
  if (isRecording) return;

  const scriptStatusElement = document.getElementById('scriptStatus');
  scriptStatusElement.textContent = 'Script Status: Converting...';

  fetch('/convert') // Send a GET request to the /convert endpoint
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      scriptStatusElement.textContent = 'Script Status: Converted!';
      console.log('AAAAAAAAAAAAAAAAAAAA');
      return response.text();
    })
    .then(message => {
      console.log(message);

      // Update the status when the conversion is successful
      scriptStatusElement.textContent = 'Script Status: Converted!';
      console.log('AAAAAAAAAAAAAAAAAAAA');
    })
    .catch(error => {
      // Handle errors and update the status accordingly
      console.error('Error:', error);

      scriptStatusElement.textContent = 'Script Status: Conversion Failed';
    })
    .finally(() => {
      console.log('finished converting');
    });
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
    };

    mediaRecorder.start();
    document.querySelector('.redDot').style.display = 'inline-block';

    if (!downloadEventAdded) {
      downloadButton.addEventListener('click', downloadAudio);
      downloadEventAdded = true;
    }

    recordButton.disabled = true; // Disable the "Start Recording" button
    stopButton.disabled = false; // Enable the "Stop Recording" button


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
async function playAudioFile(fileName) {
  const audioPlayer = document.createElement('audio');

  try {
    const response = await fetch(`/listen/${fileName}`);
    if (response.ok) {
      const blob = await response.blob();
      const audioURL = URL.createObjectURL(blob);
      
      audioPlayer.src = audioURL;
      audioPlayer.play();
      
      console.log(`Playing audio: ${fileName}`);
    } else {
      console.error('Error fetching audio file:', response.statusText);
    }
  } catch (error) {
    console.error('Error playing audio:', error);
  }
}


  // Function to fetch the list of .pth files from the server
  async function fetchPthFiles() {
    try {
      const response = await fetch('/listFiles?folderName=weights'); // Replace 'path/to/your/folder' with the actual folder name
      if (response.ok) {
        const pthFiles = await response.json();
        return pthFiles;
      } else {
        console.error('Error fetching .pth files:', response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error fetching .pth files:', error);
      return [];
    }
  }

  // Function to populate the dropdown menu with .pth files
  async function populateDropdownMenu() {
    const dropdownMenu = document.getElementById('pthDropdown');

    // Fetch the list of .pth files from the server
    const pthFiles = await fetchPthFiles();

    // Clear existing options
    dropdownMenu.innerHTML = '';

    // Create and append new options for each .pth file
    pthFiles.forEach((file) => {
      const option = document.createElement('option');
      option.value = file;
      option.text = file;
      dropdownMenu.appendChild(option);
    });
  }

  populateDropdownMenu();
  
async function playRealAudio() {
  playAudioFile('recorded_audio.webm');
}

async function playConvertedAudio() {
  playAudioFile('output_sound.wav');
}
});


