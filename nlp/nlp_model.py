import os
import re
import json
from mistralai import Mistral

# Get API key from environment variables
API_KEY = os.getenv("MISTRAL_API_KEY")
if not API_KEY:
    raise ValueError("MISTRAL_API_KEY environment variable is not set")

# Format API key with "Bearer" prefix if needed
if not API_KEY.startswith("Bearer "):
    API_KEY = f"Bearer {API_KEY}"

# Specify which Mistral model to use
MODEL_NAME = "mistral-large-latest"

# Initialize Mistral client with API key
mistral_client = Mistral(api_key=API_KEY)

def get_keywords(user_text: str, min_keywords: int = 6):
    """
    Calls Mistral to 'expand' or 'extrapolate' a list of relevant keywords for the user text.
    Returns a Python list of keywords (strings) or a dictionary with an error if input is invalid.
    """
    # First validate if the user input is about sound/soundscapes
    validation_prompt = f"""
    You are a sound-related input validator.. Determine if the following input is even remotely about sound, an audio environment, or if it could reasonably describe or inspire one.

    Input: "{user_text}"

    Be extremely lenient: Accept vague or short inputs like "river", "library", "give me soundscape for ocean", "sounds of wind", "rain", etc.
    Also accept inputs that describe sensory, emotional, or imaginative experiences that could be translated into sound, such as: "floating in space",
    "dreaming underwater", "being alone in a quiet room", "walking through a forest"
    Assume that if the input mentions a thing, place, situation, or sensory experience,  it is likely asking for sound.

    Reject only clearly irrelevant inputs like questions unrelated to sound, programming help, math problems, essays, or personal facts.  
    For example, reject inputs like: "what is the capital of France", "solve this equation", "write an essay on the Cold War", "how does photosynthesis work?", "I have two siblings", "1333647##//0", or "how to code in Python".

    Respond with ONLY a JSON object with one field:
    {{"is_valid": true}} — if the input could relate to soundscapes or audio environments
    {{"is_valid": false}} — if it is clearly unrelated to sound

    Return ONLY the JSON. No explanation or extra text.
    """.strip()

    try:
        # Call Mistral API to validate the input
        validation_response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": validation_prompt}],
        )

        validation_text = validation_response.choices[0].message.content.strip()

        # debug line 
        print("VALIDATION RESPONSE FROM MISTRAL:", validation_text)

        # Clean up response if it's wrapped in code blocks
        if "```" in validation_text:
            validation_text = validation_text.split("```")[-1].strip()

        try:
            # Parse validation response
            validation_result = json.loads(validation_text)
            if not validation_result.get("is_valid", True):
                # Return error with suggestions if input is not valid
                return {
                    "error": True,
                    "message": "Your input does not seem to describe a soundscape.",
                    "suggestions": [
                        "forest with birds and a stream",
                        "busy cafe with people talking",
                        "thunderstorm at night",
                        "ocean waves on a beach",
                        "spaceship engine room humming"
                    ]
                }
        except json.JSONDecodeError:
            print("Validation response could not be parsed; proceeding anyway.")

        # Create prompt for keyword extraction
        prompt_str = f"""
        You are a sound design keyword generator. As the keyword intelligence engine, I will give you a a sentence or description that may be short, long, or creatively written about what the user wants to hear. Your task is to identify and focus on noun, verb, or adjective elements that describe **sound-related content**. 

        Understand the **context and intent** behind the input—whether it’s a literal description (e.g., "birds chirping") or an imaginative scene (e.g., "a peaceful morning in the forest"). 

        Identify the specific things that make sounds (e.g., people, animals, environments, weather, instruments, machines) and any **descriptive modifiers** of how they sound (e.g., softly, distant, echoing). 

        Ignore words that do not describe sound directly—such as pronouns, filler phrases, or requests (e.g., “I would like to hear…”).Focus only on what the user is trying to hear or imagine hearing. 

        From this, extract or generate relevant sound effect keywords that could be used to search a sound library.

        Description: "{user_text}"

        If the description is simple (like a single word such as "river", "cafe", "ocean"), expand it into multiple related sound keywords.
        For example:
        - For "river": ["flowing water", "river current", "stream bubbling", "water splash", "gentle brook", "river ambience"]
        - For "cafe": ["coffee shop ambience", "people chatting", "coffee machine", "cup clinking", "cafe background", "restaurant noise"]

        Generate exactly {min_keywords} keywords related to sounds described. Format your response as ONLY a JSON 
        array of strings. For example: ["spaceship hum", "engine rumble", "space atmosphere", "control panel beeps", 
        "airlock sound", "cosmic radiation"]

        Important: Return ONLY the JSON array, no other text or explanation.
        """.strip()

        # Call Mistral API to generate keywords
        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt_str}],
        )

        # Extract and clean the response text
        raw_text = response.choices[0].message.content.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[-1].strip()

        try:
            # Parse the response as JSON
            expansions = json.loads(raw_text)
            # debug *
            print("Parsed expansions:", expansions)
            if not isinstance(expansions, list):
                return []

            # Clean up keywords and return them
            expansions = [k.strip() for k in expansions if k.strip()]
            return expansions

        except json.JSONDecodeError:
            # Fallback: try to extract keywords from quoted strings if JSON parsing fails
            fallback_keywords = re.findall(r'"([^"]+)"', raw_text)
            print("Fallback extracted:", fallback_keywords) # debug
            if fallback_keywords and len(fallback_keywords) >= 3:
                return fallback_keywords[:min_keywords]
            return []

    except Exception as e:
        print("Error calling Mistral:", e)
        return []

def generate_track_names(sounds_info):
    """
    Generate better, more descriptive track names for the sounds.
    
    Args:
        sounds_info (list): List of dictionaries containing sound information
        
    Returns:
        list: List of dictionaries with improved track names
    """
    if not sounds_info:
        return []

    # Prepare prompt parts for each sound
    prompt_parts = []
    for idx, sound in enumerate(sounds_info):
        sound_name = sound.get("name", "Unnamed Sound")
        sound_description = sound.get("description", "No description")
        if len(sound_description) > 300:
            sound_description = sound_description[:300] + "..."  # Truncate long descriptions

        prompt_parts.append(f"""Sound {idx+1}:
Name: "{sound_name}"
Description: "{sound_description}"
""")

    # Combine all sound details into one string
    sounds_data = "\n\n".join(prompt_parts)

    # Create prompt for generating better track names
    prompt = f"""You are a sound naming expert. Give each sound below a short, descriptive name (2-4 words) that clearly describes what the sound is.

The names should be concise, descriptive, and focused on what the sound actually is (not poetic or abstract).
Ignore any irrelevant details in the description. Focus on creating practical, useful names that accurately describe the sound content.

{sounds_data}

Format your response as a JSON array of strings containing ONLY the new names in the same order as the sounds above.
For example: ["Wind Through Pines", "Ocean Waves Crashing", "Distant Thunder", "City Traffic", "Coffee Shop Ambience", "Computer Server Room"]

IMPORTANT: Return ONLY the JSON array, no other text or explanation.
"""

    try:
        # Call Mistral API to generate track names
        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
        )

        # Extract and clean response text
        raw_text = response.choices[0].message.content.strip()
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[-1].strip()

        try:
            # Parse response as JSON
            track_names = json.loads(raw_text)
            if not isinstance(track_names, list):
                return sounds_info

            # Ensure we have the right number of names
            if len(track_names) != len(sounds_info):
                if len(track_names) < len(sounds_info):
                    # If too few names, use original names for the rest
                    track_names.extend([s.get("name", f"Sound {i+1+len(track_names)}") 
                                       for i, s in enumerate(sounds_info[len(track_names):])])
                else:
                    # If too many names, truncate
                    track_names = track_names[:len(sounds_info)]

            # Create result with new track names
            result = []
            for i, sound in enumerate(sounds_info):
                sound_copy = dict(sound)
                sound_copy["freesound_name"] = sound.get("name", "Unnamed Sound")  # Keep original name
                sound_copy["name"] = track_names[i]  # Set new name
                result.append(sound_copy)

            return result

        except json.JSONDecodeError:
            # Return original sounds if JSON parsing fails
            return sounds_info

    except Exception as e:
        print("Error calling Mistral for track names:", e)
        return sounds_info

# Generate descriptive paragraph about a soundscape based on user input
def generate_description(user_text: str) -> str:
    """
    Use Mistral to generate a descriptive paragraph of 3-4 sentences
    about how a sound might sound, based on a list of track names
    
    Args:
        user_text (str): Input text containing track names separated by commas
        
    Returns:
        str: A descriptive paragraph about the soundscape
    """

    # Create prompt for generating description
    prompt_str = f"""
    You are a specialized description generator. The user input has provided the sentence
    that includes all track names that sepeareted by comma:"{user_text}"

    Write a single paragraph (3-4 sentences) describing how this blended soundscape could sound.
    Mention some detailed sound and explain how the sounds merge or complement one another.
    Maintain a concise style.

    - Please return ONLY a valid JSON object with one key: "description".
    - "description" should be a pragraph about 3-4 sentences, evocative text describing the scene or content.

    Example response:
    {{
      "description": "This blended soundscape transports listeners to the edge of a vast, dynamic ocean,
                      where the rhythmic crashing of waves on a sandy beach creates a steady, soothing pulse.
                      The sounds of heavy, frequent waves from the Baltic Sea add depth and power, merging with
                      the pacific ocean's expansive resonance to create a sense of endless motion.
                      The occasional splashes of water running and breaking add a lively, textured layer, complementing
                      the consistent wave sounds with a touch of unpredictability, resulting in an immersive and natural coastal atmosphere."

    }}

    Return ONLY valid JSON, with no extra text, code fences, or disclaimers.
    """.strip()

    try:
        # Call Mistral API to generate description
        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt_str}],
        )

        # Extract and clean response text
        raw_text = response.choices[0].message.content.strip()
        if "```" in raw_text:
            raw_text = raw_text.split("```")[-1].strip()

        # Parse response as JSON
        data = json.loads(raw_text)
        if not isinstance(data, dict) or "description" not in data:
            raise ValueError("Missing 'description' in Mistral response.")

        return data["description"]

    except Exception as e:
        print("Error generating description with Mistral:", e)
        return ""  # fallback: return an empty string or handle as needed