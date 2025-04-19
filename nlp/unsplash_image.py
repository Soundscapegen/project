import os
import requests
from urllib.parse import quote_plus
from dotenv import load_dotenv

# Load env variable from .env file
load_dotenv()
UNSPLASH_API_KEY = os.environ.get("UNSPLASH_API_KEY")
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"

if not UNSPLASH_API_KEY:
    print("Error: Unsplash API key is not loaded.")

def get_unsplash_image(query: str) -> dict:
    '''
        Uses the Unsplash API to fetch one image result for the given query.
        Returns a dict with a key "image_url" holding the URL for the image.
    '''

    # Encode the query for using in a URL
    encoded_query = quote_plus(query)
    request_url = f"{UNSPLASH_API_URL}?query={encoded_query}&page=1&per_page=1&client_id={UNSPLASH_API_KEY}"

    # Make the request to the Unsplash API
    try:
        response = requests.get(request_url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e: # If the request fails, print an error message
        print(f"Unsplash API error searching for '{query}': {e}")
        return {"image_url": ""}

    data = response.json()
    results = data.get("results", [])
    
    if results and len(results) > 0:
        # Return the 'small' version of the image from the first result
        image_url = results[0]["urls"]["small"]
        return {"image_url": image_url}
    else: # If no image results are found, print an error message and return an empty string
        print(f"No image results found for query: {query}")
        return {"image_url": ""}