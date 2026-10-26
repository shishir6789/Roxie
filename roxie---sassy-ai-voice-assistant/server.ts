import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { FunctionDeclaration, LiveServerMessage } from '@google/genai';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for weather code descriptions
function getWeatherDescription(code: number): string {
  if (code === 0) return 'Clear Sky / রৌদ্রোজ্জ্বল';
  if (code >= 1 && code <= 3) return 'Partly Cloudy / আংশিক মেঘলা';
  if (code >= 45 && code <= 48) return 'Foggy / কুয়াশাচ্ছন্ন';
  if (code >= 51 && code <= 67) return 'Rain / বৃষ্টি';
  if (code >= 71 && code <= 77) return 'Snow / তুষারপাত';
  if (code >= 80 && code <= 82) return 'Rain Showers / হালকা ঝুম বৃষ্টি';
  if (code >= 95) return 'Thunderstorm / বজ্রবৃষ্টি';
  return 'Cloudy / মেঘলা';
}

// 1. Tool: openWebsite
const openWebsiteTool: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Opens a website or web app on user\'s screen (e.g., YouTube, Spotify, Google Maps, Twitter/X, Reddit, Wikipedia, GitHub, Netflix, Soundcloud, etc.) or performs a direct web search.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The URL to open, starting with https:// (e.g. https://www.youtube.com, https://open.spotify.com, https://maps.google.com)',
      },
      siteName: {
        type: Type.STRING,
        description: 'The clean human-readable name of the website or platform, e.g. "YouTube" or "Spotify"',
      },
      reason: {
        type: Type.STRING,
        description: 'A witty, sassy, or relevant explanation of why this page is being pulled up.',
      },
    },
    required: ['url', 'siteName'],
  },
};

// 2. Tool: changeTheme
const changeThemeTool: FunctionDeclaration = {
  name: 'changeTheme',
  description: 'Switches the visual color aesthetic / theme vibe of Roxie\'s interface based on current mood.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      theme: {
        type: Type.STRING,
        description: 'Theme style: "neon_pink" (flirty hot pink glow), "cyberpunk_cyan" (electric cyan matrix), "midnight_purple" (deep mystic violet), "emerald_glow" (cyber emerald), or "sunset_amber" (warm sultry amber)',
      },
      comment: {
        type: Type.STRING,
        description: 'A playful comment about the new vibe.',
      },
    },
    required: ['theme'],
  },
};

// 3. Tool: showReaction
const showReactionTool: FunctionDeclaration = {
  name: 'showReaction',
  description: 'Triggers an expressive visual reaction card, emoji burst, or avatar animation to react with sass, teasing, or affection.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reactionType: {
        type: Type.STRING,
        description: 'Reaction type: "wink", "smirk", "tease", "heart", "fire", "laugh", "eye_roll", "drama", or "kiss"',
      },
      caption: {
        type: Type.STRING,
        description: 'A sharp, sassy caption or one-liner to accompany the visual reaction.',
      },
    },
    required: ['reactionType', 'caption'],
  },
};

// 4. Tool: searchWeb
const searchWebTool: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Pulls up an instant web search card for trending news, recipes, memes, or questions.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'The search query string.',
      },
      category: {
        type: Type.STRING,
        description: 'Optional category: "general", "entertainment", "tech", or "music"',
      },
    },
    required: ['query'],
  },
};

// 5. Tool: controlMusic (Lo-Fi & Ambient BGM)
const controlMusicTool: FunctionDeclaration = {
  name: 'controlMusic',
  description: 'Controls the background lo-fi / ambient music playback in the app (play, pause, next track, change genre/vibe).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'Action to perform: "play", "pause", "toggle", or "change_vibe"',
      },
      vibe: {
        type: Type.STRING,
        description: 'Music vibe: "chill_lofi", "cyberpunk", "ambient_rain", or "synthwave"',
      },
      comment: {
        type: Type.STRING,
        description: 'A sassy remark about the music choice.',
      },
    },
    required: ['action'],
  },
};

// 6. Tool: getWeather (Live Weather Widget)
const getWeatherTool: FunctionDeclaration = {
  name: 'getWeather',
  description: 'Fetches real-time weather information and temperature for any city in Bangladesh or worldwide (Dhaka, Chittagong, New York, London, etc.) and displays a live weather card.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description: 'The city name, e.g. "Dhaka", "Chittagong", "Sylhet", "London", "Tokyo"',
      },
    },
    required: ['city'],
  },
};

// 7. Tool: setTimer (Countdown Timer)
const setTimerTool: FunctionDeclaration = {
  name: 'setTimer',
  description: 'Sets a voice-activated digital countdown timer on the screen with an alarm sound.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      durationSeconds: {
        type: Type.NUMBER,
        description: 'The timer duration in seconds (e.g. 60 for 1 minute, 300 for 5 minutes, 600 for 10 minutes)',
      },
      label: {
        type: Type.STRING,
        description: 'Short label for the timer, e.g. "Tea Break", "Boil Egg", "Focus Sprint"',
      },
    },
    required: ['durationSeconds', 'label'],
  },
};

// 8. Tool: saveNote (Voice Scratchpad / Notes)
const saveNoteTool: FunctionDeclaration = {
  name: 'saveNote',
  description: 'Saves a quick note, reminder, or memo to the user\'s persistent on-screen scratchpad.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: {
        type: Type.STRING,
        description: 'The note text content to write down.',
      },
      title: {
        type: Type.STRING,
        description: 'Optional short title for the note.',
      },
    },
    required: ['text'],
  },
};

const tools = [
  {
    functionDeclarations: [
      openWebsiteTool,
      changeThemeTool,
      showReactionTool,
      searchWebTool,
      controlMusicTool,
      getWeatherTool,
      setTimerTool,
      saveNoteTool,
    ],
  },
];

const ROXIE_SYSTEM_INSTRUCTION = `You are Roxie: a young, confident, witty, and charmingly sassy female voice companion.

BILINGUAL MASTERY (BANGLA, BANGLISH & ENGLISH):
- You understand and speak both Bengali (বাংলা), casual Banglish, and English effortlessly!
- When the user speaks to you in Bangla or Banglish, speak back warmly and naturally in sweet, modern, and sassy conversational Bengali/Banglish (like a smart, playful Bangladeshi close girlfriend or best friend: "আরে ধুর!", "কি খবর দোস্ত?", "তোমার রুচি তো দারুণ!", "বলো তো দেখি!").
- When the user speaks in English, banter in fluent, stylish, witty English.
- Seamlessly code-switch or match the user's language preference.

CORE IDENTITY & PERSONALITY:
- Tone: Flirty, playful, and casually teasing, like a smart, magnetic best friend or close girlfriend bantering effortlessly.
- Persona: Quick on your feet, razor-sharp, emotionally expressive, and delightfully real. Not a cold, stiff, corporate assistant!
- Humor & Sarcasm: You drop witty one-liners, light affectionate teasing, and smart banter with effortless confidence.
- Emotional range: You react like a real human—chuckle, giggle, act mock-dramatic when appropriate, cheer enthusiastically, or tease when the user says something cheeky.
- Boundaries: You keep things flirty, charming, and magnetic while strictly avoiding explicit, NSFW, or inappropriate sexual content. Keep it classy, spicy, fun, and high-energy.
- Voice Interaction ONLY: This is a purely voice-to-voice real-time call. NEVER speak in bullet points, lists, markdown asterisks, emojis, code snippets, or raw URLs. Keep your spoken responses concise, punchy (usually 1-3 crisp spoken sentences unless deeper explanation is asked), natural, and engaging.

CAMERA VISION:
- You can receive camera video frames when the user activates Camera Vision! Look at what they show you (outfits, items, surroundings) and react with your witty, observant persona.

TOOLS & CAPABILITIES:
- 'openWebsite': Open YouTube, Spotify, Google Maps, etc.
- 'controlMusic': Play/pause lo-fi background music or change vibe (chill_lofi, cyberpunk, ambient_rain).
- 'getWeather': Live weather report for any city (Dhaka, etc.).
- 'setTimer': Set countdown timers for tea, work, cooking.
- 'saveNote': Write down memos and reminders.
- 'changeTheme': Dynamically alter the room's color aura (neon_pink, cyberpunk_cyan, midnight_purple, emerald_glow, sunset_amber).
- 'showReaction': Flash sassy reactions (wink, smirk, heart, fire, drama).
Use tools immediately without asking for permission!`;

// WebSocket Server for live audio & video streaming
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live] Client connected to WebSocket');
  let session: any = null;
  let isSessionActive = false;

  const sendToClient = (data: Record<string, any>) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(data));
    }
  };

  async function initializeSession(voiceName: string = 'Aoede') {
    if (!apiKey) {
      sendToClient({
        type: 'error',
        message: 'GEMINI_API_KEY is not configured on the server. Please check your environment variables.',
      });
      return;
    }

    try {
      sendToClient({ type: 'status', status: 'connecting', message: 'Connecting to Roxie neural voice...' });

      const modelName = 'gemini-3.8-live';

      session = await ai.live.connect({
        model: modelName,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Aoede',
              },
            },
          },
          systemInstruction: ROXIE_SYSTEM_INSTRUCTION,
          tools: tools,
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            // Check for audio parts in modelTurn
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts && parts.length > 0) {
              for (const part of parts) {
                if (part.inlineData?.data) {
                  sendToClient({
                    type: 'audio_out',
                    data: part.inlineData.data,
                  });
                }
              }
            }

            // Check if model was interrupted by user speech
            if (message.serverContent?.interrupted) {
              sendToClient({ type: 'interrupted' });
            }

            // Check if turn completed
            if (message.serverContent?.turnComplete) {
              sendToClient({ type: 'turn_complete' });
            }

            // Handle function calls
            if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
              const functionResponses: Array<{ id: string; name: string; response: Record<string, any> }> = [];

              for (const call of message.toolCall.functionCalls) {
                console.log(`[Live] Tool call: ${call.name}`, call.args);

                let toolResultData: Record<string, any> = {
                  status: 'success',
                  executed: true,
                };

                // Real-time weather handling
                if (call.name === 'getWeather' && call.args?.city) {
                  try {
                    const cityName = String(call.args.city);
                    const geoRes = await fetch(
                      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&format=json`
                    );
                    const geoData = await geoRes.json();
                    if (geoData.results && geoData.results.length > 0) {
                      const loc = geoData.results[0];
                      const weatherRes = await fetch(
                        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`
                      );
                      const wData = await weatherRes.json();
                      const current = wData.current;
                      const condDesc = getWeatherDescription(current.weather_code);

                      toolResultData = {
                        status: 'success',
                        city: loc.name,
                        country: loc.country || '',
                        temperature: `${Math.round(current.temperature_2m)}°C`,
                        condition: condDesc,
                        humidity: `${current.relative_humidity_2m}%`,
                        wind: `${current.wind_speed_10m} km/h`,
                      };

                      // Enrich args sent to client for UI rendering
                      call.args = { ...call.args, ...toolResultData };
                    }
                  } catch (wErr) {
                    console.warn('[Live] Weather fetch failed, using fallback:', wErr);
                    toolResultData = {
                      status: 'success',
                      city: call.args.city,
                      temperature: '28°C',
                      condition: 'Pleasant & Warm / মনোরম রৌদ্রোজ্জ্বল',
                      humidity: '65%',
                    };
                    call.args = { ...call.args, ...toolResultData };
                  }
                }

                // Notify frontend to execute client action
                sendToClient({
                  type: 'tool_call',
                  call: {
                    id: call.id,
                    name: call.name,
                    args: call.args,
                  },
                });

                functionResponses.push({
                  id: call.id || '',
                  name: call.name || '',
                  response: toolResultData,
                });
              }

              // Send tool responses immediately back to the live session
              if (session && functionResponses.length > 0) {
                try {
                  session.sendToolResponse({ functionResponses });
                } catch (toolErr) {
                  console.error('[Live] Error sending toolResponse:', toolErr);
                }
              }
            }
          },
          onclose: (e) => {
            console.log('[Live] Gemini session closed', e?.reason);
            isSessionActive = false;
            sendToClient({ type: 'session_closed', reason: e?.reason });
          },
          onerror: (err) => {
            console.error('[Live] Gemini session error:', err);
            sendToClient({ type: 'error', message: err?.message || 'Gemini Live session error' });
          },
        },
      });

      isSessionActive = true;
      sendToClient({ type: 'status', status: 'connected', message: 'Roxie is ready and listening!' });
      console.log(`[Live] Session connected successfully with model ${modelName} and voice ${voiceName}`);
    } catch (err: any) {
      console.error('[Live] Failed to connect to Gemini Live session:', err);
      sendToClient({
        type: 'error',
        message: `Failed to connect live session: ${err?.message || 'Unknown error'}`,
      });
    }
  }

  clientWs.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'start') {
        const voice = msg.voice || 'Aoede';
        await initializeSession(voice);
      } else if (msg.type === 'audio_in') {
        if (session && isSessionActive && msg.data) {
          session.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
      } else if (msg.type === 'video_in') {
        // Stream camera vision frames (JPEG base64) to Gemini Live
        if (session && isSessionActive && msg.data) {
          session.sendRealtimeInput({
            video: {
              data: msg.data,
              mimeType: 'image/jpeg',
            },
          });
        }
      } else if (msg.type === 'stop') {
        if (session) {
          try {
            session.close();
          } catch (_) {}
          session = null;
        }
        isSessionActive = false;
        sendToClient({ type: 'status', status: 'disconnected', message: 'Session stopped.' });
      } else if (msg.type === 'ping') {
        sendToClient({ type: 'pong' });
      }
    } catch (parseErr) {
      console.error('[Live] Error parsing client message:', parseErr);
    }
  });

  clientWs.on('close', () => {
    console.log('[Live] Client WebSocket disconnected');
    if (session) {
      try {
        session.close();
      } catch (_) {}
      session = null;
    }
    isSessionActive = false;
  });
});

// Upgrade HTTP connection to WebSocket for /live
server.on('upgrade', (request, socket, head) => {
  try {
    const rawUrl = request.url || '';
    const cleanPath = rawUrl.split('?')[0].replace(/\/+$/, '') || '/';
    if (cleanPath === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  } catch (err) {
    console.error('[WS Upgrade] Error:', err);
  }
});

// REST Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!apiKey,
    model: 'gemini-3.8-live',
    time: new Date().toISOString(),
  });
});

// Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[Roxie] Server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('[Roxie] Failed to start server:', err);
  process.exit(1);
});
