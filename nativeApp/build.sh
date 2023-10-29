rm -rf ./build/*

globalenv="{\"paracordDesktop\":\"true\"}"

nativefier 'https://paracordchat.com' ./build  -a "x64" --portable --process-envs $globalenv --disable-context-menu --min-width 400 --min-height 600 -i ./icons/logo.icns --app-copyright 'Jacob Trock' -p "mac" --verbose
nativefier 'https://paracordchat.com' ./build  -a "arm64" --portable --process-envs $globalenv --disable-context-menu --min-width 400 --min-height 600 -i ./icons/logo.icns --app-copyright 'Jacob Trock' -p "mac" --verbose

nativefier 'https://paracordchat.com' ./build  -a "x64" --portable --process-envs $globalenv --disable-context-menu --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose
nativefier 'https://paracordchat.com' ./build  -a "arm64" --portable --process-envs $globalenv --disable-context-menu --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose

win32metadatastring="{\"CompanyName\":\"Edisys\"}"
nativefier 'https://paracordchat.com' ./build  -a "x64" --portable --process-envs $globalenv --disable-context-menu --min-width 400 --min-height 600 -i ./icons/logo.ico --app-copyright 'Jacob Trock' -p "windows" --verbose --win32metadata $win32metadatastring

cd build

mv Paracord-darwin-x64/Paracord.app ./Paracord-mac-intel.app
mv Paracord-darwin-arm64/Paracord.app ./Paracord-mac-m1.app
rm -rf Paracord-darwin-*

touch sums.nfo
echo "Sums:" >> sums.nfo

for folder in ./*; do
    # hash folder
    hash=$(echo "$folder" | md5sum | cut -d' ' -f1)

    #compress and add comment with hash
    zip -r "./$(basename "$folder").zip" "$folder"

    # add hash to sums.nfo
    echo " - $folder - $hash" >> sums.nfo

    rm -rf "$folder"
done

cd ..
