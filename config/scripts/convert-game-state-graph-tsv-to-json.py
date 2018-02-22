#!/usr/bin/python3

# data for this .tsv file lives at https://goo.gl/c7dDXv
# expect data in this format:
# id | source | target | conditions | priority | multi | cancel | label

import csv, json, re, sys, os
from get_graph import get_graph

def main():

    get_graph()
    return

    if len(sys.argv)==1:
        print( 'ERROR expected 1 argument: .tsv file' )
        return
    tsvfile = sys.argv[1]
    if os.path.exists(tsvfile)==False:
        print( 'ERROR file does not exist' )
        return

    data = { 'vertices':{}, 'edges':{} }
    isHeader = True
    with open(tsvfile, 'r') as f:
        tsv = csv.reader(f, delimiter='\t')
        for row in tsv:
            if isHeader:
                header = row
                isHeader = False
            else:
                while len(row) < 8:
                    row.append('')
                parsed = {
                    'name': '_e_' + row[0].replace(' ','_'),
                    'source': '_v_' + row[1].replace(' ','_'),
                    'target': '_v_' + row[2].replace(' ','_'),
                    'evaluate': row[3],
                    'isPriority': len(row[4])>0,
                    'isMulti': len(row[5])>0,
                    'isCancel': len(row[6])>0,
                    'label': row[7]
                }
                data['edges'][parsed['name']] = {
                    'evaluate': parsed['evaluate'],
                    'isPriority': parsed['isPriority'],
                    'isMulti': parsed['isMulti'],
                    'isCancel': parsed['isCancel']
                }
                if parsed['source'] in data['vertices']:
                    data['vertices'][parsed['source']]['edges'].append( parsed['name'] )
                else:
                    data['vertices'][parsed['source']] = {}
                    data['vertices'][parsed['source']]['edges'] = [ parsed['name'] ]
                if parsed['target'] not in data['vertices']:
                    data['vertices'][parsed['target']] = {}
                    data['vertices'][parsed['target']]['edges'] = []

            isContent = True

    data = "%s" % json.dumps(data, indent=3)

    data = re.sub('"vertices"', "edges", data)
    data = re.sub('"edges"', 'edges', data)
    data = re.sub('"evaluate"', 'evaluate', data)
    data = re.sub('"isMulti"', 'isMulti', data)
    data = re.sub('"isCancel"', 'isCancel', data)
    data = re.sub('"isPriority"', 'isPriority', data)
    data = re.sub(r'"(func.*\})"', r'\1', data)
    
    with open('out.js', 'w') as f:
        f.write(data)
    print(data)
    return
    with open(jsonfile, 'w') as f:
        json.dump( data, f, indent=3 )

if __name__ == '__main__':
    main();
