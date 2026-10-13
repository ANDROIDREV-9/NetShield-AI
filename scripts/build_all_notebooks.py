import os, json, uuid, gc

def make_cell(cell_type, text):
    lines = [line + '
' for line in text.strip().split('
')]
    c = {
        'cell_type': cell_type,
        'id': uuid.uuid4().hex[:8],
        'metadata': {},
        'source': lines
    }
    if cell_type == 'code':
        c['execution_count'] = None
        c['outputs'] = []
    return c

print('Builder scaffold loaded.')
