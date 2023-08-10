# push-to-talk
A website for push to talk ai conversion voices - can connect to Discord through VB virtual cable, or you can just download the .wav file yourself.


## Folder Path
Make sure to add hubert_base.py into the folder, along with the RVC-beta folder in the same folder as this github. So it would look like:

- Overall_folder
  - push-to-talk
    - -hubert_base.py
  - RVC-beta
    - RVC-beta0717
  
## If you would like to connect to Discord
- Install vb virtual cable 
- Set the default input device on windows to the Virtual cable
- Set the input device on Discord to the virtual cable
- 

## General Notes
- This assumes the paths are correct and you have everything installed.
  - If you were to do this yourself, check the TODOs in app.js to change the paths.
  - You would also need to install node js, along with some packages.
- You will have to train the models through the RVC provided training, through their own web.
- This assumes some general values for the translation - you can change them as needed, but would have to restart the website. 