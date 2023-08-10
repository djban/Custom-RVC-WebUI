const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const player = require('play-sound')({ player: 'ffplay' }); // Adjust 'ffplay' based on your system

let numbers = [];
let modelName = "";
let string = "";
let modelInputs = {};
let pitch = "";
let indexRate = "";


// In-memory storage for audio blobs
const audioStorage = [];

// Configure multer for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Serve static files from the "public" folder
app.use(express.static('public'));
app.use('/recorded_audio', express.static('recorded_audio'));

// Enable CORS
app.use(cors());
// Parse incoming JSON data
app.use(bodyParser.json());




// Endpoint to handle audio file uploads
app.post('/upload', upload.single('audio'), (req, res) => {
  console.log('received request to upload');

  const { buffer, mimetype } = req.file;

  // Save the audio blob to the in-memory storage (in a production scenario, use a database or cloud storage)
  audioStorage.push({ data: buffer, type: mimetype });

  // Save the audio file to the "recorded_audio" folder
  const fileName = `recorded_audio.webm`;
  const filePath = path.join(__dirname, 'recorded_audio', fileName);
  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error('Error saving audio file:', err);
      return res.status(500).send('Error saving audio file.');
    }
    console.log('Audio file saved successfully!');

    const downloadURL = '/recorded_audio/recorded_audio.webm';
    res.status(200).send({ downloadURL });

    // res.status(200).send('Audio file uploaded and saved successfully!');
  });
});


// Endpoint to get all the recorded audio files (for testing purposes)
app.get('/list', (req, res) => {
  res.json(audioStorage);
});

// Endpoint to serve the latest recorded audio file
app.get('/download', (req, res) => {
  console.log('received request to download');

  const audioFilePath = path.join(__dirname, 'recorded_audio', 'recorded_audio.webm');
  console.log(audioFilePath)

  // Check if the audio file exists
  fs.access(audioFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If the file does not exist, send a 404 Not Found response
      console.error('Audio file not found:', err);
      return res.status(404).send('Audio file not found.');
    }

    // If the file exists, stream it to the client for download
    const fileStream = fs.createReadStream(audioFilePath);
    res.setHeader('Content-Disposition', 'attachment; filename="recorded_audio.webm"');
    res.setHeader('Content-Type', 'audio/webm;codecs=opus');

    fileStream.pipe(res);
  });
});

// Endpoint to serve a specific audio file from the recorded_audio folder
app.get('/listen/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const audioFilePath = path.join(__dirname, 'recorded_audio', fileName);

  // Check if the audio file exists
  fs.access(audioFilePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If the file does not exist, send a 404 Not Found response
      console.error('Audio file not found:', err);
      return res.status(404).send('Audio file not found.');
    }

    // Get the file stats to determine the file size
    const stat = fs.statSync(audioFilePath);
    const fileSize = stat.size;

    // Parse range header to support range requests
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = (end - start) + 1;

      // Set the Content-Range header to support range requests
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', chunkSize);

      // Set the status code to 206 Partial Content
      res.statusCode = 206;

      // Stream the audio file based on the range request
      const fileStream = fs.createReadStream(audioFilePath, { start, end });
      res.setHeader('Content-Type', 'audio/webm;codecs=opus');
      fileStream.pipe(res);
    } else {
      // If no range request is provided, stream the whole audio file
      const fileStream = fs.createReadStream(audioFilePath);
      res.setHeader('Content-Type', 'audio/webm;codecs=opus');
      res.setHeader('Content-Length', fileSize);
      fileStream.pipe(res);
    }
  });
});

// Endpoint to get the list of .pth files in a specified folder
app.get('/listFiles', (req, res) => {
  const folderName = req.query.folderName; // Get the folderName from the query parameters

  // TODO: CHANGE BASED ON MACHINE
  const folderPath = path.join('c:/Users/drago/Documents/push-to-talk-website/RVC-beta/RVC-beta0717', folderName);
  console.log(folderPath);
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error('Error reading directory:', err);
      return res.status(500).json({ error: 'Error reading directory' });
    }

    // Filter the list to include only .pth files
    const pthFiles = files.filter((file) => path.extname(file).toLowerCase() === '.pth');

    // Send the list of .pth files to the frontend
    res.json(pthFiles);
  });
});

// Runs python script which converts "recorded_audio.webm to output_sound.wav"
app.get('/convert', (req, res) => {
  convertVoice();
  console.log('Voice conversion started.'); // You can send a response if needed
});

// Saves settings from front end
app.post('/saveSettings', (req, res) => {
  modelInputs = req.body;
  numbers = req.body.numbers;
  modelName = req.body.selectedFile;

  // save settings
  modelName = modelName.substring(0, modelName.length - 4);
  indexRate = numbers[1].toString();
  pitch = numbers[0].toString();
  console.log('pitch: ', pitch);

  //log the numbers to the console
  console.log('Received inputs:', modelInputs);
  console.log('Received numbers:', numbers);
  console.log("Received file: ", modelName);

  // Respond with a success message
  res.status(200).json({ message: 'Numbers saved successfully!' });

});

// function which contains the settings of the script to convert voice
async function convertVoice() {

// f0up_key=sys.argv[1]
// input_path=sys.argv[2]
// index_path=sys.argv[3]
// f0method=sys.argv[4]#harvest or pm or crepe
// opt_path=sys.argv[5]
// model_path=sys.argv[6]
// index_rate=float(sys.argv[7])
// device=sys.argv[8]
// is_half=bool(sys.argv[9])
// filter_radius=int(sys.argv[10])
// resample_sr=int(sys.argv[11])
// rms_mix_rate=float(sys.argv[12])
// protect=float(sys.argv[13])

  var finalInputs = [];

  finalInputs.push(pitch);
  // TODO: Change based on machine
  finalInputs.push('C:/Users/drago/Documents/push-to-talk-website/push-to-talk/recorded_audio/recorded_audio.webm');
  targetPath = path.join('C:/Users/drago/Documents/push-to-talk-website/RVC-beta/RVC-beta0717/logs', modelName);

  var indexFile = "";
  indexFile = await findFirstFileWithIndexStartingWithT(targetPath);


  // index Path
  console.log(indexFile);
  finalInputs.push(indexFile);
  
  // just set it for now
  finalInputs.push('harvest');
  finalInputs.push('C:/Users/drago/Documents/push-to-talk-website/push-to-talk/recorded_audio/output_sound.wav');

  let pthFile = modelName.concat(".pth");
  finalInputs.push(path.join("C:/Users/drago/Documents/push-to-talk-website/RVC-beta/RVC-beta0717/weights", pthFile));
  finalInputs.push(indexRate);
  finalInputs.push('cuda:0');
  finalInputs.push('True');
  finalInputs.push('3');
  finalInputs.push('0');
  finalInputs.push('1');
  finalInputs.push('0.33');



  console.log(finalInputs);

  // const stringInputs = finalInputs.join(" ");

  runPythonScript(finalInputs);

}

// plays converted audio
function playConvertedAudio() {
  const audioFilePath = 'output_sound.wav';

  // Use the ffplay command to play the audio file
  const ffplayProcess = spawn('ffplay', [audioFilePath]);

  // Handle any errors or exit events
  ffplayProcess.on('error', error => {
    console.error('Error playing audio:', error);
  });

  ffplayProcess.on('exit', code => {
    if (code !== 0) {
      console.error('Audio playback exited with code:', code);
    }
  });
}

// Function to run the Python script with inputs
function runPythonScript(inputs) {
  pythonArr = ['convert.py'].concat(inputs);
  const pythonScript = spawn('python', pythonArr);

  // Write the inputs to the Python script's stdin
  pythonScript.stdin.write(inputs.join(' '));
  pythonScript.stdin.end();

  // Handle the output from the Python script
  pythonScript.stdout.on('data', (data) => {
    console.log(`Python script output: ${data}`);
    // Process the output from the Python script as needed
  });

  // Handle any errors from the Python script
  pythonScript.stderr.on('data', (data) => {
    console.error(`Python script error: ${data}`);
  });

  // Handle the script's exit event
  pythonScript.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
    if (code === 0) {
      playConvertedAudio();
      console.log('played converted audio');
    } else {
    }
  });
}

// Finds the correct .index file
async function findFirstFileWithIndexStartingWithT(folderPath) {
  try {
    const files = await fs.promises.readdir(folderPath);
    const matchingFiles = files.filter((file) => file.startsWith(`t`) && file.endsWith(`.index`));
    if (matchingFiles.length > 0) {
      const matchingFilePath = path.join(folderPath, matchingFiles[0]);
      return matchingFilePath;
    }
    return null;
  } catch (error) {
    console.error('Error reading directory:', error);
    throw error; // Rethrow the error to the caller
  }
}
  
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
