import json
import asyncio
import re
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
import google.generativeai as genai
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
        # ✅ CRITICAL FIX: Strip keys to remove hidden newlines/spaces that break requests
        self.gemini_api_key = settings.GOOGLE_API_KEY.strip() if settings.GOOGLE_API_KEY else ""
        self.groq_api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""
        self.use_mock_fallback = settings.FALLBACK_TO_MOCK
        
        # Task routing configuration
        self.task_routing = {
            'evaluate': 'gemini',      # Frequent, needs accuracy
            'evidence': 'gemini',      # Needs precision
            'rewrite': 'groq',         # Needs speed (User enforced)
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
        """
        
        # Determine which provider to use
        provider = self.task_routing.get(task_type, 'gemini')
        
        for attempt in range(max_retries):
            try:
                # Try selected provider
                if provider == 'gemini' and self.gemini_api_key:
                    return await self._call_gemini(prompt, response_format, temperature)
                elif provider == 'groq' and self.groq_api_key:
                    return await self._call_groq(prompt, response_format, temperature)
                else:
                    # If preferred provider key is missing, try the other one
                    # (Unless it's a rewrite task and we want to enforce Groq preferences where possible)
                    if provider == 'gemini' and self.groq_api_key:
                        return await self._call_groq(prompt, response_format, temperature)
                    elif provider == 'groq' and self.gemini_api_key:
                        return await self._call_gemini(prompt, response_format, temperature)
                    elif self.use_mock_fallback:
                        return self._generate_mock_response(task_type)
                    else:
                        raise LLMClientError("No LLM provider available")
                        
            except RateLimitError:
                if attempt < max_retries - 1:
                    print(f"Rate limit hit for {provider}. Retrying...")
                    await asyncio.sleep(2 ** attempt)
                    # For rewrite, stick to Groq if possible, otherwise switch
                    if task_type != 'rewrite':
                        provider = 'groq' if provider == 'gemini' else 'gemini'
                    continue
                raise
                
            except Exception as e:
                print(f"LLM attempt {attempt+1} failed ({provider}): {str(e)}")
                
                if attempt < max_retries - 1:
                    # ✅ FIX: Enforce Groq for rewrites (do not switch to Gemini)
                    if task_type == 'rewrite' and provider == 'groq':
                        print("Retrying Groq for rewrite (enforcing user preference)...")
                        # Provider stays 'groq'
                    else:
                        # For other tasks, switch provider to maximize success chance
                        provider = 'groq' if provider == 'gemini' else 'gemini'
                        print(f"Switching to {provider} for retry...")
                    
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
        
        if response_format == 'json':
            if not ('json' in prompt.lower() and 'return' in prompt.lower()):
                prompt = prompt + "\n\nYou MUST return ONLY a valid JSON object. No markdown, no code blocks, no explanations - just pure JSON."
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "topP": 0.95,
                "topK": 40,
                "maxOutputTokens": 8192,
            },
            "safetySettings": [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
            ]
        }
        
        response = await self.http_client.post(url, json=payload)
        
        if response.status_code == 429:
            raise RateLimitError("Gemini rate limit exceeded")
        
        if response.status_code != 200:
            raise LLMClientError(f"Gemini API error: {response.status_code} - {response.text}")
        
        data = response.json()
        
        try:
            if 'candidates' not in data or not data['candidates']:
                raise LLMClientError(f"Gemini returned no candidates. Possible safety block. Response: {str(data)[:200]}")
            
            candidate = data['candidates'][0]
            if candidate.get('finishReason') == 'SAFETY':
                 raise LLMClientError("Gemini generation blocked due to safety settings.")

            if 'content' not in candidate:
                raise LLMClientError(f"Gemini candidate missing content. Finish reason: {candidate.get('finishReason')}")
                
            content_part = candidate['content']
            if 'parts' not in content_part or not content_part['parts']:
                 raise LLMClientError("Gemini content missing parts text.")

            content = content_part['parts'][0]['text']
            
            if response_format == 'json':
                content = self._clean_json_string(content)
                try:
                    return json.loads(content)
                except json.JSONDecodeError as je:
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
        
        # ✅ Clean URL string to prevent protocol errors
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {self.groq_api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [
            {"role": "system", "content": "You are an expert educational evaluator. Respond in valid JSON format."},
            {"role": "user", "content": prompt}
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
        
        # Use a fresh client context for Groq to ensure no pollution
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, headers=headers, json=payload)
        
        if response.status_code == 429:
            raise RateLimitError("Groq rate limit exceeded")
        
        if response.status_code != 200:
            raise LLMClientError(f"Groq API error: {response.status_code} - {response.text}")
        
        data = response.json()
        
        try:
            content = data['choices'][0]['message']['content']
            
            if response_format == 'json':
                content = self._clean_json_string(content)
                return json.loads(content)
            return {'text': content}
            
        except (KeyError, IndexError, json.JSONDecodeError) as e:
            raise LLMClientError(f"Failed to parse Groq response: {e}")

    def _clean_json_string(self, content: str) -> str:
        """Helper to remove markdown code blocks from JSON strings"""
        content = content.strip()
        if content.startswith('```json'):
            content = content[7:]
        elif content.startswith('```'):
            content = content[3:]
        if content.endswith('```'):
            content = content[:-3]
        return content.strip()
    
    def _generate_mock_response(self, task_type: str) -> Dict[str, Any]:
        """Generate realistic mock responses for demo purposes"""
        import random
        
        if task_type == 'evaluate':
            return {
                "clarity": {"score": round(random.uniform(6.5, 9.5), 1), "reason": "Clear explanation with examples."},
                "structure": {"score": round(random.uniform(6.0, 9.0), 1), "reason": "Logical flow present."},
                "correctness": {"score": round(random.uniform(7.0, 9.5), 1), "reason": "Technically accurate."},
                "pacing": {"score": round(random.uniform(6.0, 8.5), 1), "reason": "Appropriate pacing."},
                "communication": {"score": round(random.uniform(6.5, 9.0), 1), "reason": "Engaging tone."},
                "engagement": {"score": round(random.uniform(6.0, 9.0), 1), "reason": "Maintains interest."},
                "examples": {"score": round(random.uniform(6.5, 9.5), 1), "reason": "Good examples used."},
                "questioning": {"score": round(random.uniform(5.5, 8.5), 1), "reason": "Questions could be better."},
                "adaptability": {"score": round(random.uniform(6.0, 8.5), 1), "reason": "Good adaptation."},
                "relevance": {"score": round(random.uniform(7.0, 9.5), 1), "reason": "Highly relevant."}
            }
        elif task_type == 'rewrite':
            return {
                "original_text": "Original text placeholder",
                "rewritten_text": "Significantly improved text with better clarity and structure.",
                "improvements": ["Improved terminology", "Better flow"],
                "key_changes": {"structure": "Reorganized"},
                "clarity_improvement": 2.0,
                "word_count_change": 10,
                "confidence": 0.9
            }
        elif task_type == 'coherence':
            return {
                "contradictions": [],
                "topic_drifts": [],
                "logical_gaps": [],
                "overall_coherence_score": 8.5
            }
        return {"text": "Mock response"}
    
    async def close(self):
        await self.http_client.aclose()

# Create global instance
llm_client = UnifiedLLMClient()