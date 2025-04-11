from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_model import get_keywords, generate_track_names
from freesound import search_freesound

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

@app.route('/api/keywords', methods=['POST'])
def keywords():
    data = request.get_json()
    
    if not data or 'str' not in data:
        return jsonify(success=False, message="Missing 'str' parameter in the request."), 400

    input_str = data['str']
    
    try:
        # Mistral-based function
        keywords_result = get_keywords(input_str, min_keywords=6)

        # Check if the result indicates an invalid input (non-soundscape)
        if isinstance(keywords_result, dict) and keywords_result.get('error'):
            return jsonify(
                success=False,
                message=keywords_result.get('message', "Your input does not appear to be related to a soundscape."),
                is_valid_input=False,
                suggestions=keywords_result.get('suggestions', [])
            ), 200

        # fallback if no keywords found
        if not keywords_result:
            return jsonify(
                success=True,
                message="No keywords found, returning fallback.",
                keywords=[],
                sounds=[]
            ), 200

        # Fetch sounds from FreeSound by keywords extracted
        freesound_results = search_freesound(keywords_result)
        if not freesound_results or 'results' not in freesound_results:
            return jsonify(success=False, message="No sounds found.", keywords=keywords_result), 404

        # Only top 6 sounds for the response
        top_sounds = freesound_results["results"][:6]

        # Formatting the response
        sounds_info = []
        for index, sound in enumerate(top_sounds, start=1):
            sounds_info.append({
                "sound_number": f"Sound {index}",
                "name": sound.get("name", "Unknown"),
                "description": sound.get("description", "No description available"),
                "sound_url": sound.get("download", "No URL provided"),
                "preview_url": sound.get("preview_url", ""),
                "freesound_id": sound.get("id")
            })
            
        # Generate better track names using Mistral
        sounds_with_better_names = generate_track_names(sounds_info)

        return jsonify(success=True, keywords=keywords_result, sounds=sounds_with_better_names), 200

    except Exception as e:
        print("Exception in /api/keywords:", e)
        return jsonify(success=False, message=str(e)), 500

@app.route('/api/track-names', methods=['POST'])
def track_names():
    data = request.get_json()
    
    if not data or 'sounds' not in data:
        return jsonify(success=False, message="Missing 'sounds' parameter in the request."), 400

    sounds_info = data['sounds']
    
    try:
        # Generate better track names using Mistral
        sounds_with_better_names = generate_track_names(sounds_info)
        
        return jsonify(success=True, sounds=sounds_with_better_names), 200
        
    except Exception as e:
        print("Exception in /api/track-names:", e)
        return jsonify(success=False, message=str(e)), 500

@app.route('/api/sound/search', methods=['POST'])
def search_sound():
    data = request.get_json()
    
    if not data or 'query' not in data:
        return jsonify(success=False, message="Missing 'query' parameter in the request."), 400

    query = data['query']
    
    try:
        # Extract a single keyword from the query for better results
        # Just use the query directly as the keyword
        keywords = [query]
        
        # Fetch a single sound from FreeSound by the keyword
        freesound_results = search_freesound(keywords, max_per_keyword=1)
        if not freesound_results or 'results' not in freesound_results or not freesound_results["results"]:
            return jsonify(success=False, message=f"No sound found for '{query}'."), 404

        # Get the first result
        sound = freesound_results["results"][0]
        
        # Format the sound data
        sound_info = {
            "sound_number": "Sound 1",
            "name": sound.get("name", "Unknown"),
            "description": sound.get("description", "No description available").strip(),
            "sound_url": sound.get("download", "No URL provided"),
            "preview_url": sound.get("preview_url", ""),
            "freesound_id": sound.get("id")
        }
        
        # Generate a better track name using Mistral
        try:
            sounds_with_better_names = generate_track_names([sound_info])
            return jsonify(success=True, sound=sounds_with_better_names[0]), 200
        except Exception as e:
            # If track name generation fails, return the original sound info
            print("Error generating better track name:", e)
            return jsonify(success=True, sound=sound_info), 200

    except Exception as e:
        print("Exception in /api/sound/search:", e)
        return jsonify(success=False, message=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
