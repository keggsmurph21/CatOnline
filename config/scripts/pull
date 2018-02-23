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

def get_sheets( spreadsheet, sheets ):
    data = {}
    for sheet in sheets:
        data[sheet] = get_sheet( spreadsheet, sheets[sheet] )
    return data

def get_state_graph():

    spreadsheet = "1UlTewbihkhtMcIgH6p1RqhkqUcSufclM7UvAu6EgOcI"
    sheets = {
        'vertices'  : "235763305",
        'edges'     : "931117447"
    }

    sheets = get_sheets( spreadsheet, sheets )
    data = { 'vertices':{}, 'edges':{} }
    ignoreList = [ 'id' ]

    isHeader = True
    for line in get_sheets( spreadsheet, sheets['vertices'] ):
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
    for line in et_sheets( spreadsheet, sheets['edges'] ):
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
    for item in [ 'vertices', 'edges', 'evaluate', 'isMulti', 'isPriority', 'isCancel', 'target', 'label' ]:
        data = re.sub( '"%s"' % item, '%s' % item, data )
    data = re.sub(r'"(func.*\})"', r'\1', data)

    filepath = get_filepath('states')
    with open(filepath, 'w') as f:
        data = 'module.exports = %s' % data
        f.write(data)

    return

def get_filepath( modulename ):
    return os.path.join( os.path.dirname(sys.argv[0]), '..', '%s.js' % modulename )

def replace_name( prefix, name ):
    return '_%s_%s' % ( prefix, name.replace(' ','_') )

if __name__ == '__main__':

    if len(sys.argv)==1:
        get_state_graph()

    elif (sys.argv[1]=='states'):
        get_state_graph()

    else:
        print( 'Error: no action matching argument "%s"' % sys.argv[1] )
