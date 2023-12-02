#!/bin/bash

output_file="hello.txt"
total_size=0
index=0

while ((total_size < 11000000)); do
    # Create a line with the specified content
    line="${index} HELLO hello HELLO"

    # Append the line to the output file
    echo "$line" >> "$output_file"

    echo "$line" 

    # Update the total size of the file
    total_size=$(wc -c < "$output_file")
    ((index++))
done

echo "File creation complete. Total size: $total_size bytes."