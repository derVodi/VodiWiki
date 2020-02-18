# VodiWiki

## Abstract

VodiWiki is a self contained wiki in a monolithic HTML file. This means the reader, the editor and the content is all in the very same file which can easily be put an an USB stick or published on a web site.

You can read more here: http://vodi.de/VodiWiki/

You can download an empty wiki here: http://www.vodi.de/VodiWiki/VodiWiki.zip

## Origin & Motivation

VodiWiki is based on TiddliWiki 2.8.1 by [Jeremy Ruston](https://github.com/Jermolene). A [new generation of TiddliWiki](https://tiddlywiki.com/) is still maintained by a large community. The motivation to create a separate product (instead of participating the community) is that I want to go in a different direction: Less customizability, more simplicity in use.

## Working With The Source Code

* Clone/download
* You _can_ start indext.html right away, but saving won't work, because in the saved file all JS will be missing

### Building a fully working, monolithic HTML

First build the linker, e.g. using such a command line...

    "command": "\"C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe\" /nologo /out:Building\\MyLinker.exe Building\\MyLinker.cs"

...the invoke the linker with the right arguments, e.g. like this:

    "command": "Building\\MyLinker.exe - index.html Out\\Empty.html Out\\Original.html",

## Work in Progress

See Trello: https://trello.com/b/QffB4q5s/vodiwiki
