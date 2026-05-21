import os
import random
from datetime import datetime
from sqlalchemy.orm import Session
import google.generativeai as genai
from .models import Topic, TopicYearStat, Prediction, Exam

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class AnalyticsEngine:
    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel('gemini-1.5-flash') if api_key else None

    def generate_predictions(self, exam_id: int, target_year: int = 2026):
        """
        Runs decadal trend regression and calls Gemini to generate rationales for predictions.
        """
        # Delete old predictions for the exam
        self.db.query(Prediction).filter_by(exam_id=exam_id, target_year=target_year).delete()
        self.db.commit()

        # Fetch all subtopics and subjects
        topics = self.db.query(Topic).filter_by(exam_id=exam_id).all()
        
        predictions_created = []

        # Find years present in database stats
        stat_years = self.db.query(TopicYearStat.year).filter_by(exam_id=exam_id).distinct().all()
        years = sorted([r[0] for r in stat_years])
        if not years:
            years = list(range(2015, 2026))

        for topic in topics:
            # Gather year-by-year stats
            stats = self.db.query(TopicYearStat).filter_by(topic_id=topic.id).all()
            if not stats:
                continue

            stats_by_year = {s.year: s for s in stats}
            marks_series = [stats_by_year[y].total_marks if y in stats_by_year else 0.0 for y in years]
            q_count_series = [stats_by_year[y].question_count if y in stats_by_year else 0 for y in years]
            
            # Simple regression / probability heuristics
            years_active = sum(1 for m in marks_series if m > 0)
            frequency = years_active / len(years) if years else 0.0
            
            # Recent active frequency (last 3 years)
            recent_years = years[-3:] if len(years) >= 3 else years
            recent_active = sum(1 for y in recent_years if y in stats_by_year and stats_by_year[y].total_marks > 0)
            recent_frequency = recent_active / len(recent_years) if recent_years else 0.0

            # Estimate base probability
            predicted_prob = (0.5 * frequency) + (0.35 * recent_frequency) + (0.15 * (1.0 if marks_series[-1] > 0 else 0.0))
            predicted_prob = max(0.05, min(0.98, predicted_prob))

            # Confidence interval
            confidence_low = max(0.01, predicted_prob - 0.10)
            confidence_high = max(predicted_prob, min(0.99, predicted_prob + 0.10))

            # Rationale generation (using Gemini with fallback)
            reasoning = self._generate_gemini_rationale(topic.name, years, marks_series, predicted_prob)

            prediction = Prediction(
                exam_id=exam_id,
                topic_id=topic.id,
                target_year=target_year,
                predicted_probability=predicted_prob,
                confidence_interval_low=confidence_low,
                confidence_interval_high=confidence_high,
                reasoning=reasoning
            )
            self.db.add(prediction)
            predictions_created.append(prediction)

        self.db.commit()
        return predictions_created

    def _generate_gemini_rationale(self, topic_name: str, years: list, marks: list, prob: float) -> str:
        """Calls Gemini API to generate explanation or falls back to template rationale."""
        desc = f"Topic: {topic_name}. Decadal marks: " + ", ".join(f"{y}: {m}m" for y, m in zip(years, marks))
        
        if self.model:
            try:
                prompt = f"""
                You are an expert Computer Science exam predictor for the GATE CS exam.
                Analyze this decadal trend: {desc}
                The computed AI occurrence probability for the upcoming exam is {prob*100:.1f}%.
                
                Write a concise, 2-3 sentence syllabus-oriented reasoning explaining this probability.
                Reference the trend, frequency of occurrence, and its relative importance in a typical computer science syllabus.
                Do not include introduction or preamble. Return ONLY the 2-3 sentences.
                """
                response = self.model.generate_content(prompt)
                rationale = response.text.strip()
                if rationale:
                    return rationale
            except Exception as e:
                print(f"Gemini prediction rationale generation failed for {topic_name}: {e}")

        # Rule-based fallback templates
        active_years = sum(1 for m in marks if m > 0)
        recent_marks = marks[-3:]
        recent_total = sum(recent_marks)

        if prob >= 0.85:
            return f"Highly critical topic showing a consistent presence in {active_years} of the last {len(years)} sessions. Recent mark weight of {recent_total}m indicates it remains a cornerstone of the syllabus."
        elif prob >= 0.70:
            return f"Solid syllabus constant with stable historical weight. Steady appearance patterns over the decade suggest a high probability of featuring standard conceptual questions."
        elif recent_total > 0:
            return f"Topic has shown rising engagement in recent CBT papers. Focus should remain on core principles as examiners frequently use it for moderate-difficulty questions."
        else:
            return f"Low frequency of appearance historically, but retains potential as a minor conceptual weight. Review basic concepts to secure baseline marks if it appears."

    def generate_dynamic_study_plan(self, exam_id: int, total_days: int = 30, weakness_topics: list = None):
        """
        Generates a structured day-by-day study plan prioritised by topic weights and predicted probability.
        """
        # Fetch predictions
        preds = self.db.query(Prediction).filter_by(exam_id=exam_id).order_by(Prediction.predicted_probability.desc()).all()
        
        if not preds:
            # Fallback if no predictions generated yet
            # Trigger prediction generation first
            preds = self.generate_predictions(exam_id)
            preds = sorted(preds, key=lambda p: p.predicted_probability, reverse=True)

        if not preds:
            return []

        # Re-rank predictions if weakness_topics are provided
        weaknesses_lower = []
        if weakness_topics:
            weaknesses_lower = [w.lower().strip() for w in weakness_topics if w.strip()]
            
        if weaknesses_lower:
            def get_priority_score(pred):
                topic_name = pred.topic.name.lower()
                parent_name = pred.topic.parent_topic.name.lower() if pred.topic.parent_topic else ""
                is_weakness = any(w in topic_name or w in parent_name for w in weaknesses_lower)
                return (10.0 if is_weakness else 0.0) + pred.predicted_probability

            preds = sorted(preds, key=get_priority_score, reverse=True)

        # Partition total_days into 4 blocks as evenly as possible.
        # If total_days < 4, we use total_days blocks.
        blocks = min(4, total_days)
        if blocks <= 0:
            return []
            
        days_per_block = total_days // blocks
        extra_days = total_days % blocks
        
        plan_blocks = []
        current_day = 1
        
        for i in range(blocks):
            block_days = days_per_block + (1 if i < extra_days else 0)
            start_day = current_day
            end_day = current_day + block_days - 1
            current_day = end_day + 1
            
            # Select topics for this block
            subset_size = max(1, len(preds) // blocks)
            block_preds = preds[i * subset_size : (i + 1) * subset_size]
            
            if not block_preds:
                block_preds = [preds[0]]

            # Format block details
            topic_names = [p.topic.name for p in block_preds[:3]]
            tasks = []
            for p in block_preds[:3]:
                is_weakness = False
                if weaknesses_lower:
                    topic_name = p.topic.name.lower()
                    parent_name = p.topic.parent_topic.name.lower() if p.topic.parent_topic else ""
                    is_weakness = any(w in topic_name or w in parent_name for w in weaknesses_lower)
                
                weakness_prefix = "⚠️ [Weakness Focus] " if is_weakness else ""
                tasks.append(f"{weakness_prefix}Master core theorems and formulas for {p.topic.name}")
                tasks.append(f"Solve past exam questions on {p.topic.name} ({p.predicted_probability*100:.0f}% predicted probability)")
                if p.reasoning:
                    # Snip to one sentence
                    snip = p.reasoning.split('.')[0] + "."
                    tasks.append(f"Focus area: {snip}")

            plan_blocks.append({
                "day": f"Days {start_day}-{end_day}" if start_day != end_day else f"Day {start_day}",
                "title": f"Priority Focus: " + ", ".join(topic_names[:2]),
                "tasks": tasks[:4], # limit checklist items
                "time": f"{block_days * 4} Hrs Study"
            })

        return plan_blocks
