#!/bin/bash

gcc server.c -o server -lm -pthread -lwebsockets -lshnet -O0 -g3
valgrind --leak-check=full --show-leak-kinds=all ./server
