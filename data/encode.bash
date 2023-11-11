#!/bin/bash

FROM=$1.wav
TO=$1.js

rm -f $TO
echo -n "<source type=\"audio/wav\" src=\"data:audio/wav;base64," | tee $TO
base64 -i $FROM | tr -d '\n' >> $TO
echo "\">" >> $TO
