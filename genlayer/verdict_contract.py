import genlayer as gl

class VerdictContract(gl.Contract):
    
    verdicts: dict

    def __init__(self):
        self.verdicts = {}

    @gl.public.write
    def request_verdict(
        self, 
        hash_sha256: str,
        frame_urls: list[str],
        event_type: str,
        context: str
    ) -> None:
        
        prompt = f"""
        Sos un perito forense de accidentes laborales.
        Analizá las siguientes imágenes de un evento de tipo {event_type}.
        Contexto adicional: {context}
        
        Imágenes para analizar: {frame_urls}
        
        Respondé ÚNICAMENTE con uno de estos valores:
        - ACCIDENTE_REAL: si el evento parece un accidente genuino
        - FRAUDE_SOSPECHOSO: si hay indicios de simulación o fraude
        - INCONCLUSO: si las imágenes no son suficientes para determinar
        
        No agregues explicación, solo el valor exacto.
        """
        
        # Non-deterministic call using Optimistic Web Requests to fetch frames 
        # internally and run the LLM validation nodes.
        result = gl.nondet.exec_prompt(prompt)
        verdict = result.strip().upper()
        
        # Validar salidas
        valid_verdicts = ["ACCIDENTE_REAL", "FRAUDE_SOSPECHOSO", "INCONCLUSO"]
        if verdict not in valid_verdicts:
            verdict = "INCONCLUSO"
        
        self.verdicts[hash_sha256] = {
            "verdict": verdict,
            "frame_urls": frame_urls,
            "event_type": event_type,
            "timestamp": context
        }

    @gl.public.view
    def get_verdict(self, hash_sha256: str) -> dict:
        return self.verdicts.get(hash_sha256, {})
