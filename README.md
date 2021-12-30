## mlt-archiver

This is a tool to help you archive your [Shotcut](https://shotcut.org/) project in a single folder, putting together all dependencies (like videos, images, soundtracks etc.) and using relative paths so that you can share the project with other prople.

### Usage
Install `mlt-archiver` from the NPM Repository

``` bash
$ npm install --global mlt-archiver
```

Go to the directory where your `.mlt` file is located and run the `arvhive` command. You need to point the directory where you want to create your archived folder.

#### Archiving


``` bash
# Create the directory to save the archived media
mkdir ~/Desktop/Montando-Mesa-Archived

# Run the command to archive
node index.js archive ~/Desktop/Montando\ Mesa.mlt ~/Desktop/Montando-Mesa-Archived

# Create a zip file
zip -r -X -9 "Montando-mesa-archived.zip" ~/Desktop/Montando-Mesa-Archived
```

#### Unarchiving

``` bash
# Uncompress the zip file
unzip ~/Downloads/Montando-mesa-archived.zip

# Run the command to unarchive
node index.js unarchive ~/Downloads/Montando-Mesa-Archived/Montando\ Mesa.mlta
```

