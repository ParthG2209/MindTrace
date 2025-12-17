from typing import List
from models.transcript import TranscriptSegment

class SegmentationService:
    """Service for segmenting transcripts into logical explanation units"""
    
    def __init__(self):
        # UPDATED: Aggressively increased thresholds for 1.5h sessions
        # Target: ~30-35 segments for a 90-minute session (~13,000 words)
        # Avg segment needed: ~400 words
        self.min_segment_words = 250
        self.max_segment_words = 600
        
        self.topic_shift_indicators = [
            'now', 'next', 'let me', "let's", 'moving on', 'another',
            'first', 'second', 'third', 'finally', 'to summarize',
            'in conclusion', 'the key point', 'remember that',
            'so', 'okay', 'alright', 'well', 'basically',
            'what we', 'what i', 'the next', 'going to',
            'important', 'note that', 'keep in mind',
        ]
    
    def segment_transcript(self, segments: List[TranscriptSegment]) -> List[TranscriptSegment]:
        """
        Group transcript segments into logical explanation units
        
        Args:
            segments: Raw transcript segments
            
        Returns:
            List of merged logical segments
        """
        
        if not segments:
            return []
        
        # If we have very few segments, just return them
        if len(segments) <= 5:
            print(f"⚠️ Only {len(segments)} segments received, returning as-is")
            return segments
        
        logical_segments = []
        current_segment = {
            'texts': [],
            'start_time': segments[0].start_time,
            'word_count': 0
        }
        
        for i, seg in enumerate(segments):
            words = seg.text.split()
            word_count = len(words)
            
            current_segment['texts'].append(seg.text)
            current_segment['word_count'] += word_count
            
            # Check if we should create a new segment
            should_split = False
            
            # Split if we've reached max words
            if current_segment['word_count'] >= self.max_segment_words:
                should_split = True
            
            # Split if we detect a topic shift and have minimum words
            elif current_segment['word_count'] >= self.min_segment_words:
                if self._detect_topic_shift(seg.text):
                    should_split = True
            
            # Always split at the last segment
            if i == len(segments) - 1:
                should_split = True
            
            if should_split and current_segment['texts']:
                logical_segments.append(TranscriptSegment(
                    segment_id=len(logical_segments),
                    text=' '.join(current_segment['texts']),
                    start_time=current_segment['start_time'],
                    end_time=seg.end_time,
                    confidence=sum(s.confidence for s in segments[max(0, i - len(current_segment['texts'])):i+1]) / (len(current_segment['texts']) or 1)
                ))
                
                # Start new segment
                if i < len(segments) - 1:
                    current_segment = {
                        'texts': [],
                        'start_time': segments[i + 1].start_time,
                        'word_count': 0
                    }
        
        print(f"📊 Segmentation: {len(segments)} raw → {len(logical_segments)} logical segments")
        return logical_segments
    
    def _detect_topic_shift(self, text: str) -> bool:
        """Detect if text indicates a topic shift"""
        text_lower = text.lower()
        return any(indicator in text_lower for indicator in self.topic_shift_indicators)

segmentation_service = SegmentationService()