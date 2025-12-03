"""
Servicio de Embeddings Semánticos
Genera representaciones vectoriales de texto usando Sentence Transformers
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
import logging
import os

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Cargar modelo multilingüe (español + inglés)
MODEL_NAME = os.getenv('EMBEDDING_MODEL', 'paraphrase-multilingual-MiniLM-L12-v2')
logger.info(f"Loading embedding model: {MODEL_NAME}")

try:
    model = SentenceTransformer(MODEL_NAME)
    logger.info(f"Model loaded successfully. Embedding dimension: {model.get_sentence_embedding_dimension()}")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    raise

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_NAME,
        'embedding_dim': model.get_sentence_embedding_dimension()
    })

@app.route('/embed', methods=['POST'])
def generate_embeddings():
    """
    Genera embeddings para uno o más textos
    
    Request body:
    {
        "texts": ["texto 1", "texto 2", ...],
        "normalize": true  // opcional, default true
    }
    
    Response:
    {
        "embeddings": [[0.1, 0.2, ...], [0.3, 0.4, ...]],
        "dimension": 384,
        "count": 2
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'texts' not in data:
            return jsonify({'error': 'Missing "texts" field in request body'}), 400
        
        texts = data['texts']
        normalize = data.get('normalize', True)
        
        if not isinstance(texts, list):
            return jsonify({'error': '"texts" must be an array'}), 400
        
        if len(texts) == 0:
            return jsonify({'error': '"texts" array cannot be empty'}), 400
        
        # Filtrar textos vacíos
        texts = [str(t).strip() for t in texts if t and str(t).strip()]
        
        if len(texts) == 0:
            return jsonify({'error': 'No valid texts provided'}), 400
        
        logger.info(f"Generating embeddings for {len(texts)} texts")
        
        # Generar embeddings
        embeddings = model.encode(
            texts,
            normalize_embeddings=normalize,
            show_progress_bar=False,
            convert_to_numpy=True
        )
        
        # Convertir a lista para JSON
        embeddings_list = embeddings.tolist()
        
        return jsonify({
            'embeddings': embeddings_list,
            'dimension': len(embeddings_list[0]) if embeddings_list else 0,
            'count': len(embeddings_list)
        })
        
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/similarity', methods=['POST'])
def calculate_similarity():
    """
    Calcula similitud coseno entre dos textos
    
    Request body:
    {
        "text1": "primer texto",
        "text2": "segundo texto"
    }
    
    Response:
    {
        "similarity": 0.85
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({'error': 'Missing "text1" or "text2" fields'}), 400
        
        text1 = str(data['text1']).strip()
        text2 = str(data['text2']).strip()
        
        if not text1 or not text2:
            return jsonify({'error': 'Texts cannot be empty'}), 400
        
        # Generar embeddings
        embeddings = model.encode([text1, text2], normalize_embeddings=True)
        
        # Calcular similitud coseno
        from numpy import dot
        similarity = float(dot(embeddings[0], embeddings[1]))
        
        return jsonify({
            'similarity': similarity,
            'text1_length': len(text1),
            'text2_length': len(text2)
        })
        
    except Exception as e:
        logger.error(f"Error calculating similarity: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting embedding service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
