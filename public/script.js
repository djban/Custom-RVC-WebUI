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
  
///////////////
recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
downloadButton.addEventListener('click', downloadAudio);
playButton.addEventListener('click', playAudio);
///////////////


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
  });
}

async function stopRecording() {
  console.log('stop button pressed')

  if (!isRecording) return;
  isRecording = false;

  mediaRecorder.stop();

  const formData = new FormData();
  formData.append('audio', new Blob(audioChunks.map(chunk => chunk.data), { type: 'audio/webm' }), 'recorded_audio.webm');


  // try {
  //   // Send the recorded audio data to the server using fetch and a POST request
  //   const response = await fetch('/upload', {
  //     method: 'POST',
  //     body: formData
  //   });

  //   if (response.ok) {
  //     console.log('Audio file uploaded successfully.');
  //     console.log(formData);
      

  //     // const data = await response.json();
  //     const downloadURL = '/recorded_audio/recorded_audio.webm';


  //     // Trigger the server-side download by making another fetch request
  //     const downloadResponse = await fetch(downloadURL);
  //     if (downloadResponse.ok) {
  //       console.log('Audio file downloaded successfully on the server.');
  //     } else {
  //       console.error('Error downloading audio file on the server:', downloadResponse.statusText);
  //     }

  //     // const downloadUrl = await response.text();
  //     // window.location.href = downloadUrl;

  //     // After successful upload, trigger the download on the client side
  //     // const downloadLink = document.createElement('a');
  //     // downloadLink.href = '/download';
  //     // downloadLink.download = 'recorded_audio.webm';
  //     // downloadLink.style.display = 'none';
  //     // document.body.appendChild(downloadLink);
  //     // downloadLink.click();
  //     // document.body.removeChild(downloadLink);


  //   } else {
  //     console.error("Error uploading audio file: ", response.statusText);
  //   }
  //   } catch (error) {
  //     console.error("Error uploading audio file:", error);
  //   }
    

    // Optional: Clear the recorded audio chunks after upload

  document.querySelector('.redDot').style.display = 'none';
  // Disable the "Stop Recording" button
  stopButton.disabled = true;
  // Enable the "Start Recording" button again
  recordButton.disabled = false;


}

// function downloadAudio() {
//   const latestAudio = audioChunks[audioChunks.length - 1];
//   const downloadLink = document.createElement('a');
//   downloadLink.href = latestAudio.url;
//   downloadLink.download = 'recorded_audio.webm';
//   downloadLink.style.display = 'none';
//   document.body.appendChild(downloadLink);
//   downloadLink.click();
//   document.body.removeChild(downloadLink);
// }



// async function downloadAudio() {
//   console.log('Download button clicked')
//   try {
//     const response = await fetch('/download');
//     if (response.ok) {

//       const link = document.createElement('a');
//       link.href = '/download';
//       link.download = 'recorded_audio.webm';
//       link.style.display = 'none';

//       // Add the link to the document and click it to initiate the download
//       document.body.appendChild(link);
//       link.click();

//       // Remove the link from the document after the download
//       document.body.removeChild(link);


//       // window.location.href = '/download';

//       // const blob = await response.blob();
//       // const url = URL.createObjectURL(blob);
//       // console.log(url);

//       // Set the Blob URL as the href of the Download button
//       // downloadButton.href = url;
//       // downloadButton.download = 'recorded_audio.webm';

//       // Simulate a click on the Download button to initiate the download
//       // downloadButton.click();
//     } else {
//       console.error('Error fetching audio file:', response.statusText);
//     }
//   } catch (error) {
//     console.error('Error fetching audio file:', error);
//   }
//   downloadButton.removeEventListener('click', downloadAudio);
//   downloadEventAdded = false;
// }

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

  // try {
  //   const response = await fetch('/download');
  //   if (response.ok) {
  //     const blob = await response.blob();

  //     // Create a temporary link element to trigger the download
  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = 'recorded_audio.webm';
  //     link.style.display = 'none';

  //     // Add the link to the document and click it to initiate the download
  //     document.body.appendChild(link);
  //     link.click();

  //     // Remove the link from the document after the download
  //     document.body.removeChild(link);
  //   } else {
  //     console.error('Error fetching audio file:', response.statusText);
  //   }
  // } catch (error) {
  //   console.error('Error fetching audio file:', error);
  // }
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

  // try {
  //   const response = await fetch('/listen');
  //   if (response.ok) {
  //     const blob = await response.blob();
  //     console.log(blob);
  //     // Create a Blob URL from the received blob data
  //     const audioURL = URL.createObjectURL(blob);
  //     console.log(audioURL);


  //     // Set the Blob URL as the src attribute of the audio element
  //     audioPlayer.src = audioURL;

  //     // Play the audio
  //     audioPlayer.play();
  //   } else {
  //     console.error('Error fetching audio file:', response.statusText);
  //   }
  // } catch (error) {
  //   console.error('Error fetching audio file:', error);
  // }
} catch (error) {
  console.error('Error fetching audio file:', error);
  }
}




});

