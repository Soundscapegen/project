import os
from mistralai import Mistral
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("MISTRAL_API_KEY")

model = "mistral-large-latest"

client = Mistral(api_key=API_KEY)

""" 
Test file for the Mistral model to ensure it is working correctly. Run this file to check if the model is working.
"""
chat_response = client.chat.complete(
    model= model,
    messages = [
        {
            "role": "user",
            "content": "What is the best French cheese?",
        },
    ]
)
print(chat_response.choices[0].message.content)