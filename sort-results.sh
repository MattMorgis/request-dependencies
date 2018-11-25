#/bin/bash

# don't f with original results
cp results.csv temp.csv
# delete header so it doesn't f with sorting
sed -i '' 1d temp.csv
# sort csv based on downloads, write to temp output
# https://www.gnu.org/software/coreutils/manual/html_node/sort-invocation.html
sort -t ',' -rn -k 2 temp.csv > temp
# delete temp csv
rm temp.csv
# create new sorted file, write header
echo '"packages","downloads"' > results-sorted.csv
# write sorted results
cat temp >> results-sorted.csv
# delete temp sorted output
rm temp
