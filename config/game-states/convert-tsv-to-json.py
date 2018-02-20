#!/usr/bin/python3

import csv, json, sys, os

def main():

    if len(sys.argv)==1:
        print( 'ERROR expected 1 argument: .tsv file' )
        return
    tsvfile = sys.argv[1]
    if os.path.exists(tsvfile)==False:
        print( 'ERROR file does not exist' )
        return

    JSON = {}
    isContent = False
    with open(tsvfile, 'r') as f:
        tsv = csv.reader(f, delimiter='\t')
        for row in tsv:
            if isContent: # skip the header row
                while len(row) < 8:
                    row.append('')
                data = {
                    "name":row[0],
                    "target":row[3],
                    "conditions":row[4],
                    "isPriority":len(row[5])>0,
                    "isMulti":len(row[6])>0,
                    "isCancel":len(row[7])>0 }

                if row[2] not in JSON:
                    JSON[row[2]] = {}
                JSON[row[2]][row[1]] = data
            isContent = True

    jsonfile = sys.argv[2] if len(sys.argv)>2 else sys.argv[1].replace('tsv','json')
    with open(jsonfile, 'w') as f:
        json.dump( JSON, f, indent=3 )

if __name__ == '__main__':
    main();
