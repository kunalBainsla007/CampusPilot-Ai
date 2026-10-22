# CampusPilot AI — 2-Minute Hackathon Demo Script

**Speaker:** Solo Developer / Presenter  
**Target Video Duration:** 1 minute 50 seconds  
**Track:** Amazon Build, Ship, Shape Hackathon (Alexa+ Track)

---

### [0:00 - 0:20] The Student Problem
> *"Hi everyone! As a student, my biggest productivity hurdle isn't lacking tools—it's that my tools don't talk to each other. Syllabus deadlines live in emails, class times live on notice boards, and study plans are scribbled on random sticky notes. Typical chatbots just chat back; they don't actually organize my day or manage my real schedule.*
>
> *Introducing **CampusPilot AI**—an Alexa+-inspired agentic assistant built to turn messy student thoughts into structured, conflict-checked daily plans."*

**Visual Action:**
- Show the CampusPilot AI Dashboard view on `http://localhost:5173` (or `5174`).
- Highlight the clean layout, completion rate bar, and status indicators.

---

### [0:20 - 0:45] The Agentic Request & Tool Execution
> *"Let's test it with a classic high-stress student scenario. In the AI Assistant tab, I'll submit:
> 
> `'I have an ML exam tomorrow, a Python assignment due tonight, and classes at 9 AM. Organize my day.'`
>
> *Instead of giving me generic advice, CampusPilot AI invokes a pipeline of local deterministic tools:*
> 1. *`extract_tasks` identifies deadlines and prioritizes tonight's Python assignment over tomorrow's exam.*
> 2. *`make_schedule` locks in my 9 AM class as a fixed commitment and checks for time conflicts.*
> 3. *`study_plan` constructs a subject-specific Pomodoro study sprint.*
> 4. *And our SQLite data access layer permanently persists everything with stable IDs."*

**Visual Action:**
- Click "AI Assistant" in sidebar.
- Click the first prompt chip (or submit the benchmark prompt).
- Point out the "Step-by-Step Tool Execution Trace" cards with green checkmarks and "Real SQLite Write" badges.

---

### [0:45 - 1:10] Reviewing Tasks & Schedule
> *"Let's see what the agent created:*
> - *Under **My Tasks**, notice how our tasks have distinct priorities and deadlines: the Python assignment is High priority due Tonight; the ML exam is Tomorrow; and our 9 AM class is tracked.*
> - *Under **Schedule**, our 9 AM class is locked in purple. Flexible study slots are arranged around it—never overwriting our fixed lecture!*
> - *If we introduce an overlapping event, the scheduler immediately raises a visible conflict warning instead of silently failing."*

**Visual Action:**
- Click "My Tasks" in sidebar.
- Show the search and filter controls.
- Click "Schedule" in sidebar to demonstrate the chronological timeline with the purple "Locked Fixed Event" chip.

---

### [1:10 - 1:30] Interactive Action & Persistence
> *"CampusPilot AI isn't a static simulation. Let's mark our Python assignment as complete! Notice the strike-through and updated progress. Let's also add a quick manual task: 'Record Hackathon Demo Video'.*
>
> *Now, let's refresh the browser page. Everything—our task completion, custom tasks, and schedule—instantly reloads from SQLite and local storage. No lost work!"*

**Visual Action:**
- Check off "Finish Python assignment".
- Click "Add New Task", create "Record Hackathon Demo Video", save it.
- Press `F5` / browser reload button. Show that all changes persist.
- Switch theme to Dark Mode using the navbar button to highlight UI polish.

---

### [1:30 - 1:45] Study Planner & Pomodoro Timer
> *"In the **Study Planner**, the agent broke our Machine Learning exam preparation into Pomodoro intervals: 25 minutes of high-yield formulas, a 5-minute break, and timed exam practice. We can hit 'Start Sprint' on the interactive timer and work through our exam prep checklist."*

**Visual Action:**
- Click "Study Planner" in sidebar.
- Click "Start Sprint" on the countdown timer. Check off a checklist item.

---

### [1:45 - 2:00] Conclusion & Honest Disclosure
> *"CampusPilot AI runs 100% locally with zero paid API keys required. It demonstrates how Alexa+ agentic workflows can empower students through transparent tool execution, deterministic conflict-free scheduling, and reliable persistence.*
>
> *Thank you, and enjoy using CampusPilot AI!"*

**Visual Action:**
- Show the footer showing "CampusPilot AI • Alexa+ Track Prototype".
- End screen with project title and GitHub repo link.
