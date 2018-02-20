#!/usr/bin/python3

# data for this .tsv file lives at https://goo.gl/c7dDXv
# expect data in this format:
# id | source | target | conditions | priority | multi | cancel | label

import csv, json, sys, os

def main():

    if len(sys.argv)==1:
        print( 'ERROR expected 1 argument: .tsv file' )
        return
    tsvfile = sys.argv[1]
    if os.path.exists(tsvfile)==False:
        print( 'ERROR file does not exist' )
        return

    data = {}
    isContent = False
    with open(tsvfile, 'r') as f:
        tsv = csv.reader(f, delimiter='\t')
        for row in tsv:
            if isContent: # skip the header row
                while len(row) < 9:
                    row.append('')
                if row[2] not in data:
                    data[row[2]] = {}

                data[row[2]][row[1]] = {
                    "name":row[0],
                    "target":row[3],
                    "conditions":row[4],
                    "isPriority":len(row[5])>0,
                    "isMulti":len(row[6])>0,
                    "isCancel":len(row[7])>0,
                    "label":row[8]
                }

            isContent = True

    jsonfile = sys.argv[2] if len(sys.argv)>2 else sys.argv[1].replace('tsv','json')
    with open(jsonfile, 'w') as f:
        json.dump( data, f, indent=3 )

if __name__ == '__main__':
    main();
