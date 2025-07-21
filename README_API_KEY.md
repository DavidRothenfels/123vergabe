# OpenRouter API Key Konfiguration

Um die Fragengenerierung zu nutzen, benötigen Sie einen OpenRouter API Key.

## Schritt 1: API Key erhalten
1. Gehen Sie zu https://openrouter.ai/keys
2. Erstellen Sie einen Account (falls noch nicht vorhanden)
3. Generieren Sie einen neuen API Key

## Schritt 2: API Key konfigurieren

### Option A: Umgebungsvariable (empfohlen)
```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
./pocketbase serve
```

### Option B: PocketBase Settings
1. Öffnen Sie das PocketBase Admin Panel: http://localhost:8090/_/
2. Gehen Sie zu Settings → Application
3. Fügen Sie ein neues Setting hinzu:
   - Key: `openrouter_api_key`
   - Value: Ihr API Key

## Verfügbare Modelle
Standard: `anthropic/claude-3.5-sonnet`

Weitere Modelle finden Sie unter: https://openrouter.ai/models

## Kosten
Die Kosten werden pro Token berechnet. Details unter: https://openrouter.ai/pricing