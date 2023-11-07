# Custom RVC WebUI
A website for push to talk ai conversion voices - can connect to Discord through VB virtual cable, or you can just download the .wav file yourself. Built with a server and client side.

# Installation
This requires two different folders all within one general folder. This provides the `push-to-talk` folder without the `hubert_base.py`. Make a secondary folder called `RVC-beta` and include the `RVC-beta0717` file, which can be found in the same location as the `hubert_base.py` [here](https://huggingface.co/lj1995/VoiceConversionWebUI/tree/main).

- Overall_folder
  - push-to-talk
    - -hubert_base.py
  - RVC-beta
    - RVC-beta0717


Ensure that your python version is under 3.11. Then, create a virtual environment and run `python -m venv virtualenv`. Then run `. virtualenv/Scripts/activate` to start the virtual environment.

Then, run `pip install -r requirements.txt` from the push-to-talk folder.

Ensure that you have node installed as well. Then, inside the `push-to-talk` folder, run `node app.js`


  
## If you would like to connect to Discord
- Install vb virtual cable 
- Set the default input device on windows to the Virtual cable
- Set the input device on Discord to the virtual cable
- 

## General Notes
- This assumes the paths are correct and you have everything installed. In general, I've found that setting up machine learning environments as one of the hardest parts of this.
- You will have to train the models through the RVC provided training, through their own web ui in the `RVC-beta` file.
- This assumes some general values for the translation - you can edit  them as needed, but would have to restart the website.
- Although I've squashed many bugs, this is not bug free. This website definitely assumes the best intention from it's users. 
