"""
CampusPilot AI - Deterministic Scheduling Engine
Conflict-aware, deadline-sensitive scheduling algorithm.
Preserves fixed commitments and arranges flexible study/task sessions in open time windows.
"""

import re
import uuid
from typing import List, Dict, Any, Tuple, Optional


def parse_time_to_minutes(time_str: str) -> Optional[int]:
    """
    Parses a time string like '09:00', '9:30', '9 AM', '1:30 PM', '18:00' into minutes from midnight.
    Returns None if parsing fails.
    """
    if not time_str or not isinstance(time_str, str):
        return None

    cleaned = time_str.strip()

    # Match 12-hour format e.g. "9 AM", "9:30 AM", "11:00pm"
    m12 = re.match(r"^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$", cleaned, re.IGNORECASE)
    if m12:
        hour = int(m12.group(1))
        minute = int(m12.group(2) or 0)
        meridiem = m12.group(3).lower()

        if hour > 12 or minute > 59:
            return None

        if meridiem == "pm" and hour != 12:
            hour += 12
        elif meridiem == "am" and hour == 12:
            hour = 0

        return hour * 60 + minute

    # Match 24-hour format e.g. "09:00", "9:00", "14:30"
    m24 = re.match(r"^(\d{1,2}):(\d{2})$", cleaned)
    if m24:
        hour = int(m24.group(1))
        minute = int(m24.group(2))
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return hour * 60 + minute

    return None


def minutes_to_time_str(minutes: int) -> str:
    """Converts minutes from midnight to 'HH:MM' string."""
    m = minutes % (24 * 60)
    hour = m // 60
    minute = m % 60
    return f"{hour:02d}:{minute:02d}"


def detect_overlapping_intervals(
    intervals: List[Dict[str, Any]]
) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """
    Checks for overlapping time intervals in a list of events.
    Each event must have 'start_min' and 'end_min'.
    Returns list of pairs of overlapping events.
    """
    overlaps = []
    n = len(intervals)
    for i in range(n):
        for j in range(i + 1, n):
            ev1 = intervals[i]
            ev2 = intervals[j]
            # Overlap condition: start1 < end2 and start2 < end1
            if ev1["start_min"] < ev2["end_min"] and ev2["start_min"] < ev1["end_min"]:
                overlaps.append((ev1, ev2))
    return overlaps


class DeterministicScheduler:
    def __init__(
        self,
        day_start: str = "08:00",
        day_end: str = "22:00",
        default_flexible_duration: int = 60,
    ):
        self.day_start_min = parse_time_to_minutes(day_start) or (8 * 60)
        self.day_end_min = parse_time_to_minutes(day_end) or (22 * 60)
        self.default_duration = default_flexible_duration

    def schedule(
        self,
        tasks: List[Dict[str, Any]],
        existing_events: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Builds a full day schedule:
        1. Preserves all fixed events (cannot be moved).
        2. Detects any conflicts among fixed events.
        3. Fills remaining available slots with flexible tasks ordered by deadline and priority.
        """
        scheduled_items: List[Dict[str, Any]] = []
        fixed_events: List[Dict[str, Any]] = []

        # 1. Collect fixed events from tasks
        for t in tasks:
            fixed_time = t.get("fixed_time")
            if fixed_time:
                start_min = parse_time_to_minutes(fixed_time)
                if start_min is not None:
                    duration = t.get("estimated_minutes", 60)
                    end_min = start_min + duration
                    fixed_events.append({
                        "id": str(uuid.uuid4()),
                        "task_id": t.get("id"),
                        "time": minutes_to_time_str(start_min),
                        "end_time": minutes_to_time_str(end_min),
                        "start_min": start_min,
                        "end_min": end_min,
                        "activity": t["title"],
                        "is_fixed": True,
                        "duration_minutes": duration,
                        "has_conflict": False,
                        "conflict_details": None,
                    })

        # Add any explicitly provided existing fixed events
        if existing_events:
            for ev in existing_events:
                if ev.get("is_fixed"):
                    start_min = parse_time_to_minutes(ev["time"])
                    if start_min is not None:
                        duration = ev.get("duration_minutes", 60)
                        end_min = start_min + duration
                        fixed_events.append({
                            "id": ev.get("id") or str(uuid.uuid4()),
                            "time": minutes_to_time_str(start_min),
                            "end_time": minutes_to_time_str(end_min),
                            "start_min": start_min,
                            "end_min": end_min,
                            "activity": ev["activity"],
                            "is_fixed": True,
                            "duration_minutes": duration,
                            "has_conflict": False,
                            "conflict_details": None,
                        })

        # 2. Conflict detection among fixed events
        conflicts = detect_overlapping_intervals(fixed_events)
        for ev1, ev2 in conflicts:
            ev1["has_conflict"] = True
            ev1["conflict_details"] = f"Overlaps with '{ev2['activity']}' ({ev2['time']}-{ev2['end_time']})"
            ev2["has_conflict"] = True
            ev2["conflict_details"] = f"Overlaps with '{ev1['activity']}' ({ev1['time']}-{ev1['end_time']})"

        scheduled_items.extend(fixed_events)

        # 3. Compute occupied intervals and available free intervals
        occupied_intervals = [
            (ev["start_min"], ev["end_min"])
            for ev in fixed_events
        ]
        occupied_intervals.sort(key=lambda x: x[0])

        # Merge overlapping occupied blocks
        merged_occupied: List[Tuple[int, int]] = []
        for start, end in occupied_intervals:
            if not merged_occupied:
                merged_occupied.append((start, end))
            else:
                prev_start, prev_end = merged_occupied[-1]
                if start < prev_end:
                    merged_occupied[-1] = (prev_start, max(prev_end, end))
                else:
                    merged_occupied.append((start, end))

        # Build free windows within day_start_min and day_end_min
        free_windows: List[Tuple[int, int]] = []
        curr = self.day_start_min
        for occ_start, occ_end in merged_occupied:
            if occ_start > curr:
                free_windows.append((curr, min(occ_start, self.day_end_min)))
            curr = max(curr, occ_end)
        if curr < self.day_end_min:
            free_windows.append((curr, self.day_end_min))

        # 4. Filter flexible tasks (tasks without fixed_time) and sort by priority & deadline
        def task_urgency_score(task: Dict[str, Any]) -> int:
            score = 100
            prio = task.get("priority", "Normal").lower()
            if prio == "high":
                score -= 40
            elif prio == "low":
                score += 20

            deadline = str(task.get("deadline", "")).lower()
            if "tonight" in deadline or "today" in deadline:
                score -= 30
            elif "tomorrow" in deadline:
                score -= 10
            return score

        flexible_tasks = [
            t for t in tasks if not t.get("fixed_time")
        ]
        flexible_tasks.sort(key=task_urgency_score)

        # 5. Place flexible tasks into available free windows
        window_idx = 0
        window_cursor = free_windows[0][0] if free_windows else self.day_start_min

        for task in flexible_tasks:
            duration = task.get("estimated_minutes") or self.default_duration
            placed = False

            while window_idx < len(free_windows):
                w_start, w_end = free_windows[window_idx]
                effective_start = max(window_cursor, w_start)

                if effective_start + duration <= w_end:
                    scheduled_items.append({
                        "id": str(uuid.uuid4()),
                        "task_id": task.get("id"),
                        "time": minutes_to_time_str(effective_start),
                        "end_time": minutes_to_time_str(effective_start + duration),
                        "start_min": effective_start,
                        "end_min": effective_start + duration,
                        "activity": task["title"],
                        "is_fixed": False,
                        "duration_minutes": duration,
                        "has_conflict": False,
                        "conflict_details": None,
                    })
                    window_cursor = effective_start + duration + 15  # 15 min buffer between activities
                    placed = True
                    break
                else:
                    window_idx += 1
                    if window_idx < len(free_windows):
                        window_cursor = free_windows[window_idx][0]

            if not placed:
                # If daylight slots are full, flag as unplaced or evening overflow
                overflow_start = max(window_cursor, self.day_end_min)
                scheduled_items.append({
                    "id": str(uuid.uuid4()),
                    "task_id": task.get("id"),
                    "time": minutes_to_time_str(overflow_start),
                    "end_time": minutes_to_time_str(overflow_start + duration),
                    "start_min": overflow_start,
                    "end_min": overflow_start + duration,
                    "activity": task["title"],
                    "is_fixed": False,
                    "duration_minutes": duration,
                    "has_conflict": True,
                    "conflict_details": "Scheduled past normal hours (tight schedule)",
                })
                window_cursor = overflow_start + duration

        # 6. Sort all items chronologically
        scheduled_items.sort(key=lambda x: x["start_min"])

        # Format clean output for API / frontend
        clean_schedule = []
        for item in scheduled_items:
            clean_schedule.append({
                "id": item["id"],
                "time": item["time"],
                "end_time": item["end_time"],
                "activity": item["activity"],
                "is_fixed": item["is_fixed"],
                "duration_minutes": item["duration_minutes"],
                "has_conflict": item["has_conflict"],
                "conflict_details": item["conflict_details"],
            })

        conflicts_count = sum(1 for item in clean_schedule if item["has_conflict"])

        return {
            "schedule": clean_schedule,
            "conflicts_count": conflicts_count,
            "total_items": len(clean_schedule),
            "free_hours_remaining": round(
                sum((w[1] - w[0]) for w in free_windows) / 60, 1
            ),
        }
