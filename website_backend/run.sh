#!/bin/bash

cd /master_web/autodiep
for((;;))
do
  node fetch.mjs
  node verifier.js
  retVal=$?
  if [ $retVal -eq 0 ]; then
    node scanner.js
  fi
done
