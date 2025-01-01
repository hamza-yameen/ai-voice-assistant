import { toFile } from "openai";
import { generateText } from "ai";
import { getOpenAI } from "../../utils/openAI";
import { ollama } from "ollama-ai-provider";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import { promisify } from "util";

const pipe = promisify(pipeline);

const openai = getOpenAI();

export async function POST(req) {
  const { audio } = await req.json();
  if (!audio) {
    return NextResponse.json(
      { error: "Audio data is required" },
      { status: 400 }
    );
  }
  const audioBuffer = Buffer.from(audio, "base64");

  try {
    const audioFile = await toFile(audioBuffer, "audio.mp3");

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
    });

    const { text: response } = await generateText({
      model: ollama("llama3.2"),
      system: "You know a lot about video games",
      prompt: transcription.text,
    });

    const voiceResponse = await openai.audio.speech.create({
      model: "tts-1",
      input: response,
      voice: "onyx",
    });

    // const audioFolderPath = path.join(process.cwd(), "public", "audio");
    // if (!fs.existsSync(audioFolderPath)) {
    //   fs.mkdirSync(audioFolderPath, { recursive: true });
    // }
    // const audioFilePath = path.join(audioFolderPath, "audio.mp3");
    // await pipe(voiceResponse.body, fs.createWriteStream(audioFilePath));
    // console.log(`Audio file saved at: ${audioFilePath}`);

    return new Response(voiceResponse.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    console.log("Error : ", err);
    return NextResponse.json(
      {
        err: err,
        error: "Error converting audio",
      },
      {
        status: 500,
      }
    );
  }
}
