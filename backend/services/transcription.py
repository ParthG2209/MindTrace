import os
from typing import List
from models.transcript import TranscriptSegment
from config import settings

class TranscriptionService:
    """Service for transcribing video/audio files"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
    
    async def transcribe_video(self, video_path: str) -> tuple[str, List[TranscriptSegment]]:
        """
        Transcribe video file to text with timestamps
        
        Args:
            video_path: Path to video file
            
        Returns:
            Tuple of (full_text, segments)
        """
        
        # If OpenAI API key is available, use Whisper
        if self.api_key:
            return await self._transcribe_with_whisper(video_path)
        else:
            # Use mock transcription for demo purposes
            return await self._mock_transcription(video_path)
    
    async def _transcribe_with_whisper(self, video_path: str) -> tuple[str, List[TranscriptSegment]]:
        """Transcribe using OpenAI Whisper API"""
        try:
            import openai
            client = openai.OpenAI(api_key=self.api_key)
            
            with open(video_path, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )
            
            # Parse response
            full_text = transcript.text
            segments = []
            
            for i, seg in enumerate(transcript.segments):
                segments.append(TranscriptSegment(
                    segment_id=i,
                    text=seg['text'],
                    start_time=seg['start'],
                    end_time=seg['end'],
                    confidence=seg.get('confidence', 1.0)
                ))
            
            return full_text, segments
            
        except Exception as e:
            print(f"Whisper transcription failed: {e}")
            return await self._mock_transcription(video_path)
    
    async def _mock_transcription(self, video_path: str) -> tuple[str, List[TranscriptSegment]]:
        """Mock transcription for demo purposes"""
        
        mock_text = """
        Hello everyone, today we're going to learn about Python decorators. 
        Decorators are a very powerful feature in Python that allow you to modify the behavior of functions or classes.
        Let me start by explaining what a decorator actually is. A decorator is essentially a function that takes another function as an argument.
        It wraps the original function and extends its behavior without permanently modifying it.
        The syntax uses the at symbol followed by the decorator name, placed above the function definition.
        Let's look at a simple example. Suppose we have a function that prints hello world.
        We can create a decorator that adds some logging before and after the function executes.
        This is incredibly useful for cross-cutting concerns like logging, authentication, or timing.
        Now, you might be wondering, how does this actually work under the hood?
        When you use the decorator syntax, Python is actually doing something called syntactic sugar.
        It's equivalent to calling the decorator function and passing your original function to it.
        The decorator returns a new function which replaces the original one.
        This pattern is extremely common in web frameworks like Flask and Django.
        You'll see decorators used for routing, requiring login, caching, and many other purposes.
        Let me show you a more advanced example with a decorator that takes arguments.
        This requires an additional level of function nesting, which can be confusing at first.
        But once you understand the pattern, it becomes very straightforward to use.
        To summarize, decorators let you add functionality to existing code in a clean, readable way.
        They're one of Python's most elegant features and worth mastering.
        Does anyone have any questions about what we've covered so far?
        """
        
        # Split into segments (roughly every 30 seconds)
        sentences = [s.strip() + "." for s in mock_text.strip().split('.') if s.strip()]
        segments = []
        current_time = 0.0
        
        for i, sentence in enumerate(sentences):
            duration = len(sentence.split()) * 0.5  # Rough estimate: 0.5s per word
            segments.append(TranscriptSegment(
                segment_id=i,
                text=sentence,
                start_time=current_time,
                end_time=current_time + duration,
                confidence=0.95
            ))
            current_time += duration
        
        full_text = " ".join(sentences)
        return full_text, segments

transcription_service = TranscriptionService()