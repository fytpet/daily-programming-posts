#!/bin/bash

gsutil cp webpage/index.* gs://dailyprogramming.fytilis.com
gsutil setmeta -h "Cache-Control: no-cache" gs://dailyprogramming.fytilis.com/index.*
