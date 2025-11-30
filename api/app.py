from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_ollama import OllamaLLM
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Initialize the Ollama model
model = OllamaLLM(model="mistral")

# Pydantic model for request validation
class SymptomsRequest(BaseModel):
    symptoms: str

# Allow cross-origin requests from the frontend (React app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Replace with your frontend URL if different
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

def predict_diseases(symptoms: str):
    input_prompt = f"""You are a medical diagnosis assistant. Based on the symptoms: {symptoms}

    You MUST respond in EXACTLY this format:

    SEVERITY: [Must be one of: RED/ORANGE/YELLOW/BLUE/GREEN]

    ASSESSMENT: [Your brief analysis of the symptoms]
    
    RECOMMENDATIONS: [Your specific recommendations]

    Severity level guidelines:
    - RED (Most Severe): IMMEDIATE MEDICAL ATTENTION REQUIRED. Do not delay - go to emergency room or call emergency services immediately.
    - ORANGE: Urgent - See a doctor within 24 hours
    - YELLOW: Schedule a doctor appointment soon
    - BLUE: Minor issue - can be managed with home care
    - GREEN: No immediate medical attention needed

    If ANY of these conditions are present, you MUST assign RED severity:
    - Severe bleeding or any unusual bleeding
    - Extreme pain anywhere in body
    - Loss of consciousness
    - Difficulty breathing
    - Chest pain
    - Severe head injury
    - Symptoms of stroke
    - Severe allergic reactions
    - Multiple severe symptoms together

    Remember:
    1. ALWAYS include SEVERITY in your response
    2. For RED severity cases, always emphasize immediate emergency care
    3. When in doubt about severity, err on the side of caution
    4. Your response must follow the exact format above

    Analyze these symptoms and provide your assessment:"""

    try:
        result = model.invoke(input=input_prompt)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/diagnose")
async def diagnose(request: SymptomsRequest):
    try:
        # Get the response from the model
        response = predict_diseases(request.symptoms)
        # Return the response as it is
        return {"assessment": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

