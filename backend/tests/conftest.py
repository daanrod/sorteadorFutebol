import pytest
import shutil
from pathlib import Path
from httpx import AsyncClient, ASGITransport

# Usar um arquivo de dados de teste isolado
TEST_DATA = Path(__file__).parent / "test_data"


@pytest.fixture(autouse=True)
def clean_test_data():
    """Limpa dados de teste antes e depois de cada test."""
    if TEST_DATA.exists():
        shutil.rmtree(TEST_DATA)
    TEST_DATA.mkdir(parents=True, exist_ok=True)

    # Redirecionar storage para pasta de teste
    import storage
    storage.DATA_FILE = TEST_DATA / "db.json"

    yield

    if TEST_DATA.exists():
        shutil.rmtree(TEST_DATA)


@pytest.fixture
async def client():
    from main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest.fixture
async def admin_client(client: AsyncClient):
    """Client com sessão de admin ativa."""
    r = await client.post("/api/admin/login", json={"senha": "admin123"})
    assert r.status_code == 200
    return client
