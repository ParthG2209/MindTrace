import json
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
import google.generativeai as genai
import re
from config import settings

class LLMClientError(Exception):
    """Base exception for LLM client errors"""
    pass

class RateLimitError(LLMClientError):
    """Raised when rate limit is exceeded"""
    pass

class UnifiedLLMClient:
    """
    Unified interface for multiple LLM providers
    Routes tasks intelligently based on provider strengths
    """
    
    def __init__(self):
        self.gemini_api_key = settings.GOOGLE_API_KEY
        self.groq_api_key = settings.GROQ_API_KEY
        self.use_mock_fallback = settings.FALLBACK_TO_MOCK
        
        # Task routing configuration
        self.task_routing = {
            'evaluate': 'gemini',      # Frequent, needs accuracy
            'evidence': 'gemini',      # Needs precision
            'rewrite': 'groq',         # Needs speed
            'coherence': 'groq',       # Complex reasoning
            'pacing': 'gemini'         # Analytical task
        }
        
        # Initialize HTTP client
        self.http_client = httpx.AsyncClient(timeout=60.0)
        
    async def call_llm(
        self, 
        prompt: str, 
        task_type: str = 'evaluate',
        response_format: str = 'json',
        temperature: float = 0.7,
        max_retries: int = 3
    ) -> Dict[str, Any]:
        """
        Main LLM call method with intelligent routing and fallback
        
        Args:
            prompt: The prompt to send to the LLM
            task_type: Type of task (evaluate, rewrite, coherence, etc.)
            response_format: Expected response format (json or text)
            temperature: Sampling temperature (0-1)
            max_retries: Number of retry attempts
            
        Returns:
            Parsed response from LLM
        """
        
        # Determine which provider to use
        provider = self.task_routing.get(task_type, 'gemini')
        
        for attempt in range(max_retries):
            try:
                if provider == 'gemini' and self.gemini_api_key:
                    return await self._call_gemini(prompt, response_format, temperature)
                elif provider == 'groq' and self.groq_api_key:
                    return await self._call_groq(prompt, response_format, temperature)
                else:
                    # Try alternative provider
                    if provider == 'gemini' and self.groq_api_key:
                        return await self._call_groq(prompt, response_format, temperature)
                    elif provider == 'groq' and self.gemini_api_key:
                        return await self._call_gemini(prompt, response_format, temperature)
                    elif self.use_mock_fallback:
                        return self._generate_mock_response(task_type)
                    else:
                        raise LLMClientError("No LLM provider available")
                        
            except RateLimitError:
                # Try alternative provider on rate limit
                if attempt < max_retries - 1:
                    provider = 'groq' if provider == 'gemini' else 'gemini'
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff
                    continue
                raise
                
            except Exception as e:
                # Log the error but don't crash yet
                print(f"LLM attempt {attempt+1} failed ({provider}): {str(e)}")
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                    continue
                    
                # Final fallback to mock if enabled
                if self.use_mock_fallback:
                    print(f"All LLM calls failed, using mock response. Last error: {e}")
                    return self._generate_mock_response(task_type)
                raise
    
    async def _call_gemini(
        self, 
        prompt: str, 
        response_format: str,
        temperature: float
    ) -> Dict[str, Any]:
        """Call Google Gemini API"""
        
        url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={self.gemini_api_key}"
        
        # For JSON format, ensure prompt requests JSON
        if response_format == 'json':
            if not ('json' in prompt.lower() and 'return' in prompt.lower()):
                prompt = prompt + "\n\nYou MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanations - just pure JSON."
        
        # Prepare request
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.95,
                "topK": 40,
                # FIXED: Increased token limit to prevent JSON cutoff
                "maxOutputTokens": 8192,
            },
            # FIXED: Added safety settings to prevent blocking valid content
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        }
        
        # Make request
        response = await self.http_client.post(url, json=payload)
        
        if response.status_code == 429:
            raise RateLimitError("Gemini rate limit exceeded")
        
        if response.status_code != 200:
            raise LLMClientError(f"Gemini API error: {response.status_code} - {response.text}")
        
        # Parse response
        data = response.json()
        
        try:
            # Enhanced safety checks for response structure
            if 'candidates' not in data or not data['candidates']:
                raise LLMClientError(f"Gemini returned no candidates. Possible safety block. Response: {str(data)[:200]}")
            
            candidate = data['candidates'][0]
            
            # Check for safety finish reason
            if candidate.get('finishReason') == 'SAFETY':
                 raise LLMClientError("Gemini generation blocked due to safety settings.")

            if 'content' not in candidate:
                raise LLMClientError(f"Gemini candidate missing content. Finish reason: {candidate.get('finishReason')}")
                
            content_part = candidate['content']
            if 'parts' not in content_part or not content_part['parts']:
                 raise LLMClientError("Gemini content missing parts text.")

            content = content_part['parts'][0]['text']
            
            if response_format == 'json':
                # Remove markdown formatting if present
                content = content.strip()
                if content.startswith('```json'):
                    content = content[7:]
                elif content.startswith('```'):
                    content = content[3:]
                if content.endswith('```'):
                    content = content[:-3]
                content = content.strip()
                
                try:
                    return json.loads(content)
                except json.JSONDecodeError as je:
                    # If JSON parsing fails, try to extract JSON from the content
                    json_match = re.search(r'\{.*\}', content, re.DOTALL)
                    if json_match:
                        return json.loads(json_match.group())
                    raise LLMClientError(f"Failed to parse JSON: {je}\nContent: {content[:200]}")
            
            return {'text': content}
            
        except (KeyError, IndexError) as e:
            raise LLMClientError(f"Failed to parse Gemini response structure: {e}")
    
    async def _call_groq(
        self, 
        prompt: str, 
        response_format: str,
        temperature: float
    ) -> Dict[str, Any]:
        """Call Groq API (LLaMA 3.1)"""
        
        url = "[https://api.groq.com/openai/v1/chat/completions](https://api.groq.com/openai/v1/chat/completions)"
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": "You are an expert educational evaluator. Respond in valid JSON format."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 2048,
            "top_p": 0.95
        }
        
        if response_format == 'json':
            payload["response_format"] = {"type": "json_object"}
        
        # Make request
        response = await self.http_client.post(url, headers=headers, json=payload)
        
        if response.status_code == 429:
            raise RateLimitError("Groq rate limit exceeded")
        
        if response.status_code != 200:
            raise LLMClientError(f"Groq API error: {response.status_code} - {response.text}")
        
        # Parse response
        data = response.json()
        
        try:
            content = data['choices'][0]['message']['content']
            
            if response_format == 'json':
                # Groq sometimes wraps JSON in markdown
                content = content.strip()
                if content.startswith('```json'):
                    content = content[7:]
                if content.endswith('```'):
                    content = content[:-3]
                content = content.strip()
                
                return json.loads(content)
            return {'text': content}
            
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            raise LLMClientError(f"Failed to parse Groq response: {e}")
    
    def _generate_mock_response(self, task_type: str) -> Dict[str, Any]:
        """Generate realistic mock responses for demo purposes"""
        
        import random
        
        if task_type == 'evaluate':
            return {
                "clarity": {
                    "score": round(random.uniform(6.5, 9.5), 1),
                    "reason": "The explanation uses clear language with appropriate examples. Some technical terms could be better defined."
                },
                "structure": {
                    "score": round(random.uniform(6.0, 9.0), 1),
                    "reason": "The segment follows a logical flow, introducing concepts before elaborating. Transitions could be smoother."
                },
                "correctness": {
                    "score": round(random.uniform(7.0, 9.5), 1),
                    "reason": "The technical content is accurate and demonstrates solid understanding of the subject matter."
                },
                "pacing": {
                    "score": round(random.uniform(6.0, 8.5), 1),
                    "reason": "The pacing is generally appropriate, though some sections could be slightly slower for complex topics."
                },
                "communication": {
                    "score": round(random.uniform(6.5, 9.0), 1),
                    "reason": "The language is engaging and appropriate. Good use of analogies and examples to illustrate points."
                },
                "engagement": {
                    "score": round(random.uniform(6.0, 9.0), 1),
                    "reason": "The teacher uses effective techniques to maintain interest, including real-world connections."
                },
                "examples": {
                    "score": round(random.uniform(6.5, 9.5), 1),
                    "reason": "Examples are relevant and help clarify concepts. A good variety of illustrations is provided."
                },
                "questioning": {
                    "score": round(random.uniform(5.5, 8.5), 1),
                    "reason": "Questions are used to check understanding, though more thought-provoking questions could enhance learning."
                },
                "adaptability": {
                    "score": round(random.uniform(6.0, 8.5), 1),
                    "reason": "The teacher adjusts explanation depth appropriately, showing awareness of complexity levels."
                },
                "relevance": {
                    "score": round(random.uniform(7.0, 9.5), 1),
                    "reason": "Content is highly relevant to the stated topic and related concepts enhance understanding effectively."
                }
            }
        
        elif task_type == 'evidence':
            return {
                "evidence": [
                    {
                        "phrase": "this thing here",
                        "char_start": 45,
                        "char_end": 60,
                        "issue": "Vague reference - unclear what 'this thing' refers to",
                        "suggestion": "Use specific terminology instead of generic references",
                        "alternative_phrasing": "the decorator function",
                        "severity": "moderate"
                    }
                ]
            }
        
        elif task_type == 'rewrite':
            return {
                "original_text": "The function does stuff with the data",
                "rewritten_text": "The function processes the input data by applying a transformation algorithm",
                "improvements": [
                    "Replaced vague 'stuff' with specific 'processes'",
                    "Added technical detail about transformation",
                    "More professional terminology"
                ],
                "key_changes": {
                    "terminology": "Improved from vague to specific",
                    "structure": "Added logical flow"
                },
                "clarity_improvement": 2.5,
                "word_count_change": 8,
                "confidence": 0.85
            }
        
        elif task_type == 'coherence':
            return {
                "contradictions": [],
                "topic_drifts": [],
                "logical_gaps": [],
                "overall_coherence_score": round(random.uniform(7.0, 9.0), 1)
            }
        
        else:
            return {"text": "Mock response for demo purposes"}
    
    async def close(self):
        """Close HTTP client"""
        await self.http_client.aclose()

# Create global instance
llm_client = UnifiedLLMClient()