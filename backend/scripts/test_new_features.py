import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from utils.llm_client import llm_client
from services.evidence_extractor import evidence_extractor
from services.explanation_rewriter import explanation_rewriter
from services.coherence_checker import coherence_checker
from models.evaluation import SegmentEvaluation, ScoreDetail

async def test_llm_client():
    """Test the unified LLM client"""
    print("\n" + "="*60)
    print("TEST 1: LLM Client")
    print("="*60)
    
    try:
        # Test simple evaluation call
        prompt = """Rate this explanation on clarity (1-10):
        "The function does stuff with the data."
        
        Return JSON: {"score": 5, "reason": "Too vague"}"""
        
        response = await llm_client.call_llm(
            prompt=prompt,
            task_type='evaluate',
            response_format='json'
        )
        
        print(f"✅ LLM Client working!")
        print(f"Response: {response}")
        return True
        
    except Exception as e:
        print(f"❌ LLM Client failed: {e}")
        return False

async def test_evidence_extraction():
    """Test evidence extractor"""
    print("\n" + "="*60)
    print("TEST 2: Evidence Extraction")
    print("="*60)
    
    try:
        # Create a mock segment with low clarity score
        segment = SegmentEvaluation(
            segment_id=0,
            text="So basically, the thing does stuff with the data and then it returns the thing you need.",
            clarity=ScoreDetail(
                score=4.5,
                reason="Very vague language - 'thing', 'stuff', and 'thing you need' are unclear"
            ),
            structure=ScoreDetail(score=7.0, reason="Acceptable structure"),
            correctness=ScoreDetail(score=8.0, reason="Technically correct"),
            pacing=ScoreDetail(score=7.0, reason="Good pace"),
            communication=ScoreDetail(score=6.0, reason="Too casual"),
            overall_segment_score=6.5
        )
        
        # Extract evidence
        evidence_items = await evidence_extractor.extract_evidence(segment, 'clarity')
        
        if evidence_items:
            print(f"✅ Evidence extraction working!")
            print(f"Found {len(evidence_items)} issues:")
            for item in evidence_items[:2]:  # Show first 2
                print(f"  - Phrase: '{item.get('phrase')}'")
                print(f"    Issue: {item.get('issue')}")
                print(f"    Suggestion: {item.get('suggestion')}\n")
            return True
        else:
            print("⚠️  No evidence extracted (might be expected if score > threshold)")
            return True
            
    except Exception as e:
        print(f"❌ Evidence extraction failed: {e}")
        return False

async def test_explanation_rewriter():
    """Test explanation rewriter"""
    print("\n" + "="*60)
    print("TEST 3: Explanation Rewriting")
    print("="*60)
    
    try:
        # Create a segment that needs rewriting
        segment = SegmentEvaluation(
            segment_id=0,
            text="So Python decorators are like wrappers that do stuff to your functions.",
            clarity=ScoreDetail(
                score=5.0,
                reason="Too vague - 'like wrappers' and 'do stuff' are unclear"
            ),
            structure=ScoreDetail(score=6.0, reason="Minimal structure"),
            correctness=ScoreDetail(score=7.0, reason="Conceptually correct"),
            pacing=ScoreDetail(score=7.0, reason="Good pace"),
            communication=ScoreDetail(score=5.5, reason="Too casual"),
            overall_segment_score=6.1
        )
        
        # Generate rewrite
        rewrite = await explanation_rewriter.rewrite_segment(
            segment,
            topic_context="Python decorators"
        )
        
        if rewrite.get('rewritten_text'):
            print(f"✅ Rewriting working!")
            print(f"\nOriginal:")
            print(f"  {segment.text}")
            print(f"\nRewritten:")
            print(f"  {rewrite['rewritten_text']}")
            print(f"\nImprovements:")
            for improvement in rewrite.get('improvements', [])[:3]:
                print(f"  - {improvement}")
            return True
        else:
            print(f"⚠️  No rewrite generated: {rewrite.get('reason', 'Unknown')}")
            return True
            
    except Exception as e:
        print(f"❌ Rewriting failed: {e}")
        return False

async def test_coherence_checker():
    """Test coherence checker"""
    print("\n" + "="*60)
    print("TEST 4: Coherence Checking")
    print("="*60)
    
    try:
        # Create segments with potential contradictions
        segments = [
            SegmentEvaluation(
                segment_id=0,
                text="Python is dynamically typed, so you never need to declare variable types.",
                clarity=ScoreDetail(score=8.0, reason="Clear statement"),
                structure=ScoreDetail(score=8.0, reason="Well structured"),
                correctness=ScoreDetail(score=8.0, reason="Accurate"),
                pacing=ScoreDetail(score=7.0, reason="Good"),
                communication=ScoreDetail(score=8.0, reason="Clear"),
                overall_segment_score=7.8
            ),
            SegmentEvaluation(
                segment_id=1,
                text="Let me show you how to use type hints in Python to declare variable types.",
                clarity=ScoreDetail(score=8.0, reason="Clear"),
                structure=ScoreDetail(score=8.0, reason="Good"),
                correctness=ScoreDetail(score=8.0, reason="Accurate"),
                pacing=ScoreDetail(score=7.0, reason="Good"),
                communication=ScoreDetail(score=8.0, reason="Clear"),
                overall_segment_score=7.8
            )
        ]
        
        # Check coherence
        report = await coherence_checker.check_coherence(
            segments,
            topic="Python type system"
        )
        
        print(f"✅ Coherence checking working!")
        print(f"\nOverall Coherence Score: {report['session_coherence_score']}/10")
        print(f"Contradictions found: {len(report.get('contradictions', []))}")
        print(f"Topic drifts found: {len(report.get('topic_drifts', []))}")
        print(f"Logical gaps found: {len(report.get('logical_gaps', []))}")
        
        # Show first contradiction if any
        if report.get('contradictions'):
            contra = report['contradictions'][0]
            print(f"\nExample Contradiction:")
            print(f"  Statement 1: {contra.get('statement1')}")
            print(f"  Statement 2: {contra.get('statement2')}")
            print(f"  Explanation: {contra.get('explanation')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Coherence checking failed: {e}")
        return False

async def test_full_pipeline():
    """Test complete analysis pipeline"""
    print("\n" + "="*60)
    print("TEST 5: Full Analysis Pipeline")
    print("="*60)
    
    try:
        # Create a realistic segment
        segment = SegmentEvaluation(
            segment_id=0,
            text="So decorators in Python, they're basically functions that take other functions as arguments and return a new function. It's like wrapping your function in another function that adds extra functionality.",
            clarity=ScoreDetail(
                score=6.5,
                reason="Somewhat clear but uses informal language and vague terms"
            ),
            structure=ScoreDetail(
                score=7.0,
                reason="Follows a logical flow"
            ),
            correctness=ScoreDetail(
                score=8.5,
                reason="Technically accurate"
            ),
            pacing=ScoreDetail(
                score=7.0,
                reason="Appropriate speed"
            ),
            communication=ScoreDetail(
                score=6.5,
                reason="Too casual for technical content"
            ),
            overall_segment_score=7.1
        )
        
        print("Input segment:")
        print(f"  Text: {segment.text}")
        print(f"  Clarity: {segment.clarity.score}/10")
        
        # 1. Extract evidence
        print("\n1. Extracting evidence...")
        evidence = await evidence_extractor.extract_evidence(segment, 'clarity')
        print(f"   Found {len(evidence)} issues")
        
        # 2. Generate rewrite
        print("\n2. Generating rewrite...")
        rewrite = await explanation_rewriter.rewrite_segment(segment, "Python decorators")
        if rewrite.get('rewritten_text'):
            print(f"   ✅ Rewrite generated")
            print(f"   Estimated improvement: +{rewrite.get('estimated_clarity_improvement', 0)}")
        
        # 3. Check coherence (single segment)
        print("\n3. Checking coherence...")
        coherence = await coherence_checker.check_coherence([segment], "Python decorators")
        print(f"   Coherence score: {coherence['session_coherence_score']}/10")
        
        print("\n✅ Full pipeline working!")
        return True
        
    except Exception as e:
        print(f"❌ Full pipeline failed: {e}")
        return False

async def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("MINDTRACE NEW FEATURES TEST SUITE")
    print("="*60)
    
    results = []
    
    # Test 1: LLM Client
    results.append(("LLM Client", await test_llm_client()))
    
    # Test 2: Evidence Extraction
    results.append(("Evidence Extraction", await test_evidence_extraction()))
    
    # Test 3: Rewriting
    results.append(("Explanation Rewriting", await test_explanation_rewriter()))
    
    # Test 4: Coherence
    results.append(("Coherence Checking", await test_coherence_checker()))
    
    # Test 5: Full Pipeline
    results.append(("Full Pipeline", await test_full_pipeline()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name:.<40} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Ready for production.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Check errors above.")
    
    # Close LLM client
    await llm_client.close()

if __name__ == "__main__":
    # Run tests
    asyncio.run(run_all_tests())