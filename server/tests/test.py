import os
import httpx
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

async def test():
    client = AsyncOpenAI(
        api_key=os.getenv("AI_ML_API_KEY"),
        base_url=os.getenv("AI_ML_API_URL"),
        http_client=httpx.AsyncClient()
    )
    
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hola"}],
            max_tokens=20
        )
        print("Respuesta exitosa:", response.choices[0].message.content)
    except Exception as e:
        print("ERROR:", type(e).__name__, "-", str(e))
    finally:
        await client.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(test())