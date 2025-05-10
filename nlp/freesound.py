import os
import requests
from dotenv import load_dotenv

# Load environment variable from .env file
load_dotenv()
# Get Freesound API key from environment variables
FREESOUND_API_KEY = os.environ.get("FREESOUND_API_KEY")

# Validate API key exists
if not FREESOUND_API_KEY:
    print("Error: Freesound Api key is not loaded.")

def search_freesound(keywords, max_per_keyword=3):
    '''
    Perform multiple queries to FreeSound (one per keyword).
    Then combine results, removing duplicates if desired.
    '''
    all_results = []

    for kw in keywords:
        query = kw.strip() # remove spaces
        if not query:
            continue
        
        # Construct API endpoint URL with token
        url = f"https://freesound.org/apiv2/search/text/?token={FREESOUND_API_KEY}"
        # Set query parameters for the API request
        params = {
            "query": query,
            "fields": "id,name,description,download,previews", # Request only needed fields
            "sort": "score" # Sort results by relevance score
        }

        try:
            # Make HTTP request to Freesound API
            response = requests.get(url, params=params) # GET request to freesound api
            response.raise_for_status()  # Raise exception for HTTP errors
        except requests.exceptions.RequestException as e:
            print(f"FreeSound error searching for '{query}': {e}")
            continue

        # Parse JSON response
        data = response.json()
        results = data.get("results", [])

        # Add download and preview URLs with authentication token for each result
        for result in results:
            if 'download' in result:
                # Append API key to download URL for authentication
                result['download'] = f"{result['download']}?token={FREESOUND_API_KEY}"
            
            if 'previews' in result and 'preview-hq-mp3' in result['previews']:
                # Extract high-quality MP3 preview URL
                result['preview_url'] = result['previews']['preview-hq-mp3']
        
        # Take top N results for each keyword (max_per_keyword)
        top_n = results[:max_per_keyword]
        all_results.extend(top_n)
        
    # Return final results as a dictionary
    return {"results": all_results}