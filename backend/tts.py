import hashlib
import os
from pathlib import Path
from elevenlabs import ElevenLabs

CACHE_DIR = Path(__file__).parent / "tts_cache"
CACHE_DIR.mkdir(exist_ok=True)

TTS_SUPPORTED_LANGS = {"en", "es", "ar", "zh", "ur"}


def get_or_generate(text: str, lang: str = "en") -> str | None:
    """Return cached MP3 filename. Calls ElevenLabs on cache miss."""
    if lang not in TTS_SUPPORTED_LANGS:
        return None

    voice_id = os.getenv("ELEVEN_LABS_VOICE_ID", "JBFqnCBsd6RMkjVDRZzb")
    model_id = os.getenv("ELEVEN_LABS_MODEL", "eleven_v4")

    if not text.strip():
        raise ValueError("Empty text passed to TTS")

    key = hashlib.sha256(f"{text}{voice_id}{model_id}".encode()).hexdigest()
    path = CACHE_DIR / f"{key}.mp3"

    if not path.exists():
        client = ElevenLabs(api_key=os.getenv("ELEVEN_LABS_API_KEY") or os.getenv("ELEVENLABS_API_KEY"))
        audio = client.text_to_speech.convert(
            text=text,
            voice_id=voice_id,
            model_id=model_id,
            voice_settings={"stability": 0.5, "similarity_boost": 0.75},
        )
        tmp = path.with_suffix(".tmp")
        try:
            with open(tmp, "wb") as f:
                for chunk in audio:
                    f.write(chunk)
            tmp.rename(path)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise

    return f"{key}.mp3"
