#!/usr/bin/python3

import requests, sys

def get_sheet( spreadsheet, gid, format="tsv" ):
        url = "https://spreadsheets.google.com/feeds/download/spreadsheets/Export?key=%s&exportFormat=%s&gid=%s"
        url = url % (spreadsheet, format, gid)
        response = requests.get(url)
        print('hello')
        print(response.content)
        return response.content

def get_graph( format="tsv" ):
        edges = get_sheet( _GRAPH, _EDGE_SHEET, format )
        with open('edges.tsv', 'wb') as f:
                print(edges)
                f.write(edges)
        nodes = get_sheet( _GRAPH, _NODE_SHEET, format )
        with open('nodes.tsv', 'wb') as f:
                f.write(nodes)

        return ('edges.tsv', 'nodes.tsv')
        
_GRAPH = "1UlTewbihkhtMcIgH6p1RqhkqUcSufclM7UvAu6EgOcI"
_EDGE_SHEET = "931117447"
_NODE_SHEET = "235763305"
                        
