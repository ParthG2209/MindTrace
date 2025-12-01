from . import mentors
from . import sessions
from . import evaluations

# ===== NEW: Import new routes =====
from . import evidence
from . import rewrites
from . import coherence
# ===== END NEW =====

__all__ = [
    'mentors', 
    'sessions', 
    'evaluations',
    # ===== NEW =====
    'evidence',
    'rewrites',
    'coherence',
    # ===== END NEW =====
]