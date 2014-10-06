#!/bin/bash
$projectDir | pwd

# install bower dependencies
bower install; 

# copy shared libs
cp -Rf lib/* public/lib/

# build minified version of ace
# if [ ! -f "public/lib/ace/build/src-min/ace.js" ]
# then
# 	cd public/lib/ace
# 	npm install 
# 	node Makefile.dryice.js -m
# 	cd $projectDir
# fi