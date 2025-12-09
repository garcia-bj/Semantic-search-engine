import os
import json
import time
import requests
from urllib.parse import quote

# Configuration for DBpedia endpoints
ENDPOINTS = {
    'en': 'http://dbpedia.org/sparql',
    'es': 'http://es.dbpedia.org/sparql',
    'pt': 'http://dbpedia.org/sparql'  # Using main DBpedia with PT lang filter (pt.dbpedia.org is often down)
}

# Output directory relative to this script
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '../harvested_data')

# Limit per query to avoid timeouts
PAGE_SIZE = 100
# Maximum items to fetch per language (set to -1 for unlimited)
MAX_ITEMS = 5000 

def ensure_directory_exists(path):
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"Created directory: {path}")

def build_query(lang, limit, offset):
    """
    Builds a SPARQL query to fetch TV series data.
    """
    # The language filter depends on the endpoint language generally, 
    # but we enforce retrieving labels in the target language.
    query = f"""
    PREFIX dbo: <http://dbpedia.org/ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
    
    SELECT DISTINCT ?series ?label ?abstract ?genre ?network ?start
    WHERE {{
      ?series a dbo:TelevisionShow .
      ?series rdfs:label ?label .
      
      OPTIONAL {{ ?series dbo:abstract ?abstract . FILTER (lang(?abstract) = '{lang}') }}
      OPTIONAL {{ ?series dbo:genre ?genre }}
      OPTIONAL {{ ?series dbo:network ?network }}
      OPTIONAL {{ ?series dbo:releaseDate ?start }}
      
      FILTER (lang(?label) = '{lang}')
    }}
    ORDER BY ?series
    LIMIT {limit}
    OFFSET {offset}
    """
    return query

def fetch_data(endpoint, query):
    """
    Executes a SPARQL query against the given endpoint.
    """
    headers = {
        'Accept': 'application/sparql-results+json',
        'User-Agent': 'SemanticSearchHarvestBot/1.0'
    }
    params = {
        'query': query,
        'format': 'json'
    }
    
    try:
        response = requests.get(endpoint, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error fetching data from {endpoint}: {e}")
        return None

def process_results(results):
    """
    Simplifies the SPARQL JSON result format.
    """
    processed = []
    if not results or 'results' not in results or 'bindings' not in results['results']:
        return processed
        
    for item in results['results']['bindings']:
        entry = {
            'uri': item['series']['value'],
            'label': item['label']['value'] if 'label' in item else '',
            'abstract': item['abstract']['value'] if 'abstract' in item else '',
            'genre': item['genre']['value'] if 'genre' in item else '',
            'network': item['network']['value'] if 'network' in item else '',
            'startDate': item['start']['value'] if 'start' in item else ''
        }
        processed.append(entry)
    return processed

def harvest_language(lang, endpoint):
    print(f"\nStarted harvesting for language: {lang.upper()}")
    all_data = []
    offset = 0
    total_fetched = 0
    
    while True:
        if MAX_ITEMS != -1 and total_fetched >= MAX_ITEMS:
            print(f"Reached limit of {MAX_ITEMS} items.")
            break
            
        print(f"  Fetching batch starting at offset {offset}...")
        query = build_query(lang, PAGE_SIZE, offset)
        data = fetch_data(endpoint, query)
        
        if not data:
            print("  Failed to retrieve data. Retrying in 5 seconds...")
            time.sleep(5)
            # Simple retry logic could be improved
            data = fetch_data(endpoint, query)
            if not data:
                print("  Skipping batch after retry failure.")
                break
        
        processed_batch = process_results(data)
        if not processed_batch:
            print("  No more results found.")
            break
            
        all_data.extend(processed_batch)
        count = len(processed_batch)
        total_fetched += count
        offset += count
        
        print(f"   Retrieved {count} items. Total so far: {total_fetched}")
        
        # Be nice to the server
        time.sleep(1)
        
    # Save to file
    filename = os.path.join(OUTPUT_DIR, f'series_{lang}.json')
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(all_data)} items to {filename}")

def main():
    ensure_directory_exists(OUTPUT_DIR)
    
    for lang, endpoint in ENDPOINTS.items():
        harvest_language(lang, endpoint)

    print("\nHarvesting complete!")

if __name__ == "__main__":
    main()
