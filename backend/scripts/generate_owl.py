import json
import os
import re

def escape_xml(text):
    if not text:
        return ""
    text = str(text)
    text = text.replace("&", "&amp;")
    text = text.replace("<", "&lt;")
    text = text.replace(">", "&gt;")
    text = text.replace('"', "&quot;")
    text = text.replace("'", "&apos;")
    return text

def sanitize_id(text):
    if not text:
        return "Unknown"
    if text.startswith("http"):
        text = text.split("/")[-1]
    text = re.sub(r'[^a-zA-Z0-9_]', '_', text)
    if text and not text[0].isalpha():
        text = "S_" + text
    return text[:60]

def generate_owl():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, "..", "harvested_data")
    output_file = os.path.join(script_dir, "..", "uploads", "tv_series_kb.owl")
    
    # Load all language data
    all_series = []
    for lang in ['es', 'en', 'pt']:
        file_path = os.path.join(data_dir, f"series_{lang}.json")
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                for s in data[:100]:  # 100 per language = 300 total
                    s['language'] = lang
                    all_series.append(s)
    
    genres = set()
    networks = set()
    for s in all_series:
        if s.get('genre'):
            genres.add(s['genre'])
        if s.get('network'):
            networks.add(s['network'])
    
    owl = '''<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
         xmlns:owl="http://www.w3.org/2002/07/owl#"
         xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
         xmlns:tv="http://example.org/tv-series#"
         xmlns:dc="http://purl.org/dc/elements/1.1/">

  <owl:Ontology rdf:about="http://example.org/tv-series">
    <rdfs:label xml:lang="es">Base de Conocimiento de Series de TV</rdfs:label>
    <rdfs:comment xml:lang="es">Ontologia completa con 300 series de television en espanol, ingles y portugues</rdfs:comment>
    <dc:creator>Semantic Search Engine</dc:creator>
    <dc:date>2025-12-10</dc:date>
  </owl:Ontology>

  <!-- Classes -->
  <owl:Class rdf:about="http://example.org/tv-series#TVSeries">
    <rdfs:label xml:lang="es">Serie de Television</rdfs:label>
    <rdfs:label xml:lang="en">TV Series</rdfs:label>
    <rdfs:comment xml:lang="es">Programa de television con episodios</rdfs:comment>
  </owl:Class>
  
  <owl:Class rdf:about="http://example.org/tv-series#Genre">
    <rdfs:label xml:lang="es">Genero</rdfs:label>
    <rdfs:comment xml:lang="es">Categoria o tipo de serie</rdfs:comment>
  </owl:Class>
  
  <owl:Class rdf:about="http://example.org/tv-series#Network">
    <rdfs:label xml:lang="es">Cadena de Television</rdfs:label>
    <rdfs:comment xml:lang="es">Canal o plataforma de emision</rdfs:comment>
  </owl:Class>

  <!-- Data Properties -->
  <owl:DatatypeProperty rdf:about="http://example.org/tv-series#title">
    <rdfs:label xml:lang="es">Titulo</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#string"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://example.org/tv-series#abstract">
    <rdfs:label xml:lang="es">Descripcion</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#string"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://example.org/tv-series#startDate">
    <rdfs:label xml:lang="es">Fecha de Inicio</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#date"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://example.org/tv-series#language">
    <rdfs:label xml:lang="es">Idioma</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#string"/>
  </owl:DatatypeProperty>

  <owl:DatatypeProperty rdf:about="http://example.org/tv-series#dbpediaUri">
    <rdfs:label xml:lang="es">URI de DBpedia</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://www.w3.org/2001/XMLSchema#anyURI"/>
  </owl:DatatypeProperty>

  <!-- Object Properties -->
  <owl:ObjectProperty rdf:about="http://example.org/tv-series#hasGenre">
    <rdfs:label xml:lang="es">tiene genero</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://example.org/tv-series#Genre"/>
  </owl:ObjectProperty>

  <owl:ObjectProperty rdf:about="http://example.org/tv-series#airedOn">
    <rdfs:label xml:lang="es">transmitida en</rdfs:label>
    <rdfs:domain rdf:resource="http://example.org/tv-series#TVSeries"/>
    <rdfs:range rdf:resource="http://example.org/tv-series#Network"/>
  </owl:ObjectProperty>

'''
    
    for genre in genres:
        genre_id = sanitize_id(genre)
        owl += f'''  <tv:Genre rdf:about="http://example.org/tv-series#{genre_id}">
    <rdfs:label>{escape_xml(genre)}</rdfs:label>
  </tv:Genre>

'''
    
    for network in networks:
        network_id = sanitize_id(network)
        owl += f'''  <tv:Network rdf:about="http://example.org/tv-series#{network_id}">
    <rdfs:label>{escape_xml(network)}</rdfs:label>
  </tv:Network>

'''
    
    for i, series in enumerate(all_series):
        series_id = sanitize_id(series.get('label', f'Series_{i}'))
        label = escape_xml(series.get('label', ''))
        abstract = escape_xml(series.get('abstract', '')[:800]) if series.get('abstract') else ''
        start_date = escape_xml(series.get('startDate', ''))
        genre = series.get('genre', '')
        network = series.get('network', '')
        lang = series.get('language', 'es')
        uri = escape_xml(series.get('uri', ''))
        
        owl += f'''  <tv:TVSeries rdf:about="http://example.org/tv-series#{series_id}">
    <rdf:type rdf:resource="http://example.org/tv-series#TVSeries"/>
    <tv:title xml:lang="{lang}">{label}</tv:title>
    <rdfs:label xml:lang="{lang}">{label}</rdfs:label>
    <tv:language>{lang}</tv:language>
'''
        if abstract:
            owl += f'    <tv:abstract xml:lang="{lang}">{abstract}</tv:abstract>\n'
        if start_date:
            owl += f'    <tv:startDate>{start_date}</tv:startDate>\n'
        if uri:
            owl += f'    <tv:dbpediaUri>{uri}</tv:dbpediaUri>\n'
        if genre:
            genre_id = sanitize_id(genre)
            owl += f'    <tv:hasGenre rdf:resource="http://example.org/tv-series#{genre_id}"/>\n'
        if network:
            network_id = sanitize_id(network)
            owl += f'    <tv:airedOn rdf:resource="http://example.org/tv-series#{network_id}"/>\n'
        
        owl += '  </tv:TVSeries>\n\n'
    
    owl += '</rdf:RDF>\n'
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(owl)
    
    print(f"Generated: {output_file}")
    print(f"Series: {len(all_series)}, Genres: {len(genres)}, Networks: {len(networks)}")

if __name__ == "__main__":
    generate_owl()
