import urllib.request
import json
import re

url = "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode())

out_data = {}
for item in data['states']:
    state = item['state']
    districts = item['districts']
    out_data[state] = districts

with open('lib/locations.ts', 'w') as f:
    f.write('export const IN_STATES = ' + json.dumps(list(out_data.keys())) + ';\n')
    f.write('export const IN_CITIES: Record<string, string[]> = ' + json.dumps(out_data) + ';\n')

print("locations.ts generated.")
