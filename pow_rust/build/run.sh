#!/bin/bash

node-gyp configure && node-gyp build && node test.js
