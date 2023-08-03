const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
let numbers = [];
let modelName = "";
let string = "";
let modelInputs = {};






// In-memory storage for audio blobs (for demonstration purposes)
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

// New endpoint to serve the latest recorded audio file without downloading
app.get('/listen', (req, res) => {
  console.log('received request to listen');
  const audioFilePath = path.join(__dirname, 'recorded_audio', 'recorded_audio.webm');
  console.log(audioFilePath)

  directoryPath = path.join(__dirname, 'recorded_audio');
  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
        // Do whatever you want to do with the file
        // console.log(file); 
    });
  });

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

function convertVoice() {
  let finalInputs = [];
  // TODO: Change based on machine
  finalInputs.splice(1, 0, 'C:\Users\drago\Documents\push-to-talk-website\push-to-talk\recorded_audio\recorded_audio.webm');

  console.log(finalInputs);

  //runPythonScript(finalInputs);
  
}

// Function to run the Python script with inputs
function runPythonScript(inputs) {
  // Replace 'pythonScript.py' with the name of your Python script
  const pythonScript = spawn('python', ['convert.py']);

  // Write the inputs to the Python script's stdin
  pythonScript.stdin.write(inputs.join('\n'));
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
  });
}

app.post('/saveSettings', (req, res) => {
  modelInputs = req.body;
  numbers = req.body.numbers;
  modelName = req.body.selectedFile;
  string = req.body.additionalString;

  modelName = modelName.substring(0, modelName.length - 4);


  // You can perform any necessary validation or processing of the numbers here

  // Just log the numbers to the console
  console.log('Received inputs:', modelInputs);
  console.log('Received numbers:', numbers);
  console.log("Received file: ", modelName);
  console.log("Received string: ", string);

  // You can store the numbers in a database or perform any other backend operations here

  // Respond with a success message
  res.status(200).json({ message: 'Numbers saved successfully!' });
});
  
// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
