# Custom RVC WebUI
A website for push to talk ai conversion voices - can connect to Discord through VB virtual cable, or you can just download the .wav file yourself. Built with a server and client side.

# Installation
1. This requires two different folders all within one general folder. This provides the `push-to-talk` folder and every other file except the `hubert_base.py` which you must download and add to the `push-to-talk` folder. 

2. Make a secondary folder called `RVC-beta` and include the `RVC-beta0717` file, which can be found in the same location as the `hubert_base.py` [here](https://huggingface.co/lj1995/VoiceConversionWebUI/tree/main). Your resulting path should look like this: 
   

``` -Overall_folder
    -__pycache
    -recorded_audio
    -push-to-talk
      -hubert_base.py
    -RVC-beta
      -RVC-beta0717
    -requirements.txt
    -README.md
    -.gitignore
```

Ensure that your python version is under 3.11 - I used 3.10.0. Then, create a virtual environment and run `python -m venv venv`. Then run `. venv/Scripts/activate` to start the virtual environment.

Then, run `pip install -r requirements.txt` from the push-to-talk folder.

Ensure that you have node installed as well. Then, inside the `push-to-talk` folder, run `node app.js`


  
## If you would like to connect to Discord
- Install vb virtual cable 
- Set the default input device on windows to the Virtual cable
- Set the input device on Discord to the virtual cable

## General Notes
- This assumes the paths are correct and you have everything installed. In general, I've found that setting up machine learning environments as one of the hardest parts of this.
- You will have to train the models through the RVC provided training, through their own web ui in the `RVC-beta` folder. Use the `go-web` batch file to open up the website, and train ur model first.
- This assumes some general values for the translation - you can edit  them as needed, but would have to restart the website.
- Although I've squashed many bugs, this is not bug free. This website definitely assumes the best intention from it's users. 
