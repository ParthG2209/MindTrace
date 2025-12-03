import os
import google.generativeai as genai
from typing import List
from models.transcript import TranscriptSegment
from config import settings

class TranscriptionService:
    def __init__(self):
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def transcribe_video(self, video_path: str) -> tuple[str, List[TranscriptSegment]]:
        try:
            print(f"Transcribing {video_path} using Gemini...")
            
            # Upload file to Gemini
            video_file = genai.upload_file(path=video_path)
            
            # Wait for processing
            import time
            while video_file.state.name == "PROCESSING":
                time.sleep(2)
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                raise Exception("Gemini video processing failed")

            # Prompt for transcription with timestamps
            prompt = """
            Transcribe this video. 
            Provide the output as a JSON list of segments, where each segment has:
            - 'text': The spoken text
            - 'start': Start time in seconds (float)
            - 'end': End time in seconds (float)
            """
            
            response = self.model.generate_content(
                [video_file, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            
            # Parse response
            import json
            data = json.loads(response.text)
            
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
            print(f"Gemini transcription failed: {e}")
            # Fallback to mock only if explicitly enabled
            if settings.FALLBACK_TO_MOCK:
                return await self._mock_transcription(video_path)
            raise e

    async def _mock_transcription(self, video_path: str):
        # ... (Keep your existing mock function here)
        pass

transcription_service = TranscriptionService()