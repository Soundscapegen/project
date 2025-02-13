from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_model import get_keywords
from freesound import search_freesound

app = Flask(__name__)
CORS(app)

@app.route('/api/keywords', methods=['POST'])
def keywords():
    data = request.get_json()
    
    if not data or 'str' not in data:
        return jsonify(success=False, message="Missing 'str' parameter in the request."), 400

    input_str = data['str']
    
    try:
        # BERT-based function
        keywords_result = get_keywords(input_str)

        if not keywords_result:
            return jsonify(success=False, message="No keywords extracted into flask python backend."), 400
        
        # Fetch sounds from FreeSound by keywords extracted
        freesound_results = search_freesound(keywords_result)

        if not freesound_results or 'results' not in freesound_results:
            return jsonify(success=False, message="No sounds found.", keywords=keywords_result), 404

        # Only top 6 sounds for the response
        top_sounds = freesound_results["results"][:6]

        # Formatting the response
        sounds_info = []
        for index, sound in enumerate(top_sounds, start=1):
            sounds_info.append(({
                "sound_number": f"Sound {index}",
                "name": sound.get("name", "Unknown"),
                "description": sound.get("description", "No description available"),
                "sound_url": sound.get("download", "No URL provided")
            }))
    
        return jsonify(success=True, keywords=keywords_result, sounds=sounds_info), 200
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
