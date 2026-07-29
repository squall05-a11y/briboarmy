#!/bin/bash
F=$1; EV=$2; shift 2
for B in "$@"; do for D2 in hard hell; do
  BUILD=$B D=$D2 AIEV=$EV node -e "
process.env.BUILD='$B';process.env.D='$D2';
const fs=require('fs');let h=fs.readFileSync('harness30.js','utf8');
h=h.replace('startGame();','window.AIEVAL=$EV;startGame();');
eval(h);" >> $F 2>&1
done; done
