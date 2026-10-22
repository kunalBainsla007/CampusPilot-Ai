"""
CampusPilot AI - Study Planner Engine
Generates subject-tailored Pomodoro study routines, exam prep checklists,
and distributes focus vs. break intervals.
"""

import re
import uuid
from typing import List, Dict, Any, Optional


def identify_subjects(message: str) -> List[str]:
    """Extracts mentioned subjects and topics from message."""
    text = message.lower()
    subjects = []

    subject_patterns = [
        (r"\b(?:ml|machine learning)\b", "Machine Learning"),
        (r"\bpython\b", "Python"),
        (r"\b(?:database|sql|dbms)\b", "Database Systems"),
        (r"\b(?:algo|algorithms?|dsa)\b", "Data Structures & Algorithms"),
        (r"\b(?:os|operating systems?)\b", "Operating Systems"),
        (r"\b(?:math|calculus|linear algebra|stats?|statistics)\b", "Mathematics & Statistics"),
        (r"\b(?:web|frontend|react|backend)\b", "Web Development"),
        (r"\b(?:ai|artificial intelligence)\b", "Artificial Intelligence"),
    ]

    for pattern, name in subject_patterns:
        if re.search(pattern, text):
            subjects.append(name)

    if not subjects:
        # Check for general academic phrases
        match = re.search(r"\b(?:study|prepare for|revise)\s+([a-zA-Z0-9\s]+?)(?:\s+exam|\s+assignment|\s+test|\.|$)", text)
        if match:
            candidate = match.group(1).strip().title()
            if candidate and len(candidate) < 30 and candidate.lower() not in ["for", "an", "the", "my"]:
                subjects.append(candidate)

    if not subjects:
        subjects.append("Core Academic Subjects")

    return subjects


def generate_study_routine(
    message: str,
    subject: Optional[str] = None,
    available_hours: float = 2.0,
) -> List[Dict[str, Any]]:
    """
    Builds a Pomodoro-based study routine tailored to the subject and urgency.
    Each item has: id, minutes, activity, type ('focus' | 'break' | 'review'), completed (bool).
    """
    subjects = identify_subjects(message) if not subject else [subject]
    primary_subject = subjects[0] if subjects else "General Study"

    is_exam = bool(re.search(r"exam|test|midterm|final", message, re.IGNORECASE))
    is_coding = bool(re.search(r"python|coding|programming|assignment|project|debug", message, re.IGNORECASE))

    routine = []

    if is_exam:
        # High-intensity active recall structure
        routine = [
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 25,
                "activity": f"High-yield review: key formulas, definitions & theorems in {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 5,
                "activity": "Active mental reset: hydration and quick posture stretch",
                "type": "break",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 30,
                "activity": f"Timed exam problem drill & past paper questions for {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 10,
                "activity": "Error diagnostic: review mistakes & bookmark tricky edge cases",
                "type": "review",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 20,
                "activity": f"Rapid self-testing: Feynman explanation and flashcard recall on {primary_subject}",
                "type": "focus",
                "completed": False,
            },
        ]
    elif is_coding:
        # Coding & assignment building structure
        routine = [
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 30,
                "activity": f"Deconstruct assignment requirements & design algorithm / architecture for {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 5,
                "activity": "Short screen break: rest eyes (20-20-20 rule)",
                "type": "break",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 35,
                "activity": f"Implementation sprint: write core logic & unit tests for {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 10,
                "activity": "Code cleanup, edge-case debugging & submission checklist check",
                "type": "review",
                "completed": False,
            },
        ]
    else:
        # Standard balanced academic Pomodoro routine
        routine = [
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 25,
                "activity": f"Review lecture notes and assigned readings for {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 5,
                "activity": "Quick break: stretch and step away from study desk",
                "type": "break",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 25,
                "activity": f"Work through practice questions and textbook exercises in {primary_subject}",
                "type": "focus",
                "completed": False,
            },
            {
                "id": str(uuid.uuid4()),
                "subject": primary_subject,
                "minutes": 10,
                "activity": "Synthesize summary notes and write 3 key takeaways",
                "type": "review",
                "completed": False,
            },
        ]

    return routine


def get_exam_prep_checklist(subject: str) -> List[Dict[str, Any]]:
    """Checklist items specific to preparing for an upcoming exam."""
    return [
        {"id": "chk-1", "text": f"Gather syllabus and past exam papers for {subject}", "done": False},
        {"id": "chk-2", "text": "Create 1-page formula & high-yield concept cheat sheet", "done": False},
        {"id": "chk-3", "text": "Complete at least one full timed mock practice set", "done": False},
        {"id": "chk-4", "text": "Review all homework mistakes and marked tricky problems", "done": False},
        {"id": "chk-5", "text": "Prepare exam day logistics (materials, calculator, quiet workspace)", "done": False},
    ]
