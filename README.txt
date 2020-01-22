I wanna play online

Description:
  This software is designed to automatically convert an 'I wanna be the guy' fangame into an online playable version.

Maker:
  Dapper Mink (QuentinJanuel)
  quentinjanuelkij@gmail.com
  (my discord changes all the time, sorry)

Special thanks:
  Adam, viri, Maarten Baert and krzys-h

How to use:
  In order to use this software, all you need to do is drag and drop the executable (.exe) of any game onto iwpo.exe.
  Make sure to let iwpo in its own directory.
  If no error message is thrown, then three cases can happen:
   - If the game is made with GameMaker 8 (or 8.1), the online game will be created as a new executable in the same directory.
   - If the game is made with GameMaker Studio and is self contained, the online game will be created in a new folder with all the resources unpacked.
   - If the game is made with GameMaker Studio and is already unpacked, a file data_backup.win will be created. The game will now be online, and in order to get back to the original version replace the file data.win by data_backup.win.

Website:
  You can see all the games that are currently played on this website:
  https://iwpo.isocodes.org

FAQ:
  Q: Me and my friend can't play [some game] together, the server seems to think we are playing two different games
  A: Make sure you converted the exact same executable, probably you two had different versions of the game.

  Q: The tool I try to convert a GameMaker:Studio game even though it is GameMaker8
  A: Probably you have a data.win file in the same directory, I check its presence to detect GameMaker:Studio and unfortunately that can lead to this bug. To fix this, you can simply temporarily remove the data.win file from the directory.

  Q: I tried to convert [some game] but the converter failed. Why?
  A: Sorry about that, I cannot convert every game. Some just won't work. I will try my best at covering the greatest majority of fangames. Feel free to contact me if there is a game you really want to play online, but be aware I have other priorities and will not do updates that often. Also, no I will not cover Kamilia 3!!

  Q: This sucks, the server keeps crashing or is way too slow!
  A: Well, sorry again. This is my first experience at creating online games, so I may have done some things wrong. If you have advices or recommendations about the way I should code the server, once again feel free to contact me.

Thank you so much for downloading, I really hope you will have a lot of fun!
