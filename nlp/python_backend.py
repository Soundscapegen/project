from flask import Flask, request, jsonify
from flask_cors import CORS
from nlp_model import get_keywords, generate_track_names, generate_description, mistral_client, MODEL_NAME
from freesound import search_freesound
from unsplash_image import get_unsplash_image
import json

# Initialize Flask application
app = Flask(__name__)
# Enable Cross-Origin Resource Sharing for API access from different domains
CORS(app)

# Knowledge base for the chatbot functionality
# Contains information about SoundscapeGen features and capabilities
SOUNDSCAPEGEN_KNOWLEDGE = """
SoundscapeGen Knowledge Base

Overview:
SoundscapeGen is a web application that allows users to create custom soundscapes by describing what they want to hear. The platform uses AI to understand user descriptions and find matching sounds that can be mixed together.

Key Features:
1. Sound Generation
- Users can describe a soundscape using natural language
- The system extracts keywords and finds matching sounds
- Supports various sound categories (nature, urban, music, etc.)
- Each sound can be adjusted for volume and pan position

2. Mixer Interface
- Drag and drop interface for arranging sounds
- Volume and pan controls for each sound
- Real-time preview of the mix
- Ability to download the final mix as MP3

3. Sound Library
- Curated collection of high-quality sounds
- Organized by categories
- Search functionality
- Preview capability

4. User Features
- Save and share soundscapes
- Browse popular sounds
- Create custom mixes
- Download final compositions

Common Questions:
Q: How do I create a soundscape?
A: Simply type a description in the search box (e.g., "forest with birds and a stream"). The system will find matching sounds and take you to the mixer.

Q: How do I adjust sounds?
A: In the mixer, you can adjust the volume and pan position of each sound using the sliders. The changes are applied in real-time.

Q: Can I save my soundscapes?
A: Yes, you can save your soundscapes and access them later. They will be stored in your account.

Q: How do I download my mix?
A: In the mixer interface, click the download button. Your soundscape will be saved as an MP3 file.

Q: What kind of sounds can I use?
A: The platform offers various categories including nature sounds, urban environments, music, and more. You can browse by category or search for specific sounds.

Technical Information:
- Maximum of 6 sounds per soundscape
- MP3 format for downloads
- Real-time audio processing
- Cloud-based storage for saved soundscapes
- Cross-platform compatibility

Best Practices:
1. Be specific in your descriptions
2. Start with fewer sounds and add more as needed
3. Use the volume controls to balance the mix
4. Experiment with pan positions for spatial effects
5. Save your work regularly
"""

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running"""
    return jsonify({"status": "healthy"}), 200

@app.route('/api/keywords', methods=['POST'])
def keywords():
    """
    Extract keywords from user input and find matching sounds
    
    Expected request body: { "str": "user text description" }
    Returns keywords and matching sounds
    """
    data = request.get_json()
    
    # Validate request data
    if not data or 'str' not in data:
        return jsonify(success=False, message="Missing 'str' parameter in the request."), 400

    input_str = data['str']
    
    try:
        # Extract keywords using Mistral-based NLP function
        keywords_result = get_keywords(input_str, min_keywords=6)

        # Check if the result indicates an invalid input (non-soundscape)
        if isinstance(keywords_result, dict) and keywords_result.get('error'):
            return jsonify(
                success=False,
                message=keywords_result.get('message', "Your input does not appear to be related to a soundscape."),
                is_valid_input=False,
                suggestions=keywords_result.get('suggestions', [])
            ), 200

        # Return empty response if no keywords found
        if not keywords_result:
            return jsonify(
                success=True,
                message="No keywords found, returning fallback.",
                keywords=[],
                sounds=[]
            ), 200

        # Fetch sounds from FreeSound API using the extracted keywords
        freesound_results = search_freesound(keywords_result)
        if not freesound_results or 'results' not in freesound_results:
            return jsonify(success=False, message="No sounds found.", keywords=keywords_result), 404

        # Limit to top 6 sounds for the response
        top_sounds = freesound_results["results"][:6]

        # Format sound data for the response
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
            
        # Generate more descriptive track names using Mistral
        sounds_with_better_names = generate_track_names(sounds_info)

        return jsonify(success=True, keywords=keywords_result, sounds=sounds_with_better_names), 200

    except Exception as e:
        print("Exception in /api/keywords:", e)
        return jsonify(success=False, message=str(e)), 500

@app.route('/api/track-names', methods=['POST'])
def track_names():
    """
    Generate better track names for the provided sounds
    
    Expected request body: { "sounds": [sound objects] }
    Returns sounds with improved names
    """
    data = request.get_json()
    
    # Validate request data
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
    """
    Search for a single sound by query term
    
    Expected request body: { "query": "search term" }
    Returns a single matching sound
    """
    data = request.get_json()
    
    # Validate request data
    if not data or 'query' not in data:
        return jsonify(success=False, message="Missing 'query' parameter in the request."), 400

    query = data['query']
    
    try:
        # Use the query directly as a keyword
        keywords = [query]
        
        # Fetch a single sound from FreeSound API
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
    
@app.route('/api/description', methods=['POST'])
def get_description():
    """
    Generate a descriptive paragraph for a soundscape
    
    Expected request body: { "str": "comma-separated track names" }
    Returns a descriptive paragraph
    """
    try:
        data = request.get_json() or {}
        # Validate request data
        if 'str' not in data:
            return jsonify(success=False, message="Missing 'str' parameter"), 400

        # Generate description using Mistral
        desc = generate_description(data['str'])
        if not desc:
            return jsonify(success=False, message="Failed to generate description."), 500

        # Return a JSON with success = true, description = ...
        return jsonify(success=True, description=desc), 200

    except Exception as e:
        print("Error in /api/description route:", e)
        return jsonify(success=False, message=str(e)), 500
    

@app.route("/api/get-image", methods=["POST"])
def get_image():
    """
    Search for an image that matches the user's input
    
    Expected request body: { "str": "image search term" }
    Returns image URL and attribution information
    """
    data = request.get_json()
    # Validate request data
    if not data or "str" not in data:
        return jsonify(success=False, message="Missing 'str' parameter."), 400

    user_input = data["str"]
    # Call Unsplash API to get an image matching the input
    result = get_unsplash_image(user_input)
    if result.get("image_url"):
        return jsonify(success=True, **result), 200
    else:
        return jsonify(success=False, message="No image found."), 404

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat endpoint that uses Mistral to answer user questions
    
    Expected request body: { "message": "user question" }
    Returns an AI-generated response about SoundscapeGen
    """
    try:
        data = request.get_json()
        # Validate request data
        if not data or 'message' not in data:
            return jsonify(success=False, message="Missing 'message' parameter"), 400

        user_message = data['message']
        
        # Create a prompt for Mistral with knowledge base context
        prompt = f"""
        You are a helpful assistant for SoundscapeGen, a soundscape creation platform. 
        Use the following knowledge base to answer the user's question. If the answer 
        isn't in the knowledge base, say you don't know and suggest more applicable questions.

        Remove any markdown formatting from the response.

        Knowledge Base:
        {SOUNDSCAPEGEN_KNOWLEDGE}

        User Question: {user_message}

        Provide a clear, concise, and helpful response based on the knowledge base.
        If the question is about something not covered in the knowledge base, politely 
        say you don't have that information but you can help with SoundscapeGen-related 
        questions.

        Return your response in a JSON format with a single field 'response'.
        """

        # Call Mistral API to generate a response
        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract the response text
        raw_text = response.choices[0].message.content.strip()
        
        # Clean up response if wrapped in code blocks
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].strip()

        try:
            # Parse the JSON response
            data = json.loads(raw_text)
            if not isinstance(data, dict) or "response" not in data:
                raise ValueError("Missing 'response' in Mistral response")

            return jsonify(success=True, response=data["response"]), 200

        except json.JSONDecodeError as e:
            # Fallback: if parsing fails, return the raw text as the response
            return jsonify(success=True, response=raw_text), 200

    except Exception as e:
        print(f"Error in chat endpoint: {str(e)}")
        return jsonify(success=False, message=str(e)), 500

# Run the Flask application when this script is executed directly
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
