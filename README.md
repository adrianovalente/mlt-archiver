## mlt-archiver

This is a tool to help you archive your [Shotcut](https://shotcut.org/) project in a single folder, putting together all dependencies (like videos, images, sound tracks etc.) and using relative paths so that you can share the project with other prople.

### Usage
Install `mlt-archiver` from the NPM Repository

``` shell
$ npm install --global mlt-archiver
```

Go to the directory where your `.mlt` file is located and run the `arvhive` command. You need to point the directory where you want to create your archived folder.

``` shell
$ mkdir -p ~/Movies/archived-movie
$ mlt-archiver archive my-movie.mlt ~/Movies/archived-movie
```

This will fill the `archived-movie` directory with all dependencies and also a `my-movie.mlta` file which can be unarchived later. 

``` shell
$ mlt-archiver unarchive my-movie.mlta
```