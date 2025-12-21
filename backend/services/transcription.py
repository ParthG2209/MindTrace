import os
import asyncio
import google.generativeai as genai
from typing import List, Tuple
from models.transcript import TranscriptSegment
from config import settings
import re
import json

class TranscriptionService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    async def transcribe_video(self, video_path: str) -> Tuple[str, List[TranscriptSegment]]:
        try:
            print(f"Transcribing {video_path} using Gemini...")
            
            # Upload file to Gemini
            video_file = genai.upload_file(path=video_path)
            
            # Wait for processing - CRITICAL FIX: Use asyncio.sleep to avoid blocking the server
            while video_file.state.name == "PROCESSING":
                await asyncio.sleep(2)  # Non-blocking sleep
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                raise Exception("Gemini video processing failed")

            # OPTIMIZED PROMPT: For long videos (45m+), granular segmentation (max 40 words)
            # creates too many tokens and causes the LLM to crash/truncate.
            # We now ask for natural logical segments/paragraphs.
            prompt = """
            Transcribe this video with detailed timestamps. 
            Break the transcription into logical segments (e.g., by sentence flow or topic shift).
            
            IMPORTANT: 
            - Create a NEW segment for each logical thought or sentence group.
            - aim for 50-100 words per segment to keep the JSON structure efficient.
            - Include timestamps for EVERY segment.
            
            Provide the output as a JSON array where each segment has:
            - 'text': The spoken text
            - 'start': Start time in seconds (float)
            - 'end': End time in seconds (float)
            
            Example format:
            [
              {"text": "Welcome to today's lecture on Python decorators. We will cover the basics.", "start": 0.0, "end": 5.5},
              {"text": "Decorators are a powerful feature in Python that allow you to modify behavior.", "start": 5.5, "end": 10.2}
            ]
            
            Return ONLY the JSON array, no other text.
            """
            
            response = await self.model.generate_content_async(
                [video_file, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            # Parse response
            response_text = response.text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            try:
                data = json.loads(response_text)
            except json.JSONDecodeError:
                # Fallback for truncated JSON in very long videos
                print("⚠️ JSON parsing failed (likely truncated). Attempting recovery...")
                if response_text.rfind("}") > 0:
                    fixed_text = response_text[:response_text.rfind("}")+1] + "]"
                    try:
                        data = json.loads(fixed_text)
                    except:
                        raise Exception("Could not parse transcription response")
                else:
                    raise Exception("Could not parse transcription response")

            
            # CRITICAL FIX: If Gemini returns too few segments, split them further
            if len(data) < 10:
                print(f"⚠️ Gemini returned only {len(data)} segments, this seems too low. Attempting to split further...")
                data = self._split_large_segments(data)
            
            print(f"✅ Transcription complete: {len(data)} segments created")
            
            full_text = " ".join([seg['text'] for seg in data])
            segments = []
            
            for i, seg in enumerate(data):
                segments.append(TranscriptSegment(
                    segment_id=i,
                    text=seg['text'],
                    start_time=float(seg['start']),
                    end_time=float(seg['end']),
                    confidence=1.0
                ))
                
            return full_text, segments

        except Exception as e:
            print(f"❌ Gemini transcription failed: {e}")
            # Fallback to mock only if explicitly enabled
            if settings.FALLBACK_TO_MOCK:
                return await self._mock_transcription(video_path)
            raise e

    def _split_large_segments(self, segments: List[dict]) -> List[dict]:
        """
        Split large segments into smaller ones for better granularity
        This handles cases where Gemini returns too few segments
        """
        split_segments = []
        
        for seg in segments:
            text = seg['text']
            start_time = seg['start']
            end_time = seg['end']
            duration = end_time - start_time
            
            # Split by sentences
            sentences = re.split(r'([.!?]+\s+)', text)
            sentences = [s for s in sentences if s.strip()]
            
            # If only one sentence or very short, keep as is
            if len(sentences) <= 2 or len(text.split()) < 40:
                split_segments.append(seg)
                continue
            
            # Split into multiple segments
            time_per_char = duration / len(text) if len(text) > 0 else 0
            current_time = start_time
            current_text = ""
            
            for i, sentence in enumerate(sentences):
                current_text += sentence
                
                # Create segment every 1-2 sentences or ~40 words
                word_count = len(current_text.split())
                if word_count >= 30 or i == len(sentences) - 1:
                    segment_duration = len(current_text) * time_per_char
                    segment_end = min(current_time + segment_duration, end_time)
                    
                    split_segments.append({
                        'text': current_text.strip(),
                        'start': current_time,
                        'end': segment_end
                    })
                    
                    current_time = segment_end
                    current_text = ""
        
        print(f"📊 Segment splitting: {len(segments)} → {len(split_segments)} segments")
        return split_segments

    async def _mock_transcription(self, video_path: str):
        """Mock transcription for demo purposes"""
        # Generate mock data based on video length
        import random
        
        # Simulate ~30 segments for a typical video
        num_segments = random.randint(25, 35)
        segments = []
        full_text_parts = []
        
        mock_phrases = [
            "Let me explain this concept clearly.",
            "This is an important point to understand.",
            "Now, let's move on to the next topic.",
            "As you can see in this example,",
            "The key thing to remember here is",
            "This demonstrates the principle of",
            "Let's break this down step by step.",
            "An important application of this is",
            "Consider the following scenario:",
            "This technique is particularly useful when",
        ]
        
        current_time = 0.0
        for i in range(num_segments):
            text = random.choice(mock_phrases)
            duration = random.uniform(8, 15)  # 8-15 seconds per segment
            
            segments.append(TranscriptSegment(
                segment_id=i,
                text=text,
                start_time=current_time,
                end_time=current_time + duration,
                confidence=0.95
            ))
            
            full_text_parts.append(text)
            current_time += duration
        
        full_text = " ".join(full_text_parts)
        print(f"📝 Mock transcription: {len(segments)} segments created")
        
        return full_text, segments

transcription_service = TranscriptionService()