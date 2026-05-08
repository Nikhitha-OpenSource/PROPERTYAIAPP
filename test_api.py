import urllib.request, json

# Test GeoJSON
req = urllib.request.Request('http://localhost:8000/api/v1/properties/map/geojson')
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    feats = data.get('features', [])
    print('GeoJSON features:', len(feats))
    if feats:
        p = feats[0]['properties']
        g = feats[0]['geometry']
        print('  locality:', p['locality'])
        print('  coords:', g['coordinates'])
        print('  price:', p['price'])
        print('  bhk:', p['bhk'])

# Test properties list
req2 = urllib.request.Request('http://localhost:8000/api/v1/properties?limit=3')
with urllib.request.urlopen(req2) as resp2:
    data2 = json.loads(resp2.read().decode())
    print('Total properties:', data2.get('total'))
    if data2.get('items'):
        item = data2['items'][0]
        print('  Sample city:', item.get('city'))
        print('  Sample locality:', item.get('locality'))
        print('  Sample image_urls:', item.get('image_urls', [])[:1])
