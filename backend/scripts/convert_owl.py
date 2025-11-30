import sys
import os
from owlready2 import *

def convert_owl_to_rdf(input_path):
    try:
        # Cargar la ontología
        # Owlready2 detecta automáticamente el formato (OWL/XML, RDF/XML, etc.)
        onto = get_ontology(input_path).load()
        
        # Generar ruta de salida
        output_path = input_path + ".rdf"
        
        # Guardar en formato RDF/XML
        onto.save(file=output_path, format="rdfxml")
        
        print(output_path)
        return 0
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return 1

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_owl.py <input_file>", file=sys.stderr)
        sys.exit(1)
        
    input_file = sys.argv[1]
    sys.exit(convert_owl_to_rdf(input_file))
