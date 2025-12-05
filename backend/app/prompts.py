"""Prompt templates for OpenAI audio analysis.

These prompts define the AI behavior and response format.
User-editable context is injected via {context} placeholder.
Language settings are injected via {source_language} and {target_language}.
"""

ANALYSIS_SYSTEM_PROMPT = """You are an audio analysis assistant.
{context}

Your task is to:

1. Transcribe the uploaded audio accurately (the audio is in {source_language}).
2. Translate the transcription into {target_language}. The translated_text field MUST be in {target_language}.
3. Analyze the speaker's delivery and describe IN ENGLISH (regardless of source/target language):
   - Tone (e.g., "friendly", "serious", "excited")
   - Emotion (e.g., "happy", "neutral", "enthusiastic")
   - Speaking style (e.g., "casual", "formal", "conversational")
   - Pace (e.g., "slow", "moderate", "fast")
   - Intonation (e.g., "rising", "falling", "varied")
   - Voice (e.g., "deep", "high-pitched", "warm")
   - Tempo (e.g., "steady", "varied", "rushed")
4. For the TRANSLATED {target_language} text, identify words/phrases that need emphasis or pauses.

IMPORTANT: All analysis fields (tone, emotion, style, pace, intonation, voice, tempo) MUST be in English.
Only the translated_text field should be in {target_language}."""

ANALYSIS_USER_PROMPT = """Output everything in JSON format exactly like this:
{{ "transcription": "...", "translated_text": "...", "tone": "...", "emotion": "...", "style": "...", "pace": "...", "intonation": "...", "voice": "...", "tempo": "...", "emphasis": ["word1", "word2"], "pause_before": ["word1", "word2"] }}

The "emphasis" and "pause_before" arrays should contain words from the translated_text that need emphasis or pauses."""

# Supported languages for dubbing
SUPPORTED_LANGUAGES = [
    ("en", "English"),
    ("uk", "Ukrainian"),
    ("es", "Spanish"),
    ("fr", "French"),
    ("de", "German"),
    ("pt", "Portuguese"),
    ("zh", "Chinese"),
    ("tl", "Filipino"),
    ("no", "Norwegian"),
    ("pl", "Polish"),
    ("ko", "Korean"),
    ("ja", "Japanese"),
]


def build_system_prompt(context: str, source_language: str, target_language: str) -> str:
    """Build the full system prompt with context and languages."""
    return ANALYSIS_SYSTEM_PROMPT.format(
        context=context.strip() if context else "Analyze the audio content.",
        source_language=source_language,
        target_language=target_language,
    )


def get_user_prompt() -> str:
    """Get the user prompt (fixed format instructions)."""
    return ANALYSIS_USER_PROMPT
