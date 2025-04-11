import os
import re
import json
from mistralai import Mistral

API_KEY = os.getenv("MISTRAL_API_KEY")
MODEL_NAME = "mistral-large-latest"

mistral_client = Mistral(api_key=API_KEY)

def get_keywords(user_text: str, min_keywords: int = 6):
    """
    Calls Mistral to 'expand' or 'extrapolate' a list of relevant keywords for the user text.
    Returns a Python list of keywords (strings) or a dictionary with an error if input is invalid.
    """
    # First, validate if the input is related to a soundscape
    validation_prompt = f"""
    You are a soundscape validator. Determine if the following text describes a soundscape or sounds that could be used to create an audio environment.
    
    Input: "{user_text}"
    
    Be lenient in your validation. Even simple single words like "river", "forest", "cafe", or short phrases like "cafe noise" or "ocean waves" should be considered valid if they describe a potential sound or environment.
    
    Respond with ONLY a JSON object with two fields:
    1. "is_valid": true if the input describes a soundscape or sounds, false otherwise
    2. "reason": explanation of why it's valid or invalid
    
    Examples of valid inputs: 
    - "forest with birds and a stream"
    - "busy cafe with people talking and coffee machines"
    - "thunderstorm at night"
    - "river"
    - "cafe noise" 
    - "ocean"
    - "city"
    - "give me soundscape of xyz"
    - "sounds for xyz"
    
    Examples of invalid inputs: 
    - "what is the capital of France"
    - "write an essay about climate change"
    - "how to program in Python"
    
    Return ONLY the JSON object, no other text.
    """.strip()
    
    try:
        # First validate the input
        validation_response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": validation_prompt}
            ],
        )
        
        validation_text = validation_response.choices[0].message.content.strip()
        print(f"Validation response: {validation_text}")
        
        # Clean up response if needed
        if "```json" in validation_text:
            validation_text = validation_text.split("```json")[1].split("```")[0].strip()
        elif "```" in validation_text:
            validation_text = validation_text.split("```")[1].strip()
            
        try:
            validation_result = json.loads(validation_text)
            
            # If the input is not valid, return error
            if not validation_result.get("is_valid", True):
                print(f"Invalid input detected: {validation_result.get('reason')}")
                return {
                    "error": True,
                    "message": validation_result.get('reason', "Your input does not seem to describe a soundscape."),
                    "suggestions": [
                        "forest with birds and a stream",
                        "busy cafe with people talking",
                        "thunderstorm at night",
                        "ocean waves on a beach",
                        "spaceship engine room humming"
                    ]
                }
                
        except json.JSONDecodeError:
            print("Failed to parse validation result, proceeding with keyword generation")
    
        # If valid or we couldn't determine validity, proceed with keyword generation
        # A prompt instructing Mistral to output ONLY a JSON array of min_keywords keywords
        prompt_str = f"""
        You are a sound design keyword generator. I will give you a description, and you need to extract 
        or generate relevant sound effect keywords that could be used to search a sound library.
        
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

        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": prompt_str}
            ],
        )

        raw_text = response.choices[0].message.content.strip()
        print(f"Mistral raw response: {raw_text}")  # Add debugging
        
        # Clean up response - sometimes models add markdown code blocks
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].strip()
            
        # Try to parse JSON
        try:
            expansions = json.loads(raw_text)
            if not isinstance(expansions, list):
                print("Mistral returned valid JSON but not a list:", expansions)
                return []
                
            expansions = [k.strip() for k in expansions if k.strip()]
            print(f"Successfully extracted keywords: {expansions}")
            return expansions
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            print("Raw text that failed parsing:", raw_text)
            # If parsing fails, try a simple fallback (extract quoted terms)
            fallback_keywords = re.findall(r'"([^"]+)"', raw_text)
            if fallback_keywords and len(fallback_keywords) >= 3:
                print(f"Using fallback extraction: {fallback_keywords}")
                return fallback_keywords[:min_keywords]
            return []

    except Exception as e:
        print("Error calling Mistral:", e)
        return []

def generate_track_names(sounds_info):
    """
    Generate more descriptive names for sound tracks based on their original names and descriptions.
    
    Args:
        sounds_info: List of dictionaries containing sound information with 'name' and 'description' keys
        
    Returns:
        List of dictionaries with the same structure as input, but with improved 'name' values
    """
    if not sounds_info:
        return []
    
    # Construct a batch prompt for all sounds to minimize API calls
    prompt_parts = []
    for idx, sound in enumerate(sounds_info):
        sound_name = sound.get("name", "Unnamed Sound")
        sound_description = sound.get("description", "No description")
        
        # Truncate description if too long
        if len(sound_description) > 300:
            sound_description = sound_description[:300] + "..."
            
        prompt_parts.append(f"""Sound {idx+1}:
Name: "{sound_name}"
Description: "{sound_description}"
""")
    
    sounds_data = "\n\n".join(prompt_parts)
    
    prompt = f"""You are a sound naming expert. Give each sound below a short, descriptive name (2-4 words) that clearly describes what the sound is.
    
The names should be concise, descriptive, and focused on what the sound actually is (not poetic or abstract).
Ignore any irrelevant details in the description. Focus on creating practical, useful names that accurately describe the sound content.

{sounds_data}

Format your response as a JSON array of strings containing ONLY the new names in the same order as the sounds above.
For example: ["Wind Through Pines", "Ocean Waves Crashing", "Distant Thunder", "City Traffic", "Coffee Shop Ambience", "Computer Server Room"]

IMPORTANT: Return ONLY the JSON array, no other text or explanation.
"""

    try:
        response = mistral_client.chat.complete(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": prompt}
            ],
        )

        raw_text = response.choices[0].message.content.strip()
        print(f"Track names raw response: {raw_text}")  
        
        # Clean up response if wrapped in code blocks
        if "```json" in raw_text:
            raw_text = raw_text.split("```json")[1].split("```")[0].strip()
        elif "```" in raw_text:
            raw_text = raw_text.split("```")[1].strip()
        
        try:
            track_names = json.loads(raw_text)
            if not isinstance(track_names, list):
                print("Mistral returned valid JSON but not a list for track names:", track_names)
                return sounds_info  # Return original sounds if format is incorrect
            
            # Make sure we have the right number of names
            if len(track_names) != len(sounds_info):
                print(f"Warning: Expected {len(sounds_info)} track names but got {len(track_names)}")
                # If too few names, keep original names for the remaining sounds
                if len(track_names) < len(sounds_info):
                    track_names.extend([s.get("name", f"Sound {i+1+len(track_names)}") 
                                       for i, s in enumerate(sounds_info[len(track_names):])])
                # If too many names, truncate
                else:
                    track_names = track_names[:len(sounds_info)]
            
            # Create a new list with updated names
            result = []
            for i, sound in enumerate(sounds_info):
                sound_copy = dict(sound)  # Create a copy to avoid modifying the original
                # Store original name as freesound_name and use new name for name
                sound_copy["freesound_name"] = sound.get("name", "Unnamed Sound")
                sound_copy["name"] = track_names[i]
                result.append(sound_copy)
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"JSON parse error for track names: {e}")
            print("Raw text that failed parsing:", raw_text)
            # Return original sounds if we couldn't parse the response
            return sounds_info
            
    except Exception as e:
        print("Error calling Mistral for track names:", e)
        return sounds_info
