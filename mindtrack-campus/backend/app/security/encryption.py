from cryptography.fernet import Fernet, InvalidToken

from app.core.config import get_settings

settings = get_settings()
_fernet = Fernet(settings.JOURNAL_ENCRYPTION_KEY.encode())


def encrypt_text(plaintext: str) -> str:
    """Encrypts text before it is ever written to the database.
    Returns a string safe to store in a text column."""
    return _fernet.encrypt(plaintext.encode()).decode()


def decrypt_text(ciphertext: str) -> str:
    """Decrypts text read from the database. Only ever called when
    returning content to its owning user."""
    try:
        return _fernet.decrypt(ciphertext.encode()).decode()
    except InvalidToken:
        # Should only happen if the encryption key was rotated/lost, or
        # the stored value was corrupted — never expose this detail to
        # the client (see error envelope, Phase 9).
        raise ValueError("Journal content could not be decrypted")