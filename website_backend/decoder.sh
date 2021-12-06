#!/bin/bash

cd /master_web/autodiep
gcc decoder.c -o decoder -O3 -lssl -lcrypto -lshnet -pthread
for((;;))
do
  ./decoder
  sleep 1
done