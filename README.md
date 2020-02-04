# I wanna play online

## Description
This is the main application for I wanna play online. It has the code for moding a GM8 fangame, and needs the built [GMS modder](https://gitlab.com/i-wanna-play-online/modder-gms) for working.
The code really lacks of documentation for now.

## Launch
You will need [node](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/getting-started/install).
Then you will need to install the node modules by running
```
yarn
```
Finally, simply run
```
yarn start
```

## Build
First you will need to install the node modules by running
```
yarn
```
Then, simply run
```
yarn build
```
(you may need to create a new instance of your terminal after running `yarn setup-build`).

## Edit the GML files
The GML files contain the code that will be injected into the game.
If you want to edit these files to contribute, first there are 3 things you should note:
* For every custom variable name you use, prefix it with `@`. The converter will then add a longer prefix in order to avoid conflicts.
* All the occurences of `%arg[n]` will be replaced by the nth argument. Those are handled by the converter.
* You can add specific parts of code with some sorts of directives:
    ```c
    #if STUDIO
        // This will be added to the game only for GameMaker:Studio
        #if not NIKAPLE
            // This will be added to the game only for GameMaker:Studio with a non Nikaple engine
        #endif
    #endif
    ```
