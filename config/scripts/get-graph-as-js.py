#!/usr/bin/python3

# pip3 install requests

import csv, json, os, re, requests, sys

def get_sheet( spreadsheet, gid ):
    obj = []
    url = "https://spreadsheets.google.com/feeds/download/spreadsheets/Export?key=%s&exportFormat=tsv&gid=%s" % (spreadsheet, gid)
    content = requests.get(url).content.decode('utf-8')
    lines = content.split('\r\n')
    for line in lines:
        obj.append( line.split('\t') )
    return obj

def get_graph():
    nodes = get_sheet( _GRAPH, _NODE_SHEET )
    edges = get_sheet( _GRAPH, _EDGE_SHEET )
    return (nodes, edges)

def replace_name( prefix, name ):
    return '_%s_%s' % ( prefix, name.replace(' ','_') )

def main():

    nodes, edges = get_graph()
    data = { 'vertices':{}, 'edges':{} }
    ignoreList = [ 'id' ]

    isHeader = True
    for line in nodes:
        if isHeader:
            header = line
            isHeader = False
        else:
            for i in range(len(line)):
                th = header[i]
                if th=='name':
                    vname = replace_name( 'v', line[i] )
                    data['vertices'][vname] = { 'edges':[] }
                elif th not in ignoreList:
                    data['vertices'][vname][th] = line[i]
    isHeader = True
    for line in edges:
        if isHeader:
            header = line
            isHeader = False
        else:
            for i in range(len(line)):
                th = header[i]
                if th=='name':
                    ename = replace_name( 'e', line[i] )
                    data['edges'][ename] = {}
                elif th=='source':
                    vname = replace_name( 'v', line[i] )
                    data['vertices'][vname]['edges'].append( ename )
                elif th=='target':
                    vname = replace_name( 'v', line[i] )
                    data['edges'][ename][th] = vname
                elif th[:2]=='is':
                    data['edges'][ename][th] = len(line[i])>0
                elif th not in ignoreList:
                    data['edges'][ename][th] = line[i]

    data = json.dumps(data,indent=3)

    for item in [ 'vertices', 'edges', 'evaluate', 'isMulti', 'isPriority',
        'isCancel', 'target', 'label' ]:
        data = re.sub( '"%s"' % item, '%s' % item, data )

    data = re.sub(r'"(func.*\})"', r'\1', data)

    with open('../states.js', 'w') as f:
        data = 'module.exports = {\n\n%s\n\n}' % data
        f.write(data)

    return

_GRAPH = "1UlTewbihkhtMcIgH6p1RqhkqUcSufclM7UvAu6EgOcI" # spreadsheet id
_EDGE_SHEET = "931117447" # sheet id
_NODE_SHEET = "235763305" # sheet id

if __name__ == '__main__':
    main();
