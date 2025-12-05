from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # OpenAI
    openai_api_key: str = ""

    # Firebase
    firebase_project_id: str = ""
    firebase_service_account_path: str = ""

    # ChatterBox TTS
    chatterbox_base_url: str = "http://localhost:8004"

    # Paths
    projects_dir: Path = Path("./projects")
    voices_dir: Path = Path("./voices")

    # Upload limits
    max_upload_size_mb: int = 2000
    allowed_video_extensions: list[str] = [".mp4", ".mov", ".avi", ".mkv", ".webm"]

    # CORS
    cors_origins: list[str] = ["http://localhost:5173"]

    # Database
    database_url: str = "sqlite+aiosqlite:///./bobbervox.db"

    # Debug
    debug: bool = False

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
