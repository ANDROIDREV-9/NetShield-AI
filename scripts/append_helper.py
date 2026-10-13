import sys, base64

if len(sys.argv) < 3:
    print('Usage: append_helper.py <target_file> <base64_string>')
    sys.exit(1)

target = sys.argv[1]
data = base64.b64decode(sys.argv[2])
with open(target, 'ab') as f:
    f.write(data)
print('Appended', len(data), 'bytes to', target)
