from pathlib import Path
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any
import json, copy, datetime
from dotenv import load_dotenv
from tts import get_or_generate, CACHE_DIR

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env")  # backend/.env
load_dotenv(BASE_DIR.parent / ".env.local", override=False)  # project root .env.local (ElevenLabs key)
DIST_DIR = BASE_DIR.parent / "dist"

app = FastAPI(title="SchoolSims Player")

# Serve cached TTS audio files
app.mount("/tts", StaticFiles(directory=str(CACHE_DIR)), name="tts")

with open(BASE_DIR / "scenario.json") as f:
    SCENARIO: dict = json.load(f)

VALID_LANGS = {"en", "es", "ar", "zh", "ne", "sw", "ur"}
VALID_ETHNICITIES = {"african", "caucasian", "east_asian", "latin", "south_asian"}

CHARACTER_NAMES: dict[str, str] = {
    "african":     "Marcus Johnson",
    "caucasian":   "James Mitchell",
    "east_asian":  "Jordan Chen",
    "latin":       "Sofia Rivera",
    "south_asian": "Priya Sharma",
}

AVAILABLE_VIDEOS = set()
for _e in VALID_ETHNICITIES:
    for _l in VALID_LANGS:
        _path = Path(__file__).parent.parent / "public" / "assets" / f"{_e}_{_l}.mp4"
        if _path.exists():
            AVAILABLE_VIDEOS.add((_e, _l))


@app.get("/api/options")
def get_options(lang: str = Query("en")):
    display_lang = lang if lang in VALID_LANGS else "en"
    ui = SCENARIO[display_lang]["ui"]
    return {
        "languages": [
            {"value": code, "label": ui["language_labels"][code]}
            for code in sorted(VALID_LANGS)
        ],
        "ethnicities": [
            {"value": code, "label": ui["ethnicity_labels"][code]}
            for code in sorted(VALID_ETHNICITIES)
        ],
        "available_combos": [list(c) for c in sorted(AVAILABLE_VIDEOS)],
        "setup_ui": {
            "sim_title": ui["sim_title"],
            "setup_subtitle": ui["setup_subtitle"],
            "before_you_begin_title": ui["before_you_begin_title"],
            "before_you_begin_body": ui["before_you_begin_body"],
            "lang_label": ui["lang_label"],
            "eth_label": ui["eth_label"],
            "start_btn": ui["start_btn"],
        },
    }


@app.get("/api/simulation")
def get_simulation(
    lang: str = Query(..., description="Language code"),
    ethnicity: str = Query(..., description="Ethnicity code"),
):
    if lang not in VALID_LANGS:
        raise HTTPException(400, detail=f"lang must be one of {sorted(VALID_LANGS)}")
    if ethnicity not in VALID_ETHNICITIES:
        raise HTTPException(400, detail=f"ethnicity must be one of {sorted(VALID_ETHNICITIES)}")

    nodes = copy.deepcopy(SCENARIO[lang]["nodes"])
    char_name = CHARACTER_NAMES.get(ethnicity, "Jordan Chen")
    for node in nodes.values():
        if "character_name" in node:
            node["character_name"] = char_name
        if "character_alt" in node:
            node["character_alt"] = node["character_alt"].replace("Jordan Chen", char_name)

    return {
        "start_node_id": SCENARIO["start_node_id"],
        "nodes": nodes,
        "ui": SCENARIO[lang]["ui"],
        "media": {
            "photo": f"/assets/{ethnicity}.png",
            "video_template": f"/assets/{ethnicity}_{lang}.mp4",
            "photo_alt": "Character portrait",
        },
    }


class ScenarioUpdate(BaseModel):
    start_node_id: str
    nodes: dict[str, Any]
    ui: dict[str, Any]


@app.post("/api/tts/preload")
def tts_preload(body: dict):
    """Generate (or return cached) ElevenLabs MP3s for all slide texts."""
    texts: dict = body.get("texts", {})
    lang: str = body.get("lang", "en")
    result = {}
    for node_id, text in texts.items():
        if text:
            filename = get_or_generate(text, lang=lang)
            if filename:
                result[node_id] = f"/tts/{filename}"
    return result


@app.post("/api/scenario/{lang}")
def save_scenario(lang: str, body: ScenarioUpdate):
    if lang not in VALID_LANGS:
        raise HTTPException(400, detail=f"lang must be one of {sorted(VALID_LANGS)}")
    if body.start_node_id not in body.nodes:
        raise HTTPException(400, detail="start_node_id not found in nodes")
    global SCENARIO
    updated = copy.deepcopy(SCENARIO)
    updated[lang]["nodes"] = body.nodes
    updated[lang]["ui"] = body.ui
    updated["start_node_id"] = body.start_node_id
    with open(BASE_DIR / "scenario.json", "w") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)
    SCENARIO = updated
    return {"ok": True}


class ReviewPayload(BaseModel):
    rating: int
    experience: str
    improvements: str
    lang: str
    ethnicity: str
    chosen_option: str


@app.post("/api/review")
def submit_review(body: ReviewPayload):
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(400, detail="rating must be 1-5")
    entry = body.model_dump()
    entry["timestamp"] = datetime.datetime.utcnow().isoformat()
    reviews_path = BASE_DIR / "reviews.json"
    existing = []
    if reviews_path.exists():
        existing = json.loads(reviews_path.read_text())
    existing.append(entry)
    with open(reviews_path, "w") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    return {"ok": True}


if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/")
    def serve_index():
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/{full_path:path}")
    def catch_all(full_path: str):
        return FileResponse(str(DIST_DIR / "index.html"))
