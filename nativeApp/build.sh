rm -rf ./build/*

nativefier 'https://paracordchat.com' ./build  -a "universal" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.icns -p "mac" --verbose

nativefier 'https://paracordchat.com' ./build  -a "x64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose
nativefier 'https://paracordchat.com' ./build  -a "arm64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.png -p "linux" --verbose

nativefier 'https://paracordchat.com' ./build  -a "x64" --disable-context-menu --disable-dev-tools --min-width 400 --min-height 600 -i ./icons/logo.ico -p "windows" --verbose

for folder in ./build/*; do
    tar -czvf "./build/$(basename "$folder").tar.gz" "$folder"
    rm -rf "$folder"
done

