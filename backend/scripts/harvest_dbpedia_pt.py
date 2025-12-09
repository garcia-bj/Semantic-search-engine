import os
import json
import time
import requests

# Configuration
ENDPOINT = 'http://dbpedia.org/sparql'
LANG = 'pt'
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../harvested_data')
PAGE_SIZE = 100
MAX_ITEMS = 5000 

def build_query(limit, offset):
    query = f"""
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    
    SELECT DISTINCT ?series ?label ?abstract ?genre ?network ?start
    WHERE {{
      ?series a dbo:TelevisionShow .
      ?series rdfs:label ?label .
      
      OPTIONAL {{ ?series dbo:abstract ?abstract . FILTER (lang(?abstract) = '{LANG}') }}
      OPTIONAL {{ ?series dbo:genre ?genre }}
      OPTIONAL {{ ?series dbo:network ?network }}
      OPTIONAL {{ ?series dbo:releaseDate ?start }}
      
      FILTER (lang(?label) = '{LANG}')
    }}
    ORDER BY ?series
    LIMIT {limit}
    OFFSET {offset}
    """
    return query

def fetch_data(query):
    headers = {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'SemanticSearchHarvestBot/1.0'
    }
    params = {'query': query, 'format': 'json'}
    
    try:
        response = requests.get(ENDPOINT, params=params, headers=headers, timeout=45)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def process_results(results):
    processed = []
    if not results or 'results' not in results:
        return processed
        
    for item in results['results']['bindings']:
        entry = {
            'uri': item['series']['value'],
            'label': item['label']['value'] if 'label' in item else '',
            'abstract': item['abstract']['value'] if 'abstract' in item else '',
            'genre': item['genre']['value'] if 'genre' in item else '',
            'network': item['network']['value'] if 'network' in item else '',
            'startDate': item['start']['value'] if 'start' in item else '',
            'resource': item['series']['value']
        }
        processed.append(entry)
    return processed

def main():
    print(f"Harvesting Portuguese TV series from DBpedia...")
    all_data = []
    offset = 0
    
    while len(all_data) < MAX_ITEMS:
        print(f"  Fetching offset {offset}...")
        query = build_query(PAGE_SIZE, offset)
        data = fetch_data(query)
        
        if not data:
            print("  Retry in 5s...")
            time.sleep(5)
            data = fetch_data(query)
            if not data:
                break
        
        batch = process_results(data)
        if not batch:
            print("  No more results.")
            break
            
        all_data.extend(batch)
        offset += len(batch)
        print(f"   Got {len(batch)}. Total: {len(all_data)}")
        time.sleep(1)
    
    filename = os.path.join(OUTPUT_DIR, 'series_pt.json')
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(all_data)} items to {filename}")

if __name__ == "__main__":
    main()
