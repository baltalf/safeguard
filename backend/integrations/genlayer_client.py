import json
import logging
import asyncio
from pathlib import Path

from core.config import settings

logger = logging.getLogger(__name__)

class GenLayerClient:
    def __init__(self):
        self.simulator_url = settings.GENLAYER_SIMULATOR_URL
        self.contract_address = settings.GENLAYER_CONTRACT_ADDRESS
        self.deployed_path = Path(__file__).resolve().parent.parent.parent / "genlayer" / "deployed.json"
        
        # Si existe el deployed.json, usarlo
        if self.deployed_path.exists() and not self.contract_address:
            try:
                with open(self.deployed_path, "r") as f:
                    data = json.load(f)
                    self.contract_address = data.get("contract_address")
            except Exception as e:
                logger.warning(f"Could not load genlayer/deployed.json: {e}")

    def is_configured(self) -> bool:
        return bool(self.simulator_url)

    async def deploy_contract(self) -> str:
        """
        Despliega verdict_contract.py en la red Genlayer/Simulador.
        """
        if not self.is_configured():
            logger.warning("[MOCK] Genlayer simulator no configurado. Skipiando el deploy real.")
            self.contract_address = "mock_contract_address"
            return self.contract_address
        
        # TODO: Implemetar deploy real si genlayer-py provee APIs de deploy directas
        # Para el scope inicial simularemos la subida o la gestionariamos por CLI de genlayer.
        logger.warning("Deploy de Genlayer real deberia interactuar con su API, devolviendo dirección dummy.")
        return "not_implemented_address"

    async def request_verdict(
        self,
        hash_sha256: str,
        frame_urls: list[str], 
        event_type: str,
        context: str
    ) -> str:
        """
        Llama a request_verdict() asincrono en Genlayer.
        """
        if not self.is_configured():
            logger.info("[MOCK] Genlayer no configurado, usando veredicto mock de 2s...")
            await asyncio.sleep(2)
            return "ACCIDENTE_REAL"
            
        # Try importing genlayer components if using simulator
        try:
            import genlayer as gl
            import httpx
            # Logica de interaccion con los RPC del sim
            # Como la SDK python varia comunmente, delegar a HTTP para genlayer simulator si se requiere
            pass
        except ImportError:
            pass

        # Si estuviéramos conectados usaríamos el conector standard de Genlayer JSON-RPC.
        logger.warning(f"Connecting to simulator {self.simulator_url} needs API spec. Fallbacking to mock.")
        await asyncio.sleep(2)
        return "ACCIDENTE_REAL"

    async def get_verdict(self, hash_sha256: str) -> dict:
        """
        Lee el state deterministico actual para el hast.
        """
        if not self.is_configured():
            return {
                "verdict": "ACCIDENTE_REAL",
                "frame_urls": [],
                "event_type": "MOCK",
                "timestamp": "MOCK"
            }
        
        # Logica real
        return {}
        
genlayer_client = GenLayerClient()
