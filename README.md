## Archiving

1. Create the directory to save the archived media

``` bash
# Create the directory to save the archived media
mkdir Montando-Mesa-Archived

# Run the command to archive
node index.js archive ~/Desktop/Montando\ Mesa.mlt ~/Desktop/Montando-Mesa-Archived

# Create a zip file
zip -r -X -9 "Montando-mesa-archived.zip" Montando-Mesa-Archived
```


## Unarchiving

``` bash
# Uncompress the zip file
unzip Montando-mesa-archived.zip

# Run the command to unarchive
node index.js unarchive ~/Downloads/Montando-Mesa-Archived/Montando\ Mesa.mlta
```

