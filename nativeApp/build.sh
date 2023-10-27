rm -rf ./build/*

nativefier 'https://paracordchat.com' ./build  -a "universal" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.icns -p "mac" --verbose

nativefier 'https://paracordchat.com' ./build  -a "x64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose
nativefier 'https://paracordchat.com' ./build  -a "arm64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose

nativefier 'https://paracordchat.com' ./build  -a "x64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.ico -p "windows" --verbose

touch ./build/sums.nfo

echo "Sums:" >> ./build/sums.nfo

for folder in ./build/*; do
    # hash folder
    hash=$(echo "$folder" | md5sum | cut -d' ' -f1)

    #compress and add comment with hash
    zip -r "./build/$(basename "$folder").zip" "$folder"

    # add hash to sums.nfo
    echo " - $folder - $hash" >> ./build/sums.nfo

    rm -rf "$folder"
done


