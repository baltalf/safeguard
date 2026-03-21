import httpx
import logging
from typing import List
from pathlib import Path

from core.config import settings

logger = logging.getLogger(__name__)

class PinataClient:
    def __init__(self):
        self.jwt = settings.PINATA_JWT
        self.gateway = settings.PINATA_GATEWAY.rstrip('/')
        self.api_url = "https://api.pinata.cloud/pinning/pinFileToIPFS"

    def is_configured(self) -> bool:
        return bool(self.jwt)

    async def upload_file(self, file_path: str) -> str:
        """
        Subir un archivo a IPFS vía la API de Pinata.
        Retorna la URL del IPFS Gateway.
        """
        if not self.is_configured():
            logger.warning("PINATA_JWT not configured. Returning local file path as fallback.")
            # Fallback para desarrollo, simplemente regresa un format local
            return f"local://{file_path}"

        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        headers = {
            "Authorization": f"Bearer {self.jwt}"
        }

        async with httpx.AsyncClient() as client:
            with open(path, "rb") as f:
                files = {
                    "file": (path.name, f, "application/octet-stream")
                }
                response = await client.post(
                    self.api_url,
                    headers=headers,
                    files=files,
                    timeout=30.0
                )
                
                response.raise_for_status()
                data = response.json()
                ipfs_hash = data.get("IpfsHash")
                
                if not ipfs_hash:
                    raise Exception(f"Failed to pin file to IPFS. Response: {data}")
                    
                result_url = f"{self.gateway}/{ipfs_hash}"
                logger.info(f"File {path.name} uploaded to IPFS: {result_url}")
                return result_url

    async def upload_files(self, file_paths: List[str]) -> List[str]:
        """
        Sube multiples archivos iterando sobre upload_file
        """
        urls = []
        for fp in file_paths:
            url = await self.upload_file(fp)
            urls.append(url)
        return urls

pinata_client = PinataClient()
